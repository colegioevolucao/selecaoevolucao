import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://sqqozfohvkxfkjydxkiw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Fcm35rSx0XDCdjtvetyRLg_iymciHct';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
let applications = [];
let examDates = [];

async function checkSession(){
  const { data } = await supabase.auth.getSession();
  if(data.session){
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    await loadDashboard();
  }
}
checkSession();

document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const errorBox = document.getElementById('loginError');
  errorBox.textContent = '';

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if(error){
    errorBox.textContent = 'Acesso não autorizado. Confira login e senha.';
    return;
  }
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  await loadDashboard();
});

document.getElementById('logoutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.reload();
});

document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tabs = ['overview','candidates','exams','settings'];
    tabs.forEach(t => document.getElementById(`${t}Tab`).classList.toggle('hidden', t !== btn.dataset.tab));
  });
});

async function loadDashboard(){
  const [{data: apps, error: appsError},{data: dates, error: datesError}] = await Promise.all([
    supabase.from('applications').select('*').order('created_at',{ascending:false}),
    supabase.from('exam_dates').select('*').order('exam_date',{ascending:true})
  ]);
  if(appsError || datesError){
    console.error(appsError || datesError);
    return;
  }
  applications = apps || [];
  examDates = dates || [];
  renderStats();
  renderCandidates();
  renderExams();
}

function renderStats(){
  document.getElementById('statTotal').textContent = applications.length;
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('statToday').textContent =
    applications.filter(a => a.created_at?.slice(0,10) === today).length;
  document.getElementById('statSeries').textContent =
    new Set(applications.map(a => a.series).filter(Boolean)).size;

  const activeDates = examDates.filter(e => e.active && e.exam_date >= today);
  const next = activeDates[0];
  const nextCount = next ? applications.filter(a => a.exam_date === next.exam_date).length : 0;
  document.getElementById('statNextExam').textContent = nextCount;

  const card = document.getElementById('nextExamCard');
  if(!next){
    card.innerHTML = '<p>Nenhuma prova futura cadastrada.</p>';
  } else {
    const count = nextCount;
    const d = new Date(next.exam_date+'T12:00:00');
    card.innerHTML = `
      <div class="step">PRÓXIMA PROVA</div>
      <h2 style="font-size:42px;margin:8px 0 4px">${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).toUpperCase()} · ${next.exam_time.slice(0,5)}</h2>
      <p><strong>${count} candidatos inscritos</strong></p>
    `;
  }

  document.getElementById('upcomingExamDates').innerHTML = activeDates.slice(1,4).map(e => {
    const count = applications.filter(a => a.exam_date === e.exam_date).length;
    const d = new Date(e.exam_date+'T12:00:00');
    return `<p><strong>${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).toUpperCase()} · ${e.exam_time.slice(0,5)}</strong><br>${count} inscritos</p>`;
  }).join('') || '<p>Sem outras datas futuras.</p>';
}

function renderCandidates(filter=''){
  const q = filter.toLowerCase();
  const list = applications.filter(a => {
    const blob = `${a.student_name} ${a.guardian_name} ${a.current_school}`.toLowerCase();
    return blob.includes(q);
  });
  document.getElementById('candidatesBody').innerHTML = list.map(a => `
    <tr>
      <td>${a.student_name || ''}</td>
      <td>${a.segment || ''}</td>
      <td>${a.series || ''}</td>
      <td>${a.guardian_name || ''}</td>
      <td>${a.guardian_whatsapp || ''}</td>
      <td>${a.current_school || ''}</td>
      <td>${a.exam_date ? new Date(a.exam_date+'T12:00:00').toLocaleDateString('pt-BR') : 'Visita'}</td>
      <td><span class="status">${a.status || ''}</span></td>
    </tr>
  `).join('');
}
document.getElementById('candidateSearch').addEventListener('input', e => renderCandidates(e.target.value));

function renderExams(){
  const wrap = document.getElementById('examManagement');
  wrap.innerHTML = `
    <form id="newExamForm" class="form-grid" style="margin-bottom:28px">
      <label>Data<input id="newExamDate" type="date" required></label>
      <label>Horário<input id="newExamTime" type="time" value="14:30" required></label>
      <label>Limite de candidatos<input id="newExamLimit" type="number" min="1" value="80"></label>
      <label>Status
        <select id="newExamActive" style="width:100%;margin-top:8px;padding:15px;border:1px solid #e7ecf4;border-radius:14px">
          <option value="true">Inscrições abertas</option>
          <option value="false">Inscrições encerradas</option>
        </select>
      </label>
      <label>Segmentos (separados por vírgula)
        <input id="newExamSegments" type="text" placeholder="Ensino Fundamental Anos Iniciais, Ensino Médio">
      </label>
      <label>Séries (separadas por vírgula)
        <input id="newExamSeries" type="text" placeholder="1º ano, 2º ano, 1ª série">
      </label>
      <button class="btn primary" type="submit">+ NOVA DATA DE PROVA</button>
    </form>
    <div style="overflow:auto">
      <table>
        <thead><tr><th>Data</th><th>Horário</th><th>Inscritos</th><th>Limite</th><th>Status</th></tr></thead>
        <tbody>
          ${examDates.map(e => {
            const count = applications.filter(a => a.exam_date === e.exam_date).length;
            return `<tr>
              <td>${new Date(e.exam_date+'T12:00:00').toLocaleDateString('pt-BR')}</td>
              <td>${e.exam_time.slice(0,5)}</td>
              <td>${count}</td>
              <td>${e.capacity ?? '—'}</td>
              <td><span class="status">${e.active ? 'Inscrições abertas' : 'Encerradas'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('newExamForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const payload = {
      exam_date: document.getElementById('newExamDate').value,
      exam_time: document.getElementById('newExamTime').value,
      capacity: Number(document.getElementById('newExamLimit').value || 80),
      active: document.getElementById('newExamActive').value === 'true',
      segments: document.getElementById('newExamSegments').value.split(',').map(s => s.trim()).filter(Boolean),
      series: document.getElementById('newExamSeries').value.split(',').map(s => s.trim()).filter(Boolean)
    };
    const { error } = await supabase.from('exam_dates').insert(payload);
    if(error) return alert('Não foi possível cadastrar a data.');
    await loadDashboard();
  });
}
