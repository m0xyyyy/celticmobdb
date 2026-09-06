const state={mobs:[],items:null,skills:[],mobskills:{},mobloot:{},lootsets:{},loottables:null,spawns:[],zones:[],scripts:{},mode:'npc',selected:null};
const loaded={};
const loading={};
async function loadFile(name){
 if(loaded[name]) return state[name];
 if(loading[name]) return loading[name];
 loading[name]=fetch(`data/${name}.json`).then(r=>{if(!r.ok)throw new Error(`Failed to load ${name}.json`);return r.json()}).then(v=>{state[name]=v;loaded[name]=true;delete loading[name];return v}).catch(e=>{delete loading[name];throw e});
 return loading[name];
}
async function ensure(name){
 try{return await loadFile(name)}catch(e){console.error(e);throw e}
}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>typeof n==='number'?n.toLocaleString(undefined,{maximumFractionDigits:2}):n;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getMob=id=>state.mobs.find(m=>String(m.id)===String(id));
async function load(){
 const essential=['mobs','skills','mobskills','mobloot','lootsets','spawns','zones','mobscripts'];
 try{
  await Promise.all(essential.map(ensure));
  $('#mobCount').textContent=state.mobs.length.toLocaleString();
  renderResults();
 }catch(e){
  console.error(e);
  $('#results').innerHTML='<div style="padding:20px;color:#ff9b9b">Database failed to load. Please refresh the page.</div>';
 }
}

function setMode(mode){state.mode='npc';state.selected=null;$('#autoSearch').checked=true;$('#searchInput').value='';$('#idInput').value='';renderResults();clearDossier();}
function searchTerm(){return $('#searchInput').value.trim().toLowerCase()}
function renderResults(){
 const term=searchTerm(), id=$('#idInput').value.trim();
 let arr=state.mobs.filter(m=>(!term||m.name.toLowerCase().includes(term))&&(!id||String(m.id)===id));
 arr=arr.slice(0,250); $('#resultCount').textContent=arr.length;
 $('#results').innerHTML=arr.length?arr.map(x=>`<div class="result ${state.selected&&String(state.selected.id)===String(x.id)?'active':''}" data-id="${x.id}"><div class="result-main"><div class="result-name">${esc(x.name)}</div><div class="result-meta">Lv ${fmt(x.level)} • ${esc(x.faction)}</div></div><span class="badge">${x.id}</span></div>`).join(''):`<div style="padding:35px 18px;text-align:center;color:var(--muted);font-size:12px">No results found.<br><span style="font-size:10px">Try a shorter search term.</span></div>`;
 $$('.result').forEach(el=>el.onclick=()=>{const x=getMob(el.dataset.id);state.selected=x;renderResults();renderDossier(x);});
}
function clearDossier(){$('#dossier').classList.add('hidden');$('#emptyState').classList.remove('hidden')}
function renderDossier(m){$('#emptyState').classList.add('hidden');const d=$('#dossier');d.classList.remove('hidden');
 const skills=(state.mobskills[m.id]||[]).map(s=>({...s,meta:state.skills.find(x=>x.id===s.skillId)}));
 const loot=state.mobloot[m.id]||[]; const spawns=state.spawns.filter(s=>s.mobs.some(x=>x.mobId===Number(m.id)));
 d.innerHTML=`<div class="dossier-head"><div><div class="title-row"><h2>${esc(m.name)}</h2><span class="id-pill">ID ${m.id}</span></div><div class="subline"><span class="faction ${m.faction.toLowerCase()}">${esc(m.faction)}</span><span>Level ${fmt(m.level)}</span><span>•</span><span>${spawns.length} spawn point${spawns.length===1?'':'s'}</span></div></div><div class="actions">${spawns.length?'<button class="action-btn" id="spawnBtn">⌖ Spawn Data</button>':''}${state.scripts[m.id]?'<button class="action-btn" id="scriptBtn">⌘ Script Data</button>':''}</div></div>
 <div class="grid stats-grid">${stat('Health',m.health,'HP')}${stat('Energy',m.energy,'Energy')}${stat('Attack',m.attack)}${stat('Defence',m.defence)}${stat('Attack Speed',m.attackSpeed,'ms')}${stat('Aggro Range',m.aggro)}${stat('Follow Range',m.follow)}${stat('Radius',m.radius)}</div>
 <div class="section"><div class="section-head"><div class="section-title">Combat profile</div></div><div class="cards"><div class="panel"><h3>Core values</h3><div class="kv">${kv('Experience',fmt(m.experience))}${kv('Gold dropped',m.gold)}${kv('Ignore invisibility',`${fmt(m.ignoreInvis*10)}% chance`)}${kv('Attack speed', fmt(m.attackSpeed) + ' ms')}</div></div><div class="panel"><h3>Resistances</h3><div class="chips">${Object.entries(m.resist).map(([k,v])=>`<span class="chip">${esc(k)} <b>${esc(fmt(v))}</b></span>`).join('')}</div></div></div></div>
 <div class="section"><div class="section-head"><div class="section-title">Attack evasion</div></div><div class="panel"><div class="chips">${Object.entries(m.evasion).map(([k,v])=>`<span class="chip">${esc(k)} <b>${esc(fmt(v))}</b></span>`).join('')||'<span class="muted" style="padding:12px">No evasion data.</span>'}</div></div></div>
 <div class="section"><div class="section-head"><div class="section-title">Abilities</div><span class="muted" style="font-size:10px">${skills.length} linked skill${skills.length===1?'':'s'}</span></div><div class="panel">${skills.length?'<div class="list">'+skills.map(s=>`<div class="list-row"><div><b>${esc(s.meta?.name||`Skill ${s.skillId}`)}</b><div class="muted">${esc(s.meta?.damageType||'')} ${s.meta?.target?'• '+esc(s.meta.target):''}</div></div><span class="badge">Lv ${fmt(s.level)}</span></div>`).join('')+'</div>':'<div style="padding:16px;color:var(--muted);font-size:12px">No linked abilities in the database.</div>'}</div></div>
 <div class="section"><div class="section-head"><div class="section-title">Loot</div><span class="muted" style="font-size:10px">${loot.length} loot set link${loot.length===1?'':'s'}</span></div><div class="panel">${loot.length?'<div class="list">'+loot.map((l,i)=>`<div class="list-row loot-set" data-loot="${l.setId}"><div><b>Loot Set ${i+1}</b><div class="muted">Click to inspect tables</div></div><span class="badge">×${fmt(l.weight)}</span></div>`).join('')+'</div>':'<div style="padding:16px;color:var(--muted);font-size:12px">No direct loot-set mapping found for this NPC.</div>'}</div></div>`;
 $$('.loot-set').forEach(x=>x.onclick=()=>openLootSet(Number(x.dataset.loot)));
 if($('#spawnBtn')) $('#spawnBtn').onclick=()=>openSpawns(m,spawns);
 if($('#scriptBtn')) $('#scriptBtn').onclick=()=>openScript(m);
}
function stat(k,v,u=''){return `<div class="stat"><div class="label">${k}</div><div class="value">${esc(fmt(v))}</div>${u?`<div class="unit">${u}</div>`:''}</div>`}function kv(k,v){return `<div class="kv-item"><div class="k">${k}</div><div class="v">${v}</div></div>`}
async function renderItem(x){
 await ensure('items');
 x=state.items.find(i=>String(i.id)===String(x.id))||x;$('#emptyState').classList.add('hidden');const d=$('#dossier');d.classList.remove('hidden');d.innerHTML=`<div class="dossier-head"><div><div class="title-row"><h2>${esc(x.name)}</h2><span class="id-pill">ID ${x.id}</span></div><div class="subline"><span>Item database entry</span></div></div></div><div class="section"><div class="panel"><h3>Description</h3><div style="padding:16px;color:var(--muted);line-height:1.6;font-size:13px">${esc(x.description)||'No description stored.'}</div></div></div>`}
async function openLootSet(id){
 await ensure('loottables');
 const tables=state.lootsets[id]||[];const total=tables.reduce((a,b)=>a+b.weight,0);$('#modal').classList.remove('hidden');$('#modalBody').innerHTML=`<div class="eyebrow">LOOT SET</div><h2 style="margin:0 0 5px">Loot Set ${id}</h2><p class="muted" style="margin:0">${tables.length} table${tables.length===1?'':'s'} • weights normalized to percentage.</p><div class="panel" style="margin-top:18px"><div class="list">${tables.map(t=>{const pct=total?t.weight/total*100:0,tab=state.loottables[t.tableId]||{name:`Table ${t.tableId}`,items:[]};return `<div class="list-row" data-table="${t.tableId}"><div style="min-width:0;flex:1"><b>${esc(tab.name)}</b><div class="muted">Table ${t.tableId} • weight ${fmt(t.weight)}</div><div class="mini-bar"><span style="width:${Math.min(100,pct)}%"></span></div></div><span class="badge" style="margin-left:15px">${pct.toFixed(2)}%</span></div>`}).join('')}</div></div>`;$$('[data-table]').forEach(x=>x.onclick=()=>openLootTable(Number(x.dataset.table)));}
async function openLootTable(id){
 await ensure('loottables');
 await ensure('items');
 const t=state.loottables[id]||{name:`Table ${id}`,items:[]};const total=t.items.reduce((a,b)=>a+b.chance,0);$('#modalBody').innerHTML=`<div class="eyebrow">LOOT TABLE</div><h2 style="margin:0 0 5px">${esc(t.name)}</h2><p class="muted">Table ${id} • ${t.items.length} item entries</p><div class="panel" style="margin-top:18px"><div class="list">${t.items.map(it=>{const pct=total?it.chance/total*100:0,n=state.items.find(x=>x.id===it.itemId)?.name||`Item ${it.itemId}`;return `<div class="list-row"><div><b>${esc(n)}</b><div class="muted">ID ${it.itemId} • quantity ${esc(it.quantity)}</div></div><span class="badge">${pct.toFixed(2)}%</span></div>`}).join('')||'<div style="padding:15px;color:var(--muted)">No item entries.</div>'}</div></div><button class="action-btn" style="margin-top:14px" id="backLoot">← Back to loot set</button>`;$('#backLoot').onclick=()=>openLootSet(findLootSetForTable(id));}
function findLootSetForTable(id){for(const [sid,arr] of Object.entries(state.lootsets))if(arr.some(x=>x.tableId===id))return Number(sid);return 0}
function openScript(m){const rows=state.scripts[m.id]||[];$('#modal').classList.remove('hidden');$('#modalBody').innerHTML=`<div class="eyebrow">SCRIPT DATA</div><h2 style="margin:0 0 5px">${esc(m.name)}</h2><p class="muted">Raw script records linked to NPC ${m.id}.</p><pre style="white-space:pre-wrap;background:#090c12;border:1px solid var(--line);padding:16px;border-radius:12px;color:#bfc7d6;font-size:11px;line-height:1.55">${esc(rows.map(r=>r.join('  ~  ')).join('\n'))}</pre>`}
function openSpawns(m,spawns){const zmap={};state.zones.forEach(z=>zmap[z.id]=z);let first=spawns[0],zone=zmap[first.zone],map=`maps/${zone?.map||''}.jpg`;$('#modal').classList.remove('hidden');$('#modalBody').innerHTML=`<div class="eyebrow">SPAWN DATA</div><h2 style="margin:0 0 5px">${esc(m.name)}</h2><p class="muted">${spawns.length} spawn point${spawns.length===1?'':'s'} across ${new Set(spawns.map(s=>s.zone)).size} zone${new Set(spawns.map(s=>s.zone)).size===1?'':'s'}.</p><div class="spawn-grid">${spawns.slice(0,24).map((s,i)=>{const zz=zmap[s.zone];return `<div class="spawn-card" data-spawn-index="${i}" style="cursor:pointer"><b>${esc(zz?.name||`Zone ${s.zone}`)}</b><span>Spawn ${s.id} • ${esc(s.respawn)} • ${s.behavior}</span><div style="margin-top:6px;font-size:10px;color:#c8bcff">X ${s.x.toFixed(2)} • Y ${s.y.toFixed(2)} • Z ${s.z.toFixed(2)}</div></div>`}).join('')}</div><div class="map-wrap"><div class="map-inner"><img id="spawnMap" src="${map}" alt="Zone map" onerror="this.parentElement.style.display=\'none\'"><div id="mapDots"></div></div></div>`;renderMapDots(spawns,zone);$$('[data-spawn-index]').forEach(el=>el.onclick=()=>{const s=spawns[Number(el.dataset.spawnIndex)];zone=zmap[s.zone];const img=$('#spawnMap');img.src=`maps/${zone?.map||''}.jpg`;img.onload=()=>renderMapDots(spawns.filter(x=>x.zone===s.zone),zone);renderMapDots(spawns.filter(x=>x.zone===s.zone),zone)});}
function defaultdict(arr,key){const o={};arr.forEach(x=>(o[key(x)]??=[]).push(x));return o}
function renderMapDots(spawns,zone){const box=$('#mapDots');if(!box)return;box.innerHTML='';if(!zone)return;const w=zone.maxX-zone.minX||1,h=zone.maxZ-zone.minZ||1;const pad=0.08; // ~8% decorative border inset
spawns.forEach(s=>{const d=document.createElement('div');d.className='spawn-dot';let nx=(s.x-zone.minX)/w; let nz=(s.z-zone.minZ)/h; // 0-1
nx = pad + nx*(1-2*pad); nz = pad + nz*(1-2*pad);
const px=nx*100; const py=(1-nz)*100; // invert Z (higher Z = higher on image)
d.style.left=px+'%';d.style.top=py+'%';d.title=`Spawn ${s.id}\nX ${s.x.toFixed(2)}  Y ${s.y.toFixed(2)}  Z ${s.z.toFixed(2)}`;box.appendChild(d)})}
$('#searchInput').addEventListener('input',()=>{if($('#autoSearch').checked)renderResults()});
$('#idSearch').onclick=renderResults;
$('#idInput').addEventListener('keydown',e=>{if(e.key==='Enter')renderResults()});
$('#autoSearch').addEventListener('change',()=>{if($('#autoSearch').checked)renderResults()});
$('#clearSearch').onclick=()=>{$('#searchInput').value='';$('#idInput').value='';renderResults();$('#searchInput').focus()};
$$('[data-close]').forEach(x=>x.onclick=()=>$('#modal').classList.add('hidden'));
load().catch(err=>{$('#results').innerHTML='<div style="padding:20px;color:#ff9aaa;font-size:12px">Could not load the database. Make sure all files are uploaded to GitHub and GitHub Pages is serving the repository.</div>';console.error(err)});


/* --- Visual polish layer: presentation only, no database behaviour changed. --- */
(() => {
  const root = document.documentElement;
  let raf = 0;
  window.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);
    });
  }, {passive:true});

  // Give newly rendered result rows a gentle stagger without changing their click behaviour.
  const observe = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.classList.contains('result')) node.style.animationDelay = `${Math.min(node.parentElement?.children.length || 0, 18) * 12}ms`;
      }
    }
  });
  const results = document.getElementById('results');
  if (results) observe.observe(results, {childList:true});

  // Subtle 3D tilt on large desktop panels; automatically disabled on touch devices.
  if (window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.sidebar, .content').forEach((panel) => {
      panel.addEventListener('pointermove', (e) => {
        const r = panel.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        panel.style.transform = `perspective(1200px) rotateX(${(-y * .7).toFixed(2)}deg) rotateY(${(x * .7).toFixed(2)}deg)`;
      });
      panel.addEventListener('pointerleave', () => {
        panel.style.transform = '';
      });
    });
  }
})();

/* --- Spawn-point mob-name tooltip --- */
(() => {
  const tip = document.createElement('div');
  tip.className = 'spawn-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.innerHTML = '<span class="spawn-tooltip-kicker">SPAWN POINT</span><strong></strong>';
  document.body.appendChild(tip);

  const titleEl = tip.querySelector('strong');
  let active = null;

  const getName = (el) => {
    // Prefer explicit data/name attributes if present.
    return el.dataset.mobName || el.dataset.name || el.getAttribute('data-mob') ||
      el.getAttribute('aria-label') || el.getAttribute('title') ||
      el.querySelector('b')?.textContent?.trim() ||
      el.closest('.spawn-card')?.querySelector('b')?.textContent?.trim() ||
      el.closest('.map-inner')?.querySelector('.spawn-dot[data-name]')?.dataset.name ||
      'Unknown mob';
  };

  const show = (el, x, y) => {
    const name = getName(el);
    titleEl.textContent = name;
    tip.classList.add('show');
    active = el;

    const pad = 14;
    const rect = tip.getBoundingClientRect();
    const left = Math.max(pad, Math.min(window.innerWidth - rect.width - pad, x + 16));
    const top = Math.max(pad, Math.min(window.innerHeight - rect.height - pad, y - rect.height - 14));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };

  const hide = () => {
    tip.classList.remove('show');
    active = null;
  };

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('.spawn-dot, .spawn-card');
    if (!el) return;
    show(el, e.clientX, e.clientY);
  });

  document.addEventListener('pointermove', (e) => {
    if (!active) return;
    const rect = tip.getBoundingClientRect();
    const left = Math.max(14, Math.min(window.innerWidth - rect.width - 14, e.clientX + 16));
    const top = Math.max(14, Math.min(window.innerHeight - rect.height - 14, e.clientY - rect.height - 14));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }, {passive:true});

  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest('.spawn-dot, .spawn-card');
    if (!el) return;
    if (!e.relatedTarget || !el.contains(e.relatedTarget)) hide();
  });

  window.addEventListener('scroll', hide, {passive:true});
})();
