import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const SUPABASE_URL='https://sqqozfohvkxfkjydxkiw.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_Fcm35rSx0XDCdjtvetyRLg_iymciHct';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
let applications=[],examDates=[];

async function loadDashboard(){
 const[a,d]=await Promise.all([
   supabase.from('applications').select('*').order('created_at',{ascending:false}),
   supabase.from('exam_dates').select('*').order('exam_date')
 ]);
 applications=a.data||[];examDates=d.data||[];
 renderStats();
}

function renderStats(){
 const today=new Date().toISOString().slice(0,10);
 $('statTotal').textContent=applications.length;
 $('statToday').textContent=applications.filter(a=>a.created_at?.slice(0,10)===today).length;
 $('statSeries').textContent=new Set(applications.map(a=>a.series).filter(Boolean)).size;

 const next=examDates.filter(e=>e.active&&e.exam_date>=today)[0];
 const count=next?applications.filter(a=>a.exam_date===next.exam_date&&a.status!=='Inscrição cancelada').length:0;

 // AJUSTE SOLICITADO: mostra a data da próxima prova
 $('statNextExam').textContent=next
   ? new Date(next.exam_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
   : '—';

 $('nextExamCard').innerHTML=next
   ? `<div class="step">PRÓXIMA PROVA</div>
      <h2 style="font-size:42px;margin:8px 0">
        ${new Date(next.exam_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).toUpperCase()} · ${next.exam_time.slice(0,5)}
      </h2>
      <p><strong>${count} candidatos inscritos</strong></p>`
   : '<p>Nenhuma prova futura cadastrada.</p>';

 $('upcomingExamDates').innerHTML=examDates.filter(e=>e.active&&e.exam_date>=today).slice(1,4)
   .map(e=>`<p><strong>${new Date(e.exam_date+'T12:00:00').toLocaleDateString('pt-BR')} · ${e.exam_time.slice(0,5)}</strong><br>${applications.filter(a=>a.exam_date===e.exam_date).length} inscritos</p>`)
   .join('')||'<p>Sem outras datas futuras.</p>';
}

(async()=>{
 const {data}=await supabase.auth.getSession();
 if(data.session)await loadDashboard();
})();
