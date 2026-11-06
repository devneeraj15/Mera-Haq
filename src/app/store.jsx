import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Engine from "../engine/eligibility.js";

// ---------------------------------------------------------------------------
// Hash router
// ---------------------------------------------------------------------------
export function parseHash(hash) {
  const raw = (hash || "").replace(/^#/, "") || "/mera-haq";
  const [p, qs = ""] = raw.split("?");
  const path = ("/" + p.replace(/^\/+/, "")).replace(/\/+$/, "") || "/mera-haq";
  const query = {};
  for (const [k, v] of new URLSearchParams(qs)) query[k] = v.slice(0, 200);
  return { path, query };
}

export function buildHash(path, query) {
  const qs = new URLSearchParams(Object.entries(query || {}).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString();
  return "#" + path + (qs ? "?" + qs : "");
}

/** Old prototype routes are redirected with location.replace so history has no dead entries. */
export function legacyRedirect(path) {
  if (path === "/" || path === "/saved") return path === "/saved" ? "/mera-haq/saved" : "/mera-haq";
  if (path === "/mera-haq/profile/review") return "/mera-haq/profile";
  if (path === "/mera-haq/matching") return "/mera-haq/eligible";
  if (path === "/mera-haq/opportunities") return "/mera-haq/find";
  if (path === "/mera-haq/tests") return "/mera-haq/help";
  const m = path.match(/^\/mera-haq\/opportunities\/([^/]+)(?:\/(?:eligibility|readiness))?$/);
  if (m) return `/mera-haq/scheme/${m[1]}`;
  return null;
}

function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      const r = parseHash(window.location.hash);
      const target = legacyRedirect(r.path);
      if (target) {
        window.location.replace(buildHash(target, r.query));
        return;
      }
      setRoute(r);
    };
    onChange();
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const navigate = useCallback((path, query, opts) => {
    const h = buildHash(path, query);
    if (opts && opts.replace) window.location.replace(h);
    else if (window.location.hash !== h) window.location.hash = h;
    // Update route state now instead of waiting for the asynchronous
    // hashchange event, so a handler that runs before that event (for example
    // a filter changed right after "Clear all filters") never reads a stale query.
    setRoute(parseHash(h));
  }, []);
  return [route, navigate];
}

// ---------------------------------------------------------------------------
// Privacy-aware storage
// ---------------------------------------------------------------------------
const KEY = "merahaq.v3";
const LEGACY_KEYS = ["umang-merahaq-profile", "umang-merahaq-saved"];
const EMPTY = { profile: {}, onboarded: false, saved: [], checklist: {}, consent: { sensitive: false }, remember: false };

function safeStorage(kind) {
  try {
    const s = window[kind];
    const probe = "__mh_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch (e) {
    return null;
  }
}

function loadState() {
  const local = safeStorage("localStorage");
  const session = safeStorage("sessionStorage");
  // Data minimisation: the old prototype stored a pre-filled demo profile. Remove it.
  if (local) LEGACY_KEYS.forEach((k) => local.removeItem(k));
  for (const [store, remember] of [[local, true], [session, false]]) {
    if (!store) continue;
    try {
      const raw = store.getItem(KEY);
      if (!raw || raw.length > 200000) continue;
      const parsed = JSON.parse(raw);
      const { profile } = Engine.validateProfile(parsed.profile || {}); // never trust stored values
      const saved = Array.isArray(parsed.saved) ? parsed.saved.filter((s) => typeof s === "string" && /^[a-z0-9-]{1,120}$/.test(s)).slice(0, 500) : [];
      const checklist = {};
      if (parsed.checklist && typeof parsed.checklist === "object") {
        for (const [k, v] of Object.entries(parsed.checklist)) {
          if (/^[a-z0-9-]{1,120}$/.test(k) && v && typeof v === "object") {
            checklist[k] = Object.fromEntries(Object.entries(v).filter(([i, b]) => /^\d{1,3}$/.test(i) && b === true));
          }
        }
      }
      return { profile, onboarded: !!parsed.onboarded, saved, checklist, consent: { sensitive: !!(parsed.consent && parsed.consent.sensitive) }, remember };
    } catch (e) {
      store.removeItem(KEY);
    }
  }
  return { ...EMPTY };
}

function persist(state) {
  const local = safeStorage("localStorage");
  const session = safeStorage("sessionStorage");
  const body = JSON.stringify({ profile: state.profile, onboarded: state.onboarded, saved: state.saved, checklist: state.checklist, consent: state.consent });
  try {
    if (state.remember && local) {
      local.setItem(KEY, body);
      if (session) session.removeItem(KEY);
    } else {
      if (session) session.setItem(KEY, body);
      if (local) local.removeItem(KEY);
    }
  } catch (e) {
    /* storage full or blocked: the app keeps working in memory */
  }
}

// ---------------------------------------------------------------------------
// Dataset loading
// ---------------------------------------------------------------------------
// The app reads scheme data ONLY through the (proposed) Open Government Schemes
// API contract (docs/api/openapi.yaml). The POC serves it statically at api/v1/.
// To use an official endpoint, change <meta name="merahaq-api-base"> and add its
// origin to the CSP connect-src.
const TIMEOUT_MS = 15000;

export function apiBase() {
  const el = typeof document !== "undefined" && document.querySelector('meta[name="merahaq-api-base"]');
  const raw = (el && el.getAttribute("content")) || "api/v1/";
  try {
    const u = new URL(raw, window.location.href);
    if (u.origin !== window.location.origin && u.protocol !== "https:") return "api/v1/";
    return u.href.endsWith("/") ? u.href : u.href + "/";
  } catch (e) {
    return "api/v1/";
  }
}

async function fetchDataset(signal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener("abort", () => ctrl.abort());
  try {
    const res = await fetch(apiBase() + "schemes/index.json", { signal: ctrl.signal, cache: "no-cache", credentials: "omit" });
    if (!res.ok) throw new Error(`The scheme dataset could not be loaded (HTTP ${res.status}).`);
    const json = await res.json();
    if (!json || !Array.isArray(json.schemes)) throw new Error("The scheme dataset is malformed.");
    return json;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Loading the scheme dataset timed out. Check your connection and try again.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [route, navigate] = useHashRoute();
  const [state, setState] = useState(loadState);
  const [data, setData] = useState({ status: "loading", schemes: [], meta: null, error: null });
  const loadSeq = useRef(0);

  const reload = useCallback(() => {
    const seq = ++loadSeq.current;
    setData((d) => ({ ...d, status: "loading", error: null }));
    fetchDataset()
      .then((json) => {
        if (seq !== loadSeq.current) return;
        setData({ status: "ready", schemes: json.schemes, meta: { generatedAt: json.generatedAt, count: json.count }, error: null });
      })
      .catch((e) => seq === loadSeq.current && setData({ status: "error", schemes: [], meta: null, error: e.message }));
  }, []);
  useEffect(reload, [reload]);
  useEffect(() => persist(state), [state]);

  const updateProfile = useCallback((patch) => {
    setState((s) => {
      const merged = { ...s.profile, ...patch };
      const { profile } = Engine.validateProfile(merged);
      return { ...s, profile };
    });
  }, []);
  const completeOnboarding = useCallback(() => setState((s) => ({ ...s, onboarded: true })), []);
  const setConsent = useCallback((sensitive) => setState((s) => {
    if (sensitive) return { ...s, consent: { sensitive: true } };
    // Withdrawing consent deletes the sensitive answers immediately.
    const profile = { ...s.profile };
    for (const [f, m] of Object.entries(Engine.FIELD_META)) if (m.sensitive) profile[f] = null;
    return { ...s, profile, consent: { sensitive: false } };
  }), []);
  const setRemember = useCallback((remember) => setState((s) => ({ ...s, remember })), []);
  const toggleSave = useCallback((id) => setState((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })), []);
  const toggleDoc = useCallback((schemeId, idx) => setState((s) => {
    const cur = { ...(s.checklist[schemeId] || {}) };
    if (cur[idx]) delete cur[idx];
    else cur[idx] = true;
    return { ...s, checklist: { ...s.checklist, [schemeId]: cur } };
  }), []);
  const deleteAllData = useCallback(() => {
    for (const k of ["localStorage", "sessionStorage"]) {
      const st = safeStorage(k);
      if (st) { st.removeItem(KEY); LEGACY_KEYS.forEach((x) => st.removeItem(x)); }
    }
    setState({ ...EMPTY });
  }, []);

  const results = useMemo(() => {
    if (data.status !== "ready") return [];
    return Engine.evaluateAll(data.schemes, state.profile);
  }, [data, state.profile]);
  const resultById = useMemo(() => Object.fromEntries(results.map((r) => [r.schemeId, r])), [results]);
  const schemeById = useMemo(() => Object.fromEntries(data.schemes.map((s) => [s.id, s])), [data.schemes]);

  const value = {
    route, navigate, data, reload,
    profile: state.profile, onboarded: state.onboarded, consent: state.consent, remember: state.remember,
    saved: state.saved, checklist: state.checklist,
    updateProfile, completeOnboarding, setConsent, setRemember, toggleSave, toggleDoc, deleteAllData,
    results, resultById, schemeById,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
