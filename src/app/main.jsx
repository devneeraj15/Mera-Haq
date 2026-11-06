import { Component, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider, useApp } from "./store.jsx";
import {
  Documents, Eligible, FindSchemes, Help, NotFound, Onboarding, Overview, Profile, Resources, Saved, SchemeDetail,
  UmangPlaceholder, UmangSchemes,
} from "./views.jsx";

const MERA_HAQ_NAV = [
  ["/mera-haq", "Overview"],
  ["/mera-haq/find", "Find Schemes"],
  ["/mera-haq/eligible", "My Eligible Schemes"],
  ["/mera-haq/saved", "Saved Schemes"],
  ["/mera-haq/profile", "My Profile"],
  ["/mera-haq/documents", "Documents Checklist"],
  ["/mera-haq/resources", "Government Resources"],
  ["/mera-haq/help", "Help and FAQs"],
];
const UMANG_NAV = [["/home", "Home"], ["/services", "Services"], ["/digilocker", "DigiLocker"], ["/schemes", "Schemes"]];
const UMANG_NAV_AFTER = [["/jobs", "Jobs"], ["/dashboard", "Dashboard"]];
const PLACEHOLDER_TITLES = { "/home": "UMANG Home", "/services": "All Government Services", "/digilocker": "DigiLocker", "/jobs": "Jobs", "/dashboard": "Citizen Dashboard", "/maharashtra": "Maharashtra" };

function Header({ onMenu, menuOpen }) {
  const { navigate, profile } = useApp();
  const [q, setQ] = useState("");
  return (
    <header className="app-header">
      <button type="button" className="icon-btn menu-btn" aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="app-sidebar" onClick={onMenu}>☰</button>
      <a className="brand" href="#/mera-haq"><span className="brand-mark" aria-hidden="true">U</span><span>UMANG</span><span className="brand-sub">Mera Haq</span></a>
      <form className="header-search" role="search" onSubmit={(e) => { e.preventDefault(); navigate("/mera-haq/find", { q: q.trim().slice(0, 100) || undefined }); }}>
        <label htmlFor="header-q" className="sr-only">Search schemes</label>
        <input id="header-q" type="search" placeholder="Search schemes" value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-sm">Search</button>
      </form>
      <a className="header-profile" href="#/mera-haq/profile" aria-label="My profile">
        <span className="avatar" aria-hidden="true">{profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "?"}</span>
        <span className="header-profile-name">{profile.displayName || "My profile"}</span>
      </a>
    </header>
  );
}

function NavLink({ to, label, current, badge }) {
  const active = current === to || (to !== "/mera-haq" && current.startsWith(to + "/")) || (to === "/mera-haq/find" && current.startsWith("/mera-haq/scheme/"));
  return <li><a href={"#" + to} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>{label}{badge ? <span className="nav-count"><span className="sr-only">, </span>{badge}<span className="sr-only"> saved</span></span> : null}</a></li>;
}

function Sidebar({ open, onClose }) {
  const { route, saved } = useApp();
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <nav id="app-sidebar" className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
        <ul className="nav-list">
          {UMANG_NAV.map(([to, l]) => <NavLink key={to} to={to} label={l} current={route.path} />)}
        </ul>
        <p className="nav-section" id="nav-mh">Mera Haq</p>
        <ul className="nav-list nav-sub" aria-labelledby="nav-mh">
          {MERA_HAQ_NAV.map(([to, l]) => <NavLink key={to} to={to} label={l} current={route.path} badge={to === "/mera-haq/saved" && saved.length ? saved.length : null} />)}
        </ul>
        <ul className="nav-list">
          {UMANG_NAV_AFTER.map(([to, l]) => <NavLink key={to} to={to} label={l} current={route.path} />)}
        </ul>
        <p className="sidebar-foot small">Prototype of a Mera Haq layer inside UMANG. Not an official Government of India service.</p>
      </nav>
    </>
  );
}

function Routes() {
  const { route } = useApp();
  const p = route.path;
  if (p === "/mera-haq") return <Overview />;
  if (p === "/mera-haq/start") return <Onboarding />;
  if (p === "/mera-haq/find") return <FindSchemes />;
  if (p === "/mera-haq/eligible") return <Eligible />;
  if (p === "/mera-haq/saved") return <Saved />;
  if (p === "/mera-haq/profile") return <Profile />;
  if (p === "/mera-haq/documents") return <Documents />;
  if (p === "/mera-haq/resources") return <Resources />;
  if (p === "/mera-haq/help") return <Help />;
  if (p === "/schemes") return <UmangSchemes />;
  if (PLACEHOLDER_TITLES[p]) return <UmangPlaceholder title={PLACEHOLDER_TITLES[p]} />;
  const m = p.match(/^\/mera-haq\/scheme\/([a-z0-9-]{1,120})$/);
  if (m) return <SchemeDetail id={m[1]} />;
  if (/^\/mera-haq\/scheme\/?/.test(p)) return <NotFound what="scheme" />;
  return <NotFound />;
}

class RouteErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.routeKey !== this.props.routeKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (this.state.error) {
      return (
        <div className="page"><div className="error-state" role="alert">
          <h1 className="page-title" tabIndex={-1} data-route-heading>This page could not be displayed</h1>
          <p>An unexpected error occurred. Your saved answers are not affected.</p>
          <a className="btn btn-primary" href="#/mera-haq">Go to Mera Haq overview</a>
        </div></div>
      );
    }
    return this.props.children;
  }
}

function Shell() {
  const { route } = useApp();
  const [menu, setMenu] = useState(false);
  const routeKey = route.path + "?" + JSON.stringify(route.query);
  const firstRender = useRef(true);
  // Route change: close mobile menu, scroll to top, move focus to the page heading
  // (not on the initial load, so keyboard users still reach the skip link first)
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    const initial = firstRender.current;
    firstRender.current = false;
    const t = setTimeout(() => {
      const h = document.querySelector("[data-route-heading]");
      if (h && !initial && !document.activeElement.closest(".filters, .question-panel, form")) h.focus({ preventScroll: true });
      const title = h ? h.textContent : "Mera Haq";
      document.title = `${title} | Mera Haq on UMANG`;
    }, 0);
    return () => clearTimeout(t);
  }, [route.path]);
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);
  return (
    <div className="app">
      <a className="skip-link" href="#main-content" onClick={(e) => { e.preventDefault(); document.getElementById("main-content").focus(); }}>Skip to main content</a>
      <Header onMenu={() => setMenu(!menu)} menuOpen={menu} />
      <div className="app-body">
        <Sidebar open={menu} onClose={() => setMenu(false)} />
        <main id="main-content" className="main" tabIndex={-1}>
          <RouteErrorBoundary routeKey={route.path}>
            <Routes key={routeKey.split("?")[0]} />
          </RouteErrorBoundary>
        </main>
      </div>
      <footer className="app-footer small">
        Scheme information comes from official government sources and is linked on every scheme page. Always confirm eligibility and deadlines on the official portal before applying.
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<AppProvider><Shell /></AppProvider>);
