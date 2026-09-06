import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://sqqozfohvkxfkjydxkiw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Fcm35rSx0XDCdjtvetyRLg_iymciHct';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  segment: '',
  series: '',
  studentName: '',
  birthDate: '',
  studentPhone: '',
  guardianName: '',
  guardianRg: '',
  guardianCpf: '',
  guardianWhatsapp: '',
  guardianEmail: '',
  currentSchool: '',
  examDate: '',
  examTime: ''
};

const screens = [...document.querySelectorAll('.screen')];
function show(id){
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('[data-next]').forEach(btn => {
  btn.addEventListener('click', () => show(btn.dataset.next));
});
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => show(btn.dataset.back));
});

const seriesMap = {
  'Ensino Fundamental Anos Iniciais': ['1º ano','2º ano','3º ano','4º ano','5º ano'],
  'Ensino Fundamental Anos Finais': ['6º ano','7º ano','8º ano','9º ano'],
  'Ensino Médio': ['1ª série','2ª série','3ª série']
};

document.querySelectorAll('[data-segment]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.segment = btn.dataset.segment;

    if(state.segment === 'Educação Infantil'){
      state.series = 'Educação Infantil';
      document.getElementById('selectedSeries').value = state.series;
      document.getElementById('studentPhoneField').classList.add('hidden');
      show('student');
      return;
    }

    const wrap = document.getElementById('seriesOptions');
    wrap.innerHTML = '';
    seriesMap[state.segment].forEach(series => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.textContent = series;
      b.addEventListener('click', () => {
        state.series = series;
        document.getElementById('selectedSeries').value = series;
        document.getElementById('studentPhoneField')
          .classList.toggle('hidden', state.segment !== 'Ensino Médio');
        show('student');
      });
      wrap.appendChild(b);
    });
    show('series');
  });
});

function cpfValido(cpf){
  cpf = (cpf || '').replace(/\D/g,'');
  if(cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for(let i=0;i<9;i++) sum += Number(cpf[i])*(10-i);
  let d1 = (sum*10)%11; if(d1===10) d1=0;
  if(d1 !== Number(cpf[9])) return false;
  sum = 0;
  for(let i=0;i<10;i++) sum += Number(cpf[i])*(11-i);
  let d2 = (sum*10)%11; if(d2===10) d2=0;
  return d2 === Number(cpf[10]);
}

function readForm(){
  state.studentName = document.getElementById('studentName').value.trim();
  state.birthDate = document.getElementById('birthDate').value;
  state.studentPhone = document.getElementById('studentPhone').value.trim();
  state.guardianName = document.getElementById('guardianName').value.trim();
  state.guardianRg = document.getElementById('guardianRg').value.trim();
  state.guardianCpf = document.getElementById('guardianCpf').value.trim();
  state.guardianWhatsapp = document.getElementById('guardianWhatsapp').value.trim();
  state.guardianEmail = document.getElementById('guardianEmail').value.trim();
  state.currentSchool = document.getElementById('currentSchool').value.trim();
}

function validateBase(){
  readForm();
  const required = [
    state.studentName,state.birthDate,state.guardianName,state.guardianRg,
    state.guardianCpf,state.guardianWhatsapp,state.guardianEmail,state.currentSchool
  ];
  if(required.some(v => !v)) return alert('Preencha todos os campos obrigatórios.');
  if(!cpfValido(state.guardianCpf)) return alert('Informe um CPF válido.');
  if(!document.getElementById('privacyConsent').checked) return alert('Marque a autorização de uso dos dados.');
  return true;
}

document.getElementById('studentNext').addEventListener('click', async () => {
  if(!validateBase()) return;

  if(state.segment === 'Educação Infantil'){
    show('visit');
    return;
  }

  const { data, error } = await supabase
    .from('exam_dates')
    .select('*')
    .eq('active', true)
    .contains('segments', [state.segment])
    .order('exam_date');

  if(error){
    console.error(error);
    alert('Não foi possível carregar as datas. Verifique a configuração do Supabase.');
    return;
  }

  const available = (data || []).filter(item =>
    !item.series?.length || item.series.includes(state.series)
  );

  const wrap = document.getElementById('dateOptions');
  wrap.innerHTML = '';
  if(!available.length){
    wrap.innerHTML = '<div class="info-card"><p>No momento, não há datas disponíveis para esta série. Entre em contato com a escola.</p></div>';
  } else {
    available.forEach(item => {
      const b = document.createElement('button');
      b.className = 'choice';
      const d = new Date(item.exam_date + 'T12:00:00');
      const dateLabel = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'});
      b.textContent = `${dateLabel} — ${item.exam_time.slice(0,5)}`;
      b.addEventListener('click', () => {
        state.examDate = item.exam_date;
        state.examTime = item.exam_time;
        fillReview();
        show('review');
      });
      wrap.appendChild(b);
    });
  }
  show('date');
});

function fillReview(){
  const date = new Date(state.examDate + 'T12:00:00');
  const label = date.toLocaleDateString('pt-BR');
  document.getElementById('reviewCard').innerHTML = `
    <div class="review-row"><span>Candidato</span><strong>${state.studentName}</strong></div>
    <div class="review-row"><span>Ingresso</span><strong>${state.series} — ${state.segment}</strong></div>
    <div class="review-row"><span>Prova</span><strong>${label} · ${state.examTime.slice(0,5)}</strong></div>
    <div class="review-row"><span>Responsável</span><strong>${state.guardianName}</strong></div>
    <div class="review-row"><span>WhatsApp</span><strong>${state.guardianWhatsapp}</strong></div>
  `;
}

async function saveApplication(type){
  const payload = {
    application_type: type,
    segment: state.segment,
    series: state.series,
    student_name: state.studentName,
    birth_date: state.birthDate,
    student_phone: state.segment === 'Ensino Médio' ? state.studentPhone : null,
    guardian_name: state.guardianName,
    guardian_rg: state.guardianRg,
    guardian_cpf: state.guardianCpf.replace(/\D/g,''),
    guardian_whatsapp: state.guardianWhatsapp,
    guardian_email: state.guardianEmail,
    current_school: state.currentSchool,
    exam_date: type === 'exam' ? state.examDate : null,
    exam_time: type === 'exam' ? state.examTime : null,
    status: type === 'visit' ? 'Visita a agendar' : 'Inscrição confirmada'
  };

  const { error } = await supabase.from('applications').insert(payload);
  if(error){
    console.error(error);
    alert('Não foi possível concluir a inscrição. Tente novamente.');
    return false;
  }
  return true;
}

document.getElementById('confirmApplication').addEventListener('click', async () => {
  if(await saveApplication('exam')){
    const date = new Date(state.examDate + 'T12:00:00');
    document.getElementById('successText').innerHTML =
      `A inscrição de <b>${state.studentName}</b> para a <b>Seleção 2027 — ${state.series}</b> foi confirmada.`;
    document.getElementById('successDate').textContent =
      `${date.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})} | ${state.examTime.slice(0,5)}`;
    show('success');
  }
});

document.getElementById('visitConfirm').addEventListener('click', async () => {
  if(await saveApplication('visit')) show('visitSuccess');
});
