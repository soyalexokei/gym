var SPORTS=["Gym","Pádel","Montaña","Surf","Otro"];
var S={routines:[],filter:"Todos",open:{},db:null,ready:false};
var timers={},dirty={};
function uid(){return Math.random().toString(36).slice(2,9)}
function esc(x){return String(x==null?"":x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function opts(sel){return SPORTS.map(function(s){return'<option'+(s===sel?" selected":"")+'>'+s+'</option>'}).join("")}
function get(id){return S.routines.filter(function(r){return r.id===id})[0]}
var stT;function status(m,bad){var e=document.getElementById("st");e.textContent=m;e.style.color=bad?"#c0392b":"";e.style.display="block";clearTimeout(stT);stT=setTimeout(function(){e.style.display="none"},bad?5000:1500)}
function writeNow(r){if(!S.db)return;S.db.collection("routines").doc(r.id).set({title:r.title,day:r.day,sport:r.sport,order:r.order,rows:r.rows}).then(function(){delete dirty[r.id];status("Guardado")}).catch(function(e){delete dirty[r.id];status("No se pudo guardar: "+((e&&e.message)||"error"),true)})}
function saveR(r){dirty[r.id]=1;clearTimeout(timers[r.id]);timers[r.id]=setTimeout(function(){writeNow(r)},500)}
function typing(){var a=document.activeElement;return a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)&&a.closest&&a.closest("#list")}
function render(){
  var ch=["Todos"].concat(SPORTS).map(function(s){return'<button class="chip" data-f="'+s+'" aria-pressed="'+(S.filter===s)+'">'+s+'</button>'}).join("");
  document.getElementById("chips").innerHTML=ch;
  var L=document.getElementById("list");
  if(!S.db){L.innerHTML='<p class="empty">'+(S.ready?"Abre esta página en claude.ai con tu sesión iniciada para ver y guardar tus rutinas.":"Cargando…")+'</p>';return}
  var shown=S.routines.filter(function(r){return S.filter==="Todos"||r.sport===S.filter});
  if(!shown.length){L.innerHTML='<p class="empty">'+(S.ready?"No hay rutinas aquí. Crea una con “Nueva rutina” o pega una tabla.":"Cargando…")+'</p>';return}
  L.innerHTML=shown.map(function(r){
    var rows=r.rows.map(function(w,i){return'<tr>'+["e","s","d","c","n"].map(function(k){return'<td><input data-r="'+r.id+'" data-i="'+i+'" data-k="'+k+'" value="'+esc(w[k])+'" aria-label="'+k+'"></td>'}).join("")+'<td class="x"><button data-a="delrow" data-r="'+r.id+'" data-i="'+i+'" aria-label="Quitar ejercicio">×</button></td></tr>'}).join("");
    return'<details data-id="'+r.id+'"'+(S.open[r.id]?" open":"")+'><summary><span class="t">'+esc(r.title||"Sin título")+'</span><span class="m">'+esc(r.day)+' · '+esc(r.sport)+'</span></summary><div class="body">'
    +'<div class="meta"><input class="tt" data-r="'+r.id+'" data-k="title" value="'+esc(r.title)+'" aria-label="Título"><input data-r="'+r.id+'" data-k="day" value="'+esc(r.day)+'" placeholder="Día" size="10" aria-label="Día"><select data-r="'+r.id+'" data-k="sport" aria-label="Deporte">'+opts(r.sport)+'</select></div>'
    +'<div class="wrap"><table><thead><tr><th>Ejercicio</th><th>Series x reps</th><th>Descanso</th><th>Mi carga</th><th>Notas</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div class="acts"><button class="btn" data-a="addrow" data-r="'+r.id+'">Añadir ejercicio</button><button class="btn" data-a="dup" data-r="'+r.id+'">Duplicar</button><button class="btn d" data-a="del" data-r="'+r.id+'">Eliminar rutina</button></div></div></details>'}).join("")}
document.addEventListener("input",function(e){var t=e.target;if(!t.dataset.r)return;var r=get(t.dataset.r);if(!r)return;
  if(t.dataset.i!==undefined)r.rows[+t.dataset.i][t.dataset.k]=t.value;else r[t.dataset.k]=t.value;
  if(t.dataset.k==="title"||t.dataset.k==="day"){var d=t.closest("details");if(d){d.querySelector(".t").textContent=r.title||"Sin título";d.querySelector(".m").textContent=r.day+" · "+r.sport}}
  saveR(r)});
document.addEventListener("change",function(e){var t=e.target;if(t.dataset.k==="sport"){var r=get(t.dataset.r);r.sport=t.value;saveR(r);render()}});
document.addEventListener("toggle",function(e){var d=e.target;if(d.dataset&&d.dataset.id)S.open[d.dataset.id]=d.open},true);
function nextOrder(){return S.routines.length?Math.min.apply(null,S.routines.map(function(r){return r.order}))-1:1}
function add(r){S.routines.unshift(r);S.open[r.id]=true;writeNow(r);render()}
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t)return;
  if(t.dataset.f){S.filter=t.dataset.f;render();return}
  var a=t.dataset.a,r=t.dataset.r?get(t.dataset.r):null;
  if(a==="addrow"){r.rows.push({e:"",s:"",d:"",n:"",c:""});S.open[r.id]=true;saveR(r)}
  else if(a==="delrow"){r.rows.splice(+t.dataset.i,1);S.open[r.id]=true;saveR(r)}
  else if(a==="del"){if(!confirm("¿Eliminar esta rutina?"))return;clearTimeout(timers[r.id]);delete dirty[r.id];S.routines=S.routines.filter(function(x){return x!==r});S.db.collection("routines").doc(r.id).delete().then(function(){status("Eliminada")}).catch(function(e){status("No se pudo eliminar: "+((e&&e.message)||"error"),true)})}
  else if(a==="dup"){var c=JSON.parse(JSON.stringify(r));c.id=uid();c.title+=" (copia)";c.order=r.order+0.5;S.routines.push(c);S.routines.sort(function(x,y){return x.order-y.order});S.open[c.id]=true;writeNow(c)}
  else return;
  render()});
document.getElementById("new").onclick=function(){if(!S.db)return;add({id:uid(),title:"Nueva rutina",day:"",sport:S.filter==="Todos"?"Gym":S.filter,order:nextOrder(),rows:[{e:"",s:"",d:"",n:"",c:""}]})};
var dlg=document.getElementById("dlg");
document.getElementById("isp").innerHTML=opts("Gym");
document.getElementById("imp").onclick=function(){if(!S.db)return;document.getElementById("ita").value="";document.getElementById("itt").value="";dlg.showModal()};
document.getElementById("ok").onclick=function(){
  var rows=[];
  document.getElementById("ita").value.split("\n").forEach(function(l){if(l.indexOf("|")<0||/^[\s|:\-]+$/.test(l))return;
    var c=l.split("|").map(function(x){return x.trim()});if(c[0]==="")c.shift();if(c.length&&c[c.length-1]==="")c.pop();
    if(c.length>=5&&/^\d+$/.test(c[0]))c.shift();
    if(/^ejercicio$/i.test(c[0]))return;
    rows.push({e:c[0]||"",s:c[1]||"",d:c[2]||"",n:c[3]||"",c:""})});
  if(!rows.length){alert("No encuentro filas con barras |. Revisa el formato.");return}
  dlg.close();add({id:uid(),title:document.getElementById("itt").value||"Rutina importada",day:"",sport:document.getElementById("isp").value,order:nextOrder(),rows:rows})};
function localDb(){
  var K="mis-rutinas-local-v1",SEED={"r1": {"title": "Pierna A (fuerza)", "day": "Lunes", "sport": "Gym", "order": 1, "rows": [{"e": "Sentadilla con barra en rack", "s": "4 x 5-8", "d": "2-3 min", "n": "Hasta paralelo o más", "c": ""}, {"e": "Peso muerto rumano con barra", "s": "3 x 8-10", "d": "2 min", "n": "", "c": ""}, {"e": "Sentadilla búlgara con mancuernas", "s": "3 x 8-10 por pierna", "d": "90 s", "n": "", "c": ""}, {"e": "Curl femoral en máquina", "s": "3 x 10-12", "d": "90 s", "n": "", "c": ""}, {"e": "Elevación de gemelos de pie", "s": "4 x 10-15", "d": "60 s", "n": "Pausa de 1 s arriba", "c": ""}, {"e": "Crunch en polea o rueda abdominal", "s": "3 x 10-15", "d": "60 s", "n": "", "c": ""}]}, "r2": {"title": "Torso A (fuerza)", "day": "Martes", "sport": "Gym", "order": 2, "rows": [{"e": "Press banca con barra", "s": "4 x 5-7", "d": "2-3 min", "n": "", "c": ""}, {"e": "Dominadas", "s": "4 x 6-10", "d": "2-3 min", "n": "Con lastre o asistidas", "c": ""}, {"e": "Press militar con mancuernas sentado", "s": "3 x 8-10", "d": "2 min", "n": "", "c": ""}, {"e": "Remo con barra inclinado", "s": "3 x 8-10", "d": "2 min", "n": "", "c": ""}, {"e": "Elevaciones laterales", "s": "3 x 12-15", "d": "60 s", "n": "Última serie al fallo", "c": ""}, {"e": "Curl con barra Z", "s": "3 x 8-12", "d": "60 s", "n": "", "c": ""}, {"e": "Extensión de tríceps en polea", "s": "3 x 10-12", "d": "60 s", "n": "", "c": ""}]}, "r3": {"title": "Pierna B (hipertrofia)", "day": "Jueves", "sport": "Gym", "order": 3, "rows": [{"e": "Sentadilla en multipower", "s": "3 x 10-12", "d": "2 min", "n": "", "c": ""}, {"e": "Hip thrust con barra", "s": "3 x 8-12", "d": "2 min", "n": "Pausa de 1 s arriba", "c": ""}, {"e": "Extensión de cuádriceps en máquina", "s": "3 x 12-15", "d": "90 s", "n": "Última serie al fallo", "c": ""}, {"e": "Curl femoral en máquina", "s": "3 x 10-12", "d": "90 s", "n": "", "c": ""}, {"e": "Zancadas con mancuernas", "s": "3 x 10-12 por pierna", "d": "90 s", "n": "", "c": ""}, {"e": "Gemelos (otra variante)", "s": "4 x 12-15", "d": "60 s", "n": "", "c": ""}, {"e": "Elevación de piernas o plancha", "s": "3 x 10-15", "d": "60 s", "n": "", "c": ""}]}, "r4": {"title": "Torso B (hipertrofia)", "day": "Viernes", "sport": "Gym", "order": 4, "rows": [{"e": "Press inclinado con mancuernas", "s": "4 x 8-12", "d": "2 min", "n": "", "c": ""}, {"e": "Jalón al pecho (agarre neutro)", "s": "3 x 10-12", "d": "90 s", "n": "", "c": ""}, {"e": "Fondos en paralelas", "s": "3 x 8-12", "d": "90 s", "n": "", "c": ""}, {"e": "Remo sentado en polea", "s": "3 x 10-12", "d": "90 s", "n": "", "c": ""}, {"e": "Press de hombro con mancuernas (Arnold)", "s": "3 x 8-12", "d": "2 min", "n": "", "c": ""}, {"e": "Elevaciones laterales en polea", "s": "3 x 12-15", "d": "60 s", "n": "Última serie al fallo", "c": ""}, {"e": "Face pull o pájaros", "s": "3 x 15", "d": "60 s", "n": "Superserie con las laterales", "c": ""}, {"e": "Curl martillo con mancuernas", "s": "3 x 10-12", "d": "60 s", "n": "", "c": ""}, {"e": "Tríceps sobre la cabeza en polea", "s": "3 x 10-12", "d": "60 s", "n": "", "c": ""}]}};
  var data=null;try{data=JSON.parse(localStorage.getItem(K))}catch(e){}
  if(!data||typeof data!=="object"||!Object.keys(data).length)data=JSON.parse(JSON.stringify(SEED));
  function write(){try{localStorage.setItem(K,JSON.stringify(data))}catch(e){}}
  function snap(){var ids=Object.keys(data).sort(function(a,b){return(data[a].order||0)-(data[b].order||0)});return{docs:ids.map(function(id){return{id:id,data:function(){return data[id]}}})}}
  return{collection:function(){return{
    orderBy:function(){return{onSnapshot:function(f){setTimeout(function(){f(snap())},0)}}},
    doc:function(id){return{
      set:function(d){data[id]=JSON.parse(JSON.stringify(d));write();return Promise.resolve()},
      delete:function(){delete data[id];write();return Promise.resolve()}}}}}}}
function start(db){
  S.db=db;S.ready=true;
  if(!db){render();return}
  db.collection("routines").orderBy("order").onSnapshot(function(snap){
    S.routines=snap.docs.map(function(d){var x=d.data()||{};var loc=dirty[d.id]?get(d.id):null;return loc||{id:d.id,title:x.title||"",day:x.day||"",sport:x.sport||"Gym",order:typeof x.order==="number"?x.order:0,rows:Array.isArray(x.rows)?x.rows:[]}});
    if(!typing())render()},function(e){status("No se pudo leer la base de datos",true)})}
render();
(function(){var done=false;var t=setTimeout(function(){if(!done){done=true;start(localDb())}},10000);
  if(typeof claude==="undefined"||!claude.use){clearTimeout(t);start(localDb());return}
  claude.use("db").then(function(db){if(done)return;done=true;clearTimeout(t);start(db)}).catch(function(){if(done)return;done=true;clearTimeout(t);start(localDb())})})();