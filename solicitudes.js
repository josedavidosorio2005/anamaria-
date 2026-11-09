(function(){
'use strict';
const form=document.getElementById('quote-form');
const preview=document.getElementById('request-preview');
if(!form||!preview)return;
const number='573187158731';
let current=null;
let imageBlob=null;
const els={
  title:document.getElementById('pv-title'),
  service:document.getElementById('pv-service'),
  ref:document.getElementById('pv-ref'),
  client:document.getElementById('pv-client'),
  email:document.getElementById('pv-email'),
  phone:document.getElementById('pv-phone'),
  city:document.getElementById('pv-city'),
  mode:document.getElementById('pv-mode'),
  when:document.getElementById('pv-when'),
  details:document.getElementById('pv-details'),
  date:document.getElementById('pv-date'),
  share:document.getElementById('share-card'),
  download:document.getElementById('download-card'),
  chat:document.getElementById('chat-request'),
  status:document.getElementById('request-status')
};
const value=id=>(document.getElementById(id)?.value||'').trim();
const clean=s=>String(s).replace(/\s+/g,' ').trim();
function reference(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=k=>parts.find(x=>x.type===k)?.value||'';
  const date=part('year')+part('month')+part('day');
  const random=new Uint32Array(1);
  if(window.crypto&&window.crypto.getRandomValues)window.crypto.getRandomValues(random);
  else random[0]=Math.floor(Math.random()*1000000);
  return 'AG-'+date+'-'+(random[0]%100000).toString().padStart(5,'0');
}
function readForm(){
  return {
    service:document.querySelector('.choice.active')?.dataset.service||'Consultoría farmacéutica',
    client:clean(value('client-name')),
    email:value('client-email'),
    phone:clean(value('client-phone')),
    city:clean(value('client-city')),
    mode:value('client-mode')||'Por definir',
    when:value('client-when')||'Por definir',
    details:value('client-message'),
    date:new Intl.DateTimeFormat('es-CO',{timeZone:'America/Bogota',dateStyle:'long'}).format(new Date()),
    ref:reference()
  };
}
function whatsappMessage(d){
  const lines=[
    '*SOLICITUD DE COTIZACIÓN — ANA MARÍA GALLEGO BETANCUR*',
    '*Referencia:* '+d.ref,
    '',
    '*SERVICIO:* '+d.service,
    '*SOLICITANTE:* '+d.client,
    '*CORREO:* '+d.email,
    ...(d.phone?['*TELÉFONO:* '+d.phone]:[]),
    ...(d.city?['*CIUDAD:* '+d.city]:[]),
    '*MODALIDAD:* '+d.mode,
    '*PLAZO:* '+d.when,
    '',
    '*NECESIDAD:*',
    d.details,
    '',
    'Solicitud generada desde el portafolio profesional.'
  ];
  return lines.join('\n');
}
function showCard(d){
  const values={
    title:'Solicitud de cotización',
    service:d.service,ref:d.ref,client:d.client,email:d.email,
    phone:d.phone||'No indicado',city:d.city||'No indicada',
    mode:d.mode,when:d.when,details:d.details,date:d.date
  };
  for(const [key,val] of Object.entries(values)){
    if(els[key])els[key].textContent=val;
  }
  els.chat.href='https://wa.me/'+number+'?text='+encodeURIComponent(whatsappMessage(d));
  preview.hidden=false;
  preview.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function wrap(ctx,str,max){
  const out=[];
  const paragraphs=String(str).split(/\n/);
  for(const para of paragraphs){
    const words=para.trim().split(/\s+/).filter(Boolean);
    let line='';
    for(const word of words){
      const candidate=line?line+' '+word:word;
      if(ctx.measureText(candidate).width<=max){line=candidate;continue;}
      if(line){out.push(line);line='';}
      if(ctx.measureText(word).width<=max){line=word;continue;}
      let part='';
      for(const ch of [...word]){
        if(part&&ctx.measureText(part+ch).width>max){out.push(part);part=ch;}
        else part+=ch;
      }
      line=part;
    }
    if(line)out.push(line);
    else if(!words.length)out.push('');
  }
  return out;
}
function drawImage(d){
  const canvas=document.createElement('canvas');
  canvas.width=1200;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas no disponible');
  ctx.font='34px Arial, sans-serif';
  const detailLines=wrap(ctx,d.details,1020);
  const H=Math.max(1480,1360+detailLines.length*48);
  canvas.height=H;
  const ink='#0a2929',mint='#d8fb78',paper='#f7f7f1',grey='#526b68',dark='#0b2023';
  function fillRect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  function write(t,x,y,size,color,weight){
    ctx.fillStyle=color;ctx.font=(weight||'400')+' '+size+'px Arial, sans-serif';
    ctx.fillText(String(t),x,y);
  }
  function field(label,val,x,y,w){
    write(label.toUpperCase(),x,y,19,grey,'700');
    ctx.font='600 29px Arial, sans-serif';
    const lines=wrap(ctx,val,w);
    lines.slice(0,2).forEach((line,i)=>write(line,x,y+43+i*36,29,ink,'600'));
  }
  fillRect(0,0,1200,H,paper);
  fillRect(0,0,1200,304,dark);
  fillRect(84,68,94,94,mint);
  write('AG',107,136,42,dark,'800');
  write('ANA MARÍA GALLEGO BETANCUR',206,94,23,'#b9d4cc','700');
  write('QUÍMICA FARMACÉUTICA',206,128,17,'#88a7a0','600');
  write('SOLICITUD',80,229,57,'#ffffff','800');
  write('DE COTIZACIÓN',440,229,57,mint,'800');
  write('REFERENCIA  '+d.ref,83,281,20,'#c2d7cd','600');
  fillRect(80,344,1040,148,'#e5f1e0');
  write('SERVICIO DE INTERÉS',107,386,20,grey,'700');
  ctx.font='800 45px Arial, sans-serif';
  const serviceLines=wrap(ctx,d.service,950);
  serviceLines.slice(0,2).forEach((line,i)=>write(line,106,446+i*45,45,ink,'800'));
  fillRect(80,548,1040,2,'#d2ddd4');
  field('Nombre / empresa',d.client,82,603,480);
  field('Correo electrónico',d.email,632,603,480);
  field('Teléfono',d.phone||'No indicado',82,745,480);
  field('Ciudad / ubicación',d.city||'No indicada',632,745,480);
  field('Modalidad',d.mode,82,885,480);
  field('Plazo requerido',d.when,632,885,480);
  fillRect(80,972,1040,2,'#d2ddd4');
  write('DESCRIPCIÓN DE LA SOLICITUD',82,1023,21,grey,'700');
  ctx.font='400 34px Arial, sans-serif';
  detailLines.forEach((line,i)=>write(line,82,1086+i*48,34,ink,'400'));
  fillRect(0,H-136,1200,136,dark);
  write('AG / SCIENCE IN MOTION',80,H-79,24,mint,'700');
  write('Ficha preparada '+d.date+' · '+d.ref,80,H-43,20,'#b6cdc6','400');
  write('WHATSAPP  +57 318 715 8731',760,H-77,19,'#e6f5e4','700');
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo generar la imagen')),'image/png'));
}
function download(blob,name){
  const href=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=href;a.download=name;
  document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(href),1000);
}
function filename(){return 'Solicitud-Cotizacion-'+(current?.ref||'Ana-Maria')+'.png';}
form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  if(!document.getElementById('client-consent').checked){
    document.getElementById('client-consent').reportValidity();
    return;
  }
  current=readForm();
  imageBlob=null;
  els.share.disabled=true;
  els.download.disabled=true;
  els.status.textContent='Estamos preparando tu ficha visual…';
  showCard(current);
  try{
    const blob=await drawImage(current);
    imageBlob=blob;
    els.share.disabled=false;
    els.download.disabled=false;
    els.status.textContent='Ficha lista. Puedes compartirla como imagen o abrir el chat de Ana María con el resumen organizado.';
  }catch(err){
    els.status.textContent='La ficha se muestra aquí, pero no se pudo crear la imagen en este navegador. Usa el botón para abrir WhatsApp.';
  }
});
els.download.addEventListener('click',()=>{
  if(imageBlob)download(imageBlob,filename());
});
els.share.addEventListener('click',()=>{
  if(!current||!imageBlob)return;
  const f=new File([imageBlob],filename(),{type:'image/png'});
  if(navigator.canShare && navigator.share && navigator.canShare({files:[f]})){
    navigator.share({
      files:[f],
      title:'Solicitud de cotización '+current.ref
    }).then(()=>{
      els.status.textContent='La ficha se compartió con la aplicación elegida. Confirma la conversación y el envío en WhatsApp.';
    }).catch(err=>{
      if(err.name!=='AbortError')els.status.textContent='No se pudo abrir el menú de compartir. Descarga la imagen y adjúntala en el chat con Ana María.';
    });
  }else if(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem){
    navigator.clipboard.write([new ClipboardItem({'image/png':imageBlob})]).then(()=>{
      els.status.textContent='Ficha copiada como imagen. Pulsa «Abrir WhatsApp con resumen», pega la imagen en el chat (Ctrl+V) y confirma el envío.';
    }).catch(()=>{
      download(imageBlob,filename());
      els.status.textContent='Se descargó la imagen porque el navegador no permitió copiarla. Adjunta el archivo al chat con Ana María.';
    });
  }else{
    download(imageBlob,filename());
    els.status.textContent='La ficha se descargó. Abre el chat con Ana María y adjunta la imagen.';
  }
});
})();