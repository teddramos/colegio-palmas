import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";

const INITIAL_USERS = [
  { id: 1, username: "admin", password: "admin123", role: "admin", name: "Administrador" },
  { id: 2, username: "asistente", password: "asist123", role: "asistente", name: "María López" },
  { id: 3, username: "empleado", password: "empl123", role: "empleado", name: "Carlos Ruiz" },
];

const INITIAL_CONFIG = {
  nombreColegio: "Colegio San José", rif: "J-12345678-9",
  direccion: "Av. Principal #123, Ciudad", telefono: "0212-5551234",
  email: "admin@colegiosanjose.edu", director: "Prof. Ana Martínez",
};

const INITIAL_CUENTAS = [
  { id: 1, nombre: "Mensualidades", tipo: "ingreso", descripcion: "Pagos mensuales de alumnos" },
  { id: 2, nombre: "Inscripciones", tipo: "ingreso", descripcion: "Cobros de inscripción" },
  { id: 3, nombre: "Actividades Extracurriculares", tipo: "ingreso", descripcion: "Ingresos por actividades extra" },
  { id: 4, nombre: "Nómina Docente", tipo: "gasto", descripcion: "Pago a profesores" },
  { id: 5, nombre: "Servicios Públicos", tipo: "gasto", descripcion: "Agua, luz, gas" },
  { id: 6, nombre: "Mantenimiento", tipo: "gasto", descripcion: "Reparaciones y mantenimiento" },
  { id: 7, nombre: "Material Escolar", tipo: "gasto", descripcion: "Útiles y materiales" },
  { id: 8, nombre: "Administración", tipo: "gasto", descripcion: "Gastos administrativos" },
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const fn = () => setM(window.innerWidth < 768); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  return m;
};

const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --navy:#0f1f3d;--navy-l:#1a3060;--gold:#c8a84b;--gold-l:#e8c97a;
      --cream:#f7f4ee;--g100:#f0ede8;--g200:#e0dbd2;--g400:#a09880;--g600:#6b6358;
      --green:#2e7d52;--gl:#e8f5ee;--red:#b03a2e;--rl:#fdf0ee;
      --sh:0 2px 8px rgba(15,31,61,.08);--shm:0 8px 24px rgba(15,31,61,.12);--shl:0 16px 48px rgba(15,31,61,.18);
      --bnh:64px;
    }
    body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--navy);-webkit-tap-highlight-color:transparent}
    @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideLeft{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    .fi{animation:fadeIn .35s ease forwards}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;white-space:nowrap;min-height:40px}
    .btn-p{background:var(--gold);color:var(--navy)}.btn-p:hover{background:var(--gold-l)}.btn-p:active{transform:scale(.97)}
    .btn-s{background:transparent;color:var(--navy);border:1.5px solid var(--g200)}.btn-s:hover{background:var(--g100)}.btn-s:active{transform:scale(.97)}
    .btn-d{background:var(--rl);color:var(--red);border:1px solid #f5c6c2}.btn-d:active{transform:scale(.97)}
    .btn-n{background:var(--navy);color:white}.btn-n:hover{background:var(--navy-l)}.btn-n:active{transform:scale(.97)}
    .btn-sm{padding:6px 12px;font-size:13px;min-height:34px}
    .btn-ic{padding:8px;border-radius:8px;min-width:36px;min-height:36px}
    .btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important}
    .card{background:white;border-radius:16px;padding:20px;box-shadow:var(--sh);border:1px solid var(--g200)}
    @media(max-width:767px){.card{padding:15px;border-radius:14px}}
    .inp{width:100%;padding:11px 14px;border:1.5px solid var(--g200);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:15px;color:var(--navy);background:white;transition:border .2s;outline:none;-webkit-appearance:none}
    .inp:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,168,75,.15)}
    .inp::placeholder{color:var(--g400)}
    .lbl{display:block;font-size:13px;font-weight:500;color:var(--g600);margin-bottom:6px}
    .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500}
    .bi{background:var(--gl);color:var(--green)}.bg_{background:var(--rl);color:var(--red)}
    .ba{background:#e8ecff;color:#3b4fd8}.bass{background:#fff3e8;color:#c47a2b}.be{background:#f0f0f0;color:#555}
    table{width:100%;border-collapse:collapse}
    th{padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--g600);text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--g200)}
    td{padding:11px 12px;font-size:14px;border-bottom:1px solid var(--g100);vertical-align:middle}
    tr:last-child td{border-bottom:none}tr:hover td{background:var(--g100)}
    .mo{position:fixed;inset:0;background:rgba(15,31,61,.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s;backdrop-filter:blur(4px)}
    @media(min-width:768px){.mo{align-items:center;padding:20px}}
    .md{background:white;width:100%;max-width:540px;max-height:92vh;overflow-y:auto;border-radius:20px 20px 0 0;padding:24px 20px 32px;box-shadow:var(--shl);animation:slideUp .3s}
    @media(min-width:768px){.md{border-radius:20px;padding:32px}}
    .sidebar{width:230px;background:white;height:100vh;display:flex;flex-direction:column;border-right:1px solid var(--g200);padding:20px 14px;position:sticky;top:0;flex-shrink:0}
    @media(max-width:767px){.sidebar{display:none}}
    .bnav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:white;border-top:1px solid var(--g200);height:var(--bnh);padding:0 4px;box-shadow:0 -4px 20px rgba(15,31,61,.08)}
    @media(max-width:767px){.bnav{display:flex;align-items:stretch}}
    .bni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 2px;background:none;border:none;cursor:pointer;color:var(--g400);font-size:10px;font-weight:500;font-family:'DM Sans',sans-serif;border-radius:10px;transition:color .2s}
    .bni.act{color:var(--navy)}.bni .bic{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background .2s}
    .bni.act .bic{background:rgba(200,168,75,.18)}
    .sl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;color:var(--g400);font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;border:none;background:transparent;width:100%;text-align:left}
    .sl:hover{background:rgba(200,168,75,.1);color:var(--navy)}.sl.act{background:rgba(200,168,75,.15);color:var(--navy);font-weight:600}
    .dov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:500;animation:fadeIn .2s}
    .drw{position:fixed;top:0;left:0;bottom:0;width:260px;background:white;z-index:501;padding:20px 14px;display:flex;flex-direction:column;box-shadow:var(--shl);animation:slideLeft .25s}
    @media(max-width:767px){.dov{display:block}}
    .sg{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
    @media(min-width:600px){.sg{grid-template-columns:repeat(4,1fr)}}
    .sp{width:36px;height:36px;border:3px solid var(--g200);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite}
    .ttl{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:var(--navy)}
    .sub{font-size:13px;color:var(--g400);margin-top:3px}
    .ap{color:var(--green);font-weight:600}.an{color:var(--red);font-weight:600}
    .es{text-align:center;padding:40px 20px;color:var(--g400)}.es .icon{font-size:40px;margin-bottom:10px;opacity:.5}
    .pb{height:6px;background:var(--g200);border-radius:3px;overflow:hidden}
    .pf{height:100%;border-radius:3px;transition:width .5s}
    .mc{padding:6px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1.5px solid var(--g200);background:white;transition:all .2s;color:var(--g600);white-space:nowrap}
    .mc:hover{border-color:var(--gold);color:var(--navy)}.mc.act{background:var(--navy);color:white;border-color:var(--navy)}.mc.hd{border-color:var(--gold);color:var(--navy)}
    .tab{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:transparent;color:var(--g600);transition:all .2s}
    .tab.act{background:var(--navy);color:white}.tab:hover:not(.act){background:var(--g100);color:var(--navy)}
    .notif{position:fixed;top:16px;left:16px;right:16px;z-index:2000;padding:13px 16px;border-radius:12px;font-size:14px;font-weight:500;box-shadow:var(--shl);animation:slideUp .3s;display:flex;align-items:center;gap:10px}
    @media(min-width:480px){.notif{left:auto;right:20px;max-width:340px}}
    .ns{background:var(--green);color:white}.ne{background:var(--red);color:white}
    .tbl{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .movc{background:white;border-radius:12px;padding:14px 16px;border:1px solid var(--g200);margin-bottom:10px;display:flex;flex-direction:column;gap:6px;box-shadow:var(--sh)}
    .movr{display:flex;justify-content:space-between;align-items:center}
    .topb{display:none;background:white;border-bottom:1px solid var(--g200);padding:12px 16px;position:sticky;top:0;z-index:100;align-items:center;justify-content:space-between;box-shadow:var(--sh)}
    @media(max-width:767px){.topb{display:flex}}
    @media(max-width:767px){.mc-pb{padding-bottom:calc(var(--bnh) + 12px)!important}}
    ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--g200);border-radius:3px}
  `}</style>
);

// ── Helpers UI ──
const Notif = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`notif ${type==='success'?'ns':'ne'}`}>
      <span>{type==='success'?'✓':'✗'}</span>
      <span style={{flex:1}}>{msg}</span>
      <button onClick={onClose} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontSize:'20px',lineHeight:1,padding:'0 4px'}}>×</button>
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="md">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <h2 style={{fontFamily:'Playfair Display',fontSize:'18px',color:'var(--navy)'}}>{title}</h2>
        <button onClick={onClose} style={{background:'var(--g100)',border:'none',width:'32px',height:'32px',borderRadius:'50%',cursor:'pointer',fontSize:'18px',color:'var(--g600)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const FF = ({ label, children }) => (
  <div style={{marginBottom:'14px'}}>
    <label className="lbl">{label}</label>
    {children}
  </div>
);

// ── LOGIN ──
const Login = ({ onLogin }) => {
  const [u,setU]=useState(''); const [p,setP]=useState(''); const [err,setErr]=useState(''); const [ld,setLd]=useState(false);
  const users = load('sf_users', INITIAL_USERS);
  const go = () => {
    setErr(''); setLd(true);
    setTimeout(()=>{
      const f=users.find(x=>x.username===u&&x.password===p);
      if(f) onLogin(f); else { setErr('Usuario o contraseña incorrectos'); setLd(false); }
    },800);
  };
  return (
    <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        {[...Array(5)].map((_,i)=><div key={i} style={{position:'absolute',borderRadius:'50%',background:`rgba(200,168,75,${.025+i*.01})`,width:`${170+i*130}px`,height:`${170+i*130}px`,top:`${-50+i*90}px`,left:`${-50+i*110}px`}}/>)}
      </div>
      <div className="fi" style={{width:'100%',maxWidth:'390px',position:'relative'}}>
        <div style={{textAlign:'center',marginBottom:'30px'}}>
          <div style={{width:'60px',height:'60px',background:'var(--gold)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:'26px'}}>🏫</div>
          <h1 style={{fontFamily:'Playfair Display',color:'white',fontSize:'24px',marginBottom:'4px'}}>SchoolFinance</h1>
          <p style={{color:'rgba(255,255,255,.5)',fontSize:'13px'}}>Sistema de Gestión Financiera Escolar</p>
        </div>
        <div style={{background:'rgba(255,255,255,.06)',backdropFilter:'blur(20px)',borderRadius:'20px',padding:'26px 22px',border:'1px solid rgba(255,255,255,.1)'}}>
          {err&&<div style={{background:'rgba(176,58,46,.2)',border:'1px solid rgba(176,58,46,.4)',color:'#ff8a80',padding:'10px 14px',borderRadius:'8px',fontSize:'13px',marginBottom:'12px'}}>⚠️ {err}</div>}
          <FF label={<span style={{color:'rgba(255,255,255,.6)'}}>Usuario</span>}>
            <input className="inp" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="Ingrese su usuario" style={{background:'rgba(255,255,255,.08)',border:'1.5px solid rgba(255,255,255,.15)',color:'white'}}/>
          </FF>
          <FF label={<span style={{color:'rgba(255,255,255,.6)'}}>Contraseña</span>}>
            <input className="inp" type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="Ingrese su contraseña" style={{background:'rgba(255,255,255,.08)',border:'1.5px solid rgba(255,255,255,.15)',color:'white'}}/>
          </FF>
          <button className="btn btn-p" onClick={go} disabled={ld} style={{width:'100%',padding:'13px',fontSize:'15px',marginTop:'4px',borderRadius:'12px'}}>
            {ld?<><div style={{width:'17px',height:'17px',border:'2px solid var(--navy)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .6s linear infinite'}}/> Ingresando...</>:'→ Ingresar'}
          </button>
          <div style={{marginTop:'16px',padding:'12px',background:'rgba(255,255,255,.04)',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,.4)',lineHeight:1.8}}>
            <strong style={{color:'rgba(255,255,255,.6)'}}>Demo:</strong><br/>
            admin / admin123 · asistente / asist123 · empleado / empl123
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TOP BAR móvil ──
const TopBar = ({ page, onMenu }) => {
  const titles={dashboard:'Dashboard',movimientos:'Movimientos',cuentas:'Cuentas',reportes:'Reportes',configuracion:'Configuración',usuarios:'Usuarios'};
  return (
    <div className="topb">
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
        <div style={{width:'28px',height:'28px',background:'var(--navy)',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>🏫</div>
        <span style={{fontFamily:'Playfair Display',fontSize:'15px',fontWeight:'600',color:'var(--navy)'}}>{titles[page]||'SchoolFinance'}</span>
      </div>
      <button onClick={onMenu} style={{background:'var(--g100)',border:'none',padding:'7px 11px',borderRadius:'8px',cursor:'pointer',fontSize:'17px',color:'var(--navy)'}}>☰</button>
    </div>
  );
};

const NAV_LINKS = [
  {id:'dashboard',    label:'Inicio',   icon:'📊', roles:['admin','asistente','empleado']},
  {id:'movimientos',  label:'Movim.',   icon:'💰', roles:['admin','asistente']},
  {id:'reportes',     label:'Reportes', icon:'📄', roles:['admin','asistente','empleado']},
  {id:'cuentas',      label:'Cuentas',  icon:'📋', roles:['admin']},
  {id:'configuracion',label:'Config.',  icon:'⚙️', roles:['admin']},
  {id:'usuarios',     label:'Usuarios', icon:'👥', roles:['admin']},
];

// ── DRAWER móvil ──
const Drawer = ({ user, page, setPage, onClose, onLogout }) => (
  <>
    <div className="dov" onClick={onClose}/>
    <div className="drw">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'30px',height:'30px',background:'var(--navy)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px'}}>🏫</div>
          <span style={{fontFamily:'Playfair Display',fontSize:'14px',fontWeight:'700',color:'var(--navy)'}}>SchoolFinance</span>
        </div>
        <button onClick={onClose} style={{background:'var(--g100)',border:'none',width:'30px',height:'30px',borderRadius:'50%',cursor:'pointer',fontSize:'16px',color:'var(--g600)',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
      </div>
      <div style={{flex:1}}>
        {NAV_LINKS.filter(l=>l.roles.includes(user.role)).map(l=>(
          <button key={l.id} className={`sl ${page===l.id?'act':''}`} onClick={()=>{setPage(l.id);onClose();}}>
            <span style={{fontSize:'17px'}}>{l.icon}</span>{l.label==='Config.'?'Configuración':l.label==='Movim.'?'Movimientos':l.label}
          </button>
        ))}
      </div>
      <div style={{borderTop:'1px solid var(--g200)',paddingTop:'14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px',borderRadius:'10px',background:'var(--g100)',marginBottom:'10px'}}>
          <div style={{width:'34px',height:'34px',background:'var(--navy)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'14px',fontWeight:'600',flexShrink:0}}>{user.name.charAt(0)}</div>
          <div style={{overflow:'hidden'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
            <span className={`badge b${user.role==='admin'?'a':user.role==='asistente'?'ass':'e'}`} style={{fontSize:'11px',padding:'1px 7px'}}>{user.role}</span>
          </div>
        </div>
        <button className="btn btn-s" onClick={onLogout} style={{width:'100%',justifyContent:'center'}}>← Cerrar Sesión</button>
      </div>
    </div>
  </>
);

// ── SIDEBAR desktop ──
const Sidebar = ({ user, page, setPage, onLogout }) => (
  <div className="sidebar">
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'26px',padding:'0 5px'}}>
      <div style={{width:'32px',height:'32px',background:'var(--navy)',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>🏫</div>
      <div><div style={{fontFamily:'Playfair Display',fontSize:'13px',fontWeight:'700',color:'var(--navy)'}}>SchoolFinance</div><div style={{fontSize:'10px',color:'var(--g400)'}}>v1.0</div></div>
    </div>
    <nav style={{flex:1}}>
      {NAV_LINKS.filter(l=>l.roles.includes(user.role)).map(l=>(
        <button key={l.id} className={`sl ${page===l.id?'act':''}`} onClick={()=>setPage(l.id)}>
          <span style={{fontSize:'17px'}}>{l.icon}</span>
          {l.label==='Movim.'?'Movimientos':l.label==='Config.'?'Configuración':l.label}
        </button>
      ))}
    </nav>
    <div style={{borderTop:'1px solid var(--g200)',paddingTop:'12px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'10px',background:'var(--g100)',marginBottom:'8px'}}>
        <div style={{width:'30px',height:'30px',background:'var(--navy)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'12px',fontWeight:'600',flexShrink:0}}>{user.name.charAt(0)}</div>
        <div style={{overflow:'hidden',flex:1}}>
          <div style={{fontSize:'12px',fontWeight:'500',color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
          <span className={`badge b${user.role==='admin'?'a':user.role==='asistente'?'ass':'e'}`} style={{fontSize:'10px',padding:'1px 6px'}}>{user.role}</span>
        </div>
      </div>
      <button className="btn btn-s btn-sm" onClick={onLogout} style={{width:'100%',justifyContent:'center'}}>← Salir</button>
    </div>
  </div>
);

// ── BOTTOM NAV ──
const BNav = ({ user, page, setPage }) => {
  const links = NAV_LINKS.filter(l=>l.roles.includes(user.role)).slice(0,5);
  return (
    <div className="bnav">
      {links.map(l=>(
        <button key={l.id} className={`bni ${page===l.id?'act':''}`} onClick={()=>setPage(l.id)}>
          <div className="bic">{l.icon}</div>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
};

// ── DASHBOARD ──
const Dashboard = ({ movimientos, cuentas, currentYear, currentMonth, setPage }) => {
  const mb = useIsMobile();
  const mk = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;
  const mm = movimientos.filter(m=>m.periodo===mk);
  const ti = mm.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0);
  const tg = mm.filter(m=>m.tipo==='gasto').reduce((s,m)=>s+m.monto,0);
  const bal = ti-tg;
  const months = [...new Set(movimientos.map(m=>m.periodo))].sort().slice(-6);
  const cd = months.map(p=>{const ms=movimientos.filter(m=>m.periodo===p);return{label:p.split('-')[1]+'/'+p.split('-')[0].slice(2),ing:ms.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0),gas:ms.filter(m=>m.tipo==='gasto').reduce((s,m)=>s+m.monto,0)};});
  const mx = Math.max(...cd.map(d=>Math.max(d.ing,d.gas)),1);
  const top = cuentas.map(c=>({...c,total:mm.filter(m=>m.cuentaId===c.id).reduce((s,m)=>s+m.monto,0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total).slice(0,4);
  const p = mb?'16px':'28px';
  return (
    <div className="fi" style={{padding:p,flex:1,overflow:'auto'}}>
      {!mb&&<div style={{marginBottom:'22px'}}><div className="ttl">Dashboard</div><div className="sub">{MESES[currentMonth]} {currentYear} · Resumen financiero</div></div>}
      {mb&&<div style={{marginBottom:'12px',color:'var(--g400)',fontSize:'13px'}}>{MESES[currentMonth]} {currentYear}</div>}
      <div className="sg" style={{marginBottom:'14px'}}>
        {[{l:'Ingresos',v:ti,c:'var(--green)',b:'var(--gl)',i:'↑'},{l:'Gastos',v:tg,c:'var(--red)',b:'var(--rl)',i:'↓'},{l:'Balance',v:bal,c:bal>=0?'var(--green)':'var(--red)',b:bal>=0?'var(--gl)':'var(--rl)',i:'⚖'},{l:'Registros',v:mm.length,c:'var(--navy)',b:'var(--g100)',i:'#',n:true}].map((s,i)=>(
          <div key={i} className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
              <span style={{fontSize:'10px',fontWeight:'600',color:'var(--g400)',textTransform:'uppercase',letterSpacing:'.04em'}}>{s.l}</span>
              <div style={{width:'26px',height:'26px',background:s.b,borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',color:s.c,fontSize:'12px',fontWeight:'700',flexShrink:0}}>{s.i}</div>
            </div>
            <div style={{fontSize:mb?'16px':'20px',fontWeight:'700',color:s.n?'var(--navy)':s.c,lineHeight:1.2}}>
              {s.n?s.v:`$${s.v.toLocaleString('es-VE',{minimumFractionDigits:2})}`}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:mb?'1fr':'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
        <div className="card">
          <h3 style={{fontSize:'13px',fontWeight:'600',marginBottom:'14px',color:'var(--navy)'}}>📈 Tendencia 6 meses</h3>
          {cd.length===0?<div className="es"><div className="icon">📊</div><p>Sin datos</p></div>:(
            <div style={{display:'flex',alignItems:'flex-end',gap:'6px',height:'110px',padding:'0 2px'}}>
              {cd.map((d,i)=>(
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',height:'100%',justifyContent:'flex-end'}}>
                  <div style={{width:'100%',display:'flex',gap:'2px',alignItems:'flex-end',height:'90px'}}>
                    <div style={{flex:1,background:'var(--gl)',border:'1px solid var(--green)',borderRadius:'3px 3px 0 0',height:`${(d.ing/mx)*100}%`,minHeight:'3px',transition:'height .5s'}}/>
                    <div style={{flex:1,background:'var(--rl)',border:'1px solid var(--red)',borderRadius:'3px 3px 0 0',height:`${(d.gas/mx)*100}%`,minHeight:'3px',transition:'height .5s'}}/>
                  </div>
                  <span style={{fontSize:'9px',color:'var(--g400)',fontWeight:'500'}}>{d.label}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',gap:'12px',marginTop:'8px',paddingTop:'8px',borderTop:'1px solid var(--g100)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'var(--g600)'}}><div style={{width:'8px',height:'8px',background:'var(--gl)',border:'1px solid var(--green)',borderRadius:'2px'}}/> Ingresos</div>
            <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'var(--g600)'}}><div style={{width:'8px',height:'8px',background:'var(--rl)',border:'1px solid var(--red)',borderRadius:'2px'}}/> Gastos</div>
          </div>
        </div>
        <div className="card">
          <h3 style={{fontSize:'13px',fontWeight:'600',marginBottom:'12px',color:'var(--navy)'}}>📋 Top Cuentas</h3>
          {top.length===0?<div className="es"><div className="icon">📋</div><p>Sin movimientos</p></div>:(
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {top.map(c=>(
                <div key={c.id}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                    <span style={{fontSize:'12px',fontWeight:'500',color:'var(--navy)'}}>{c.nombre}</span>
                    <span style={{fontSize:'12px',fontWeight:'600',color:c.tipo==='ingreso'?'var(--green)':'var(--red)'}}>
                      {c.tipo==='ingreso'?'+':'-'}${c.total.toLocaleString('es-VE',{minimumFractionDigits:2})}
                    </span>
                  </div>
                  <div className="pb"><div className="pf" style={{width:`${(c.total/(top[0]?.total||1))*100}%`,background:c.tipo==='ingreso'?'var(--green)':'var(--red)'}}/></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card" style={{background:'linear-gradient(135deg,var(--navy),var(--navy-l))',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <div style={{color:'rgba(255,255,255,.6)',fontSize:'12px',marginBottom:'4px'}}>Balance {MESES[currentMonth]} {currentYear}</div>
          <div style={{color:bal>=0?'var(--gold-l)':'#ff8a80',fontSize:mb?'22px':'26px',fontWeight:'700',fontFamily:'Playfair Display'}}>
            {bal>=0?'+':''}{bal.toLocaleString('es-VE',{style:'currency',currency:'USD',minimumFractionDigits:2})}
          </div>
        </div>
        <button className="btn btn-p" onClick={()=>setPage('reportes')}>Ver Reporte →</button>
      </div>
    </div>
  );
};

// ── MOVIMIENTOS ──
const Movimientos = ({ user, movimientos, setMovimientos, cuentas, currentYear, currentMonth, setCurrentMonth, setCurrentYear, notify }) => {
  const mb=useIsMobile(); const ce=['admin','asistente'].includes(user.role); const ia=user.role==='admin';
  const [show,setShow]=useState(false); const [form,setForm]=useState({tipo:'ingreso',cuentaId:'',monto:'',descripcion:'',fecha:new Date().toISOString().split('T')[0]}); const [fil,setFil]=useState('todos'); const [eid,setEid]=useState(null);
  const mk=`${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;
  const mm=movimientos.filter(m=>m.periodo===mk);
  const filtered=fil==='todos'?mm:mm.filter(m=>m.tipo===fil);
  const ti=mm.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0);
  const tg=mm.filter(m=>m.tipo==='gasto').reduce((s,m)=>s+m.monto,0);
  const oA=()=>{setEid(null);setForm({tipo:'ingreso',cuentaId:'',monto:'',descripcion:'',fecha:new Date().toISOString().split('T')[0]});setShow(true);};
  const oE=m=>{setEid(m.id);setForm({tipo:m.tipo,cuentaId:m.cuentaId,monto:m.monto,descripcion:m.descripcion,fecha:m.fecha});setShow(true);};
  const save2=()=>{
    if(!form.cuentaId||!form.monto||!form.fecha){notify('Complete todos los campos','error');return;}
    const mo=parseFloat(form.monto);if(isNaN(mo)||mo<=0){notify('Monto inválido','error');return;}
    if(eid){setMovimientos(prev=>prev.map(m=>m.id===eid?{...m,...form,monto:mo,cuentaId:parseInt(form.cuentaId)}:m));notify('Actualizado','success');}
    else{setMovimientos(prev=>[...prev,{id:Date.now(),...form,monto:mo,cuentaId:parseInt(form.cuentaId),periodo:mk,usuario:user.name}]);notify('Registrado','success');}
    setShow(false);
  };
  const del=id=>{if(confirm('¿Eliminar?')){setMovimientos(prev=>prev.filter(m=>m.id!==id));notify('Eliminado','success');}};
  const p=mb?'16px':'28px';
  return (
    <div className="fi" style={{padding:p,flex:1,overflow:'auto'}}>
      {!mb&&<div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'18px',flexWrap:'wrap',gap:'10px'}}><div><div className="ttl">Movimientos</div><div className="sub">Registro de ingresos y gastos</div></div>{ce&&<button className="btn btn-n" onClick={oA}>+ Nuevo</button>}</div>}
      {mb&&ce&&<button className="btn btn-n" onClick={oA} style={{width:'100%',marginBottom:'14px',padding:'13px'}}>+ Nuevo Movimiento</button>}
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',overflowX:'auto',paddingBottom:'4px'}}>
        {ia&&<select className="inp" value={currentYear} onChange={e=>setCurrentYear(parseInt(e.target.value))} style={{width:'auto',flexShrink:0,fontSize:'13px',padding:'7px 10px'}}>{[currentYear-1,currentYear,currentYear+1].map(y=><option key={y} value={y}>{y}</option>)}</select>}
        {MESES.map((m,i)=>{const k=`${currentYear}-${String(i+1).padStart(2,'0')}`;const hd=movimientos.some(mv=>mv.periodo===k);return<button key={i} className={`mc ${i===currentMonth?'act':''} ${hd&&i!==currentMonth?'hd':''}`} onClick={()=>setCurrentMonth(i)}>{m.slice(0,3)}</button>;})}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'12px'}}>
        {[{l:'Ingresos',v:ti,c:'var(--green)'},{l:'Gastos',v:tg,c:'var(--red)'},{l:'Balance',v:ti-tg,c:(ti-tg)>=0?'var(--green)':'var(--red)'}].map((s,i)=>(
          <div key={i} className="card" style={{padding:'11px 13px'}}>
            <div style={{fontSize:'10px',color:'var(--g400)',marginBottom:'3px',textTransform:'uppercase',fontWeight:'600'}}>{s.l}</div>
            <div style={{fontSize:mb?'13px':'17px',fontWeight:'700',color:s.c}}>${s.v.toLocaleString('es-VE',{minimumFractionDigits:2})}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:'6px',marginBottom:'10px',overflowX:'auto'}}>
        {['todos','ingreso','gasto'].map(f=><button key={f} className={`tab ${fil===f?'act':''}`} onClick={()=>setFil(f)} style={{flexShrink:0}}>{f==='todos'?'Todos':f==='ingreso'?'Ingresos':'Gastos'}</button>)}
        <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--g400)',alignSelf:'center',flexShrink:0}}>{filtered.length} reg.</span>
      </div>
      {filtered.length===0?<div className="es card"><div className="icon">💸</div><p>Sin movimientos en {MESES[currentMonth]}</p></div>:
        mb?(
          <div>
            {filtered.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(m=>{const c=cuentas.find(x=>x.id===m.cuentaId);return(
              <div key={m.id} className="movc">
                <div className="movr"><span style={{fontWeight:'600',fontSize:'14px',color:'var(--navy)'}}>{c?.nombre||'—'}</span><span className={m.tipo==='ingreso'?'ap':'an'} style={{fontSize:'15px'}}>{m.tipo==='ingreso'?'+':'-'}${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>
                <div className="movr"><span style={{fontSize:'12px',color:'var(--g400)'}}>{m.descripcion||'Sin descripción'}</span><span className={`badge b${m.tipo==='ingreso'?'i':'g_'}`}>{m.tipo}</span></div>
                <div className="movr"><span style={{fontSize:'12px',color:'var(--g400)'}}>📅 {new Date(m.fecha+'T12:00:00').toLocaleDateString('es-VE')}</span>{ce&&<div style={{display:'flex',gap:'5px'}}><button className="btn btn-s btn-sm btn-ic" onClick={()=>oE(m)}>✏️</button><button className="btn btn-d btn-sm btn-ic" onClick={()=>del(m.id)}>🗑️</button></div>}</div>
              </div>
            );})}
          </div>
        ):(
          <div className="card"><div className="tbl"><table><thead><tr><th>Fecha</th><th>Cuenta</th><th>Descripción</th><th>Tipo</th><th>Monto</th>{ce&&<th>Acc.</th>}</tr></thead><tbody>
            {filtered.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(m=>{const c=cuentas.find(x=>x.id===m.cuentaId);return(
              <tr key={m.id}><td style={{color:'var(--g600)',fontSize:'13px'}}>{new Date(m.fecha+'T12:00:00').toLocaleDateString('es-VE')}</td><td style={{fontWeight:'500'}}>{c?.nombre||'—'}</td><td style={{color:'var(--g600)'}}>{m.descripcion||'—'}</td><td><span className={`badge b${m.tipo==='ingreso'?'i':'g_'}`}>{m.tipo}</span></td><td className={m.tipo==='ingreso'?'ap':'an'}>{m.tipo==='ingreso'?'+':'-'}${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}</td>{ce&&<td><div style={{display:'flex',gap:'5px'}}><button className="btn btn-s btn-sm" onClick={()=>oE(m)}>✏️</button><button className="btn btn-d btn-sm" onClick={()=>del(m.id)}>🗑️</button></div></td>}</tr>
            );})}
          </tbody></table></div></div>
        )
      }
      {show&&<Modal title={eid?'Editar Movimiento':'Nuevo Movimiento'} onClose={()=>setShow(false)}>
        <FF label="Tipo"><div style={{display:'flex',gap:'8px'}}>{['ingreso','gasto'].map(t=><button key={t} className={`tab ${form.tipo===t?'act':''}`} onClick={()=>setForm(f=>({...f,tipo:t,cuentaId:''}))}>{t==='ingreso'?'↑ Ingreso':'↓ Gasto'}</button>)}</div></FF>
        <FF label="Cuenta"><select className="inp" value={form.cuentaId} onChange={e=>setForm(f=>({...f,cuentaId:e.target.value}))}><option value="">Seleccionar cuenta...</option>{cuentas.filter(c=>c.tipo===form.tipo).map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></FF>
        <FF label="Monto"><input className="inp" type="number" step="0.01" min="0" value={form.monto} onChange={e=>setForm(f=>({...f,monto:e.target.value}))} placeholder="0.00" inputMode="decimal"/></FF>
        <FF label="Fecha"><input className="inp" type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/></FF>
        <FF label="Descripción (opcional)"><input className="inp" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Descripción..."/></FF>
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'6px'}}>
          <button className="btn btn-s" onClick={()=>setShow(false)}>Cancelar</button>
          <button className="btn btn-n" onClick={save2}>{eid?'Actualizar':'Registrar'}</button>
        </div>
      </Modal>}
    </div>
  );
};

// ── CUENTAS ──
const Cuentas = ({ cuentas, setCuentas, notify }) => {
  const mb=useIsMobile(); const [show,setShow]=useState(false); const [form,setForm]=useState({nombre:'',tipo:'ingreso',descripcion:''}); const [eid,setEid]=useState(null); const [fil,setFil]=useState('todos');
  const oA=()=>{setEid(null);setForm({nombre:'',tipo:'ingreso',descripcion:''});setShow(true);};
  const oE=c=>{setEid(c.id);setForm({nombre:c.nombre,tipo:c.tipo,descripcion:c.descripcion});setShow(true);};
  const sv=()=>{if(!form.nombre.trim()){notify('Ingrese el nombre','error');return;}if(eid){setCuentas(prev=>prev.map(c=>c.id===eid?{...c,...form}:c));notify('Actualizada','success');}else{setCuentas(prev=>[...prev,{id:Date.now(),...form}]);notify('Creada','success');}setShow(false);};
  const dl=id=>{if(confirm('¿Eliminar?')){setCuentas(prev=>prev.filter(c=>c.id!==id));notify('Eliminada','success');}};
  const filtered=fil==='todos'?cuentas:cuentas.filter(c=>c.tipo===fil);
  const p=mb?'16px':'28px';
  return (
    <div className="fi" style={{padding:p,flex:1,overflow:'auto'}}>
      {!mb&&<div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'18px'}}><div><div className="ttl">Cuentas</div><div className="sub">Cuentas contables</div></div><button className="btn btn-n" onClick={oA}>+ Nueva</button></div>}
      {mb&&<button className="btn btn-n" onClick={oA} style={{width:'100%',marginBottom:'14px',padding:'13px'}}>+ Nueva Cuenta</button>}
      <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>{['todos','ingreso','gasto'].map(f=><button key={f} className={`tab ${fil===f?'act':''}`} onClick={()=>setFil(f)}>{f==='todos'?'Todas':f==='ingreso'?'Ingresos':'Gastos'}</button>)}</div>
      <div style={{display:'grid',gridTemplateColumns:mb?'1fr':'repeat(auto-fill,minmax(270px,1fr))',gap:'12px'}}>
        {filtered.map(c=>(
          <div key={c.id} className="card" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div><div style={{fontWeight:'600',fontSize:'14px',color:'var(--navy)',marginBottom:'4px'}}>{c.nombre}</div><span className={`badge b${c.tipo==='ingreso'?'i':'g_'}`}>{c.tipo}</span></div>
              <div style={{display:'flex',gap:'5px'}}><button className="btn btn-s btn-sm btn-ic" onClick={()=>oE(c)}>✏️</button><button className="btn btn-d btn-sm btn-ic" onClick={()=>dl(c.id)}>🗑️</button></div>
            </div>
            {c.descripcion&&<p style={{fontSize:'12px',color:'var(--g600)',lineHeight:1.5}}>{c.descripcion}</p>}
          </div>
        ))}
        {filtered.length===0&&<div className="es card" style={{gridColumn:'1/-1'}}><div className="icon">📋</div><p>Sin cuentas</p></div>}
      </div>
      {show&&<Modal title={eid?'Editar Cuenta':'Nueva Cuenta'} onClose={()=>setShow(false)}>
        <FF label="Nombre"><input className="inp" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Nombre de la cuenta"/></FF>
        <FF label="Tipo"><div style={{display:'flex',gap:'8px'}}>{['ingreso','gasto'].map(t=><button key={t} className={`tab ${form.tipo===t?'act':''}`} onClick={()=>setForm(f=>({...f,tipo:t}))}>{t==='ingreso'?'↑ Ingreso':'↓ Gasto'}</button>)}</div></FF>
        <FF label="Descripción"><input className="inp" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Descripción..."/></FF>
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'6px'}}><button className="btn btn-s" onClick={()=>setShow(false)}>Cancelar</button><button className="btn btn-n" onClick={sv}>{eid?'Actualizar':'Crear'}</button></div>
      </Modal>}
    </div>
  );
};

// ── REPORTES ──
const Reportes = ({ user, movimientos, cuentas, config, currentYear, currentMonth, setCurrentMonth, setCurrentYear }) => {
  const mb=useIsMobile();
  const mk=`${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;
  const mm=movimientos.filter(m=>m.periodo===mk);
  const ing=mm.filter(m=>m.tipo==='ingreso'); const gas=mm.filter(m=>m.tipo==='gasto');
  const ti=ing.reduce((s,m)=>s+m.monto,0); const tg=gas.reduce((s,m)=>s+m.monto,0); const bal=ti-tg;
  const ipc=cuentas.filter(c=>c.tipo==='ingreso').map(c=>({...c,movs:ing.filter(m=>m.cuentaId===c.id),total:ing.filter(m=>m.cuentaId===c.id).reduce((s,m)=>s+m.monto,0)})).filter(c=>c.total>0);
  const gpc=cuentas.filter(c=>c.tipo==='gasto').map(c=>({...c,movs:gas.filter(m=>m.cuentaId===c.id),total:gas.filter(m=>m.cuentaId===c.id).reduce((s,m)=>s+m.monto,0)})).filter(c=>c.total>0);
  const xls=()=>{
    const wb=XLSX.utils.book_new(); const fmt=n=>n.toFixed(2);
    const wd=[[config.nombreColegio],[`RIF: ${config.rif}`],[config.direccion],[`Tel: ${config.telefono}`],[],[`CUADRE MENSUAL - ${MESES[currentMonth].toUpperCase()} ${currentYear}`],[`Director: ${config.director}`],[],['INGRESOS'],['Cuenta','Descripción','Monto']];
    ipc.forEach(c=>c.movs.forEach(m=>wd.push([c.nombre,m.descripcion||'',fmt(m.monto)])));
    wd.push([],[`SUBTOTAL INGRESOS`,'',fmt(ti)],[],['GASTOS'],['Cuenta','Descripción','Monto']);
    gpc.forEach(c=>c.movs.forEach(m=>wd.push([c.nombre,m.descripcion||'',fmt(m.monto)])));
    wd.push([],[`SUBTOTAL GASTOS`,'',fmt(tg)],[],['BALANCE NETO','',fmt(bal)],[],[`Generado: ${new Date().toLocaleDateString('es-VE')}`]);
    const ws=XLSX.utils.aoa_to_sheet(wd);ws['!cols']=[{wch:30},{wch:40},{wch:15}];XLSX.utils.book_append_sheet(wb,ws,`${MESES[currentMonth]} ${currentYear}`);
    const det=[['FECHA','TIPO','CUENTA','DESCRIPCIÓN','MONTO']];mm.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).forEach(m=>{const c=cuentas.find(x=>x.id===m.cuentaId);det.push([m.fecha,m.tipo.toUpperCase(),c?.nombre||'',m.descripcion||'',fmt(m.monto)]);});
    const ws2=XLSX.utils.aoa_to_sheet(det);ws2['!cols']=[{wch:14},{wch:10},{wch:28},{wch:38},{wch:14}];XLSX.utils.book_append_sheet(wb,ws2,'Detalle');
    XLSX.writeFile(wb,`Cuadre_${config.nombreColegio.replace(/\s/g,'_')}_${MESES[currentMonth]}_${currentYear}.xlsx`);
  };
  const p=mb?'16px':'28px';
  return (
    <div className="fi" style={{padding:p,flex:1,overflow:'auto'}}>
      {!mb&&<div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'18px',flexWrap:'wrap',gap:'10px'}}><div><div className="ttl">Reportes</div><div className="sub">Cuadre mensual</div></div><div style={{display:'flex',gap:'8px'}}><button className="btn btn-s" onClick={()=>window.print()}>🖨️ Imprimir</button><button className="btn btn-n" onClick={xls}>📊 Excel</button></div></div>}
      {mb&&<div style={{display:'flex',gap:'8px',marginBottom:'14px'}}><button className="btn btn-s" onClick={()=>window.print()} style={{flex:1}}>🖨️ Imprimir</button><button className="btn btn-n" onClick={xls} style={{flex:1}}>📊 Excel</button></div>}
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px',overflowX:'auto',paddingBottom:'4px'}}>
        <select className="inp" value={currentYear} onChange={e=>setCurrentYear(parseInt(e.target.value))} style={{width:'auto',flexShrink:0,fontSize:'13px',padding:'7px 10px'}}>{[currentYear-1,currentYear,currentYear+1].map(y=><option key={y} value={y}>{y}</option>)}</select>
        {MESES.map((m,i)=>{const k=`${currentYear}-${String(i+1).padStart(2,'0')}`;const hd=movimientos.some(mv=>mv.periodo===k);return<button key={i} className={`mc ${i===currentMonth?'act':''} ${hd&&i!==currentMonth?'hd':''}`} onClick={()=>setCurrentMonth(i)}>{m.slice(0,3)}</button>;})}
      </div>
      <div style={{background:'white',borderRadius:'16px',padding:mb?'18px':'34px',boxShadow:'var(--sh)',border:'1px solid var(--g200)'}}>
        <div style={{textAlign:'center',marginBottom:'22px',paddingBottom:'18px',borderBottom:'2px solid var(--navy)'}}>
          <div style={{fontSize:'22px',marginBottom:'5px'}}>🏫</div>
          <h1 style={{fontFamily:'Playfair Display',fontSize:mb?'17px':'21px',color:'var(--navy)',marginBottom:'3px'}}>{config.nombreColegio}</h1>
          <p style={{fontSize:'12px',color:'var(--g600)'}}>{config.rif} · {config.direccion}</p>
          <p style={{fontSize:'12px',color:'var(--g600)'}}>{config.telefono} · {config.email}</p>
          <div style={{marginTop:'10px',display:'inline-block',background:'var(--navy)',color:'white',padding:'6px 16px',borderRadius:'20px',fontSize:'12px',fontWeight:'600'}}>CUADRE MENSUAL — {MESES[currentMonth].toUpperCase()} {currentYear}</div>
          <p style={{fontSize:'12px',color:'var(--g400)',marginTop:'5px'}}>Director(a): {config.director}</p>
        </div>
        {mm.length===0?<div className="es"><div className="icon">📄</div><p>Sin movimientos en este período</p></div>:(
          <>
            <div style={{marginBottom:'22px'}}>
              <h3 style={{fontSize:'13px',fontWeight:'700',color:'var(--green)',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid var(--gl)'}}>↑ INGRESOS</h3>
              {ipc.length===0?<p style={{color:'var(--g400)',fontSize:'13px'}}>Sin ingresos</p>:mb?(
                ipc.map(c=>c.movs.map(m=><div key={m.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--g100)'}}><div><div style={{fontSize:'13px',fontWeight:'500'}}>{c.nombre}</div><div style={{fontSize:'11px',color:'var(--g400)'}}>{m.descripcion||'—'}</div></div><span className="ap" style={{fontSize:'13px',flexShrink:0}}>+${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>))
              ):(
                <div className="tbl"><table><thead><tr><th>Cuenta</th><th>Descripción</th><th>Fecha</th><th style={{textAlign:'right'}}>Monto</th></tr></thead><tbody>{ipc.map(c=>c.movs.map(m=><tr key={m.id}><td>{c.nombre}</td><td style={{color:'var(--g600)'}}>{m.descripcion||'—'}</td><td style={{color:'var(--g600)'}}>{new Date(m.fecha+'T12:00:00').toLocaleDateString('es-VE')}</td><td style={{textAlign:'right'}} className="ap">${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}</td></tr>))}</tbody></table></div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',padding:'9px 0 0',borderTop:'2px solid var(--green)',marginTop:'4px'}}><span style={{fontWeight:'700',fontSize:'13px'}}>TOTAL INGRESOS</span><span className="ap" style={{fontWeight:'700',fontSize:'13px'}}>+${ti.toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>
            </div>
            <div style={{marginBottom:'22px'}}>
              <h3 style={{fontSize:'13px',fontWeight:'700',color:'var(--red)',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid var(--rl)'}}>↓ GASTOS</h3>
              {gpc.length===0?<p style={{color:'var(--g400)',fontSize:'13px'}}>Sin gastos</p>:mb?(
                gpc.map(c=>c.movs.map(m=><div key={m.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--g100)'}}><div><div style={{fontSize:'13px',fontWeight:'500'}}>{c.nombre}</div><div style={{fontSize:'11px',color:'var(--g400)'}}>{m.descripcion||'—'}</div></div><span className="an" style={{fontSize:'13px',flexShrink:0}}>-${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>))
              ):(
                <div className="tbl"><table><thead><tr><th>Cuenta</th><th>Descripción</th><th>Fecha</th><th style={{textAlign:'right'}}>Monto</th></tr></thead><tbody>{gpc.map(c=>c.movs.map(m=><tr key={m.id}><td>{c.nombre}</td><td style={{color:'var(--g600)'}}>{m.descripcion||'—'}</td><td style={{color:'var(--g600)'}}>{new Date(m.fecha+'T12:00:00').toLocaleDateString('es-VE')}</td><td style={{textAlign:'right'}} className="an">${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}</td></tr>))}</tbody></table></div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',padding:'9px 0 0',borderTop:'2px solid var(--red)',marginTop:'4px'}}><span style={{fontWeight:'700',fontSize:'13px'}}>TOTAL GASTOS</span><span className="an" style={{fontWeight:'700',fontSize:'13px'}}>-${tg.toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>
            </div>
            <div style={{background:bal>=0?'var(--gl)':'var(--rl)',borderRadius:'12px',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:'700',fontSize:mb?'14px':'16px',color:bal>=0?'var(--green)':'var(--red)',fontFamily:'Playfair Display'}}>BALANCE NETO</span>
              <span style={{fontWeight:'700',fontSize:mb?'17px':'21px',color:bal>=0?'var(--green)':'var(--red)',fontFamily:'Playfair Display'}}>{bal>=0?'+':''}${bal.toLocaleString('es-VE',{minimumFractionDigits:2})}</span>
            </div>
          </>
        )}
        <div style={{marginTop:'16px',paddingTop:'10px',borderTop:'1px solid var(--g200)',display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:'4px',fontSize:'11px',color:'var(--g400)'}}><span>Generado: {new Date().toLocaleDateString('es-VE',{year:'numeric',month:'long',day:'numeric'})}</span><span>{config.nombreColegio}</span></div>
      </div>
    </div>
  );
};

// ── CONFIGURACIÓN ──
const Configuracion = ({ config, setConfig, notify }) => {
  const mb=useIsMobile(); const [form,setForm]=useState({...config});
  const p=mb?'16px':'28px';
  return (
    <div className="fi" style={{padding:p,flex:1,overflow:'auto'}}>
      {!mb&&<div style={{marginBottom:'22px'}}><div className="ttl">Configuración</div><div className="sub">Datos del colegio</div></div>}
      <div style={{maxWidth:'600px'}}>
        <div className="card" style={{marginBottom:'14px'}}>
          <h3 style={{fontSize:'14px',fontWeight:'600',color:'var(--navy)',marginBottom:'16px'}}>🏫 Información del Colegio</h3>
          <div style={{display:'grid',gridTemplateColumns:mb?'1fr':'1fr 1fr',gap:'13px'}}>
            <FF label="Nombre del Colegio"><input className="inp" value={form.nombreColegio} onChange={e=>setForm(f=>({...f,nombreColegio:e.target.value}))}/></FF>
            <FF label="RIF"><input className="inp" value={form.rif} onChange={e=>setForm(f=>({...f,rif:e.target.value}))}/></FF>
            <FF label="Teléfono"><input className="inp" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} inputMode="tel"/></FF>
            <FF label="Email"><input className="inp" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} inputMode="email"/></FF>
          </div>
          <FF label="Dirección"><input className="inp" value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))}/></FF>
          <FF label="Director(a)"><input className="inp" value={form.director} onChange={e=>setForm(f=>({...f,director:e.target.value}))}/></FF>
        </div>
        <button className="btn btn-n" onClick={()=>{setConfig(form);notify('Configuración guardada','success');}} style={{width:'100%',justifyContent:'center',padding:'13px'}}>💾 Guardar Configuración</button>
      </div>
    </div>
  );
};

// ── USUARIOS ──
const Usuarios = ({ users, setUsers, currentUser, notify }) => {
  const mb=useIsMobile(); const [show,setShow]=useState(false); const [form,setForm]=useState({username:'',password:'',name:'',role:'asistente'}); const [eid,setEid]=useState(null);
  const oA=()=>{setEid(null);setForm({username:'',password:'',name:'',role:'asistente'});setShow(true);};
  const oE=u=>{setEid(u.id);setForm({username:u.username,password:u.password,name:u.name,role:u.role});setShow(true);};
  const sv=()=>{if(!form.username||!form.password||!form.name){notify('Complete todos los campos','error');return;}if(eid){setUsers(prev=>prev.map(u=>u.id===eid?{...u,...form}:u));notify('Actualizado','success');}else{if(users.find(u=>u.username===form.username)){notify('Usuario ya existe','error');return;}setUsers(prev=>[...prev,{id:Date.now(),...form}]);notify('Creado','success');}setShow(false);};
  const dl=id=>{if(id===currentUser.id){notify('No puedes eliminarte','error');return;}if(confirm('¿Eliminar?')){setUsers(prev=>prev.filter(u=>u.id!==id));notify('Eliminado','success');}};
  const rl={admin:'Admin',asistente:'Asistente',empleado:'Empleado'};
  const p=mb?'16px':'28px';
  return (
    <div className="fi" style={{padding:p,flex:1,overflow:'auto'}}>
      {!mb&&<div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'18px'}}><div><div className="ttl">Usuarios</div><div className="sub">Gestión de accesos y roles</div></div><button className="btn btn-n" onClick={oA}>+ Nuevo</button></div>}
      {mb&&<button className="btn btn-n" onClick={oA} style={{width:'100%',marginBottom:'14px',padding:'13px'}}>+ Nuevo Usuario</button>}
      {mb?(
        <div>{users.map(u=>(
          <div key={u.id} className="card" style={{marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',flex:1,overflow:'hidden'}}>
              <div style={{width:'36px',height:'36px',background:'var(--navy)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'14px',fontWeight:'600',flexShrink:0}}>{u.name.charAt(0)}</div>
              <div style={{overflow:'hidden'}}>
                <div style={{fontWeight:'500',fontSize:'14px',color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:'var(--g400)',fontFamily:'monospace'}}>@{u.username}</span>
                  <span className={`badge b${u.role==='admin'?'a':u.role==='asistente'?'ass':'e'}`} style={{fontSize:'11px'}}>{rl[u.role]}</span>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:'5px',flexShrink:0}}>
              <button className="btn btn-s btn-sm btn-ic" onClick={()=>oE(u)}>✏️</button>
              {u.id!==currentUser.id&&<button className="btn btn-d btn-sm btn-ic" onClick={()=>dl(u.id)}>🗑️</button>}
            </div>
          </div>
        ))}</div>
      ):(
        <div className="card"><div className="tbl"><table><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Permisos</th><th>Acc.</th></tr></thead><tbody>
          {users.map(u=>(
            <tr key={u.id}><td><span style={{fontFamily:'monospace',background:'var(--g100)',padding:'2px 8px',borderRadius:'4px',fontSize:'13px'}}>{u.username}</span></td><td style={{fontWeight:'500'}}>{u.name}</td><td><span className={`badge b${u.role==='admin'?'a':u.role==='asistente'?'ass':'e'}`}>{rl[u.role]}</span></td><td style={{fontSize:'12px',color:'var(--g600)'}}>{u.role==='admin'?'Acceso completo':u.role==='asistente'?'Ingresos y gastos':'Solo reportes'}</td><td><div style={{display:'flex',gap:'5px'}}><button className="btn btn-s btn-sm" onClick={()=>oE(u)}>✏️</button>{u.id!==currentUser.id&&<button className="btn btn-d btn-sm" onClick={()=>dl(u.id)}>🗑️</button>}</div></td></tr>
          ))}
        </tbody></table></div></div>
      )}
      {show&&<Modal title={eid?'Editar Usuario':'Nuevo Usuario'} onClose={()=>setShow(false)}>
        <FF label="Nombre Completo"><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nombre"/></FF>
        <FF label="Usuario"><input className="inp" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="usuario" disabled={!!eid} style={eid?{opacity:.6}:{}}/></FF>
        <FF label="Contraseña"><input className="inp" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Contraseña"/></FF>
        <FF label="Rol"><select className="inp" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}><option value="admin">Administrador</option><option value="asistente">Asistente</option><option value="empleado">Empleado</option></select></FF>
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'6px'}}><button className="btn btn-s" onClick={()=>setShow(false)}>Cancelar</button><button className="btn btn-n" onClick={sv}>{eid?'Actualizar':'Crear'}</button></div>
      </Modal>}
    </div>
  );
};

// ── APP ──
export default function App() {
  const [user,setUser]=useState(null); const [ld,setLd]=useState(true); const [page,setPage]=useState('dashboard');
  const [notif,setNotif]=useState(null); const [drawer,setDrawer]=useState(false);
  const [movimientos,setMov]=useState(()=>load('sf_mov',[]));
  const [cuentas,setCuent]=useState(()=>load('sf_cuentas',INITIAL_CUENTAS));
  const [config,setConf]=useState(()=>load('sf_config',INITIAL_CONFIG));
  const [users,setUsrs]=useState(()=>load('sf_users',INITIAL_USERS));
  const now=new Date(); const [cm,setCm]=useState(now.getMonth()); const [cy,setCy]=useState(now.getFullYear());
  const setMovimientos=fn=>{setMov(p=>{const n=typeof fn==='function'?fn(p):fn;save('sf_mov',n);return n;});};
  const setCuentas=fn=>{setCuent(p=>{const n=typeof fn==='function'?fn(p):fn;save('sf_cuentas',n);return n;});};
  const setConfig=v=>{setConf(v);save('sf_config',v);};
  const setUsers=fn=>{setUsrs(p=>{const n=typeof fn==='function'?fn(p):fn;save('sf_users',n);return n;});};
  const notify=useCallback((msg,type='success')=>setNotif({msg,type}),[]);
  useEffect(()=>{setTimeout(()=>setLd(false),1000);},[]);
  if(ld)return(<div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'18px'}}><G/><div style={{fontSize:'42px',animation:'pulse 1.5s ease infinite'}}>🏫</div><div style={{color:'white',fontFamily:'Playfair Display',fontSize:'19px'}}>SchoolFinance</div><div className="sp" style={{borderColor:'rgba(255,255,255,.2)',borderTopColor:'var(--gold)'}}/></div>);
  if(!user)return<><G/><Login onLogin={u=>{setUser(u);setPage('dashboard');}}/></>;
  const props={user,movimientos,setMovimientos,cuentas,setCuentas,config,setConfig,users,setUsers,currentMonth:cm,setCurrentMonth:setCm,currentYear:cy,setCurrentYear:setCy,notify};
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'var(--cream)'}}>
      <G/>
      {notif&&<Notif msg={notif.msg} type={notif.type} onClose={()=>setNotif(null)}/>}
      <Sidebar user={user} page={page} setPage={setPage} onLogout={()=>setUser(null)}/>
      {drawer&&<Drawer user={user} page={page} setPage={setPage} onClose={()=>setDrawer(false)} onLogout={()=>{setUser(null);setDrawer(false);}}/>}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        <TopBar page={page} onMenu={()=>setDrawer(true)}/>
        <main className="mc-pb" style={{flex:1,overflowY:'auto',overflowX:'hidden'}}>
          {page==='dashboard'     &&<Dashboard     {...props} setPage={setPage}/>}
          {page==='movimientos'   &&<Movimientos   {...props}/>}
          {page==='cuentas'       &&<Cuentas       {...props}/>}
          {page==='reportes'      &&<Reportes      {...props}/>}
          {page==='configuracion' &&<Configuracion {...props}/>}
          {page==='usuarios'      &&<Usuarios      {...props} currentUser={user}/>}
        </main>
      </div>
      <BNav user={user} page={page} setPage={setPage}/>
    </div>
  );
}
