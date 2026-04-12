const { useState, useEffect, useCallback, useMemo } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } = Recharts;

const FEEDS = [
  { id: "f1", name: "Aquatilapia Preiniciador Microextruido", prot: 45, wMin: 0.5, wMax: 8 },
  { id: "f2", name: "Aquatilapia 45 Extruido", prot: 45, wMin: 8, wMax: 25 },
  { id: "f3", name: "Aquatilapia 38", prot: 38, wMin: 25, wMax: 60 },
  { id: "f4", name: "Aquatilapia 34", prot: 34, wMin: 60, wMax: 120 },
  { id: "f5", name: "Aquatilapia 32", prot: 32, wMin: 120, wMax: 250 },
  { id: "f6", name: "Aquatilapia 30", prot: 30, wMin: 250, wMax: 350 },
  { id: "f7", name: "Aquatilapia 25", prot: 25, wMin: 350, wMax: 600 },
];

const WR = [
  {wi:0.5,wf:1.0,fr:10.0,fpd:10},{wi:1.0,wf:2.0,fr:10.0,fpd:8},{wi:2.0,wf:3.5,fr:10.0,fpd:8},{wi:3.5,wf:5.5,fr:9.0,fpd:7},{wi:5.5,wf:8.5,fr:8.0,fpd:7},
  {wi:8.5,wf:13.0,fr:7.0,fpd:6},{wi:13.0,wf:19.0,fr:6.5,fpd:6},{wi:19.0,wf:27.0,fr:6.0,fpd:5},{wi:27.0,wf:38.0,fr:5.5,fpd:5},
  {wi:38.0,wf:52.0,fr:5.0,fpd:4},{wi:52.0,wf:70.0,fr:4.5,fpd:4},{wi:70.0,wf:92.0,fr:4.0,fpd:4},{wi:92.0,wf:118.0,fr:3.5,fpd:3},
  {wi:118.0,wf:148.0,fr:3.2,fpd:3},{wi:148.0,wf:180.0,fr:3.0,fpd:3},{wi:180.0,wf:212.0,fr:2.8,fpd:3},{wi:212.0,wf:245.0,fr:2.5,fpd:3},
  {wi:245.0,wf:278.0,fr:2.3,fpd:2},{wi:278.0,wf:310.0,fr:2.1,fpd:2},{wi:310.0,wf:340.0,fr:2.0,fpd:2},{wi:340.0,wf:368.0,fr:1.8,fpd:2},
  {wi:368.0,wf:393.0,fr:1.7,fpd:2},{wi:393.0,wf:415.0,fr:1.6,fpd:2},{wi:415.0,wf:435.0,fr:1.5,fpd:2},{wi:435.0,wf:460.0,fr:1.5,fpd:2},
  {wi:460.0,wf:485.0,fr:1.4,fpd:2},{wi:485.0,wf:515.0,fr:1.4,fpd:2},{wi:515.0,wf:540.0,fr:1.3,fpd:2},{wi:540.0,wf:550.0,fr:1.3,fpd:2},
];

function gF(w){return FEEDS.find(function(f){return w>=f.wMin&&w<f.wMax})||FEEDS[6]}
function shortF(name){return name.replace("Aquatilapia ","").replace("Preiniciador Microextruido","Preiniciador").replace("Extruido","Ext.")}
function gP(w){return w<8?"Alevín":w<25?"Pre-cría":w<60?"Lev38":w<120?"Lev34":w<250?"Eng32":w<350?"Eng30":"Final"}
var PC={"Alevín":"#0ea5e9","Pre-cría":"#06b6d4","Lev38":"#22c55e","Lev34":"#84cc16","Eng32":"#f59e0b","Eng30":"#f97316","Final":"#ef4444"};
var SK="lamaria-v6";
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function mkT(n){return{id:uid(),name:n||"Tanque",fish:1000,ew:0.5,sd:new Date().toISOString().slice(0,10),on:true,mort:Array(29).fill(0),rw:Array(29).fill(null),rwNotes:Array(29).fill(""),fc:[],wl:[],ac:0,oc:[],notes:""}}
function dS(){return{tanks:[mkT("Tanque 1")],feeds:FEEDS.map(function(f){return Object.assign({},f)}),inv:FEEDS.map(function(f){return{fid:f.id,stk:0,prices:[]}}),log:[]}}

function wksFor(ew){var si=0;for(var i=0;i<WR.length;i++){if(ew<WR[i].wf){si=i;break}}return WR.slice(si).map(function(w,i){return Object.assign({},w,{wk:i+1,wi:i===0?ew:WR[si+i].wi})})}
function calc(t){
  var ws=wksFor(t.ew),cf=0,al=t.fish;
  return ws.map(function(w,i){
    al=Math.max(0,al-(t.mort[i]||0));var bS=al*w.wi/1000,bE=al*w.wf/1000;
    var d=((bS+bE)/2)*w.fr/100,wkly=d*7;cf+=wkly;
    var g=bE-(t.fish*ws[0].wi/1000),fcr=g>0?cf/g:0;
    var feed=gF((w.wi+w.wf)/2),phase=gP((w.wi+w.wf)/2);
    var rw=t.rw[i],dev=rw!=null?((rw-w.wf)/w.wf*100):null;
    return Object.assign({},w,{al:al,bS:bS,bE:bE,d:d,wk:i+1,wkly:wkly,cf:cf,fcr:fcr,feed:feed,phase:phase,rw:rw,dev:dev,pm:d/w.fpd*1000,idx:i});
  });
}
function curWk(t){var c=calc(t);var i=c.findIndex(function(w){return t.rw[w.idx]==null});return i===-1?c.length:i}

function calWeek(sd){
  var s=new Date(sd+"T00:00:00");var dow=s.getDay();
  var dtm=dow===0?1:(dow===1?0:8-dow);
  var fm=new Date(s);fm.setDate(fm.getDate()+dtm);
  var today=new Date();today.setHours(0,0,0,0);
  if(today<fm)return 0;
  return Math.floor((today-fm)/(7*86400000))+1;
}

function weekDates(sd,wk){
  var s=new Date(sd+"T00:00:00");var dow=s.getDay();
  var dtm=dow===0?1:(dow===1?0:8-dow);
  var fm=new Date(s);fm.setDate(fm.getDate()+dtm);
  var ws=new Date(fm);ws.setDate(ws.getDate()+(wk-1)*7);
  var we=new Date(ws);we.setDate(we.getDate()+6);
  var fmt=function(d){var m=d.getMonth()+1;var dy=d.getDate();return(dy<10?"0":"")+dy+"/"+(m<10?"0":"")+m};
  return fmt(ws)+" - "+fmt(we);
}

function fN(n){return n!=null?Number(n).toLocaleString("es-CO"):"—"}
function fMoney(n){return n!=null?"$"+Number(Math.round(n)).toLocaleString("es-CO"):"—"}

var sI={border:"2px solid #3b82f6",borderRadius:6,padding:"5px 8px",fontSize:13,textAlign:"center",background:"#eff6ff",fontWeight:600,color:"#1e40af",outline:"none",width:"100%"};
var sC={background:"white",borderRadius:12,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0"};
function sB(bg){return{background:bg||"#1e40af",color:"white",border:"none",padding:"7px 16px",borderRadius:8,fontWeight:600,fontSize:11,cursor:"pointer"}}
function fCost(t){return(t.fc||[]).reduce(function(a,x){return a+x.qty*(x.price||0)},0)}
function oCost(t){return(t.oc||[]).reduce(function(a,x){return a+x.amt},0)}
function tCost(t){return(t.ac||0)+fCost(t)+oCost(t)}

function KPI(l,v,s,c){return <div style={Object.assign({},sC,{padding:12,borderLeft:"4px solid "+c})}><div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:c,fontFamily:"monospace",marginTop:2}}>{v}</div><div style={{fontSize:9,color:"#94a3b8"}}>{s}</div></div>}

function TabBtn(props){return <button onClick={props.onClick} style={{padding:"9px 14px",fontSize:11,fontWeight:props.active?700:500,color:props.active?"#0c2d48":"#64748b",background:"none",border:"none",borderBottom:props.active?"3px solid #1a4a6e":"3px solid transparent",cursor:"pointer",whiteSpace:"nowrap"}}>{props.label}</button>}

function Overview({S}){
  var actv=S.tanks.filter(function(t){return t.on});
  var invVal=S.inv.reduce(function(a,inv){
    var ps=inv.prices;var lp=ps.length?ps[ps.length-1].price:0;
    return a+inv.stk*lp;
  },0);
  return <div>
    <div style={{fontWeight:700,fontSize:15,color:"#0c2d48",marginBottom:12}}>Resumen General</div>
    <div style={Object.assign({},sC,{overflowX:"auto",marginBottom:12})}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr style={{background:"#0c2d48",color:"white"}}>{["Cultivo","Sem","Vivos","Peso Esp","Últ.Bio","g/Rac","Rac/Día","Alimento","kg/Día","BioFin","Costo"].map(function(h,i){return <th key={i} style={{padding:"8px 4px",fontSize:9,fontWeight:600,textAlign:"center",whiteSpace:"nowrap"}}>{h}</th>})}</tr></thead>
        <tbody>{actv.map(function(t){
          var c=calc(t),cw=calWeek(t.sd),x=c[Math.min(cw>0?cw-1:0,c.length-1)],last=c[c.length-1];
          var lastBio=null;for(var bi=c.length-1;bi>=0;bi--){if(c[bi].rw!=null){lastBio=c[bi].rw;break}}
          return <tr key={t.id} style={{borderBottom:"1px solid #e2e8f0"}}>
            <td style={{padding:6,fontWeight:700,fontSize:10}}>{t.name}</td>
            <td style={{textAlign:"center",fontWeight:700,color:"#1a4a6e",fontSize:10}}>{"S"+cw}</td>
            <td style={{textAlign:"center",fontWeight:600}}>{fN(x.al)}</td>
            <td style={{textAlign:"center",fontWeight:700}}>{x.wf+"g"}</td>
            <td style={{textAlign:"center",fontWeight:600,color:lastBio!=null?"#8b5cf6":"#ccc"}}>{lastBio!=null?lastBio+"g":"—"}</td>
            <td style={{textAlign:"center",fontWeight:600,color:"#1e40af"}}>{fN(Math.round(x.pm))}</td>
            <td style={{textAlign:"center",fontWeight:600}}>{x.fpd}</td>
            <td style={{textAlign:"center",fontSize:8}}><span style={{background:PC[x.phase]||"#999",color:"white",padding:"2px 4px",borderRadius:4,fontSize:7,fontWeight:600,whiteSpace:"nowrap"}}>{shortF(x.feed.name)}</span></td>
            <td style={{textAlign:"center",fontWeight:600}}>{x.d.toFixed(2)}</td>
            <td style={{textAlign:"center",fontWeight:700}}>{fN(Math.round(last.bE))}</td>
            <td style={{textAlign:"center",fontFamily:"monospace",fontSize:10}}>{fMoney(tCost(t))}</td>
          </tr>
        })}</tbody>
      </table>
    </div>
    <div style={Object.assign({},sC,{display:"flex",justifyContent:"space-between"})}><span style={{fontWeight:600}}>Valor Inventario:</span><span style={{fontWeight:700,fontSize:18,fontFamily:"monospace",color:"#0c2d48"}}>{fMoney(invVal)}</span></div>
  </div>
}

function App(){
  var _s=useState(dS()),S=_s[0],setS=_s[1];
  var _l=useState(true),ld=_l[0],setLd=_l[1];
  var _t=useState("ov"),tab=_t[0],setTab=_t[1];
  var _sel=useState(null),sel=_sel[0],setSel=_sel[1];
  var _sub=useState("da"),sub=_sub[0],setSub=_sub[1];
  var _fcW=useState(1),fcW=_fcW[0],setFcW=_fcW[1];
  var _fcF=useState(""),fcF=_fcF[0],setFcF=_fcF[1];
  var _fcQ=useState(""),fcQ=_fcQ[0],setFcQ=_fcQ[1];
  var _fcP=useState(""),fcP=_fcP[0],setFcP=_fcP[1];
  var _fcN=useState(""),fcN=_fcN[0],setFcN=_fcN[1];
  var _wf=useState({date:"",temp:"",o2:"",ph:"",nh3:"",no2:""}),wf=_wf[0],setWfS=_wf[1];
  var _invF=useState(""),invF=_invF[0],setInvF=_invF[1];
  var _invQ=useState(""),invQ=_invQ[0],setInvQ=_invQ[1];
  var _invP=useState(""),invP=_invP[0],setInvP=_invP[1];
  var _invN=useState(""),invN=_invN[0],setInvN=_invN[1];
  var _ocD=useState(""),ocD=_ocD[0],setOcD=_ocD[1];
  var _ocA=useState(""),ocA=_ocA[0],setOcA=_ocA[1];
  var _dsb=useState(false),desdob=_dsb[0],setDesdob=_dsb[1];
  var _dsA=useState(""),dsA=_dsA[0],setDsA=_dsA[1];
  var _dsB=useState(""),dsB=_dsB[0],setDsB=_dsB[1];
  var _dsNA=useState(""),dsNA=_dsNA[0],setDsNA=_dsNA[1];
  var _dsNB=useState(""),dsNB=_dsNB[0],setDsNB=_dsNB[1];
  var _locked=useState(true),locked=_locked[0],setLocked=_locked[1];
  var _pin=useState(""),pin=_pin[0],setPin=_pin[1];
  var _invLocked=useState(true),invLocked=_invLocked[0],setInvLocked=_invLocked[1];
  var _invPin=useState(""),invPin=_invPin[0],setInvPin=_invPin[1];
  function tryUnlockInv(){if(invPin==="1020"){setInvLocked(false);setInvPin("")}else{setInvPin("")}}
  function doLockInv(){setInvLocked(true);setInvPin("")}
  function tryUnlock(){if(pin==="1020"){setLocked(false);setPin("")}else{setPin("")}}
  function doLock(){setLocked(true);setPin("")}

  useEffect(function(){(async function(){try{var r=await window.storage.get(SK);if(r&&r.value)setS(JSON.parse(r.value))}catch(e){}setLd(false)})()},[]);
  var save=useCallback(async function(s){setS(s);try{await window.storage.set(SK,JSON.stringify(s))}catch(e){}},[]);

  var tank=sel?S.tanks.find(function(t){return t.id===sel}):null;
  var cd=tank?calc(tank):[];
  function upT(id,p){save(Object.assign({},S,{tanks:S.tanks.map(function(t){return t.id===id?Object.assign({},t,p):t})}))}
  function gSt(fid){var f=S.inv.find(function(i){return i.fid===fid});return f?f.stk:0}
  function lP(fid){var f=S.inv.find(function(i){return i.fid===fid});return f&&f.prices.length?f.prices[f.prices.length-1].price:0}
  function iV(){return S.inv.reduce(function(a,i){return a+i.stk*lP(i.fid)},0)}
  function adjS(fid,delta,act,price,tid,note){
    var inv=S.inv.map(function(i){if(i.fid!==fid)return i;return Object.assign({},i,{stk:i.stk+delta,prices:act==="compra"&&price?i.prices.concat([{date:new Date().toISOString().slice(0,10),price:price,qty:Math.abs(delta)}]):i.prices})});
    return{inv:inv,log:S.log.concat([{date:new Date().toISOString().slice(0,10),fid:fid,qty:delta,act:act,price:price||null,tid:tid,note:note||""}])};
  }
  var proj=useMemo(function(){var p={};S.tanks.filter(function(t){return t.on}).forEach(function(t){var c=calc(t),w=curWk(t);if(w<c.length){var x=c[w];p[x.feed.id]=(p[x.feed.id]||0)+x.wkly}});return p},[S]);

  function doDesdoble(){
    if(!tank||!dsA||!dsB)return;
    var nA=parseInt(dsA)||0,nB=parseInt(dsB)||0;
    if(nA+nB>tank.fish||nA<=0||nB<=0){alert("Revise cantidades");return}
    var cw=curWk(tank);var curW=cd[Math.min(cw,cd.length-1)];var curWeight=curW?curW.wf:tank.ew;
    var ratio=nA/(nA+nB);var cost=tCost(tank);
    var tA=mkT(dsNA||tank.name+" A");tA.fish=nA;tA.ew=curWeight;tA.ac=Math.round(cost*ratio);tA.notes="Desdoble de "+tank.name;
    var tB=mkT(dsNB||tank.name+" B");tB.fish=nB;tB.ew=curWeight;tB.ac=Math.round(cost*(1-ratio));tB.notes="Desdoble de "+tank.name;
    var tanks=S.tanks.map(function(t){return t.id===tank.id?Object.assign({},t,{on:false,notes:(t.notes||"")+"\nDesdoble: "+nA+"/"+nB}):t});
    save(Object.assign({},S,{tanks:tanks.concat([tA,tB])}));
    setDesdob(false);setSel(null);setDsA("");setDsB("");setDsNA("");setDsNB("");
  }

  var _csv=useState(null),csvData=_csv[0],setCsvData=_csv[1];
  var _csvLabel=useState(""),csvLabel=_csvLabel[0],setCsvLabel=_csvLabel[1];
  function exportCSVTank(t){
    var lines=["Tanque,Sem,Alimento,Wi,Wf,Mort,Vivos,BioI,BioF,kg/dia,kg/sem,Acum,FCR,Real,Desv%"];
    calc(t).forEach(function(w){lines.push([t.name,w.wk,w.feed.name,w.wi,w.wf,t.mort[w.idx]||0,w.al,w.bS.toFixed(2),w.bE.toFixed(2),w.d.toFixed(3),w.wkly.toFixed(2),w.cf.toFixed(2),w.fcr.toFixed(2),w.rw!=null?w.rw:"",w.dev!=null?w.dev.toFixed(1):""].join(","))});
    setCsvData(lines.join("\n"));setCsvLabel(t.name);
  }
  function exportCSVAll(){
    var lines=["Tanque,Sem,Alimento,Wi,Wf,Mort,Vivos,BioI,BioF,kg/dia,kg/sem,Acum,FCR,Real,Desv%"];
    S.tanks.forEach(function(t){calc(t).forEach(function(w){lines.push([t.name,w.wk,w.feed.name,w.wi,w.wf,t.mort[w.idx]||0,w.al,w.bS.toFixed(2),w.bE.toFixed(2),w.d.toFixed(3),w.wkly.toFixed(2),w.cf.toFixed(2),w.fcr.toFixed(2),w.rw!=null?w.rw:"",w.dev!=null?w.dev.toFixed(1):""].join(","))})});
    setCsvData(lines.join("\n"));setCsvLabel("Todos");
  }
  function exportCSVInv(){
    var lines=["Fecha,Alimento,Acción,Cantidad,Precio,Tanque,Nota"];
    (S.log||[]).forEach(function(e){
      var fn=(S.feeds.find(function(f){return f.id===e.fid})||{}).name||"?";
      var tn=e.tid?(S.tanks.find(function(t){return t.id===e.tid})||{}).name||"":"";
      lines.push([e.date,fn,e.act,e.qty,e.price||"",tn,e.note||""].join(","));
    });
    setCsvData(lines.join("\n"));setCsvLabel("Inventario");
  }

  if(ld)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"#7fadc7"}}>Cargando...</div>;

  function renderDash(){
    var last=cd[cd.length-1];var al=last?last.al:0;var su=tank.fish>0?al/tank.fish*100:0;
    return <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:14}}>
        {KPI("Vivos",fN(al),su.toFixed(1)+"%","#22c55e")}
        {KPI("Biomasa",last?fN(Math.round(last.bE))+"kg":"0kg","FCR "+(last?last.fcr:0).toFixed(2),"#3b82f6")}
        {KPI("Alimento",last?fN(Math.round(last.cf))+"kg":"0kg","acum","#8b5cf6")}
        {KPI("Costo",fMoney(tCost(tank)),"COP","#f59e0b")}
      </div>
      <div style={sC}><div style={{fontWeight:700,fontSize:12,marginBottom:8,color:"#0c2d48"}}>Crecimiento</div>
        <ResponsiveContainer width="100%" height={200}><ComposedChart data={cd.map(function(c){return{s:"S"+c.wk,esp:c.wf,real:c.rw}})}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="s" tick={{fontSize:9}}/><YAxis tick={{fontSize:9}}/>
          <Tooltip contentStyle={{fontSize:10,borderRadius:8}}/><Legend wrapperStyle={{fontSize:9}}/>
          <Area type="monotone" dataKey="esp" fill="#d1e7f5" stroke="#1a4a6e" strokeWidth={2} name="Esperado" fillOpacity={0.3}/>
          <Line type="monotone" dataKey="real" stroke="#ef4444" strokeWidth={3} dot={{r:3}} name="Real" connectNulls/>
        </ComposedChart></ResponsiveContainer>
      </div>
    </div>
  }

  function renderFeed(){
    var cw=calWeek(tank.sd);
    return <div style={Object.assign({},sC,{overflowX:"auto"})}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
        <thead><tr style={{background:"#0c2d48",color:"white"}}>{["S","Fechas","Alimento","Wi","Wf","Mort","Vivos","%","kg/d","kg/s","x/d","g/c","Acum","FCR"].map(function(h,i){return <th key={i} style={{padding:"6px 3px",fontSize:8,textAlign:"center"}}>{h}</th>})}</tr></thead>
        <tbody>{cd.map(function(c,i){var isNow=c.wk===cw;return <tr key={i} style={{borderBottom:"1px solid #e2e8f0",background:isNow?"#dbeafe":""}}>
          <td style={{textAlign:"center",padding:4,fontWeight:700,color:isNow?"#1e40af":"inherit"}}>{c.wk}</td>
          <td style={{textAlign:"center",padding:4,fontSize:7,color:"#64748b"}}>{weekDates(tank.sd,c.wk)}</td>
          <td style={{padding:4,fontSize:8}}><span style={{background:PC[c.phase]||"#999",color:"white",padding:"1px 4px",borderRadius:4,fontSize:7}}>{shortF(c.feed.name)}</span></td>
          <td style={{textAlign:"center",padding:4}}>{c.wi}</td><td style={{textAlign:"center",padding:4}}>{c.wf}</td>
          <td style={{textAlign:"center",padding:2}}><input type="number" min="0" value={tank.mort[i]||""} placeholder="0" onChange={function(e){var m=tank.mort.slice();m[i]=Math.max(0,parseInt(e.target.value)||0);upT(tank.id,{mort:m})}} style={Object.assign({},sI,{width:40,padding:"2px",fontSize:10})}/></td>
          <td style={{textAlign:"center",padding:4,fontWeight:600}}>{fN(c.al)}</td>
          <td style={{textAlign:"center",padding:4}}>{c.fr}</td>
          <td style={{textAlign:"center",padding:4,fontWeight:600,color:"#1e40af"}}>{c.d.toFixed(3)}</td>
          <td style={{textAlign:"center",padding:4}}>{c.wkly.toFixed(2)}</td>
          <td style={{textAlign:"center",padding:4}}>{c.fpd}</td>
          <td style={{textAlign:"center",padding:4}}>{fN(Math.round(c.pm))}</td>
          <td style={{textAlign:"center",padding:4}}>{c.cf.toFixed(1)}</td>
          <td style={{textAlign:"center",padding:4,fontFamily:"monospace",fontWeight:600,color:c.fcr>1.8?"#ef4444":c.fcr>1.5?"#f59e0b":"#22c55e"}}>{c.fcr>0?c.fcr.toFixed(2):"—"}</td>
        </tr>})}</tbody>
      </table>
    </div>
  }

  function renderBio(){
    var cw=calWeek(tank.sd);
    var notes=tank.rwNotes||Array(29).fill("");
    return <div style={Object.assign({},sC,{overflowX:"auto"})}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
        <thead><tr style={{background:"#0c2d48",color:"white"}}>{["S","Fechas","Esp","Real","Desv","Desv%","Acción","Nota"].map(function(h,i){return <th key={i} style={{padding:"6px 4px",fontSize:9,textAlign:"center"}}>{h}</th>})}</tr></thead>
        <tbody>{cd.map(function(c,i){var dg=c.rw!=null?c.rw-c.wf:null;var dp=c.dev;var isNow=c.wk===cw;
          return <tr key={i} style={{borderBottom:"1px solid #e2e8f0",background:isNow?"#dbeafe":""}}>
            <td style={{textAlign:"center",padding:4,fontWeight:700,color:isNow?"#1e40af":"inherit"}}>{c.wk}</td>
            <td style={{textAlign:"center",padding:4,fontSize:7,color:"#64748b"}}>{weekDates(tank.sd,c.wk)}</td>
            <td style={{textAlign:"center",padding:4}}>{c.wf}</td>
            <td style={{textAlign:"center",padding:2}}><input type="number" step="0.1" value={tank.rw[i]!=null?tank.rw[i]:""} placeholder="—" onChange={function(e){var w=tank.rw.slice();w[i]=e.target.value===""?null:parseFloat(e.target.value);upT(tank.id,{rw:w})}} style={Object.assign({},sI,{width:60,padding:"2px",fontSize:10})}/></td>
            <td style={{textAlign:"center",padding:4,fontWeight:600,color:dg!=null?(dg>=0?"#16a34a":"#dc2626"):"#94a3b8"}}>{dg!=null?(dg>0?"+":"")+dg.toFixed(1):"—"}</td>
            <td style={{textAlign:"center",padding:4,fontWeight:600,color:dp!=null?(dp>=0?"#16a34a":"#dc2626"):"#94a3b8"}}>{dp!=null?(dp>0?"+":"")+dp.toFixed(1)+"%":"—"}</td>
            <td style={{textAlign:"left",padding:4,fontSize:9}}>{dp==null?"—":dp>10?"Reducir 10%":dp<-10?"↑ración":dp<-5?"Monitorear":"OK"}</td>
            <td style={{textAlign:"center",padding:2}}><input value={notes[i]||""} placeholder="—" onChange={function(e){var n=(tank.rwNotes||Array(29).fill("")).slice();n[i]=e.target.value;upT(tank.id,{rwNotes:n})}} style={Object.assign({},sI,{width:90,padding:"2px",fontSize:9,fontWeight:400,color:"#475569"})}/></td>
          </tr>})}</tbody>
      </table>
    </div>
  }

  function renderCons(){
    var cw=calWeek(tank.sd);var curRow=cd[Math.min(cw>0?cw-1:0,cd.length-1)];
    return <div>
      <div style={Object.assign({},sC,{marginBottom:10,background:"#eff6ff",borderColor:"#93c5fd"})}>
        <div style={{fontWeight:700,fontSize:13,color:"#0c2d48"}}>{"📍 Semana: S"+cw+" · "+weekDates(tank.sd,Math.max(cw,1))}</div>
        {curRow&&<div style={{fontSize:11,color:"#475569",marginTop:3}}>{curRow.feed.name+" · "+curRow.d.toFixed(3)+" kg/día · "+curRow.fpd+"x"}</div>}
      </div>
      <div style={Object.assign({},sC,{marginBottom:10})}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-end",marginBottom:6}}>
          <div style={{width:50}}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>Sem</label><input type="number" min="1" value={fcW} onChange={function(e){setFcW(parseInt(e.target.value)||1)}} style={sI}/></div>
          <div style={{flex:1,minWidth:120}}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>Alimento</label><select value={fcF} onChange={function(e){setFcF(e.target.value)}} style={Object.assign({},sI,{textAlign:"left"})}><option value="">--</option>{S.feeds.map(function(f){return <option key={f.id} value={f.id}>{f.name}</option>})}</select></div>
          <div style={{width:60}}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>Kg</label><input type="number" step="0.1" value={fcQ} onChange={function(e){setFcQ(e.target.value)}} style={sI}/></div>
          <div style={{width:80}}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>$/kg</label><input type="number" value={fcP} onChange={function(e){setFcP(e.target.value)}} style={sI}/></div>
          <button onClick={function(){if(!fcF||!fcQ)return;var q=parseFloat(fcQ),p=parseFloat(fcP)||lP(fcF)||0;var newFc=tank.fc.concat([{week:fcW,fid:fcF,qty:q,price:p,date:new Date().toISOString().slice(0,10),note:fcN||""}]);var iu=adjS(fcF,-q,"consumo",null,tank.id);save(Object.assign({},S,{tanks:S.tanks.map(function(t){return t.id===tank.id?Object.assign({},t,{fc:newFc}):t})},iu));setFcQ("");setFcP("");setFcN("")}} style={sB()}>+</button>
        </div>
        <input value={fcN} onChange={function(e){setFcN(e.target.value)}} placeholder="Nota (ej: parcial lunes, falta martes-viernes)" style={Object.assign({},sI,{textAlign:"left",fontSize:11,fontWeight:400,color:"#475569"})}/>
      </div>
      {tank.fc.length>0&&<div style={Object.assign({},sC,{overflowX:"auto"})}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr style={{background:"#0c2d48",color:"white"}}>{["Fecha","S","Alimento","Kg","$/kg","Total","Nota"].map(function(h,i){return <th key={i} style={{padding:"6px",fontSize:9,textAlign:"center"}}>{h}</th>})}</tr></thead>
          <tbody>{tank.fc.slice().reverse().map(function(e,i){var fn=(S.feeds.find(function(f){return f.id===e.fid})||{}).name||"?";
            return <tr key={i} style={{borderBottom:"1px solid #e2e8f0"}}>
              <td style={{textAlign:"center",padding:5}}>{e.date}</td>
              <td style={{textAlign:"center"}}>{"S"+e.week}</td>
              <td style={{padding:5,fontSize:9}}>{fn}</td>
              <td style={{textAlign:"center",fontWeight:600}}>{e.qty}</td>
              <td style={{textAlign:"center"}}>{fMoney(e.price||0)}</td>
              <td style={{textAlign:"center",fontWeight:600,fontFamily:"monospace"}}>{fMoney(e.qty*(e.price||0))}</td>
              <td style={{padding:5,fontSize:9,color:"#64748b",maxWidth:120}}>{e.note||""}</td>
            </tr>})}</tbody>
        </table>
      </div>}
    </div>
  }

  function renderCosts(){
    var fc=fCost(tank),oc=oCost(tank),tot=tCost(tank),last=cd[cd.length-1],bio=last?last.bE:0,cpk=bio>0?tot/bio:0;
    return <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:14}}>
        {KPI("Alevinos",fMoney(tank.ac||0),"","#0ea5e9")}{KPI("Alimento",fMoney(fc),"","#8b5cf6")}{KPI("Otros",fMoney(oc),"","#f59e0b")}{KPI("TOTAL",fMoney(tot),"COP","#ef4444")}{KPI("$/kg",fMoney(cpk),"COP/kg","#0c2d48")}
      </div>
      <div style={Object.assign({},sC,{marginBottom:12})}>
        <div style={{fontWeight:700,fontSize:12,marginBottom:8}}>Costo Alevinos</div>
        <input type="number" value={tank.ac||""} placeholder="COP" onChange={function(e){upT(tank.id,{ac:parseInt(e.target.value)||0})}} style={Object.assign({},sI,{maxWidth:200})}/>
      </div>
      <div style={sC}>
        <div style={{fontWeight:700,fontSize:12,marginBottom:8}}>Otros Costos</div>
        <div style={{display:"flex",gap:6,alignItems:"flex-end",marginBottom:8}}>
          <div style={{flex:1}}><input value={ocD} onChange={function(e){setOcD(e.target.value)}} placeholder="Descripción" style={Object.assign({},sI,{textAlign:"left"})}/></div>
          <div style={{width:100}}><input type="number" value={ocA} onChange={function(e){setOcA(e.target.value)}} placeholder="$COP" style={sI}/></div>
          <button onClick={function(){if(!ocD||!ocA)return;upT(tank.id,{oc:(tank.oc||[]).concat([{desc:ocD,amt:parseInt(ocA)||0,date:new Date().toISOString().slice(0,10)}])});setOcD("");setOcA("")}} style={sB()}>+</button>
        </div>
        {(tank.oc||[]).map(function(c,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #e2e8f0",fontSize:11}}><span>{c.date+" — "+c.desc}</span><span style={{fontWeight:600,fontFamily:"monospace"}}>{fMoney(c.amt)}</span></div>})}
      </div>
    </div>
  }

  function renderWater(){
    var lastEntry=tank.wl.length>0?tank.wl[tank.wl.length-1]:null;
    var alerts=[];
    if(lastEntry){
      if(lastEntry.o2!=null&&lastEntry.o2<3)alerts.push({m:"⚠️ O₂ "+lastEntry.o2+" — NO ALIMENTAR",c:"#dc2626"});
      if(lastEntry.nh3!=null&&lastEntry.nh3>0.05)alerts.push({m:"⚠️ NH₃ "+lastEntry.nh3+" — SUSPENDER",c:"#dc2626"});
      if(alerts.length===0)alerts.push({m:"✅ OK",c:"#16a34a"});
    }
    var fg=function(v,lo,hi){return v==null?{}:(v<lo||v>hi)?{color:"#dc2626",fontWeight:700}:{color:"#16a34a"}};
    return <div>
      <div style={Object.assign({},sC,{marginBottom:10})}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:6,marginBottom:8}}>
          {[["date","Fecha","date"],["temp","T°C","number"],["o2","O₂","number"],["ph","pH","number"],["nh3","NH₃","number"],["no2","NO₂","number"]].map(function(arr){return <div key={arr[0]}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>{arr[1]}</label><input type={arr[2]} step={arr[2]==="number"?"0.01":undefined} value={wf[arr[0]]} onChange={function(e){var u=Object.assign({},wf);u[arr[0]]=e.target.value;setWfS(u)}} style={Object.assign({},sI,{fontSize:10})}/></div>})}
        </div>
        <button onClick={function(){if(!wf.date)return;upT(tank.id,{wl:tank.wl.concat([{date:wf.date,temp:parseFloat(wf.temp)||null,o2:parseFloat(wf.o2)||null,ph:parseFloat(wf.ph)||null,nh3:parseFloat(wf.nh3)||null,no2:parseFloat(wf.no2)||null}])});setWfS({date:"",temp:"",o2:"",ph:"",nh3:"",no2:""})}} style={sB()}>+ Registrar</button>
      </div>
      {alerts.length>0&&<div style={{marginBottom:10}}>{alerts.map(function(x,i){return <div key={i} style={Object.assign({},sC,{padding:8,marginBottom:6,borderLeft:"4px solid "+x.c,fontWeight:600,fontSize:11,color:x.c})}>{x.m}</div>})}</div>}
      {tank.wl.length>0&&<div style={Object.assign({},sC,{overflowX:"auto"})}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr style={{background:"#0c2d48",color:"white"}}>{["Fecha","T°C","O₂","pH","NH₃","NO₂"].map(function(h,i){return <th key={i} style={{padding:"6px",fontSize:9,textAlign:"center"}}>{h}</th>})}</tr></thead>
          <tbody>{tank.wl.slice().reverse().slice(0,15).map(function(e,i){return <tr key={i} style={{borderBottom:"1px solid #e2e8f0"}}>
            <td style={{textAlign:"center",padding:5}}>{e.date}</td>
            <td style={Object.assign({textAlign:"center",padding:5},fg(e.temp,26,32))}>{e.temp!=null?e.temp:"—"}</td>
            <td style={Object.assign({textAlign:"center",padding:5},fg(e.o2,3,99))}>{e.o2!=null?e.o2:"—"}</td>
            <td style={Object.assign({textAlign:"center",padding:5},fg(e.ph,6.5,8.5))}>{e.ph!=null?e.ph:"—"}</td>
            <td style={Object.assign({textAlign:"center",padding:5},e.nh3!=null&&e.nh3>0.05?{color:"#dc2626",fontWeight:700}:{color:"#16a34a"})}>{e.nh3!=null?e.nh3:"—"}</td>
            <td style={Object.assign({textAlign:"center",padding:5},e.no2!=null&&e.no2>0.5?{color:"#dc2626",fontWeight:700}:{color:"#16a34a"})}>{e.no2!=null?e.no2:"—"}</td>
          </tr>})}</tbody>
        </table>
      </div>}
    </div>
  }

  return <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f0f4f8",minHeight:"100vh",color:"#1e293b"}}>
    <div style={{background:"linear-gradient(135deg,#0c2d48,#1a4a6e)",padding:"12px 16px",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:8,background:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#0c2d48",lineHeight:1,textAlign:"center",padding:2}}>LM<br/>P</div>
        <div><div style={{fontSize:18,fontWeight:700}}>La María Piscícola</div><div style={{fontSize:10,opacity:0.5}}>Santiago de Tolú · RAS</div></div>
      </div>
    </div>

    <div style={{display:"flex",borderBottom:"2px solid #dce5ed",background:"white",overflowX:"auto"}}>
      <TabBtn onClick={function(){setTab("ov");setSel(null)}} active={tab==="ov"} label="Vista General"/>
      <TabBtn onClick={function(){setTab("tk");setSel(null)}} active={tab==="tk"} label="Cultivos"/>
      <TabBtn onClick={function(){setTab("iv");setSel(null)}} active={tab==="iv"} label="Inventario"/>
      <TabBtn onClick={function(){setTab("fd");setSel(null)}} active={tab==="fd"} label="Alimentos"/>
    </div>

    <div style={{padding:14,maxWidth:1100,margin:"0 auto"}}>
      {csvData&&<div style={Object.assign({},sC,{marginBottom:14})}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontWeight:700,fontSize:13,color:"#0c2d48"}}>{"CSV — "+csvLabel+" — Copie y pegue en Excel"}</span>
          <button onClick={function(){setCsvData(null)}} style={sB("#64748b")}>Cerrar</button>
        </div>
        <textarea readOnly value={csvData} rows={10} style={{width:"100%",fontFamily:"monospace",fontSize:10,padding:8,border:"1px solid #e2e8f0",borderRadius:6,background:"#f8fafc"}} onClick={function(e){e.target.select()}}/>
        <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>Haga clic en el texto para seleccionar todo, luego Ctrl+C para copiar</div>
      </div>}
      {tab==="ov"&&<Overview S={S}/>}

      {tab==="tk"&&!sel&&<div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:15,color:"#0c2d48"}}>Cultivos</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={exportCSVAll} style={Object.assign({},sB("#2d6a8a"),{fontSize:10,padding:"5px 12px"})}>⬇ CSV Todos</button>
            <button onClick={function(){var t=mkT("Tanque "+(S.tanks.length+1));save(Object.assign({},S,{tanks:S.tanks.concat([t])}));setSel(t.id);setSub("da")}} style={sB()}>+ Nuevo</button>
          </div>
        </div>
        {S.tanks.map(function(t){var c=calc(t),last=c[c.length-1],w=calWeek(t.sd);
          return <div key={t.id} onClick={function(){setSel(t.id);setSub("da")}} style={Object.assign({},sC,{cursor:"pointer",borderLeft:"5px solid "+(t.on?"#22c55e":"#94a3b8"),display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10})}>
            <div><div style={{fontWeight:700}}>{t.name}{!t.on&&<span style={{fontSize:10,color:"#94a3b8"}}> (Fin)</span>}</div><div style={{fontSize:10,color:"#64748b"}}>{fN(t.fish)+" · "+t.ew+"g · "+t.sd}</div></div>
            <div style={{display:"flex",gap:12,fontSize:11,textAlign:"center"}}>
              <div><div style={{fontWeight:700,fontSize:15,color:"#22c55e"}}>{fN(last.al)}</div>vivos</div>
              <div><div style={{fontWeight:700,fontSize:15,color:"#3b82f6"}}>{fN(Math.round(last.bE))}</div>kg</div>
              <div><div style={{fontWeight:700,fontSize:15,color:"#8b5cf6"}}>{"S"+w}</div>sem</div>
            </div>
          </div>})}
      </div>}

      {tab==="tk"&&sel&&tank&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={function(){setSel(null)}} style={{background:"none",border:"none",color:"#1a4a6e",fontWeight:600,fontSize:12,cursor:"pointer"}}>← Cultivos</button>
          <button onClick={function(){exportCSVTank(tank)}} style={Object.assign({},sB("#2d6a8a"),{fontSize:10,padding:"5px 12px"})}>⬇ CSV {tank.name}</button>
        </div>
        <div style={Object.assign({},sC,{marginBottom:12})}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontWeight:700,fontSize:13,color:"#0c2d48"}}>{tank.name}</span>
            {locked?<div style={{display:"flex",gap:4,alignItems:"center"}}>
              <input type="password" value={pin} onChange={function(e){setPin(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")tryUnlock()}} placeholder="PIN" style={Object.assign({},sI,{width:70,fontSize:11,padding:"4px 6px"})}/>
              <button onClick={tryUnlock} style={sB("#64748b")}>🔒</button>
            </div>:<button onClick={doLock} style={sB("#22c55e")}>🔓 Bloquear</button>}
          </div>
          {!locked&&<div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
            <div style={{flex:1,minWidth:120}}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>Nombre</label><input value={tank.name} onChange={function(e){upT(tank.id,{name:e.target.value})}} style={Object.assign({},sI,{textAlign:"left"})}/></div>
            <div style={{width:70}}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>Peces</label><input type="number" value={tank.fish} onChange={function(e){upT(tank.id,{fish:Math.max(0,parseInt(e.target.value)||0)})}} style={sI}/></div>
            <div style={{width:60}}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>Peso(g)</label><input type="number" step="0.1" value={tank.ew} onChange={function(e){upT(tank.id,{ew:Math.max(0.1,parseFloat(e.target.value)||0.5)})}} style={sI}/></div>
            <div style={{width:110}}><label style={{fontSize:9,fontWeight:600,color:"#64748b"}}>Inicio</label><input type="date" value={tank.sd} onChange={function(e){upT(tank.id,{sd:e.target.value})}} style={sI}/></div>
          </div>}
          {!locked&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={function(){setDesdob(!desdob)}} style={sB("#8b5cf6")}>Desdoble</button>
            <button onClick={function(){upT(tank.id,{on:!tank.on})}} style={sB(tank.on?"#64748b":"#22c55e")}>{tank.on?"Finalizar":"Reactivar"}</button>
            <button onClick={function(){save(Object.assign({},S,{tanks:S.tanks.filter(function(t){return t.id!==tank.id})}));setSel(null)}} style={sB("#dc2626")}>Eliminar</button>
          </div>}
          {locked&&<div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>{fN(tank.fish)+" peces · "+tank.ew+"g · "+tank.sd}</div>}
          <div style={{marginTop:8,padding:"8px 12px",background:"#eff6ff",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,fontSize:14,color:"#1e40af"}}>{"Semana "+calWeek(tank.sd)}</span>
            <span style={{fontSize:10,color:"#64748b"}}>{"de "+calc(tank).length+" semanas"}</span>
          </div>
        </div>
        {desdob&&<div style={Object.assign({},sC,{marginBottom:12,borderColor:"#8b5cf6"})}>
          <div style={{fontWeight:700,fontSize:12,marginBottom:8,color:"#8b5cf6"}}>Desdoble</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{width:120}}><label style={{fontSize:9}}>Tanque A</label><input value={dsNA} onChange={function(e){setDsNA(e.target.value)}} placeholder="Nombre A" style={Object.assign({},sI,{textAlign:"left"})}/></div>
            <div style={{width:70}}><label style={{fontSize:9}}>Peces A</label><input type="number" value={dsA} onChange={function(e){setDsA(e.target.value)}} style={sI}/></div>
            <div style={{width:120}}><label style={{fontSize:9}}>Tanque B</label><input value={dsNB} onChange={function(e){setDsNB(e.target.value)}} placeholder="Nombre B" style={Object.assign({},sI,{textAlign:"left"})}/></div>
            <div style={{width:70}}><label style={{fontSize:9}}>Peces B</label><input type="number" value={dsB} onChange={function(e){setDsB(e.target.value)}} style={sI}/></div>
            <button onClick={doDesdoble} style={sB("#8b5cf6")}>Confirmar</button>
          </div>
        </div>}
        <div style={Object.assign({},sC,{marginBottom:12})}>
          <div style={{fontWeight:700,fontSize:11,color:"#64748b",marginBottom:4}}>Notas del cultivo</div>
          <textarea value={tank.notes||""} onChange={function(e){upT(tank.id,{notes:e.target.value})}} placeholder="Notas generales..." rows={2} style={Object.assign({},sI,{textAlign:"left",resize:"vertical",fontFamily:"inherit",fontSize:11,fontWeight:400,color:"#334155"})}/>
        </div>
        <div style={{display:"flex",marginBottom:12,borderBottom:"2px solid #dce5ed",background:"white",borderRadius:"8px 8px 0 0",overflowX:"auto"}}>
          <TabBtn onClick={function(){setSub("da")}} active={sub==="da"} label="Dashboard"/>
          <TabBtn onClick={function(){setSub("fe")}} active={sub==="fe"} label="Alimentación"/>
          <TabBtn onClick={function(){setSub("bi")}} active={sub==="bi"} label="Biometría"/>
          <TabBtn onClick={function(){setSub("co")}} active={sub==="co"} label="Consumo"/>
          <TabBtn onClick={function(){setSub("$$")}} active={sub==="$$"} label="Costos"/>
          <TabBtn onClick={function(){setSub("wa")}} active={sub==="wa"} label="Agua"/>
        </div>
        {sub==="da"&&renderDash()}
        {sub==="fe"&&renderFeed()}
        {sub==="bi"&&renderBio()}
        {sub==="co"&&renderCons()}
        {sub==="$$"&&renderCosts()}
        {sub==="wa"&&renderWater()}
      </div>}

      {tab==="iv"&&<div style={sC}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:14,color:"#0c2d48"}}>Inventario</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontWeight:700,fontFamily:"monospace"}}>{fMoney(iV())}</span>
            {invLocked?<div style={{display:"flex",gap:4,alignItems:"center"}}>
              <input type="password" value={invPin} onChange={function(e){setInvPin(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")tryUnlockInv()}} placeholder="PIN" style={Object.assign({},sI,{width:70,fontSize:11,padding:"4px 6px"})}/>
              <button onClick={tryUnlockInv} style={sB("#64748b")}>🔒</button>
            </div>:<div style={{display:"flex",gap:4}}>
              <button onClick={exportCSVInv} style={Object.assign({},sB("#2d6a8a"),{fontSize:10,padding:"5px 10px"})}>⬇ CSV</button>
              <button onClick={doLockInv} style={sB("#22c55e")}>🔓</button>
            </div>}
          </div>
        </div>
        {!invLocked&&<div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-end",marginBottom:6}}>
            <div style={{flex:1,minWidth:130}}><select value={invF} onChange={function(e){setInvF(e.target.value)}} style={Object.assign({},sI,{textAlign:"left"})}><option value="">Alimento</option>{S.feeds.map(function(f){return <option key={f.id} value={f.id}>{f.name}</option>})}</select></div>
            <div style={{width:65}}><input type="number" step="0.1" value={invQ} onChange={function(e){setInvQ(e.target.value)}} placeholder="Kg" style={sI}/></div>
            <div style={{width:80}}><input type="number" value={invP} onChange={function(e){setInvP(e.target.value)}} placeholder="$/kg" style={sI}/></div>
            <button onClick={function(){if(!invF||!invQ)return;var u=adjS(invF,parseFloat(invQ),"compra",parseFloat(invP)||0,null,invN);save(Object.assign({},S,u));setInvQ("");setInvP("");setInvN("")}} style={sB("#22c55e")}>+ Compra</button>
            <button onClick={function(){if(!invF||!invQ)return;var u=adjS(invF,parseFloat(invQ),"ajuste",null,null,invN||"Ajuste manual");save(Object.assign({},S,u));setInvQ("");setInvP("");setInvN("")}} style={sB("#f59e0b")}>± Ajuste</button>
          </div>
          <input value={invN} onChange={function(e){setInvN(e.target.value)}} placeholder="Nota (factura, razón del ajuste, etc.)" style={Object.assign({},sI,{textAlign:"left",fontSize:11,fontWeight:400,color:"#475569",marginBottom:12})}/>
        </div>}
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:"#0c2d48",color:"white"}}>{["Alimento","Stock","$/kg","Valor","Consumo Proy. 1 Sem",""].map(function(h,i){return <th key={i} style={{padding:"7px",fontSize:9,textAlign:"center"}}>{h}</th>})}</tr></thead>
          <tbody>{S.feeds.map(function(f){var stk=gSt(f.id),lpr=lP(f.id),pr=proj[f.id]||0,low=pr>0&&stk<pr,crit=pr>0&&stk<pr*0.5;
            return <tr key={f.id} style={{borderBottom:"1px solid #e2e8f0",background:crit?"#fee2e2":low?"#fef9c3":""}}>
              <td style={{padding:7,fontWeight:600,fontSize:10}}>{f.name}</td>
              <td style={{textAlign:"center",fontWeight:700,fontSize:14,fontFamily:"monospace",color:stk<0?"#dc2626":crit?"#dc2626":low?"#f59e0b":"#1e293b"}}>{stk.toFixed(1)}</td>
              <td style={{textAlign:"center"}}>{lpr?fMoney(lpr):"—"}</td>
              <td style={{textAlign:"center",fontFamily:"monospace"}}>{fMoney(stk*lpr)}</td>
              <td style={{textAlign:"center"}}>{pr>0?pr.toFixed(1):"—"}</td>
              <td style={{textAlign:"center"}}>{crit?<span style={{background:"#dc2626",color:"white",padding:"2px 6px",borderRadius:6,fontSize:9,fontWeight:700}}>PEDIR</span>:low?<span style={{background:"#f59e0b",color:"white",padding:"2px 6px",borderRadius:6,fontSize:9}}>Bajo</span>:"✅"}</td>
            </tr>})}</tbody>
        </table>
        {!invLocked&&(S.log||[]).length>0&&<div style={{marginTop:16}}>
          <div style={{fontWeight:700,fontSize:12,color:"#0c2d48",marginBottom:8}}>Historial de Movimientos</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
              <thead><tr style={{background:"#334155",color:"white"}}>{["Fecha","Alimento","Acción","Cantidad","Precio","Tanque","Nota"].map(function(h,i){return <th key={i} style={{padding:"6px",fontSize:9,textAlign:"center"}}>{h}</th>})}</tr></thead>
              <tbody>{(S.log||[]).slice().reverse().slice(0,50).map(function(e,i){
                var fn=(S.feeds.find(function(f){return f.id===e.fid})||{}).name||"?";
                var tn=e.tid?(S.tanks.find(function(t){return t.id===e.tid})||{}).name||"":"";
                var actColor=e.act==="compra"?"#22c55e":e.act==="consumo"?"#3b82f6":e.act==="ajuste"?"#f59e0b":"#94a3b8";
                return <tr key={i} style={{borderBottom:"1px solid #e2e8f0"}}>
                  <td style={{textAlign:"center",padding:5}}>{e.date}</td>
                  <td style={{padding:5,fontSize:9}}>{shortF(fn)}</td>
                  <td style={{textAlign:"center"}}><span style={{background:actColor,color:"white",padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:600}}>{e.act}</span></td>
                  <td style={{textAlign:"center",fontWeight:600,fontFamily:"monospace"}}>{e.qty>0&&e.act!=="consumo"?"+":""}{e.qty}</td>
                  <td style={{textAlign:"center"}}>{e.price?fMoney(e.price):"—"}</td>
                  <td style={{textAlign:"center",fontSize:9}}>{tn||"—"}</td>
                  <td style={{padding:5,fontSize:9,color:"#64748b",maxWidth:120}}>{e.note||"—"}</td>
                </tr>})}</tbody>
            </table>
          </div>
        </div>}
      </div>}

      {tab==="fd"&&<div style={sC}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:10,color:"#0c2d48"}}>Línea Italcol Aquatilapia</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:"#0c2d48",color:"white"}}>{["Producto","Proteína","Rango"].map(function(h,i){return <th key={i} style={{padding:"7px",fontSize:10,textAlign:"center"}}>{h}</th>})}</tr></thead>
          <tbody>{S.feeds.map(function(f){return <tr key={f.id} style={{borderBottom:"1px solid #e2e8f0"}}>
            <td style={{padding:7,fontWeight:600}}>{f.name}</td>
            <td style={{textAlign:"center"}}>{f.prot+"%"}</td>
            <td style={{textAlign:"center",fontSize:10}}>{f.wMin+"g – "+f.wMax+"g"}</td>
          </tr>})}</tbody>
        </table>
      </div>}

      <div style={{marginTop:20,textAlign:"center",fontSize:10,color:"#94a3b8"}}>La María Piscícola · Santiago de Tolú</div>
    </div>
  </div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
