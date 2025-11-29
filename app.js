const apiBase = './api_weather.php';
const el = id => document.getElementById(id);
let units = 'metric';
let autoTimer = null;
const debounce = (fn,ms=300)=>{let t;return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
const showStatus = t=>el('status').textContent=t;
const iconUrl = c=>`https://openweathermap.org/img/wn/${c}@2x.png`;
function saveFavs(a){localStorage.setItem('wd_favs',JSON.stringify(a))}
function loadFavs(){try{return JSON.parse(localStorage.getItem('wd_favs')||'[]')}catch{return[]}}
function renderFavs(){
  const out=el('favorites');out.innerHTML='';
  const favs=loadFavs();
  if(!favs.length){out.innerHTML='<div class="small">Belum ada favorit</div>';return}
  favs.forEach(f=>{
    const b=document.createElement('button');b.textContent=f.name;b.onclick=()=>fetchByCoords(f.lat,f.lon,f.name);
    out.appendChild(b);
    const d=document.createElement('button');d.textContent='✖';d.onclick=(e)=>{e.stopPropagation();const rem=favs.filter(x=>x.name!==f.name);saveFavs(rem);renderFavs()}
    out.appendChild(d)
  })
}
async function apiGet(params){
  const qs=new URLSearchParams(params).toString();
  const res=await fetch(`${apiBase}?${qs}`);
  if(!res.ok)throw new Error('Network error');
  return res.json();
}
async function geocode(q){
  return apiGet({action:'geocode',q:q});
}
async function fetchByCoords(lat,lon,display){
  showStatus('⏳ Mengambil data...');
  try{
    const cur=await apiGet({action:'current',lat:lat,lon:lon,units:units});
    const f=await apiGet({action:'forecast',lat:lat,lon:lon,units:units});
    renderCurrent(cur,display||(`${cur.name}, ${cur.sys.country}`));
    renderForecast(f);
    showStatus(`✅ Terakhir: ${new Date().toLocaleTimeString()}`);
    if(autoTimer)clearInterval(autoTimer);
    autoTimer=setInterval(()=>fetchByCoords(lat,lon,display),5*60*1000);
  }catch(e){
    showStatus('❌ '+e.message);
    el('currentMain').innerHTML=`<div class="small">${e.message}</div>`;
  }
}
function renderCurrent(data,display){
  el('loc').textContent=display;
  const html=`<div style="display:flex;align-items:center">
    <img src="${iconUrl(data.weather[0].icon)}" alt="${data.weather[0].description}">
    <div>
      <div style="font-size:28px;font-weight:600">${Math.round(data.main.temp)}° ${units==='metric'?'C':'F'}</div>
      <div class="small">${data.weather[0].description} • Humidity ${data.main.humidity}% • Wind ${data.wind.speed} m/s</div>
      <div class="small">Updated: ${new Date(data.dt*1000).toLocaleString()}</div>
      <div style="margin-top:8px"><button id="addFav">Simpan Favorit</button></div>
    </div>
  </div>`;
  el('currentMain').innerHTML=html;
  el('addFav').onclick=()=>{
    const favs=loadFavs();
    if(favs.some(f=>f.name===display))return alert('Sudah ada di favorit');
    favs.unshift({name:display,lat:data.coord.lat,lon:data.coord.lon});
    saveFavs(favs.slice(0,10));
    renderFavs();
  }
}
function groupByDay(list){
  const map={};
  list.forEach(i=>{
    const k=new Date(i.dt*1000).toLocaleDateString();
    if(!map[k])map[k]=[];
    map[k].push(i);
  });
  return map;
}
function renderForecast(fdata){
  const groups=groupByDay(fdata.list);
  const keys=Object.keys(groups).slice(0,5);
  const out=el('forecast');out.innerHTML='';
  keys.forEach(k=>{
    const arr=groups[k];
    const temps=arr.map(i=>i.main.temp);
    const min=Math.round(Math.min(...temps));
    const max=Math.round(Math.max(...temps));
    let icon=arr[0].weather[0].icon;
    const noon=arr.find(i=>new Date(i.dt*1000).getHours()===12);
    if(noon)icon=noon.weather[0].icon;
    const d=document.createElement('div');d.className='day';
    d.innerHTML=`<div><strong>${k}</strong></div><img src="${iconUrl(icon)}" alt="" width="64" height="64"><div>${min} / ${max}°</div>`;
    out.appendChild(d);
  })
}
function bindSearch(){
  const input=el('search');
  const sug=el('suggest');
  input.addEventListener('input',debounce(async ()=>{
    const v=input.value.trim();
    if(!v){sug.style.display='none';sug.innerHTML='';return}
    try{
      const data=await geocode(v);
      if(!Array.isArray(data)||!data.length){sug.style.display='none';sug.innerHTML='';return}
      sug.innerHTML=data.map(l=>`<button data-lat="${l.lat}" data-lon="${l.lon}">${l.name}${l.state?(', '+l.state):''} — ${l.country}</button>`).join('');
      sug.style.display='block';
    }catch(e){
      sug.innerHTML=`<div class="small">Error</div>`;sug.style.display='block';
    }
  },350));
  sug.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const lat=b.dataset.lat,lon=b.dataset.lon,name=b.textContent;
    sug.style.display='none';el('search').value='';
    fetchByCoords(lat,lon,name);
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.search-box')){sug.style.display='none'}})
}
el('btnUnit').addEventListener('click',()=>{
  units=units==='metric'?'imperial':'metric';
  el('btnUnit').textContent=units==='metric'?'°C':'°F';
  const favs=loadFavs();
  if(favs[0])fetchByCoords(favs[0].lat,favs[0].lon,favs[0].name);
});
el('btnTheme').addEventListener('click',()=>{
  const app=document.getElementById('app');const cur=app.getAttribute('data-theme')||'light';const next=cur==='light'?'dark':'light';app.setAttribute('data-theme',next);el('btnTheme').textContent=next==='dark'?'☀️':'🌙';
});
el('btnRefresh').addEventListener('click',()=>{
  const favs=loadFavs();
  if(favs[0])fetchByCoords(favs[0].lat,favs[0].lon,favs[0].name);
  else alert('Pilih lokasi atau simpan favorit dulu.');
});
bindSearch();
renderFavs();
