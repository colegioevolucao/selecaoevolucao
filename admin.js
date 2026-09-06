import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const SUPABASE_URL='https://sqqozfohvkxfkjydxkiw.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_Fcm35rSx0XDCdjtvetyRLg_iymciHct';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
let applications=[],examDates=[],editingId=null;

const seriesMap={'Educação Infantil':['Educação Infantil'],'Ensino Fundamental Anos Iniciais':['1º ano','2º ano','3º ano','4º ano','5º ano'],'Ensino Fundamental Anos Finais':['6º ano','7º ano','8º ano','9º ano'],'Ensino Médio':['1ª série','2ª série','3ª série']};

async function checkSession(){const{data}=await supabase.auth.getSession();if(data.session){$('loginView').classList.add('hidden');$('dashboardView').classList.remove('hidden');await loadDashboard();}}checkSession();
$('loginButton').onclick=async()=>{const{error}=await supabase.auth.signInWithPassword({email:$('adminEmail').value.trim(),password:$('adminPassword').value});if(error)return $('loginError').textContent='Acesso não autorizado. Confira login e senha.';$('loginView').classList.add('hidden');$('dashboardView').classList.remove('hidden');await loadDashboard();};
$('logoutButton').onclick=async()=>{await supabase.auth.signOut();location.reload();};

document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');['overview','candidates','exams','settings'].forEach(t=>$(`${t}Tab`).classList.toggle('hidden',t!==b.dataset.tab));});

async function loadDashboard(){
 const[a,d]=await Promise.all([supabase.from('applications').select('*').order('created_at',{ascending:false}),supabase.from('exam_dates').select('*').order('exam_date')]);
 if(a.error||d.error){console.error(a.error||d.error);return alert('Não foi possível carregar os dados da gestão.');}
 applications=a.data||[];examDates=d.data||[];populateDates();renderStats();renderCandidates();renderExams();
}

function renderStats(){
 const today=new Date().toISOString().slice(0,10);$('statTotal').textContent=applications.length;$('statToday').textContent=applications.filter(a=>a.created_at?.slice(0,10)===today).length;$('statSeries').textContent=new Set(applications.map(a=>a.series).filter(Boolean)).size;
 const next=examDates.filter(e=>e.active&&e.exam_date>=today)[0],count=next?applications.filter(a=>a.exam_date===next.exam_date&&a.status!=='Inscrição cancelada').length:0;$('statNextExam').textContent=count;
 $('nextExamCard').innerHTML=next?`<div class="step">PRÓXIMA PROVA</div><h2 style="font-size:42px;margin:8px 0">${new Date(next.exam_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).toUpperCase()} · ${next.exam_time.slice(0,5)}</h2><p><strong>${count} candidatos inscritos</strong></p>`:'<p>Nenhuma prova futura cadastrada.</p>';
 $('upcomingExamDates').innerHTML=examDates.filter(e=>e.active&&e.exam_date>=today).slice(1,4).map(e=>`<p><strong>${new Date(e.exam_date+'T12:00:00').toLocaleDateString('pt-BR')} · ${e.exam_time.slice(0,5)}</strong><br>${applications.filter(a=>a.exam_date===e.exam_date).length} inscritos</p>`).join('')||'<p>Sem outras datas futuras.</p>';
}

function populateDates(){
 const current=$('dateFilter').value;const dates=[...new Set(applications.map(a=>a.exam_date).filter(Boolean))].sort();
 $('dateFilter').innerHTML='<option value="">Todas as datas</option>'+dates.map(d=>`<option value="${d}">${new Date(d+'T12:00:00').toLocaleDateString('pt-BR')}</option>`).join('');$('dateFilter').value=current;
 $('crmExamDate').innerHTML='<option value="">Selecione</option>'+examDates.filter(e=>e.active).map(e=>`<option value="${e.id}">${new Date(e.exam_date+'T12:00:00').toLocaleDateString('pt-BR')} · ${e.exam_time.slice(0,5)}</option>`).join('');
}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function filtered(){const q=$('candidateSearch').value.toLowerCase(),date=$('dateFilter').value,seg=$('segmentFilter').value;return applications.filter(a=>(!q||`${a.student_name} ${a.guardian_name} ${a.current_school}`.toLowerCase().includes(q))&&(!date||a.exam_date===date)&&(!seg||a.segment===seg));}
function renderCandidates(){
 const list=filtered();$('candidateCount').textContent=`${list.length} candidato${list.length===1?'':'s'} encontrado${list.length===1?'':'s'}`;
 $('candidatesBody').innerHTML=list.map(a=>`<tr>
 <td>${esc(a.student_name)}</td><td>${esc(a.segment)}</td><td>${esc(a.series)}</td><td>${esc(a.guardian_name)}</td><td>${esc(a.guardian_whatsapp)}</td><td>${esc(a.current_school)}</td>
 <td>${a.exam_date?new Date(a.exam_date+'T12:00:00').toLocaleDateString('pt-BR'):'Visita'}</td>
 <td><span class="source-badge ${a.source==='CRM'?'crm':''}">${esc(a.source||'Link')}</span></td>
 <td><span class="payment-pill ${a.payment_status==='Pagamento confirmado'?'ok':''}">${esc(a.payment_status||'—')}</span></td>
 <td>${a.receipt_path?`<button class="receipt-btn" data-receipt="${esc(a.receipt_path)}">Ver</button>`:'—'}</td>
 <td><span class="status">${esc(a.status)}</span></td>
 <td><button class="icon-btn" data-edit="${a.id}">✎</button> <button class="icon-btn danger" data-delete="${a.id}">🗑</button></td></tr>`).join('');
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openModal(b.dataset.edit));
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>delCandidate(b.dataset.delete));
 document.querySelectorAll('[data-receipt]').forEach(b=>b.onclick=()=>openReceipt(b.dataset.receipt));
}
['candidateSearch','dateFilter','segmentFilter'].forEach(id=>$(id).oninput=renderCandidates);
$('clearFiltersBtn').onclick=()=>{$('candidateSearch').value='';$('dateFilter').value='';$('segmentFilter').value='';renderCandidates();};

async function openReceipt(path){
 const {data,error}=await supabase.storage.from('payment-receipts').createSignedUrl(path,60);
 if(error){console.error(error);return alert('Não foi possível abrir o comprovante.');}
 window.open(data.signedUrl,'_blank','noopener,noreferrer');
}

const modal=$('candidateModal');document.querySelectorAll('[data-close-modal]').forEach(e=>e.onclick=()=>modal.classList.add('hidden'));$('addCandidateBtn').onclick=()=>openModal();
$('crmSegment').onchange=()=>{refreshSeries();const infantil=$('crmSegment').value==='Educação Infantil';$('crmStudentPhoneWrap').classList.toggle('hidden',$('crmSegment').value!=='Ensino Médio');$('crmExamDate').disabled=infantil;if(infantil){$('crmExamDate').value='';$('crmStatus').value='Visita a agendar';$('crmPaymentStatus').value='Isento';}};
function refreshSeries(selected=''){$('crmSeries').innerHTML='<option value="">Selecione</option>'+(seriesMap[$('crmSegment').value]||[]).map(s=>`<option ${s===selected?'selected':''}>${s}</option>`).join('');}

function openModal(id=null){
 editingId=id;['crmStudentName','crmBirthDate','crmStudentPhone','crmGuardianName','crmGuardianRg','crmGuardianCpf','crmGuardianWhatsapp','crmGuardianEmail','crmCurrentSchool'].forEach(x=>$(x).value='');
 $('crmSegment').value='';refreshSeries();$('crmExamDate').value='';$('crmExamDate').disabled=false;$('crmStatus').value='Inscrição confirmada';$('crmPaymentStatus').value='Aguardando conferência';$('candidateModalTitle').textContent=id?'Editar aluno':'Adicionar aluno';
 if(id){const a=applications.find(x=>x.id===id);$('crmSegment').value=a.segment;refreshSeries(a.series);$('crmStudentName').value=a.student_name||'';$('crmBirthDate').value=a.birth_date||'';$('crmStudentPhone').value=a.student_phone||'';$('crmGuardianName').value=a.guardian_name||'';$('crmGuardianRg').value=a.guardian_rg||'';$('crmGuardianCpf').value=a.guardian_cpf||'';$('crmGuardianWhatsapp').value=a.guardian_whatsapp||'';$('crmGuardianEmail').value=a.guardian_email||'';$('crmCurrentSchool').value=a.current_school||'';$('crmStatus').value=a.status||'Inscrição confirmada';$('crmPaymentStatus').value=a.payment_status||'Aguardando conferência';$('crmStudentPhoneWrap').classList.toggle('hidden',a.segment!=='Ensino Médio');const e=examDates.find(e=>e.exam_date===a.exam_date&&e.exam_time===a.exam_time);$('crmExamDate').value=e?.id||'';$('crmExamDate').disabled=a.segment==='Educação Infantil';}
 modal.classList.remove('hidden');
}

$('saveCandidateBtn').onclick=async()=>{
 const segment=$('crmSegment').value,series=$('crmSeries').value,student_name=$('crmStudentName').value.trim(),birth_date=$('crmBirthDate').value,guardian_name=$('crmGuardianName').value.trim(),guardian_rg=$('crmGuardianRg').value.trim(),guardian_cpf=$('crmGuardianCpf').value.replace(/\D/g,''),guardian_whatsapp=$('crmGuardianWhatsapp').value.trim(),guardian_email=$('crmGuardianEmail').value.trim(),current_school=$('crmCurrentSchool').value.trim(),status=$('crmStatus').value,payment_status=$('crmPaymentStatus').value;
 if(!segment||!series||!student_name||!birth_date||!guardian_name||!guardian_rg||!guardian_cpf||!guardian_whatsapp||!guardian_email||!current_school)return alert('Preencha todos os campos obrigatórios.');
 let exam_date=null,exam_time=null;const eid=$('crmExamDate').value;if(segment!=='Educação Infantil'){if(!eid)return alert('Selecione a data da prova.');const e=examDates.find(x=>x.id===eid);exam_date=e.exam_date;exam_time=e.exam_time;}
 const original=editingId?applications.find(a=>a.id===editingId):null;
 const payload={application_type:segment==='Educação Infantil'?'visit':'exam',segment,series,student_name,birth_date,student_phone:segment==='Ensino Médio'?$('crmStudentPhone').value.trim():null,guardian_name,guardian_rg,guardian_cpf,guardian_whatsapp,guardian_email,current_school,exam_date,exam_time,status,payment_amount:segment==='Educação Infantil'?0:30,payment_method:segment==='Educação Infantil'?null:'PIX',payment_status,source:original?.source||'CRM'};
 const r=editingId?await supabase.from('applications').update(payload).eq('id',editingId):await supabase.from('applications').insert(payload);
 if(r.error){console.error(r.error);return alert('Não foi possível salvar o aluno.');}modal.classList.add('hidden');await loadDashboard();
};

async function delCandidate(id){
 const a=applications.find(x=>x.id===id);if(!confirm(`Excluir o cadastro de "${a.student_name}"?`))return;
 if(a.receipt_path)await supabase.storage.from('payment-receipts').remove([a.receipt_path]);
 const{error}=await supabase.from('applications').delete().eq('id',id);if(error)return alert('Não foi possível excluir o cadastro.');await loadDashboard();
}

$('exportPdfBtn').onclick=()=>{
 const list=filtered();if(!list.length)return alert('Não há candidatos para gerar o PDF.');
 const{jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape'});doc.setFontSize(18);doc.text('Colégio Evolução — Seleção 2027',14,16);
 const filterDate=$('dateFilter').value;doc.setFontSize(10);doc.text(`${filterDate?'Data: '+new Date(filterDate+'T12:00:00').toLocaleDateString('pt-BR'):'Todas as datas'} | ${list.length} candidato(s)`,14,23);
 doc.autoTable({startY:29,head:[['Candidato','Segmento','Série','Responsável','WhatsApp','Escola','Data','Pagamento','Status']],body:list.map(a=>[a.student_name,a.segment,a.series,a.guardian_name,a.guardian_whatsapp,a.current_school,a.exam_date?new Date(a.exam_date+'T12:00:00').toLocaleDateString('pt-BR'):'Visita',a.payment_status||'—',a.status]),styles:{fontSize:8}});
 doc.save(`selecao-2027-${filterDate||'todos'}.pdf`);
};

function renderExams(){
 const w=$('examManagement');w.innerHTML=`<form id="newExamForm" class="form-grid" style="margin-bottom:28px"><label>Data<input id="newExamDate" type="date" required></label><label>Horário<input id="newExamTime" type="time" value="14:30" required></label><label>Limite<input id="newExamLimit" type="number" value="80"></label><label>Status<select id="newExamActive"><option value="true">Inscrições abertas</option><option value="false">Inscrições encerradas</option></select></label><label>Segmentos<input id="newExamSegments" placeholder="separados por vírgula"></label><label>Séries<input id="newExamSeries" placeholder="separadas por vírgula"></label><button class="btn primary">+ NOVA DATA DE PROVA</button></form>
 <div style="overflow:auto"><table><thead><tr><th>Data</th><th>Horário</th><th>Inscritos</th><th>Limite</th><th>Status</th></tr></thead><tbody>${examDates.map(e=>`<tr><td>${new Date(e.exam_date+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>${e.exam_time.slice(0,5)}</td><td>${applications.filter(a=>a.exam_date===e.exam_date&&a.status!=='Inscrição cancelada').length}</td><td>${e.capacity??'—'}</td><td><span class="status">${e.active?'Inscrições abertas':'Encerradas'}</span></td></tr>`).join('')}</tbody></table></div>`;
 $('newExamForm').onsubmit=async ev=>{ev.preventDefault();const payload={exam_date:$('newExamDate').value,exam_time:$('newExamTime').value,capacity:Number($('newExamLimit').value||80),active:$('newExamActive').value==='true',segments:$('newExamSegments').value.split(',').map(s=>s.trim()).filter(Boolean),series:$('newExamSeries').value.split(',').map(s=>s.trim()).filter(Boolean)};const{error}=await supabase.from('exam_dates').insert(payload);if(error)return alert('Não foi possível cadastrar a data.');await loadDashboard();};
}
