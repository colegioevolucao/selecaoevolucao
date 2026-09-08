import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://sqqozfohvkxfkjydxkiw.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_Fcm35rSx0XDCdjtvetyRLg_iymciHct';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const PROGRAM_FILES={
  '1º ano':'./programas/programa-1-ano.pdf','2º ano':'./programas/programa-2-ano.pdf','3º ano':'./programas/programa-3-ano.pdf',
  '4º ano':'./programas/programa-4-ano.pdf','5º ano':'./programas/programa-5-ano.pdf','6º ano':'./programas/programa-6-ano.pdf',
  '7º ano':'./programas/programa-7-ano.pdf','8º ano':'./programas/programa-8-ano.pdf','9º ano':'./programas/programa-9-ano.pdf',
  '1ª série':'./programas/programa-1-serie.pdf','2ª série':'./programas/programa-2-serie.pdf','3ª série':'./programas/programa-3-serie.pdf'
};

const $=id=>document.getElementById(id);
const state={segment:'',series:'',studentName:'',birthDate:'',studentPhone:'',guardianName:'',guardianRg:'',guardianCpf:'',guardianWhatsapp:'',guardianEmail:'',currentSchool:'',examDate:'',examTime:'',receiptFile:null};
const screens=[...document.querySelectorAll('.screen')];

function show(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>show(b.dataset.next));
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));

const seriesMap={
 'Ensino Fundamental Anos Iniciais':['1º ano','2º ano','3º ano','4º ano','5º ano'],
 'Ensino Fundamental Anos Finais':['6º ano','7º ano','8º ano','9º ano'],
 'Ensino Médio':['1ª série','2ª série','3ª série']
};

document.querySelectorAll('[data-segment]').forEach(btn=>btn.onclick=()=>{
 state.segment=btn.dataset.segment;
 if(state.segment==='Educação Infantil'){state.series='Educação Infantil';$('selectedSeries').value=state.series;show('student');return;}
 const wrap=$('seriesOptions');wrap.innerHTML='';
 seriesMap[state.segment].forEach(series=>{
   const b=document.createElement('button');b.className='choice';b.textContent=series;
   b.onclick=()=>{state.series=series;$('selectedSeries').value=series;$('studentPhoneField').classList.toggle('hidden',state.segment!=='Ensino Médio');show('student');};
   wrap.appendChild(b);
 });
 show('series');
});

function readForm(){
 state.studentName=$('studentName').value.trim();state.birthDate=$('birthDate').value;state.studentPhone=$('studentPhone').value.trim();
 state.guardianName=$('guardianName').value.trim();state.guardianRg=$('guardianRg').value.trim();state.guardianCpf=$('guardianCpf').value.trim();
 state.guardianWhatsapp=$('guardianWhatsapp').value.trim();state.guardianEmail=$('guardianEmail').value.trim();state.currentSchool=$('currentSchool').value.trim();
}

$('studentNext').onclick=async()=>{
 readForm();
 if(!state.studentName||!state.birthDate||!state.guardianName||!state.guardianCpf||!state.guardianWhatsapp||!state.guardianEmail||!state.currentSchool){
   return alert('Preencha todos os campos obrigatórios.');
 }
 const {data,error}=await supabase.from('exam_dates').select('*').eq('active',true).contains('segments',[state.segment]).order('exam_date');
 if(error)return alert('Não foi possível carregar as datas.');

 const available=(data||[]).filter(x=>!x.series?.length||x.series.includes(state.series));
 const wrap=$('dateOptions');const continueBtn=$('dateContinueBtn');
 wrap.innerHTML='';continueBtn.disabled=true;state.examDate='';state.examTime='';

 const groups={};
 available.forEach(item=>{
   const d=new Date(item.exam_date+'T12:00:00');
   const monthKey=d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
   if(!groups[monthKey])groups[monthKey]=[];
   groups[monthKey].push(item);
 });

 Object.entries(groups).forEach(([monthLabel,items])=>{
   const section=document.createElement('div');section.className='date-month-group';
   const title=document.createElement('h3');title.className='date-month-title';title.textContent=monthLabel.toUpperCase();section.appendChild(title);
   const grid=document.createElement('div');grid.className='date-card-grid';

   items.forEach(item=>{
     const d=new Date(item.exam_date+'T12:00:00');
     const card=document.createElement('button');card.type='button';card.className='date-card';
     const day=d.toLocaleDateString('pt-BR',{day:'2-digit'});
     const monthShort=d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','').toUpperCase();
     const weekday=d.toLocaleDateString('pt-BR',{weekday:'long'});
     const time=item.exam_time.slice(0,5);

     card.innerHTML=`<span class="date-card-month">${monthShort}</span><strong class="date-card-day">${day}</strong><span class="date-card-weekday">${weekday}</span><span class="date-card-time">${time}</span><span class="date-card-select">Escolher <b>○</b></span>`;
     card.onclick=()=>{
       document.querySelectorAll('.date-card').forEach(c=>{c.classList.remove('selected');const m=c.querySelector('.date-card-select b');if(m)m.textContent='○';});
       card.classList.add('selected');card.querySelector('.date-card-select b').textContent='✓';
       state.examDate=item.exam_date;state.examTime=item.exam_time;continueBtn.disabled=false;
     };
     grid.appendChild(card);
   });

   section.appendChild(grid);wrap.appendChild(section);
 });

 show('date');
};

$('dateContinueBtn').onclick=()=>{if(!state.examDate)return alert('Escolha uma data para continuar.');show('payment');};

$('paymentReceipt').onchange=e=>{state.receiptFile=e.target.files?.[0]||null;$('receiptFileName').textContent=state.receiptFile?state.receiptFile.name:'Nenhum arquivo selecionado';};
$('paymentNext').onclick=()=>{if(!state.receiptFile)return alert('Anexe o comprovante para continuar.');fillReview();show('review');};

function fillReview(){
 const date=new Date(state.examDate+'T12:00:00');
 $('reviewCard').innerHTML=`<div class="review-row"><span>Candidato</span><strong>${state.studentName}</strong></div><div class="review-row"><span>Ingresso</span><strong>${state.series}</strong></div><div class="review-row"><span>Prova</span><strong>${date.toLocaleDateString('pt-BR')} · ${state.examTime.slice(0,5)}</strong></div>`;
}

$('confirmApplication').onclick=async()=>{
 const id=crypto.randomUUID();const file=state.receiptFile;const ext=(file.name.split('.').pop()||'bin').toLowerCase();const receiptPath=`${id}/${crypto.randomUUID()}.${ext}`;
 const upload=await supabase.storage.from('payment-receipts').upload(receiptPath,file,{upsert:false,contentType:file.type});
 if(upload.error)return alert('Não foi possível enviar o comprovante.');

 const payload={id,application_type:'exam',segment:state.segment,series:state.series,student_name:state.studentName,birth_date:state.birthDate,
 student_phone:state.segment==='Ensino Médio'?state.studentPhone:null,guardian_name:state.guardianName,guardian_rg:state.guardianRg,
 guardian_cpf:state.guardianCpf.replace(/\D/g,''),guardian_whatsapp:state.guardianWhatsapp,guardian_email:state.guardianEmail,current_school:state.currentSchool,
 exam_date:state.examDate,exam_time:state.examTime,status:'Inscrição confirmada',source:'Link',payment_amount:30,payment_method:'PIX',payment_status:'Comprovante enviado',
 receipt_path:receiptPath,receipt_uploaded_at:new Date().toISOString()};

 const {error}=await supabase.from('applications').insert(payload);
 if(error)return alert('Não foi possível concluir a inscrição.');

 const date=new Date(state.examDate+'T12:00:00');
 $('successStudentName').textContent=state.studentName;
 $('successSeriesLine').textContent=`Seleção 2027 • ${state.series}`;
 $('successExamDate').textContent=date.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'});
 $('successExamTime').textContent=state.examTime.slice(0,5);

 const programFile=PROGRAM_FILES[state.series];
 if(programFile){$('programDownloadBtn').href=programFile;$('programDownloadBox').classList.remove('hidden');}
 show('success');
};
