import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://sqqozfohvkxfkjydxkiw.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_Fcm35rSx0XDCdjtvetyRLg_iymciHct';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const $=id=>document.getElementById(id);

let applications=[];
let examDates=[];
let editingId=null;

const seriesMap={
 'Educação Infantil':['Educação Infantil'],
 'Ensino Fundamental Anos Iniciais':['1º ano','2º ano','3º ano','4º ano','5º ano'],
 'Ensino Fundamental Anos Finais':['6º ano','7º ano','8º ano','9º ano'],
 'Ensino Médio':['1ª série','2ª série','3ª série']
};

function esc(v=''){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function todayISO(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDateBR(d){return d?new Date(d+'T12:00:00').toLocaleDateString('pt-BR'):'—';}

/* MENU MOBILE */
function openMobileMenu(){
  $('sidebar').classList.add('mobile-open');
  $('mobileMenuBackdrop').classList.remove('hidden');
  document.body.classList.add('menu-open');
  $('mobileMenuButton').setAttribute('aria-expanded','true');
}
function closeMobileMenu(){
  $('sidebar').classList.remove('mobile-open');
  $('mobileMenuBackdrop').classList.add('hidden');
  document.body.classList.remove('menu-open');
  $('mobileMenuButton').setAttribute('aria-expanded','false');
}
$('mobileMenuButton').addEventListener('click',openMobileMenu);
$('mobileMenuClose').addEventListener('click',closeMobileMenu);
$('mobileMenuBackdrop').addEventListener('click',closeMobileMenu);

async function checkSession(){
  const {data}=await supabase.auth.getSession();
  if(data.session){
    $('loginView').classList.add('hidden');
    $('dashboardView').classList.remove('hidden');
    await loadDashboard();
  }
}
checkSession();

$('loginButton').onclick=async()=>{
  const {error}=await supabase.auth.signInWithPassword({
    email:$('adminEmail').value.trim(),
    password:$('adminPassword').value
  });
  if(error)return $('loginError').textContent='Acesso não autorizado. Confira login e senha.';
  $('loginView').classList.add('hidden');
  $('dashboardView').classList.remove('hidden');
  await loadDashboard();
};

$('logoutButton').onclick=async()=>{await supabase.auth.signOut();location.reload();};
$('refreshButton').onclick=()=>loadDashboard();

document.querySelectorAll('[data-tab]').forEach(btn=>{
  btn.addEventListener('click',async()=>{
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');

    const tab=btn.dataset.tab;
    ['overview','candidates','exams','settings'].forEach(t=>{
      $(`${t}Tab`).classList.toggle('hidden',t!==tab);
    });

    closeMobileMenu();

    if(tab!=='settings')await loadDashboard();
  });
});

async function loadDashboard(){
  const [a,d]=await Promise.all([
    supabase.from('applications').select('*').order('created_at',{ascending:false}),
    supabase.from('exam_dates').select('*').order('exam_date')
  ]);
  if(a.error||d.error){console.error(a.error||d.error);return;}
  applications=a.data||[];
  examDates=d.data||[];
  populateDates();
  renderStats();
  renderCandidates();
  renderExams();
}

function renderStats(){
  const today=todayISO();
  const valid=applications.filter(a=>a.status!=='Inscrição cancelada');

  $('statTotal').textContent=valid.length;
  $('statSeries').textContent=new Set(valid.map(a=>a.series).filter(Boolean)).size;
  $('statToday').textContent=valid.filter(a=>{
    if(!a.created_at)return false;
    const d=new Date(a.created_at);
    const local=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return local===today;
  }).length;

  const future=examDates.filter(e=>e.active&&e.exam_date>=today);
  const next=future[0];
  $('statNextExam').textContent=next
    ? new Date(next.exam_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
    : '—';

  if(!next){
    $('nextExamCard').innerHTML='<p class="muted">Nenhuma prova futura.</p>';
    $('upcomingExamDates').innerHTML='<p class="muted">Sem próximas datas.</p>';
    return;
  }

  const count=valid.filter(a=>a.exam_date===next.exam_date).length;
  $('nextExamCard').innerHTML=`<div class="step">PRÓXIMA PROVA</div><div class="next-exam-date">${formatDateBR(next.exam_date)} · ${next.exam_time.slice(0,5)}</div><div class="next-exam-count">${count} candidato${count===1?'':'s'} inscrito${count===1?'':'s'}</div>`;

  $('upcomingExamDates').innerHTML=future.slice(1,4).map(e=>{
    const c=valid.filter(a=>a.exam_date===e.exam_date).length;
    return `<div class="upcoming-item"><strong>${formatDateBR(e.exam_date)} · ${e.exam_time.slice(0,5)}</strong><span>${c} inscrito${c===1?'':'s'}</span></div>`;
  }).join('');
}

function populateDates(){
  const dates=[...new Set(examDates.map(e=>e.exam_date).filter(Boolean))].sort();
  $('dateFilter').innerHTML='<option value="">Todas as datas</option>'+dates.map(d=>`<option value="${d}">${formatDateBR(d)}</option>`).join('');
  $('crmExamDate').innerHTML='<option value="">Selecione</option>'+examDates.filter(e=>e.active).map(e=>`<option value="${e.id}">${formatDateBR(e.exam_date)} · ${e.exam_time.slice(0,5)}</option>`).join('');
}

function filtered(){
  const q=$('candidateSearch').value.toLowerCase();
  const date=$('dateFilter').value;
  const seg=$('segmentFilter').value;
  return applications.filter(a=>(!q||`${a.student_name} ${a.guardian_name} ${a.current_school}`.toLowerCase().includes(q))&&(!date||a.exam_date===date)&&(!seg||a.segment===seg));
}

function renderCandidates(){
  const list=filtered();
  $('candidateCount').textContent=`${list.length} candidato${list.length===1?'':'s'}`;
  $('candidatesBody').innerHTML=list.map(a=>`<tr>
    <td>${esc(a.student_name)}</td><td>${esc(a.segment)}</td><td>${esc(a.series)}</td><td>${esc(a.guardian_name)}</td>
    <td>${esc(a.guardian_whatsapp)}</td><td>${esc(a.current_school)}</td><td>${a.exam_date?formatDateBR(a.exam_date):'Visita'}</td>
    <td>${esc(a.source||'Link')}</td><td>${esc(a.payment_status||'—')}</td>
    <td>${a.receipt_path?`<button class="receipt-btn" data-receipt="${esc(a.receipt_path)}">Ver</button>`:'—'}</td>
    <td>${esc(a.status)}</td>
    <td><button class="icon-btn" data-edit="${a.id}">✎</button> <button class="icon-btn danger" data-delete="${a.id}">🗑</button></td>
  </tr>`).join('');

  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openModal(b.dataset.edit));
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteCandidate(b.dataset.delete));
  document.querySelectorAll('[data-receipt]').forEach(b=>b.onclick=()=>openReceipt(b.dataset.receipt));
}

$('candidateSearch').oninput=renderCandidates;
$('dateFilter').onchange=renderCandidates;
$('segmentFilter').onchange=renderCandidates;
$('clearFiltersBtn').onclick=()=>{$('candidateSearch').value='';$('dateFilter').value='';$('segmentFilter').value='';renderCandidates();};

async function openReceipt(path){
  const {data,error}=await supabase.storage.from('payment-receipts').createSignedUrl(path,60);
  if(error)return alert('Não foi possível abrir o comprovante.');
  window.open(data.signedUrl,'_blank');
}

const modal=$('candidateModal');
document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=()=>modal.classList.add('hidden'));
$('addCandidateBtn').onclick=()=>openModal();

function refreshSeries(selected=''){
  $('crmSeries').innerHTML='<option value="">Selecione</option>'+(seriesMap[$('crmSegment').value]||[]).map(s=>`<option ${s===selected?'selected':''}>${s}</option>`).join('');
}
$('crmSegment').onchange=()=>refreshSeries();

function openModal(id=null){
  editingId=id;
  $('candidateModalTitle').textContent=id?'Editar aluno':'Adicionar aluno';
  modal.classList.remove('hidden');
}

async function deleteCandidate(id){
  const a=applications.find(x=>x.id===id);
  if(!confirm(`Excluir ${a.student_name}?`))return;
  await supabase.from('applications').delete().eq('id',id);
  await loadDashboard();
}

$('saveCandidateBtn').onclick=async()=>{
  const segment=$('crmSegment').value;
  const series=$('crmSeries').value;
  const examId=$('crmExamDate').value;
  const exam=examDates.find(e=>e.id===examId);

  const payload={
    application_type:segment==='Educação Infantil'?'visit':'exam',
    segment,series,
    student_name:$('crmStudentName').value.trim(),
    birth_date:$('crmBirthDate').value,
    student_phone:$('crmStudentPhone').value.trim()||null,
    guardian_name:$('crmGuardianName').value.trim(),
    guardian_rg:$('crmGuardianRg').value.trim(),
    guardian_cpf:$('crmGuardianCpf').value.replace(/\D/g,''),
    guardian_whatsapp:$('crmGuardianWhatsapp').value.trim(),
    guardian_email:$('crmGuardianEmail').value.trim(),
    current_school:$('crmCurrentSchool').value.trim(),
    exam_date:exam?.exam_date||null,
    exam_time:exam?.exam_time||null,
    status:$('crmStatus').value,
    payment_status:$('crmPaymentStatus').value,
    source:'CRM',
    payment_amount:segment==='Educação Infantil'?0:30,
    payment_method:segment==='Educação Infantil'?null:'PIX'
  };

  const r=editingId
    ? await supabase.from('applications').update(payload).eq('id',editingId)
    : await supabase.from('applications').insert(payload);

  if(r.error)return alert('Não foi possível salvar.');
  modal.classList.add('hidden');
  await loadDashboard();
};

$('exportPdfBtn').onclick=()=>{
  const list=filtered();
  if(!list.length)return alert('Não há candidatos para gerar o PDF.');
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape'});
  doc.text('Colégio Evolução — Seleção 2027',14,16);
  doc.autoTable({
    startY:24,
    head:[['Candidato','Segmento','Série','Responsável','WhatsApp','Escola','Data','Pagamento','Status']],
    body:list.map(a=>[a.student_name,a.segment,a.series,a.guardian_name,a.guardian_whatsapp,a.current_school,a.exam_date?formatDateBR(a.exam_date):'Visita',a.payment_status||'—',a.status])
  });
  doc.save('selecao-2027.pdf');
};

function renderExams(){
  $('examManagement').innerHTML='<div class="table-wrap"><table><thead><tr><th>Data</th><th>Horário</th><th>Inscritos</th><th>Limite</th><th>Status</th></tr></thead><tbody>'+
    examDates.map(e=>`<tr><td>${formatDateBR(e.exam_date)}</td><td>${e.exam_time.slice(0,5)}</td><td>${applications.filter(a=>a.exam_date===e.exam_date).length}</td><td>${e.capacity??'—'}</td><td>${e.active?'Inscrições abertas':'Encerradas'}</td></tr>`).join('')+
    '</tbody></table></div>';
}
