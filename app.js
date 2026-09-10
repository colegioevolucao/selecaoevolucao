import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://sqqozfohvkxfkjydxkiw.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_Fcm35rSx0XDCdjtvetyRLg_iymciHct';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const PIX_KEY='83 99196-8537';
const PROGRAM_FILES={
 '1º ano':'./programas/programa-1-ano.pdf',
 '2º ano':'./programas/programa-2-ano.pdf',
 '3º ano':'./programas/programa-3-ano.pdf',
 '4º ano':'./programas/programa-4-ano.pdf',
 '5º ano':'./programas/programa-5-ano.pdf',
 '6º ano':'./programas/programa-6-ano.pdf',
 '7º ano':'./programas/programa-7-ano.pdf',
 '8º ano':'./programas/programa-8-ano.pdf',
 '9º ano':'./programas/programa-9-ano.pdf',
 '1ª série':'./programas/programa-1-serie.pdf',
 '2ª série':'./programas/programa-2-serie.pdf',
 '3ª série':'./programas/programa-3-serie.pdf'
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
 if(state.segment==='Educação Infantil'){
   state.series='Educação Infantil';$('selectedSeries').value=state.series;$('studentPhoneField').classList.add('hidden');show('student');return;
 }
 const wrap=$('seriesOptions');wrap.innerHTML='';
 seriesMap[state.segment].forEach(series=>{
   const b=document.createElement('button');b.className='choice';b.textContent=series;
   b.onclick=()=>{state.series=series;$('selectedSeries').value=series;$('studentPhoneField').classList.toggle('hidden',state.segment!=='Ensino Médio');show('student');};
   wrap.appendChild(b);
 });
 show('series');
});

function cpfValido(cpf){
 cpf=(cpf||'').replace(/\D/g,'');if(cpf.length!==11||/^(\d)\1{10}$/.test(cpf))return false;
 let s=0;for(let i=0;i<9;i++)s+=Number(cpf[i])*(10-i);let d1=(s*10)%11;if(d1===10)d1=0;if(d1!==Number(cpf[9]))return false;
 s=0;for(let i=0;i<10;i++)s+=Number(cpf[i])*(11-i);let d2=(s*10)%11;if(d2===10)d2=0;return d2===Number(cpf[10]);
}
function readForm(){
 state.studentName=$('studentName').value.trim();state.birthDate=$('birthDate').value;state.studentPhone=$('studentPhone').value.trim();
 state.guardianName=$('guardianName').value.trim();state.guardianRg=$('guardianRg').value.trim();state.guardianCpf=$('guardianCpf').value.trim();
 state.guardianWhatsapp=$('guardianWhatsapp').value.trim();state.guardianEmail=$('guardianEmail').value.trim();state.currentSchool=$('currentSchool').value.trim();
}
function validateBase(){
 readForm();const req=[state.studentName,state.birthDate,state.guardianName,state.guardianRg,state.guardianCpf,state.guardianWhatsapp,state.guardianEmail,state.currentSchool];
 if(req.some(v=>!v)){alert('Preencha todos os campos obrigatórios.');return false;}
 if(!cpfValido(state.guardianCpf)){alert('Informe um CPF válido.');return false;}
 if(!$('privacyConsent').checked){alert('Marque a autorização de uso dos dados.');return false;}
 return true;
}

$('studentNext').onclick=async()=>{
 if(!validateBase())return;
 if(state.segment==='Educação Infantil'){show('visit');return;}
 const {data,error}=await supabase.from('exam_dates').select('*').eq('active',true).contains('segments',[state.segment]).order('exam_date');
 if(error){console.error(error);alert('Não foi possível carregar as datas.');return;}
 const available=(data||[]).filter(x=>!x.series?.length||x.series.includes(state.series));
 const wrap=$('dateOptions');
 const continueBtn=$('dateContinueBtn');

 wrap.innerHTML='';
 continueBtn.disabled=true;
 state.examDate='';
 state.examTime='';

 if(!available.length){
   wrap.innerHTML='<div class="info-card"><p>No momento, não há datas disponíveis para esta série.</p></div>';
 }else{
   const groups={};

   available.forEach(item=>{
     const d=new Date(item.exam_date+'T12:00:00');
     const monthKey=d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
     if(!groups[monthKey]) groups[monthKey]=[];
     groups[monthKey].push(item);
   });

   Object.entries(groups).forEach(([monthLabel,items])=>{
     const section=document.createElement('div');
     section.className='date-month-group';

     const title=document.createElement('h3');
     title.className='date-month-title';
     title.textContent=monthLabel.toUpperCase();
     section.appendChild(title);

     const grid=document.createElement('div');
     grid.className='date-card-grid';

     items.forEach(item=>{
       const d=new Date(item.exam_date+'T12:00:00');
       const card=document.createElement('button');
       card.type='button';
       card.className='date-card';

       const day=d.toLocaleDateString('pt-BR',{day:'2-digit'});
       const monthShort=d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','').toUpperCase();
       const weekday=d.toLocaleDateString('pt-BR',{weekday:'long'});
       const time=item.exam_time.slice(0,5);

       card.innerHTML=`
         <span class="date-card-month">${monthShort}</span>
         <strong class="date-card-day">${day}</strong>
         <span class="date-card-weekday">${weekday}</span>
         <span class="date-card-time">${time}</span>
         <span class="date-card-select">Escolher <b>○</b></span>
       `;

       card.onclick=()=>{
         document.querySelectorAll('.date-card').forEach(c=>{
           c.classList.remove('selected');
           const mark=c.querySelector('.date-card-select b');
           if(mark) mark.textContent='○';
         });

         card.classList.add('selected');
         const mark=card.querySelector('.date-card-select b');
         if(mark) mark.textContent='✓';

         state.examDate=item.exam_date;
         state.examTime=item.exam_time;
         continueBtn.disabled=false;
       };

       grid.appendChild(card);
     });

     section.appendChild(grid);
     wrap.appendChild(section);
   });
 }

 show('date');
};

$('dateContinueBtn').onclick=()=>{
 if(!state.examDate){
   alert('Escolha uma data para continuar.');
   return;
 }
 show('payment');
};

$('paymentReceipt').onchange=e=>{
 const file=e.target.files?.[0]||null;state.receiptFile=file;
 $('receiptFileName').textContent=file?file.name:'Nenhum arquivo selecionado';
};
$('copyPixBtn').onclick=async()=>{
 try{await navigator.clipboard.writeText(PIX_KEY.replace(/\D/g,''));$('copyPixBtn').textContent='CHAVE COPIADA ✓';setTimeout(()=>$('copyPixBtn').textContent='COPIAR CHAVE',1800);}
 catch{alert(`Chave PIX: ${PIX_KEY}`);}
};
$('paymentNext').onclick=()=>{
 const file=state.receiptFile;
 if(!file){alert('Anexe o comprovante de pagamento para continuar.');return;}
 const allowed=['application/pdf','image/jpeg','image/png','image/webp'];
 if(!allowed.includes(file.type)){alert('Envie o comprovante em PDF, JPG, PNG ou WEBP.');return;}
 if(file.size>8*1024*1024){alert('O arquivo deve ter no máximo 8 MB.');return;}
 fillReview();show('review');
};

function fillReview(){
 const date=new Date(state.examDate+'T12:00:00');
 $('reviewCard').innerHTML=`
 <div class="review-row"><span>Candidato</span><strong>${state.studentName}</strong></div>
 <div class="review-row"><span>Ingresso</span><strong>${state.series} — ${state.segment}</strong></div>
 <div class="review-row"><span>Prova</span><strong>${date.toLocaleDateString('pt-BR')} · ${state.examTime.slice(0,5)}</strong></div>
 <div class="review-row"><span>Responsável</span><strong>${state.guardianName}</strong></div>
 <div class="review-row"><span>WhatsApp</span><strong>${state.guardianWhatsapp}</strong></div>
 <div class="review-row"><span>Pagamento</span><strong>R$ 30,00 · comprovante anexado</strong></div>`;
}

async function saveExamApplication(){
 const id=crypto.randomUUID();
 const file=state.receiptFile;
 const ext=(file.name.split('.').pop()||'bin').toLowerCase();
 const receiptPath=`${id}/${crypto.randomUUID()}.${ext}`;

 const upload=await supabase.storage.from('payment-receipts').upload(receiptPath,file,{upsert:false,contentType:file.type});
 if(upload.error){console.error(upload.error);alert('Não foi possível enviar o comprovante. Tente novamente.');return false;}

 const payload={
   id,application_type:'exam',segment:state.segment,series:state.series,student_name:state.studentName,birth_date:state.birthDate,
   student_phone:state.segment==='Ensino Médio'?state.studentPhone:null,guardian_name:state.guardianName,guardian_rg:state.guardianRg,
   guardian_cpf:state.guardianCpf.replace(/\D/g,''),guardian_whatsapp:state.guardianWhatsapp,guardian_email:state.guardianEmail,
   current_school:state.currentSchool,exam_date:state.examDate,exam_time:state.examTime,status:'Inscrição confirmada',source:'Link',
   payment_amount:30,payment_method:'PIX',payment_status:'Comprovante enviado',receipt_path:receiptPath,receipt_uploaded_at:new Date().toISOString()
 };
 const {error}=await supabase.from('applications').insert(payload);
 if(error){console.error(error);alert('O comprovante foi enviado, mas não foi possível concluir a inscrição. Entre em contato com a escola.');return false;}
 return true;
}

$('confirmApplication').onclick=async()=>{
 $('confirmApplication').disabled=true;$('confirmApplication').textContent='ENVIANDO...';
 const ok=await saveExamApplication();
 $('confirmApplication').disabled=false;$('confirmApplication').textContent='CONFIRMAR INSCRIÇÃO';
 if(!ok)return;
 const date=new Date(state.examDate+'T12:00:00');
 $('successStudentName').textContent=state.studentName;
 $('successSeriesLine').textContent=`Seleção 2027 • ${state.series}`;
 $('successExamDate').textContent=date.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'});
 $('successExamTime').textContent=state.examTime.slice(0,5);
 const programFile=PROGRAM_FILES[state.series];
 if(programFile){
   $('programDownloadBtn').href=programFile;
   $('programDownloadBtn').setAttribute('download',`Programa da Prova - ${state.series} - Selecao 2027.pdf`);
   $('programDownloadBox').classList.remove('hidden');
 }else{
   $('programDownloadBox').classList.add('hidden');
 }
 show('success');
};

$('visitConfirm').onclick=async()=>{
 readForm();
 const payload={application_type:'visit',segment:'Educação Infantil',series:'Educação Infantil',student_name:state.studentName,birth_date:state.birthDate,
 guardian_name:state.guardianName,guardian_rg:state.guardianRg,guardian_cpf:state.guardianCpf.replace(/\D/g,''),guardian_whatsapp:state.guardianWhatsapp,
 guardian_email:state.guardianEmail,current_school:state.currentSchool,status:'Visita a agendar',source:'Link',payment_status:'Isento'};
 const {error}=await supabase.from('applications').insert(payload);
 if(error){console.error(error);alert('Não foi possível registrar o interesse.');return;}
 show('visitSuccess');
};
