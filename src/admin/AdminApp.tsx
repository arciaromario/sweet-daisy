import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { Wordmark } from '../components/Logo';
import { useCatalog } from '../context/CatalogContext';
import { getAdminSession, sendPasswordReset, signIn, signOut, type AdminSession } from '../lib/adminApi';
import { resetDb } from '../lib/localDb';
import { supabase } from '../lib/supabase';
import AvailabilityAdmin from './pages/Availability';
import Categories from './pages/Categories';
import CustomConfig from './pages/CustomConfig';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Orders from './pages/Orders';
import ProductEditor from './pages/ProductEditor';
import Products from './pages/Products';
import Requests from './pages/Requests';
import SettingsPage from './pages/Settings';
import { Loading, ToastProvider } from './ui';
import './admin.css';

const nav: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '', label: 'Resumen', icon: 'sparkle', end: true },
  { to: 'pedidos', label: 'Pedidos', icon: 'bag' },
  { to: 'solicitudes', label: 'Pasteles personalizados', icon: 'gift' },
  { to: 'productos', label: 'Productos', icon: 'store' },
  { to: 'categorias', label: 'Categorías', icon: 'filter' },
  { to: 'disponibilidad', label: 'Disponibilidad', icon: 'calendar' },
  { to: 'configuracion-pasteles', label: 'Opciones de pasteles', icon: 'heart' },
  { to: 'mensajes', label: 'Mensajes y newsletter', icon: 'mail' },
  { to: 'ajustes', label: 'Ajustes de la tienda', icon: 'info' },
];

export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);

  const refresh = () =>
    getAdminSession()
      .then(setSession)
      .catch(() => setSession(null));

  useEffect(() => {
    refresh();
    const sub = supabase?.auth.onAuthStateChange(() => refresh());
    return () => sub?.data.subscription.unsubscribe();
  }, []);

  return (
    <ToastProvider>
      <title>Admin | Sweet Daisy</title>
      <meta name="robots" content="noindex, nofollow" />
      {session === undefined ? (
        <div className="adm-center">
          <Loading />
        </div>
      ) : !session ? (
        <Login />
      ) : !session.isAdmin ? (
        <NotAdmin email={session.email} />
      ) : (
        <Shell session={session} />
      )}
    </ToastProvider>
  );
}

function Shell({ session }: { session: AdminSession }) {
  const { demo } = useCatalog();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="adm">
      <aside className={`adm-side${menuOpen ? ' is-open' : ''}`}>
        <div className="adm-side__brand">
          <Wordmark compact />
          <span className="adm-side__label">Panel de administración</span>
        </div>
        <nav aria-label="Admin">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to ? `/admin/${n.to}` : '/admin'} end={n.end} className={({ isActive }) => `adm-nav${isActive ? ' is-active' : ''}`}>
              <Icon name={n.icon} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-side__foot">
          <Link to="/" className="adm-nav" target="_blank">
            <Icon name="eye" /> Ver tienda
          </Link>
          {!demo && (
            <button className="adm-nav" onClick={() => signOut()}>
              <Icon name="arrowLeft" /> Cerrar sesión
            </button>
          )}
          <p className="adm-side__user">{demo ? 'Modo demo' : session.email}</p>
        </div>
      </aside>
      {menuOpen && <div className="adm-scrim" onClick={() => setMenuOpen(false)} />}

      <div className="adm-main">
        <header className="adm-top">
          <button className="icon-btn adm-top__menu" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </button>
          <span className="adm-top__brand">
            <Wordmark compact /> <span className="adm-side__label">Admin</span>
          </span>
        </header>

        {demo && (
          <div className="adm-demo">
            <Icon name="info" />
            <p>
              <strong>Modo demo:</strong> los cambios se guardan solo en este navegador. Conecta Supabase para guardarlos de verdad y que los vean tus clientes.
            </p>
            <button
              className="adm-link"
              onClick={() => {
                if (confirm('¿Borrar todos los datos de demo y volver al catálogo inicial?')) resetDb();
              }}
            >
              Restablecer demo
            </button>
          </div>
        )}

        <main className="adm-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<Orders />} />
            <Route path="solicitudes" element={<Requests />} />
            <Route path="productos" element={<Products />} />
            <Route path="productos/nuevo" element={<ProductEditor />} />
            <Route path="productos/:slug" element={<ProductEditor />} />
            <Route path="categorias" element={<Categories />} />
            <Route path="disponibilidad" element={<AvailabilityAdmin />} />
            <Route path="configuracion-pasteles" element={<CustomConfig />} />
            <Route path="mensajes" element={<Inbox />} />
            <Route path="ajustes" element={<SettingsPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-center">
      <form className="adm-login" onSubmit={onSubmit}>
        <Wordmark />
        <h1>Panel de Sweet Daisy</h1>
        <p className="adm-muted">Inicia sesión con tu cuenta de administración.</p>
        <label className="adm-field">
          <span className="adm-field__label">Email</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Contraseña</span>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="field__error">{error}</p>}
        {info && <p className="adm-muted">{info}</p>}
        <button className="btn btn--block" disabled={busy}>
          {busy ? <span className="spinner" aria-label="Entrando" /> : 'Entrar'}
        </button>
        <button
          type="button"
          className="adm-link"
          onClick={async () => {
            if (!email) return setError('Escribe tu email para recibir el enlace.');
            try {
              await sendPasswordReset(email.trim());
              setInfo('Te hemos enviado un enlace para restablecer la contraseña.');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Error');
            }
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>
        <Link to="/" className="adm-link">
          ← Volver a la tienda
        </Link>
      </form>
    </div>
  );
}

function NotAdmin({ email }: { email: string }) {
  return (
    <div className="adm-center">
      <div className="adm-login">
        <Wordmark />
        <h1>Sin permisos</h1>
        <p className="adm-muted">
          La cuenta <strong>{email}</strong> no tiene permisos de administración. Para darle acceso, ejecuta en el SQL Editor de Supabase:
        </p>
        <pre className="adm-code">
          {`insert into public.admins (user_id, email)\nselect id, email from auth.users\nwhere email = '${email}';`}
        </pre>
        <button className="btn btn--outline btn--block" onClick={() => signOut()}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
