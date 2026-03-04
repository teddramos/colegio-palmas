import { useState, useEffect, useRef } from "react";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";

// ─── DATOS INICIALES ────────────────────────────────────────────────────────
const INITIAL_USERS = [
  { id: 1, username: "admin", password: "admin123", role: "admin", name: "Administrador" },
  { id: 2, username: "asistente", password: "asist123", role: "asistente", name: "María López" },
  { id: 3, username: "empleado", password: "empl123", role: "empleado", name: "Carlos Ruiz" },
];

const INITIAL_CONFIG = {
  nombreColegio: "Colegio San José",
  rif: "J-12345678-9",
  direccion: "Av. Principal #123, Ciudad",
  telefono: "0212-5551234",
  email: "admin@colegiosanjose.edu",
  director: "Prof. Ana Martínez",
  logo: null,
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

// ─── STORAGE HELPERS ────────────────────────────────────────────────────────
const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── ESTILOS GLOBALES ────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --navy: #0f1f3d;
      --navy-light: #1a3060;
      --gold: #c8a84b;
      --gold-light: #e8c97a;
      --cream: #f7f4ee;
      --white: #ffffff;
      --gray-100: #f0ede8;
      --gray-200: #e0dbd2;
      --gray-400: #a09880;
      --gray-600: #6b6358;
      --green: #2e7d52;
      --green-light: #e8f5ee;
      --red: #b03a2e;
      --red-light: #fdf0ee;
      --shadow-sm: 0 2px 8px rgba(15,31,61,0.08);
      --shadow-md: 0 8px 24px rgba(15,31,61,0.12);
      --shadow-lg: 0 16px 48px rgba(15,31,61,0.18);
    }

    body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--navy); }

    @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeOut { from { opacity:1; } to { opacity:0; } }
    @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }

    .fade-in { animation: fadeIn 0.4s ease forwards; }
    .slide-in { animation: slideIn 0.3s ease forwards; }

    .btn {
      display:inline-flex; align-items:center; gap:8px; padding:10px 20px;
      border:none; border-radius:8px; font-family:'DM Sans',sans-serif;
      font-size:14px; font-weight:500; cursor:pointer; transition:all 0.2s ease;
      text-decoration:none;
    }
    .btn-primary { background:var(--gold); color:var(--navy); }
    .btn-primary:hover { background:var(--gold-light); transform:translateY(-1px); box-shadow:var(--shadow-sm); }
    .btn-secondary { background:transparent; color:var(--navy); border:1.5px solid var(--gray-200); }
    .btn-secondary:hover { background:var(--gray-100); }
    .btn-danger { background:var(--red-light); color:var(--red); border:1px solid #f5c6c2; }
    .btn-danger:hover { background:#fde8e6; }
    .btn-navy { background:var(--navy); color:white; }
    .btn-navy:hover { background:var(--navy-light); transform:translateY(-1px); }
    .btn-sm { padding:6px 14px; font-size:13px; }
    .btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

    .card {
      background:white; border-radius:16px; padding:24px;
      box-shadow:var(--shadow-sm); border:1px solid var(--gray-200);
    }

    .input-field {
      width:100%; padding:10px 14px; border:1.5px solid var(--gray-200);
      border-radius:8px; font-family:'DM Sans',sans-serif; font-size:14px;
      color:var(--navy); background:white; transition:border 0.2s;
      outline:none;
    }
    .input-field:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(200,168,75,0.15); }
    .input-field::placeholder { color:var(--gray-400); }

    select.input-field { cursor:pointer; }

    .label { display:block; font-size:13px; font-weight:500; color:var(--gray-600); margin-bottom:6px; }

    .badge {
      display:inline-flex; align-items:center; gap:4px; padding:3px 10px;
      border-radius:20px; font-size:12px; font-weight:500;
    }
    .badge-ingreso { background:var(--green-light); color:var(--green); }
    .badge-gasto { background:var(--red-light); color:var(--red); }
    .badge-admin { background:#e8ecff; color:#3b4fd8; }
    .badge-asistente { background:#fff3e8; color:#c47a2b; }
    .badge-empleado { background:#f0f0f0; color:#555; }

    table { width:100%; border-collapse:collapse; }
    th { padding:10px 16px; text-align:left; font-size:12px; font-weight:600; color:var(--gray-600); text-transform:uppercase; letter-spacing:0.05em; border-bottom:2px solid var(--gray-200); }
    td { padding:12px 16px; font-size:14px; border-bottom:1px solid var(--gray-100); vertical-align:middle; }
    tr:hover td { background:var(--gray-100); }

    .modal-overlay {
      position:fixed; inset:0; background:rgba(15,31,61,0.5); z-index:1000;
      display:flex; align-items:center; justify-content:center; padding:20px;
      animation: fadeIn 0.2s ease;
      backdrop-filter:blur(4px);
    }
    .modal {
      background:white; border-radius:20px; padding:32px; width:100%;
      max-width:520px; max-height:90vh; overflow-y:auto;
      box-shadow:var(--shadow-lg); animation:fadeIn 0.3s ease;
    }

    .sidebar-link {
      display:flex; align-items:center; gap:12px; padding:10px 16px;
      border-radius:10px; color:var(--gray-400); font-size:14px; font-weight:500;
      cursor:pointer; transition:all 0.2s; border:none; background:transparent;
      width:100%; text-align:left;
    }
    .sidebar-link:hover { background:rgba(200,168,75,0.1); color:var(--navy); }
    .sidebar-link.active { background:rgba(200,168,75,0.15); color:var(--navy); font-weight:600; }
    .sidebar-link .icon { width:20px; text-align:center; }

    .stat-card {
      background:white; border-radius:16px; padding:20px 24px;
      border:1px solid var(--gray-200); box-shadow:var(--shadow-sm);
      transition:transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }

    .month-chip {
      padding:8px 16px; border-radius:30px; font-size:13px; font-weight:500;
      cursor:pointer; border:1.5px solid var(--gray-200); background:white;
      transition:all 0.2s; color:var(--gray-600);
    }
    .month-chip:hover { border-color:var(--gold); color:var(--navy); }
    .month-chip.active { background:var(--navy); color:white; border-color:var(--navy); }
    .month-chip.has-data { border-color:var(--gold); color:var(--navy); }

    .tab { padding:8px 20px; border-radius:8px; font-size:14px; font-weight:500; cursor:pointer; border:none; background:transparent; color:var(--gray-600); transition:all 0.2s; }
    .tab.active { background:var(--navy); color:white; }
    .tab:hover:not(.active) { background:var(--gray-100); color:var(--navy); }

    ::-webkit-scrollbar { width:6px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:var(--gray-200); border-radius:3px; }

    .spinner { width:40px; height:40px; border:3px solid var(--gray-200); border-top-color:var(--gold); border-radius:50%; animation:spin 0.8s linear infinite; }

    .empty-state { text-align:center; padding:48px 24px; color:var(--gray-400); }
    .empty-state .icon { font-size:48px; margin-bottom:12px; opacity:0.5; }

    .divider { height:1px; background:var(--gray-200); margin:16px 0; }

    .notification {
      position:fixed; top:24px; right:24px; z-index:2000;
      padding:14px 20px; border-radius:12px; font-size:14px; font-weight:500;
      box-shadow:var(--shadow-lg); animation:slideIn 0.3s ease;
      display:flex; align-items:center; gap:10px; max-width:340px;
    }
    .notification-success { background:var(--green); color:white; }
    .notification-error { background:var(--red); color:white; }

    .amount-positive { color:var(--green); font-weight:600; }
    .amount-negative { color:var(--red); font-weight:600; }

    .section-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:600; color:var(--navy); }
    .section-subtitle { font-size:14px; color:var(--gray-400); margin-top:4px; }

    .progress-bar { height:6px; background:var(--gray-200); border-radius:3px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:3px; transition:width 0.5s ease; }

    @media (max-width:768px) {
      .sidebar { transform:translateX(-100%); position:fixed; z-index:500; }
      .sidebar.open { transform:translateX(0); }
    }
  `}</style>
);

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────
const Spinner = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'48px'}}>
    <div className="spinner"/>
  </div>
);

const Notification = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`notification notification-${type}`}>
      <span>{type==='success'?'✓':'✗'}</span>
      <span>{msg}</span>
      <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',color:'inherit',cursor:'pointer',fontSize:'18px',lineHeight:1}}>×</button>
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
    <div className="modal">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
        <h2 style={{fontFamily:'Playfair Display',fontSize:'20px',color:'var(--navy)'}}>{title}</h2>
        <button onClick={onClose} style={{background:'var(--gray-100)',border:'none',width:'32px',height:'32px',borderRadius:'50%',cursor:'pointer',fontSize:'18px',color:'var(--gray-600)',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const FormField = ({ label, children }) => (
  <div style={{marginBottom:'16px'}}>
    <label className="label">{label}</label>
    {children}
  </div>
);

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const users = load('sf_users', INITIAL_USERS);

  const handleLogin = () => {
    setErr('');
    setLoading(true);
    setTimeout(() => {
      const found = users.find(x => x.username===u && x.password===p);
      if (found) onLogin(found);
      else { setErr('Usuario o contraseña incorrectos'); setLoading(false); }
    }, 800);
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        {[...Array(6)].map((_,i) => (
          <div key={i} style={{position:'absolute',borderRadius:'50%',background:`rgba(200,168,75,${0.03+i*0.01})`,width:`${200+i*150}px`,height:`${200+i*150}px`,top:`${-50+i*80}px`,left:`${-80+i*120}px`}}/>
        ))}
      </div>
      <div className="fade-in" style={{width:'100%',maxWidth:'420px',position:'relative'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{width:'72px',height:'72px',background:'var(--gold)',borderRadius:'20px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'32px'}}>🏫</div>
          <h1 style={{fontFamily:'Playfair Display',color:'white',fontSize:'28px',marginBottom:'6px'}}>SchoolFinance</h1>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:'14px'}}>Sistema de Gestión Financiera Escolar</p>
        </div>
        <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(20px)',borderRadius:'20px',padding:'32px',border:'1px solid rgba(255,255,255,0.1)'}}>
          {err && (
            <div style={{background:'rgba(176,58,46,0.2)',border:'1px solid rgba(176,58,46,0.4)',color:'#ff8a80',padding:'12px 16px',borderRadius:'8px',fontSize:'13px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
              ⚠️ {err}
            </div>
          )}
          <FormField label={<span style={{color:'rgba(255,255,255,0.6)'}}>Usuario</span>}>
            <input className="input-field" value={u} onChange={e=>setU(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()}
              placeholder="Ingrese su usuario"
              style={{background:'rgba(255,255,255,0.08)',border:'1.5px solid rgba(255,255,255,0.15)',color:'white'}}
            />
          </FormField>
          <FormField label={<span style={{color:'rgba(255,255,255,0.6)'}}>Contraseña</span>}>
            <input className="input-field" type="password" value={p} onChange={e=>setP(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()}
              placeholder="Ingrese su contraseña"
              style={{background:'rgba(255,255,255,0.08)',border:'1.5px solid rgba(255,255,255,0.15)',color:'white'}}
            />
          </FormField>
          <button className="btn btn-primary" onClick={handleLogin} disabled={loading} style={{width:'100%',justifyContent:'center',padding:'12px',fontSize:'15px',marginTop:'8px'}}>
            {loading ? <><div style={{width:'18px',height:'18px',border:'2px solid var(--navy)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.6s linear infinite'}}/> Ingresando...</> : '→ Ingresar'}
          </button>
          <div style={{marginTop:'20px',padding:'16px',background:'rgba(255,255,255,0.04)',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>
            <strong style={{color:'rgba(255,255,255,0.6)'}}>Accesos demo:</strong><br/>
            admin / admin123 · asistente / asist123 · empleado / empl123
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({ user, page, setPage, onLogout }) => {
  const links = [
    { id:'dashboard', label:'Dashboard', icon:'📊', roles:['admin','asistente','empleado'] },
    { id:'movimientos', label:'Movimientos', icon:'💰', roles:['admin','asistente'] },
    { id:'cuentas', label:'Cuentas', icon:'📋', roles:['admin'] },
    { id:'reportes', label:'Reportes', icon:'📄', roles:['admin','asistente','empleado'] },
    { id:'configuracion', label:'Configuración', icon:'⚙️', roles:['admin'] },
    { id:'usuarios', label:'Usuarios', icon:'👥', roles:['admin'] },
  ];

  return (
    <div style={{width:'240px',background:'white',height:'100vh',display:'flex',flexDirection:'column',borderRight:'1px solid var(--gray-200)',padding:'24px 16px',position:'sticky',top:0,flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'32px',padding:'0 8px'}}>
        <div style={{width:'36px',height:'36px',background:'var(--navy)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>🏫</div>
        <div>
          <div style={{fontFamily:'Playfair Display',fontSize:'14px',fontWeight:'700',color:'var(--navy)',lineHeight:1.2}}>SchoolFinance</div>
          <div style={{fontSize:'11px',color:'var(--gray-400)'}}>v1.0</div>
        </div>
      </div>
      <nav style={{flex:1}}>
        {links.filter(l=>l.roles.includes(user.role)).map(l => (
          <button key={l.id} className={`sidebar-link ${page===l.id?'active':''}`} onClick={()=>setPage(l.id)}>
            <span className="icon">{l.icon}</span>
            {l.label}
          </button>
        ))}
      </nav>
      <div style={{borderTop:'1px solid var(--gray-200)',paddingTop:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px',borderRadius:'10px',background:'var(--gray-100)',marginBottom:'8px'}}>
          <div style={{width:'32px',height:'32px',background:'var(--navy)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'13px',fontWeight:'600',flexShrink:0}}>
            {user.name.charAt(0)}
          </div>
          <div style={{overflow:'hidden'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
            <span className={`badge badge-${user.role}`} style={{fontSize:'11px',padding:'1px 7px'}}>{user.role}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{width:'100%',justifyContent:'center'}}>
          ← Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = ({ movimientos, cuentas, currentYear, currentMonth, setPage }) => {
  const monthKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;
  const movMes = movimientos.filter(m => m.periodo === monthKey);
  const totalIngresos = movMes.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0);
  const totalGastos = movMes.filter(m=>m.tipo==='gasto').reduce((s,m)=>s+m.monto,0);
  const balance = totalIngresos - totalGastos;

  const allMonths = [...new Set(movimientos.map(m=>m.periodo))].sort().slice(-6);
  const chartData = allMonths.map(p => {
    const ms = movimientos.filter(m=>m.periodo===p);
    return {
      label: p.split('-')[1] + '/' + p.split('-')[0].slice(2),
      ing: ms.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0),
      gas: ms.filter(m=>m.tipo==='gasto').reduce((s,m)=>s+m.monto,0),
    };
  });

  const maxVal = Math.max(...chartData.map(d=>Math.max(d.ing,d.gas)), 1);

  const cuentasResumen = cuentas.map(c => {
    const total = movMes.filter(m=>m.cuentaId===c.id).reduce((s,m)=>s+m.monto,0);
    return {...c, total};
  }).filter(c=>c.total>0).sort((a,b)=>b.total-a.total).slice(0,5);

  return (
    <div className="fade-in" style={{padding:'32px',flex:1,overflow:'auto'}}>
      <div style={{marginBottom:'28px'}}>
        <div className="section-title">Dashboard</div>
        <div className="section-subtitle">{MESES[currentMonth]} {currentYear} · Resumen financiero</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px',marginBottom:'28px'}}>
        {[
          {label:'Ingresos del Mes',value:totalIngresos,icon:'↑',color:'var(--green)',bg:'var(--green-light)'},
          {label:'Gastos del Mes',value:totalGastos,icon:'↓',color:'var(--red)',bg:'var(--red-light)'},
          {label:'Balance',value:balance,icon:'⚖',color:balance>=0?'var(--green)':'var(--red)',bg:balance>=0?'var(--green-light)':'var(--red-light)'},
          {label:'Movimientos',value:movMes.length,icon:'#',color:'var(--navy)',bg:'var(--gray-100)',isCount:true},
        ].map((s,i) => (
          <div key={i} className="stat-card fade-in" style={{animationDelay:`${i*0.1}s`}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
              <span style={{fontSize:'12px',fontWeight:'500',color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</span>
              <div style={{width:'32px',height:'32px',background:s.bg,borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:s.color,fontSize:'16px',fontWeight:'700'}}>{s.icon}</div>
            </div>
            <div style={{fontSize:'24px',fontWeight:'700',color:s.isCount?'var(--navy)':s.color}}>
              {s.isCount ? s.value : `$${s.value.toLocaleString('es-VE',{minimumFractionDigits:2})}`}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'28px'}}>
        <div className="card">
          <h3 style={{fontSize:'15px',fontWeight:'600',marginBottom:'20px',color:'var(--navy)'}}>📈 Tendencia Últimos 6 Meses</h3>
          {chartData.length === 0 ? (
            <div className="empty-state"><div className="icon">📊</div><p>Sin datos aún</p></div>
          ) : (
            <div style={{display:'flex',alignItems:'flex-end',gap:'12px',height:'140px',padding:'0 4px'}}>
              {chartData.map((d,i) => (
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',height:'100%',justifyContent:'flex-end'}}>
                  <div style={{width:'100%',display:'flex',gap:'2px',alignItems:'flex-end',height:'120px'}}>
                    <div style={{flex:1,background:'var(--green-light)',borderRadius:'4px 4px 0 0',height:`${(d.ing/maxVal)*100}%`,minHeight:'4px',position:'relative',transition:'height 0.5s ease'}}>
                      <div style={{position:'absolute',top:'-18px',left:'50%',transform:'translateX(-50%)',fontSize:'9px',color:'var(--green)',fontWeight:'600',whiteSpace:'nowrap'}}>{d.ing>0?`$${(d.ing/1000).toFixed(0)}k`:''}</div>
                    </div>
                    <div style={{flex:1,background:'var(--red-light)',borderRadius:'4px 4px 0 0',height:`${(d.gas/maxVal)*100}%`,minHeight:'4px',transition:'height 0.5s ease'}}/>
                  </div>
                  <span style={{fontSize:'10px',color:'var(--gray-400)',fontWeight:'500'}}>{d.label}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',gap:'16px',marginTop:'12px',paddingTop:'12px',borderTop:'1px solid var(--gray-100)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'var(--gray-600)'}}><div style={{width:'10px',height:'10px',background:'var(--green-light)',border:'1px solid var(--green)',borderRadius:'2px'}}/> Ingresos</div>
            <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'var(--gray-600)'}}><div style={{width:'10px',height:'10px',background:'var(--red-light)',border:'1px solid var(--red)',borderRadius:'2px'}}/> Gastos</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{fontSize:'15px',fontWeight:'600',marginBottom:'16px',color:'var(--navy)'}}>📋 Top Cuentas del Mes</h3>
          {cuentasResumen.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>Sin movimientos este mes</p></div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {cuentasResumen.map(c => (
                <div key={c.id}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                    <span style={{fontSize:'13px',fontWeight:'500',color:'var(--navy)'}}>{c.nombre}</span>
                    <span style={{fontSize:'13px',fontWeight:'600',color:c.tipo==='ingreso'?'var(--green)':'var(--red)'}}>
                      {c.tipo==='ingreso'?'+':'-'}${c.total.toLocaleString('es-VE',{minimumFractionDigits:2})}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width:`${(c.total/(cuentasResumen[0]?.total||1))*100}%`,background:c.tipo==='ingreso'?'var(--green)':'var(--red)'}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(135deg,var(--navy),var(--navy-light))'}}>
        <div>
          <div style={{color:'rgba(255,255,255,0.7)',fontSize:'13px',marginBottom:'4px'}}>Balance {MESES[currentMonth]} {currentYear}</div>
          <div style={{color:balance>=0?'var(--gold-light)':'#ff8a80',fontSize:'32px',fontWeight:'700',fontFamily:'Playfair Display'}}>
            {balance>=0?'+':''}{balance.toLocaleString('es-VE',{style:'currency',currency:'USD',minimumFractionDigits:2})}
          </div>
        </div>
        <button className="btn btn-primary" onClick={()=>setPage('reportes')} style={{flexShrink:0}}>
          Ver Reporte →
        </button>
      </div>
    </div>
  );
};

// ─── MOVIMIENTOS ─────────────────────────────────────────────────────────────
const Movimientos = ({ user, movimientos, setMovimientos, cuentas, currentYear, currentMonth, setCurrentMonth, setCurrentYear, notify }) => {
  const canEdit = ['admin','asistente'].includes(user.role);
  const isAdmin = user.role === 'admin';
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({tipo:'ingreso',cuentaId:'',monto:'',descripcion:'',fecha:new Date().toISOString().split('T')[0]});
  const [filter, setFilter] = useState('todos');
  const [editId, setEditId] = useState(null);

  const monthKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;
  const movMes = movimientos.filter(m => m.periodo === monthKey);
  const filtered = filter==='todos' ? movMes : movMes.filter(m=>m.tipo===filter);

  const openAdd = () => { setEditId(null); setForm({tipo:'ingreso',cuentaId:'',monto:'',descripcion:'',fecha:new Date().toISOString().split('T')[0]}); setShowModal(true); };
  const openEdit = (m) => { setEditId(m.id); setForm({tipo:m.tipo,cuentaId:m.cuentaId,monto:m.monto,descripcion:m.descripcion,fecha:m.fecha}); setShowModal(true); };

  const handleSave = () => {
    if(!form.cuentaId||!form.monto||!form.fecha) { notify('Complete todos los campos','error'); return; }
    const monto = parseFloat(form.monto);
    if(isNaN(monto)||monto<=0) { notify('Monto inválido','error'); return; }
    if(editId) {
      setMovimientos(prev => prev.map(m => m.id===editId ? {...m,...form,monto,cuentaId:parseInt(form.cuentaId)} : m));
      notify('Movimiento actualizado','success');
    } else {
      const nuevo = { id:Date.now(), ...form, monto, cuentaId:parseInt(form.cuentaId), periodo:monthKey, usuario:user.name };
      setMovimientos(prev=>[...prev,nuevo]);
      notify('Movimiento registrado','success');
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if(confirm('¿Eliminar este movimiento?')) {
      setMovimientos(prev=>prev.filter(m=>m.id!==id));
      notify('Movimiento eliminado','success');
    }
  };

  const totalIngresos = movMes.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0);
  const totalGastos = movMes.filter(m=>m.tipo==='gasto').reduce((s,m)=>s+m.monto,0);

  const years = [currentYear-1, currentYear, currentYear+1];

  return (
    <div className="fade-in" style={{padding:'32px',flex:1,overflow:'auto'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <div className="section-title">Movimientos</div>
          <div className="section-subtitle">Registro de ingresos y gastos</div>
        </div>
        {canEdit && <button className="btn btn-navy" onClick={openAdd}>+ Nuevo Movimiento</button>}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
        <select className="input-field" value={currentYear} onChange={e=>setCurrentYear(parseInt(e.target.value))} style={{width:'auto',paddingRight:'32px'}} disabled={!isAdmin&&false}>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {MESES.map((m,i) => {
            const key = `${currentYear}-${String(i+1).padStart(2,'0')}`;
            const hasDat = movimientos.some(mv=>mv.periodo===key);
            return (
              <button key={i} className={`month-chip ${i===currentMonth?'active':''} ${hasDat&&i!==currentMonth?'has-data':''}`}
                onClick={()=>setCurrentMonth(i)}>{m.slice(0,3)}</button>
            );
          })}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'20px'}}>
        <div className="stat-card"><div style={{fontSize:'12px',color:'var(--gray-400)',marginBottom:'6px'}}>INGRESOS</div><div style={{fontSize:'20px',fontWeight:'700',color:'var(--green)'}}>+${totalIngresos.toLocaleString('es-VE',{minimumFractionDigits:2})}</div></div>
        <div className="stat-card"><div style={{fontSize:'12px',color:'var(--gray-400)',marginBottom:'6px'}}>GASTOS</div><div style={{fontSize:'20px',fontWeight:'700',color:'var(--red)'}}>-${totalGastos.toLocaleString('es-VE',{minimumFractionDigits:2})}</div></div>
        <div className="stat-card"><div style={{fontSize:'12px',color:'var(--gray-400)',marginBottom:'6px'}}>BALANCE</div><div style={{fontSize:'20px',fontWeight:'700',color:(totalIngresos-totalGastos)>=0?'var(--green)':'var(--red)'}}>${(totalIngresos-totalGastos).toLocaleString('es-VE',{minimumFractionDigits:2})}</div></div>
      </div>

      <div className="card">
        <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
          {['todos','ingreso','gasto'].map(f=>(
            <button key={f} className={`tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{f==='todos'?'Todos':f==='ingreso'?'Ingresos':'Gastos'}</button>
          ))}
          <span style={{marginLeft:'auto',fontSize:'13px',color:'var(--gray-400)',alignSelf:'center'}}>{filtered.length} registros</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">💸</div><p>No hay movimientos{filter!=='todos'?` de ${filter}s`:''} en {MESES[currentMonth]} {currentYear}</p></div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr><th>Fecha</th><th>Cuenta</th><th>Descripción</th><th>Tipo</th><th>Monto</th>{canEdit&&<th>Acciones</th>}</tr></thead>
              <tbody>
                {filtered.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map(m => {
                  const cuenta = cuentas.find(c=>c.id===m.cuentaId);
                  return (
                    <tr key={m.id}>
                      <td style={{color:'var(--gray-600)',fontSize:'13px'}}>{new Date(m.fecha+'T12:00:00').toLocaleDateString('es-VE')}</td>
                      <td><span style={{fontWeight:'500'}}>{cuenta?.nombre||'—'}</span></td>
                      <td style={{color:'var(--gray-600)'}}>{m.descripcion||'—'}</td>
                      <td><span className={`badge badge-${m.tipo}`}>{m.tipo}</span></td>
                      <td className={m.tipo==='ingreso'?'amount-positive':'amount-negative'}>
                        {m.tipo==='ingreso'?'+':'-'}${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}
                      </td>
                      {canEdit && (
                        <td>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(m)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(m.id)}>🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editId?'Editar Movimiento':'Nuevo Movimiento'} onClose={()=>setShowModal(false)}>
          <FormField label="Tipo">
            <div style={{display:'flex',gap:'8px'}}>
              {['ingreso','gasto'].map(t=>(
                <button key={t} className={`tab ${form.tipo===t?'active':''}`} onClick={()=>setForm(f=>({...f,tipo:t,cuentaId:''}))}>
                  {t==='ingreso'?'↑ Ingreso':'↓ Gasto'}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Cuenta">
            <select className="input-field" value={form.cuentaId} onChange={e=>setForm(f=>({...f,cuentaId:e.target.value}))}>
              <option value="">Seleccionar cuenta...</option>
              {cuentas.filter(c=>c.tipo===form.tipo).map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </FormField>
          <FormField label="Monto (USD)">
            <input className="input-field" type="number" step="0.01" min="0" value={form.monto} onChange={e=>setForm(f=>({...f,monto:e.target.value}))} placeholder="0.00"/>
          </FormField>
          <FormField label="Fecha">
            <input className="input-field" type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/>
          </FormField>
          <FormField label="Descripción (opcional)">
            <input className="input-field" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Descripción del movimiento..."/>
          </FormField>
          <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'8px'}}>
            <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn btn-navy" onClick={handleSave}>{editId?'Actualizar':'Registrar'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── CUENTAS ─────────────────────────────────────────────────────────────────
const Cuentas = ({ cuentas, setCuentas, notify }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({nombre:'',tipo:'ingreso',descripcion:''});
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('todos');

  const openAdd = () => { setEditId(null); setForm({nombre:'',tipo:'ingreso',descripcion:''}); setShowModal(true); };
  const openEdit = (c) => { setEditId(c.id); setForm({nombre:c.nombre,tipo:c.tipo,descripcion:c.descripcion}); setShowModal(true); };

  const handleSave = () => {
    if(!form.nombre.trim()) { notify('Ingrese el nombre de la cuenta','error'); return; }
    if(editId) {
      setCuentas(prev=>prev.map(c=>c.id===editId?{...c,...form}:c));
      notify('Cuenta actualizada','success');
    } else {
      setCuentas(prev=>[...prev,{id:Date.now(),...form}]);
      notify('Cuenta creada','success');
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if(confirm('¿Eliminar esta cuenta?')) { setCuentas(prev=>prev.filter(c=>c.id!==id)); notify('Cuenta eliminada','success'); }
  };

  const filtered = filter==='todos' ? cuentas : cuentas.filter(c=>c.tipo===filter);

  return (
    <div className="fade-in" style={{padding:'32px',flex:1,overflow:'auto'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'28px'}}>
        <div><div className="section-title">Cuentas</div><div className="section-subtitle">Gestión de cuentas contables</div></div>
        <button className="btn btn-navy" onClick={openAdd}>+ Nueva Cuenta</button>
      </div>

      <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
        {['todos','ingreso','gasto'].map(f=>(
          <button key={f} className={`tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{f==='todos'?'Todas':f==='ingreso'?'Ingresos':'Gastos'}</button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
        {filtered.map(c => (
          <div key={c.id} className="card slide-in" style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontWeight:'600',fontSize:'15px',color:'var(--navy)',marginBottom:'4px'}}>{c.nombre}</div>
                <span className={`badge badge-${c.tipo}`}>{c.tipo}</span>
              </div>
              <div style={{display:'flex',gap:'6px'}}>
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(c)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(c.id)}>🗑️</button>
              </div>
            </div>
            {c.descripcion && <p style={{fontSize:'13px',color:'var(--gray-600)',lineHeight:1.5}}>{c.descripcion}</p>}
          </div>
        ))}
        {filtered.length===0 && <div className="empty-state" style={{gridColumn:'1/-1'}}><div className="icon">📋</div><p>No hay cuentas de este tipo</p></div>}
      </div>

      {showModal && (
        <Modal title={editId?'Editar Cuenta':'Nueva Cuenta'} onClose={()=>setShowModal(false)}>
          <FormField label="Nombre"><input className="input-field" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Nombre de la cuenta"/></FormField>
          <FormField label="Tipo">
            <div style={{display:'flex',gap:'8px'}}>
              {['ingreso','gasto'].map(t=>(
                <button key={t} className={`tab ${form.tipo===t?'active':''}`} onClick={()=>setForm(f=>({...f,tipo:t}))}>
                  {t==='ingreso'?'↑ Ingreso':'↓ Gasto'}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Descripción"><input className="input-field" value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Descripción..."/></FormField>
          <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'8px'}}>
            <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn btn-navy" onClick={handleSave}>{editId?'Actualizar':'Crear'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── REPORTES ────────────────────────────────────────────────────────────────
const Reportes = ({ user, movimientos, cuentas, config, currentYear, currentMonth, setCurrentMonth, setCurrentYear }) => {
  const canExport = ['admin','asistente','empleado'].includes(user.role);
  const monthKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;
  const movMes = movimientos.filter(m => m.periodo === monthKey);

  const ingresos = movMes.filter(m=>m.tipo==='ingreso');
  const gastos = movMes.filter(m=>m.tipo==='gasto');
  const totalIngresos = ingresos.reduce((s,m)=>s+m.monto,0);
  const totalGastos = gastos.reduce((s,m)=>s+m.monto,0);
  const balance = totalIngresos - totalGastos;

  const ingPorCuenta = cuentas.filter(c=>c.tipo==='ingreso').map(c => ({
    ...c, movs: ingresos.filter(m=>m.cuentaId===c.id), total: ingresos.filter(m=>m.cuentaId===c.id).reduce((s,m)=>s+m.monto,0)
  })).filter(c=>c.total>0);

  const gasPorCuenta = cuentas.filter(c=>c.tipo==='gasto').map(c => ({
    ...c, movs: gastos.filter(m=>m.cuentaId===c.id), total: gastos.filter(m=>m.cuentaId===c.id).reduce((s,m)=>s+m.monto,0)
  })).filter(c=>c.total>0);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const fmt = (n) => n.toFixed(2);

    // Hoja principal
    const wsData = [
      [config.nombreColegio],
      [`RIF: ${config.rif}`],
      [config.direccion],
      [`Tel: ${config.telefono}`],
      [],
      [`CUADRE MENSUAL - ${MESES[currentMonth].toUpperCase()} ${currentYear}`],
      [`Director: ${config.director}`],
      [],
      ['INGRESOS'],
      ['Cuenta','Descripción','Monto'],
    ];
    ingPorCuenta.forEach(c => {
      c.movs.forEach(m => wsData.push([c.nombre, m.descripcion||'', fmt(m.monto)]));
    });
    wsData.push([]);
    wsData.push(['SUBTOTAL INGRESOS','',fmt(totalIngresos)]);
    wsData.push([]);
    wsData.push(['GASTOS']);
    wsData.push(['Cuenta','Descripción','Monto']);
    gasPorCuenta.forEach(c => {
      c.movs.forEach(m => wsData.push([c.nombre, m.descripcion||'', fmt(m.monto)]));
    });
    wsData.push([]);
    wsData.push(['SUBTOTAL GASTOS','',fmt(totalGastos)]);
    wsData.push([]);
    wsData.push(['BALANCE NETO','',fmt(balance)]);
    wsData.push([]);
    wsData.push([`Generado: ${new Date().toLocaleDateString('es-VE')}`]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch:30},{wch:40},{wch:15}];
    XLSX.utils.book_append_sheet(wb, ws, `${MESES[currentMonth]} ${currentYear}`);

    // Hoja detalle
    const det = [['FECHA','TIPO','CUENTA','DESCRIPCIÓN','MONTO']];
    movMes.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).forEach(m => {
      const c = cuentas.find(x=>x.id===m.cuentaId);
      det.push([m.fecha, m.tipo.toUpperCase(), c?.nombre||'', m.descripcion||'', fmt(m.monto)]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(det);
    ws2['!cols'] = [{wch:14},{wch:10},{wch:28},{wch:38},{wch:14}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle');

    XLSX.writeFile(wb, `Cuadre_${config.nombreColegio.replace(/\s/g,'_')}_${MESES[currentMonth]}_${currentYear}.xlsx`);
  };

  const printReport = () => window.print();

  return (
    <div className="fade-in" style={{padding:'32px',flex:1,overflow:'auto'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px',flexWrap:'wrap',gap:'12px'}}>
        <div><div className="section-title">Reportes</div><div className="section-subtitle">Cuadre mensual</div></div>
        {canExport && (
          <div style={{display:'flex',gap:'10px'}}>
            <button className="btn btn-secondary" onClick={printReport}>🖨️ Imprimir</button>
            <button className="btn btn-navy" onClick={exportExcel}>📊 Exportar Excel</button>
          </div>
        )}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px',flexWrap:'wrap'}}>
        <select className="input-field" value={currentYear} onChange={e=>setCurrentYear(parseInt(e.target.value))} style={{width:'auto'}}>
          {[currentYear-1, currentYear, currentYear+1].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {MESES.map((m,i) => {
            const key = `${currentYear}-${String(i+1).padStart(2,'0')}`;
            const hasDat = movimientos.some(mv=>mv.periodo===key);
            return <button key={i} className={`month-chip ${i===currentMonth?'active':''} ${hasDat&&i!==currentMonth?'has-data':''}`} onClick={()=>setCurrentMonth(i)}>{m.slice(0,3)}</button>;
          })}
        </div>
      </div>

      {/* Reporte */}
      <div id="reporte-print" style={{background:'white',borderRadius:'20px',padding:'40px',boxShadow:'var(--shadow-sm)',border:'1px solid var(--gray-200)'}}>
        {/* Cabecera */}
        <div style={{textAlign:'center',marginBottom:'32px',paddingBottom:'24px',borderBottom:'2px solid var(--navy)'}}>
          <div style={{fontSize:'28px',marginBottom:'8px'}}>🏫</div>
          <h1 style={{fontFamily:'Playfair Display',fontSize:'24px',color:'var(--navy)',marginBottom:'4px'}}>{config.nombreColegio}</h1>
          <p style={{fontSize:'13px',color:'var(--gray-600)'}}>{config.rif} · {config.direccion}</p>
          <p style={{fontSize:'13px',color:'var(--gray-600)'}}>{config.telefono} · {config.email}</p>
          <div style={{marginTop:'16px',display:'inline-block',background:'var(--navy)',color:'white',padding:'8px 24px',borderRadius:'30px',fontSize:'14px',fontWeight:'600'}}>
            CUADRE MENSUAL — {MESES[currentMonth].toUpperCase()} {currentYear}
          </div>
          <p style={{fontSize:'13px',color:'var(--gray-400)',marginTop:'8px'}}>Director(a): {config.director}</p>
        </div>

        {movMes.length === 0 ? (
          <div className="empty-state"><div className="icon">📄</div><p>No hay movimientos en este período</p></div>
        ) : (
          <>
            {/* Ingresos */}
            <div style={{marginBottom:'28px'}}>
              <h3 style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'16px',fontWeight:'700',color:'var(--green)',marginBottom:'12px',paddingBottom:'8px',borderBottom:'1px solid var(--green-light)'}}>
                ↑ INGRESOS
              </h3>
              {ingPorCuenta.length===0 ? <p style={{color:'var(--gray-400)',fontSize:'13px'}}>Sin ingresos registrados</p> : (
                <table>
                  <thead><tr><th>Cuenta</th><th>Descripción</th><th>Fecha</th><th style={{textAlign:'right'}}>Monto</th></tr></thead>
                  <tbody>
                    {ingPorCuenta.map(c => c.movs.map(m => (
                      <tr key={m.id}>
                        <td>{c.nombre}</td>
                        <td style={{color:'var(--gray-600)'}}>{m.descripcion||'—'}</td>
                        <td style={{color:'var(--gray-600)'}}>{new Date(m.fecha+'T12:00:00').toLocaleDateString('es-VE')}</td>
                        <td style={{textAlign:'right'}} className="amount-positive">${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}</td>
                      </tr>
                    )))}
                    <tr style={{borderTop:'2px solid var(--green)'}}>
                      <td colSpan={3} style={{fontWeight:'700',paddingTop:'10px'}}>TOTAL INGRESOS</td>
                      <td style={{textAlign:'right',fontWeight:'700',paddingTop:'10px'}} className="amount-positive">${totalIngresos.toLocaleString('es-VE',{minimumFractionDigits:2})}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Gastos */}
            <div style={{marginBottom:'28px'}}>
              <h3 style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'16px',fontWeight:'700',color:'var(--red)',marginBottom:'12px',paddingBottom:'8px',borderBottom:'1px solid var(--red-light)'}}>
                ↓ GASTOS
              </h3>
              {gasPorCuenta.length===0 ? <p style={{color:'var(--gray-400)',fontSize:'13px'}}>Sin gastos registrados</p> : (
                <table>
                  <thead><tr><th>Cuenta</th><th>Descripción</th><th>Fecha</th><th style={{textAlign:'right'}}>Monto</th></tr></thead>
                  <tbody>
                    {gasPorCuenta.map(c => c.movs.map(m => (
                      <tr key={m.id}>
                        <td>{c.nombre}</td>
                        <td style={{color:'var(--gray-600)'}}>{m.descripcion||'—'}</td>
                        <td style={{color:'var(--gray-600)'}}>{new Date(m.fecha+'T12:00:00').toLocaleDateString('es-VE')}</td>
                        <td style={{textAlign:'right'}} className="amount-negative">${m.monto.toLocaleString('es-VE',{minimumFractionDigits:2})}</td>
                      </tr>
                    )))}
                    <tr style={{borderTop:'2px solid var(--red)'}}>
                      <td colSpan={3} style={{fontWeight:'700',paddingTop:'10px'}}>TOTAL GASTOS</td>
                      <td style={{textAlign:'right',fontWeight:'700',paddingTop:'10px'}} className="amount-negative">${totalGastos.toLocaleString('es-VE',{minimumFractionDigits:2})}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Balance */}
            <div style={{background:balance>=0?'var(--green-light)':'var(--red-light)',borderRadius:'12px',padding:'20px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:'700',fontSize:'18px',color:balance>=0?'var(--green)':'var(--red)',fontFamily:'Playfair Display'}}>BALANCE NETO</span>
              <span style={{fontWeight:'700',fontSize:'24px',color:balance>=0?'var(--green)':'var(--red)',fontFamily:'Playfair Display'}}>
                {balance>=0?'+':''}${balance.toLocaleString('es-VE',{minimumFractionDigits:2})}
              </span>
            </div>
          </>
        )}

        <div style={{marginTop:'32px',paddingTop:'16px',borderTop:'1px solid var(--gray-200)',display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--gray-400)'}}>
          <span>Generado el {new Date().toLocaleDateString('es-VE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
          <span>{config.nombreColegio} · Sistema Financiero</span>
        </div>
      </div>
    </div>
  );
};

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const Configuracion = ({ config, setConfig, notify }) => {
  const [form, setForm] = useState({...config});

  const handleSave = () => {
    setConfig(form);
    notify('Configuración guardada exitosamente','success');
  };

  return (
    <div className="fade-in" style={{padding:'32px',flex:1,overflow:'auto'}}>
      <div style={{marginBottom:'28px'}}>
        <div className="section-title">Configuración</div>
        <div className="section-subtitle">Datos del colegio y configuración general</div>
      </div>
      <div style={{maxWidth:'640px'}}>
        <div className="card" style={{marginBottom:'20px'}}>
          <h3 style={{fontSize:'15px',fontWeight:'600',color:'var(--navy)',marginBottom:'20px',display:'flex',alignItems:'center',gap:'8px'}}>🏫 Información del Colegio</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <FormField label="Nombre del Colegio"><input className="input-field" value={form.nombreColegio} onChange={e=>setForm(f=>({...f,nombreColegio:e.target.value}))}/></FormField>
            <FormField label="RIF"><input className="input-field" value={form.rif} onChange={e=>setForm(f=>({...f,rif:e.target.value}))}/></FormField>
            <FormField label="Teléfono"><input className="input-field" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/></FormField>
            <FormField label="Email"><input className="input-field" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></FormField>
          </div>
          <FormField label="Dirección"><input className="input-field" value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))}/></FormField>
          <FormField label="Director(a)"><input className="input-field" value={form.director} onChange={e=>setForm(f=>({...f,director:e.target.value}))}/></FormField>
        </div>
        <button className="btn btn-navy" onClick={handleSave} style={{width:'100%',justifyContent:'center',padding:'12px'}}>💾 Guardar Configuración</button>
      </div>
    </div>
  );
};

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
const Usuarios = ({ users, setUsers, currentUser, notify }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({username:'',password:'',name:'',role:'asistente'});
  const [editId, setEditId] = useState(null);

  const openAdd = () => { setEditId(null); setForm({username:'',password:'',name:'',role:'asistente'}); setShowModal(true); };
  const openEdit = (u) => { setEditId(u.id); setForm({username:u.username,password:u.password,name:u.name,role:u.role}); setShowModal(true); };

  const handleSave = () => {
    if(!form.username||!form.password||!form.name) { notify('Complete todos los campos','error'); return; }
    if(editId) {
      setUsers(prev=>prev.map(u=>u.id===editId?{...u,...form}:u));
      notify('Usuario actualizado','success');
    } else {
      if(users.find(u=>u.username===form.username)) { notify('Nombre de usuario ya existe','error'); return; }
      setUsers(prev=>[...prev,{id:Date.now(),...form}]);
      notify('Usuario creado','success');
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if(id===currentUser.id) { notify('No puedes eliminar tu propio usuario','error'); return; }
    if(confirm('¿Eliminar este usuario?')) { setUsers(prev=>prev.filter(u=>u.id!==id)); notify('Usuario eliminado','success'); }
  };

  const roleLabels = {admin:'Administrador',asistente:'Asistente',empleado:'Empleado'};

  return (
    <div className="fade-in" style={{padding:'32px',flex:1,overflow:'auto'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'28px'}}>
        <div><div className="section-title">Usuarios</div><div className="section-subtitle">Gestión de accesos y roles</div></div>
        <button className="btn btn-navy" onClick={openAdd}>+ Nuevo Usuario</button>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Permisos</th><th>Acciones</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><span style={{fontFamily:'monospace',background:'var(--gray-100)',padding:'2px 8px',borderRadius:'4px',fontSize:'13px'}}>{u.username}</span></td>
                <td style={{fontWeight:'500'}}>{u.name}</td>
                <td><span className={`badge badge-${u.role}`}>{roleLabels[u.role]}</span></td>
                <td style={{fontSize:'12px',color:'var(--gray-600)'}}>
                  {u.role==='admin'?'Acceso completo':u.role==='asistente'?'Ingresos y gastos':'Solo reportes'}
                </td>
                <td>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(u)}>✏️</button>
                    {u.id!==currentUser.id && <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(u.id)}>🗑️</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{marginTop:'20px'}}>
        <h3 style={{fontSize:'14px',fontWeight:'600',color:'var(--navy)',marginBottom:'12px'}}>📋 Descripción de Roles</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px'}}>
          {[
            {role:'admin',label:'Administrador',perms:['Crear/editar cuentas','Registrar movimientos','Exportar reportes','Configuración','Gestionar usuarios'],color:'#3b4fd8',bg:'#e8ecff'},
            {role:'asistente',label:'Asistente',perms:['Registrar movimientos','Ver reportes','Exportar Excel'],color:'#c47a2b',bg:'#fff3e8'},
            {role:'empleado',label:'Empleado',perms:['Ver reportes','Exportar Excel','Imprimir'],color:'#555',bg:'#f0f0f0'},
          ].map(r => (
            <div key={r.role} style={{padding:'16px',borderRadius:'10px',background:r.bg,border:`1px solid ${r.color}25`}}>
              <div style={{fontWeight:'600',fontSize:'13px',color:r.color,marginBottom:'8px'}}>{r.label}</div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'4px'}}>
                {r.perms.map((p,i)=><li key={i} style={{fontSize:'12px',color:r.color,display:'flex',alignItems:'center',gap:'6px'}}><span style={{opacity:.7}}>✓</span>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <Modal title={editId?'Editar Usuario':'Nuevo Usuario'} onClose={()=>setShowModal(false)}>
          <FormField label="Nombre Completo"><input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nombre del usuario"/></FormField>
          <FormField label="Nombre de Usuario"><input className="input-field" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="usuario" disabled={!!editId} style={editId?{opacity:.6}:{}}/></FormField>
          <FormField label="Contraseña"><input className="input-field" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Contraseña"/></FormField>
          <FormField label="Rol">
            <select className="input-field" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option value="admin">Administrador</option>
              <option value="asistente">Asistente</option>
              <option value="empleado">Empleado</option>
            </select>
          </FormField>
          <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'8px'}}>
            <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn btn-navy" onClick={handleSave}>{editId?'Actualizar':'Crear'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [notification, setNotification] = useState(null);
  const [movimientos, setMovimientosState] = useState(() => load('sf_movimientos', []));
  const [cuentas, setCuentasState] = useState(() => load('sf_cuentas', INITIAL_CUENTAS));
  const [config, setConfigState] = useState(() => load('sf_config', INITIAL_CONFIG));
  const [users, setUsersState] = useState(() => load('sf_users', INITIAL_USERS));
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const setMovimientos = (fn) => { setMovimientosState(p => { const n = typeof fn==='function'?fn(p):fn; save('sf_movimientos',n); return n; }); };
  const setCuentas = (fn) => { setCuentasState(p => { const n = typeof fn==='function'?fn(p):fn; save('sf_cuentas',n); return n; }); };
  const setConfig = (v) => { setConfigState(v); save('sf_config',v); };
  const setUsers = (fn) => { setUsersState(p => { const n = typeof fn==='function'?fn(p):fn; save('sf_users',n); return n; }); };

  const notify = (msg, type='success') => setNotification({msg,type});

  useEffect(() => { setTimeout(()=>setLoading(false), 1200); }, []);

  const handleLogin = (u) => { setUser(u); setPage('dashboard'); };
  const handleLogout = () => { setUser(null); };

  if(loading) return (
    <div style={{minHeight:'100vh',background:'var(--navy)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'20px'}}>
      <GlobalStyles/>
      <div style={{fontSize:'48px',animation:'pulse 1.5s ease infinite'}}>🏫</div>
      <div style={{color:'white',fontFamily:'Playfair Display',fontSize:'22px'}}>SchoolFinance</div>
      <div className="spinner" style={{borderColor:'rgba(255,255,255,0.2)',borderTopColor:'var(--gold)'}}/>
    </div>
  );

  if(!user) return <><GlobalStyles/><LoginScreen onLogin={handleLogin}/></>;

  const pageProps = { user, movimientos, setMovimientos, cuentas, setCuentas, config, setConfig, users, setUsers, currentMonth, setCurrentMonth, currentYear, setCurrentYear, notify };

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'var(--cream)'}}>
      <GlobalStyles/>
      {notification && <Notification msg={notification.msg} type={notification.type} onClose={()=>setNotification(null)}/>}
      <Sidebar user={user} page={page} setPage={setPage} onLogout={handleLogout}/>
      <main style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        {page==='dashboard' && <Dashboard {...pageProps} setPage={setPage}/>}
        {page==='movimientos' && <Movimientos {...pageProps}/>}
        {page==='cuentas' && <Cuentas {...pageProps}/>}
        {page==='reportes' && <Reportes {...pageProps}/>}
        {page==='configuracion' && <Configuracion {...pageProps}/>}
        {page==='usuarios' && <Usuarios {...pageProps} currentUser={user}/>}
      </main>
    </div>
  );
}
