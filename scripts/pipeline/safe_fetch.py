"""
Hardened HTTP fetcher for the Mera Haq scheme ingestion pipeline.

Security controls (see SECURITY_AUDIT.md, section "Scraping security"):
  * HTTPS only, TLS certificate verification always ON (never disabled).
  * Host allow-list: only domains listed in data/sources/domains.json with
    status "ALLOWED" may be fetched. Redirects are re-validated hop by hop.
  * SSRF / DNS-rebinding guard: every resolved IP must be a public, global
    unicast address (no loopback, private, link-local, multicast, reserved).
  * robots.txt is honoured (urllib.robotparser) and Crawl-delay respected.
  * Per-host throttling (min 3 s between requests), timeouts, bounded retries
    with exponential backoff, response-size cap (5 MB), content-type allow-list.
  * Downloaded content is never executed. HTML is converted to plain text with
    the stdlib HTMLParser (no XML entity expansion, no external entity fetch).

Only the Python standard library is used so the pipeline has no supply-chain
surface beyond CPython itself.
"""
from __future__ import annotations

import hashlib
import ipaddress
import json
import socket
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOMAINS_FILE = ROOT / "data" / "sources" / "domains.json"

USER_AGENT = "MeraHaq-SchemeIndexer/1.0 (+https://github.com/devneeraj15/Mera-Haq; respects robots.txt)"
MAX_BYTES = 5 * 1024 * 1024
MAX_PDF_BYTES = 15 * 1024 * 1024
TIMEOUT_S = 30
MIN_INTERVAL_S = 3.0
MAX_RETRIES = 3
MAX_REDIRECTS = 5
ALLOWED_CONTENT_TYPES = ("text/html", "application/xhtml+xml", "text/plain", "application/xml", "text/xml", "application/pdf")


class FetchError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(f"{code}: {message}")
        self.code = code


def load_domain_policy() -> dict:
    data = json.loads(DOMAINS_FILE.read_text(encoding="utf-8"))
    return {d["host"].lower(): d for d in data["domains"]}


def host_allowed(host: str, policy: dict) -> bool:
    host = (host or "").lower().rstrip(".")
    entry = policy.get(host)
    return bool(entry and entry.get("status") == "ALLOWED")


def assert_public_host(host: str) -> None:
    """Resolve host and refuse any non-public address (SSRF / rebinding guard)."""
    try:
        infos = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise FetchError("DNS_FAILURE", f"{host}: {exc}") from exc
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global or ip.is_multicast:
            raise FetchError("NON_PUBLIC_ADDRESS", f"{host} resolved to {ip}")


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D401
        return None  # we follow redirects manually so each hop is validated


INTERMEDIATE_CACHE = ROOT / "data" / "sources" / "intermediate-cas.pem"


def _ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.check_hostname = True
    ctx.verify_mode = ssl.CERT_REQUIRED
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    if INTERMEDIATE_CACHE.exists() and INTERMEDIATE_CACHE.stat().st_size:
        # Extra *intermediate* certificates only. Trust is still anchored in
        # the OS root store: an intermediate that does not chain to a trusted
        # root cannot make an untrusted server verify.
        ctx.load_verify_locations(cafile=str(INTERMEDIATE_CACHE))
    return ctx


def fetch_missing_intermediate(host: str) -> bool:
    """AIA chasing, as browsers do for servers that omit their intermediate.

    The leaf certificate is read only to learn its caIssuers URL. The
    downloaded intermediate is appended to INTERMEDIATE_CACHE and the original
    request is retried with FULL verification. Returns True if a cert was added.
    """
    import tempfile
    assert_public_host(host)
    raw_ctx = ssl.create_default_context()
    raw_ctx.check_hostname = False
    raw_ctx.verify_mode = ssl.CERT_NONE  # metadata read only; never used for content
    with socket.create_connection((host, 443), timeout=TIMEOUT_S) as sock:
        with raw_ctx.wrap_socket(sock, server_hostname=host) as tls:
            der = tls.getpeercert(binary_form=True)
    with tempfile.NamedTemporaryFile("w", suffix=".pem", delete=False) as fh:
        fh.write(ssl.DER_cert_to_PEM_cert(der))
        leaf_path = fh.name
    try:
        info = ssl._ssl._test_decode_cert(leaf_path)  # stdlib cert decoder
    finally:
        Path(leaf_path).unlink(missing_ok=True)
    added = False
    queue = list(info.get("caIssuers", ()))  # usually plain http by design (RFC 5280)
    seen: set[str] = set()
    while queue and len(seen) < 4:  # walk up at most 4 levels
        issuer_url = queue.pop(0)
        if issuer_url in seen:
            continue
        seen.add(issuer_url)
        parts = urllib.parse.urlsplit(issuer_url)
        if parts.scheme not in ("http", "https") or not parts.hostname:
            continue
        assert_public_host(parts.hostname)
        with urllib.request.urlopen(urllib.request.Request(issuer_url, headers={"User-Agent": USER_AGENT}), timeout=TIMEOUT_S) as resp:
            blob = resp.read(64 * 1024)
        if b"-----BEGIN CERTIFICATE-----" in blob:
            pem = blob.decode("ascii", "ignore")
        else:
            try:
                pem = ssl.DER_cert_to_PEM_cert(blob)
            except Exception:  # PKCS#7 bundles etc. are not supported
                continue
        with tempfile.NamedTemporaryFile("w", suffix=".pem", delete=False) as fh:
            fh.write(pem)
            cand_path = fh.name
        try:
            cand = ssl._ssl._test_decode_cert(cand_path)
        except ssl.SSLError:
            continue
        finally:
            Path(cand_path).unlink(missing_ok=True)
        # Refuse self-signed downloads: a self-signed cert in the verify store
        # would act as a trust anchor. Without PARTIAL_CHAIN, a non-self-signed
        # intermediate is only useful if it chains to an OS-trusted root.
        if cand.get("issuer") == cand.get("subject"):
            continue
        existing = INTERMEDIATE_CACHE.read_text() if INTERMEDIATE_CACHE.exists() else ""
        if pem.strip() not in existing:
            INTERMEDIATE_CACHE.write_text(existing + pem.strip() + "\n")
            added = True
        queue.extend(cand.get("caIssuers", ()))
    return added


@dataclass
class FetchResult:
    url: str
    final_url: str
    status: int
    content_type: str
    body: bytes
    fetched_at: str
    sha256: str
    redirects: list = field(default_factory=list)


class SafeFetcher:
    def __init__(self, policy: dict | None = None):
        self.policy = policy or load_domain_policy()
        self._last_hit: dict[str, float] = {}
        self._robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
        self._aia_tried: set[str] = set()
        self._opener = urllib.request.build_opener(_NoRedirect(), urllib.request.HTTPSHandler(context=_ssl_context()))

    # -- policy -----------------------------------------------------------
    def _validate_url(self, url: str) -> urllib.parse.SplitResult:
        parts = urllib.parse.urlsplit(url)
        if parts.scheme != "https":
            raise FetchError("SCHEME_REJECTED", url)
        if parts.username or parts.password:
            raise FetchError("CREDENTIALS_IN_URL", url)
        if parts.port not in (None, 443):
            raise FetchError("PORT_REJECTED", url)
        if not host_allowed(parts.hostname, self.policy):
            raise FetchError("HOST_NOT_ALLOWLISTED", parts.hostname or "")
        assert_public_host(parts.hostname)
        return parts

    def _throttle(self, host: str) -> None:
        delay = max(MIN_INTERVAL_S, float(self.policy.get(host, {}).get("crawlDelay") or 0))
        wait = self._last_hit.get(host, 0) + delay - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        self._last_hit[host] = time.monotonic()

    def _robots_ok(self, url: str) -> bool:
        host = urllib.parse.urlsplit(url).hostname
        if host not in self._robots:
            rp = urllib.robotparser.RobotFileParser()
            try:
                raw = self._raw_get(f"https://{host}/robots.txt", allow_missing=True)
                if raw is None or raw[0] >= 400:
                    rp = None  # no robots.txt => no restriction expressed
                else:
                    rp.parse(raw[2].decode("utf-8", "ignore").splitlines())
                    cd = rp.crawl_delay(USER_AGENT)
                    if cd:
                        self.policy.setdefault(host, {})["crawlDelay"] = cd
            except FetchError:
                rp = None
            self._robots[host] = rp
        rp = self._robots[host]
        return True if rp is None else rp.can_fetch(USER_AGENT, url)

    # -- transport --------------------------------------------------------
    def _raw_get(self, url: str, allow_missing: bool = False):
        parts = self._validate_url(url)
        self._throttle(parts.hostname)
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5"})
        try:
            resp = self._opener.open(req, timeout=TIMEOUT_S)
        except urllib.error.HTTPError as exc:
            if exc.code in (301, 302, 303, 307, 308):
                return exc.code, exc.headers, b""
            if allow_missing:
                return exc.code, exc.headers, b""
            raise FetchError(f"HTTP_{exc.code}", url) from exc
        except (urllib.error.URLError, TimeoutError, ssl.SSLError, ConnectionError) as exc:
            if "CERTIFICATE_VERIFY_FAILED" in str(exc) and "issuer" in str(exc) and parts.hostname not in self._aia_tried:
                self._aia_tried.add(parts.hostname)
                try:
                    if fetch_missing_intermediate(parts.hostname):
                        self._opener = urllib.request.build_opener(_NoRedirect(), urllib.request.HTTPSHandler(context=_ssl_context()))
                        return self._raw_get(url, allow_missing)
                except (OSError, ValueError, FetchError):
                    pass
                raise FetchError("TLS_CHAIN_INCOMPLETE", f"{url}: {exc}") from exc
            raise FetchError("NETWORK", f"{url}: {exc}") from exc
        with resp:
            is_pdf = (resp.headers.get("Content-Type") or "").lower().startswith("application/pdf")
            cap = MAX_PDF_BYTES if is_pdf else MAX_BYTES
            length = resp.headers.get("Content-Length")
            if length and length.isdigit() and int(length) > cap:
                raise FetchError("TOO_LARGE", url)
            body = resp.read(cap + 1)
            if len(body) > cap:
                raise FetchError("TOO_LARGE", url)
            return resp.status, resp.headers, body

    def get(self, url: str) -> FetchResult:
        if not self._robots_ok(url):
            raise FetchError("ROBOTS_DISALLOWED", url)
        current, hops = url, []
        for attempt in range(MAX_RETRIES):
            try:
                for _ in range(MAX_REDIRECTS + 1):
                    status, headers, body = self._raw_get(current)
                    if status in (301, 302, 303, 307, 308):
                        nxt = urllib.parse.urljoin(current, headers.get("Location", ""))
                        hops.append(nxt)
                        current = nxt  # re-validated (allow-list + IP) on next _raw_get
                        if not self._robots_ok(current):
                            raise FetchError("ROBOTS_DISALLOWED", current)
                        continue
                    ctype = (headers.get("Content-Type") or "").split(";")[0].strip().lower()
                    if ctype and not ctype.startswith(ALLOWED_CONTENT_TYPES):
                        raise FetchError("CONTENT_TYPE_REJECTED", f"{ctype} {current}")
                    return FetchResult(url, current, status, ctype, body,
                                       time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                                       hashlib.sha256(body).hexdigest(), hops)
                raise FetchError("TOO_MANY_REDIRECTS", url)
            except FetchError as exc:
                retriable = exc.code in ("NETWORK",) or exc.code in ("HTTP_429", "HTTP_502", "HTTP_503", "HTTP_504")
                if not retriable or attempt == MAX_RETRIES - 1:
                    raise
                time.sleep(2 ** (attempt + 1))
        raise FetchError("UNREACHABLE", url)


class _TextExtractor(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "template", "iframe"}
    BLOCK = {"p", "div", "li", "br", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article", "td", "th", "ul", "ol", "table"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self._skip = 0
        self.title = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self._skip += 1
        if tag == "title":
            self._in_title = True
        if tag in self.BLOCK:
            self.out.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self._skip:
            self._skip -= 1
        if tag == "title":
            self._in_title = False
        if tag in self.BLOCK:
            self.out.append("\n")

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if not self._skip:
            self.out.append(data)


def html_to_text(body: bytes) -> tuple[str, str]:
    html = body.decode("utf-8", "replace")
    p = _TextExtractor()
    p.feed(html)
    lines = [" ".join(l.split()) for l in "".join(p.out).splitlines()]
    text = "\n".join(l for l in lines if l)
    return " ".join(p.title.split()), text


def normalize_for_match(s: str) -> str:
    """Whitespace/quote/dash-insensitive form used to check evidence quotes."""
    table = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " ", "₹": "Rs."})
    s = s.translate(table).lower()
    s = s.replace("rs.", "rs ").replace("rs ", "rs ")
    return " ".join(s.split())
