"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:9001";

const SAMPLE_REPOS = [
  { label: "Brainwave", url: "https://github.com/adrianhajdin/brainwave" },
  { label: "Nike Landing", url: "https://github.com/adrianhajdin/nike_landing_page" },
  { label: "iPhone Clone", url: "https://github.com/adrianhajdin/iphone" },
  { label: "3D Portfolio", url: "https://github.com/adrianhajdin/project_3D_developer_portfolio" },
  { label: "Animated Portfolio", url: "https://github.com/safak/animated-portfolio" },
];

type LogEntry = { id: string; text: string };

function parseLog(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.log !== undefined) return parsed.log;
  } catch {}
  return raw;
}

export default function Home() {
  const [gitURL, setGitURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSample, setCopiedSample] = useState<string | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  const subscribe = (projectSlug: string) => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("subscribe", `logs:${projectSlug}`));
    socket.on("message", (msg: string) => {
      const text = parseLog(msg);
      setLogs(prev => [...prev, { id: crypto.randomUUID(), text }]);
      if (text.includes("Done...")) setDone(true);
    });
  };

  const deploy = async () => {
    if (!gitURL.trim()) return;
    setError(null); setLogs([]); setSlug(null); setDeployUrl(null);
    setLoading(true); setDone(false);
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gitURL: gitURL.trim() }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const { data } = await res.json();
      setSlug(data.projectSlug);
      setDeployUrl(data.url);
      subscribe(data.projectSlug);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    if (!deployUrl) return;
    navigator.clipboard.writeText(deployUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copySample = (url: string) => {
    navigator.clipboard.writeText(url);
    setGitURL(url);
    setCopiedSample(url);
    setTimeout(() => setCopiedSample(null), 2000);
  };

  const active = !!slug || logs.length > 0;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html { font-size: 16px; }

        .nav { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; border-bottom: 1px solid #141414; }
        .nav-links { display: flex; gap: 20px; }

        .body { max-width: 1100px; margin: 0 auto; padding: 32px 20px 80px; display: flex; gap: 24px; align-items: flex-start; }
        .main { flex: 1; min-width: 0; }
        .sidebar { width: 220px; flex-shrink: 0; }
        .sidebar-card { background: #0d0d0d; border: 1px solid #1e1e1e; border-radius: 14px; padding: 20px; position: sticky; top: 20px; }

        .hero { margin-bottom: 24px; }
        .hero h1 { font-size: clamp(26px, 5vw, 44px); font-weight: 700; letter-spacing: -2px; line-height: 1.1; margin: 0 0 10px; }

        .samples { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }

        .input-row { display: flex; gap: 10px; }
        .deploy-input { flex: 1; min-width: 0; background: #000; border: 1px solid #222; border-radius: 9px; padding: 12px 16px; color: #fff; font-size: 14px; font-family: Inter, sans-serif; outline: none; width: 100%; }
        .deploy-btn { background: #11cd2f; color: #000; border: none; border-radius: 9px; padding: 12px 20px; font-size: 14px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: Inter, sans-serif; flex-shrink: 0; }

        .result-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .result-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

        .logs-box { height: 420px; overflow-y: auto; background: #000; border-radius: 9px; padding: 14px 16px; font-family: 'Courier New', monospace; font-size: 12.5px; color: #999; display: flex; flex-direction: column; gap: 2px; }

        /* Mobile accordion for sidebar */
        .how-accordion { display: none; background: #0d0d0d; border: 1px solid #1e1e1e; border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
        .how-accordion-btn { width: 100%; background: none; border: none; cursor: pointer; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; color: #fff; font-family: Inter, sans-serif; font-size: 13px; font-weight: 600; }
        .how-accordion-body { padding: 0 18px 18px; border-top: 1px solid #1a1a1a; }

        @media (max-width: 768px) {
          .nav { padding: 12px 16px; }
          .body { flex-direction: column; padding: 20px 16px 60px; gap: 14px; }
          .sidebar { display: none; }
          .how-accordion { display: block; }
          .input-row { flex-direction: column; }
          .deploy-btn { width: 100%; padding: 14px; font-size: 15px; }
          .deploy-input { font-size: 15px; padding: 13px 16px; }
          .result-row { flex-direction: column; align-items: flex-start; }
          .result-actions { width: 100%; }
          .result-actions a, .result-actions button { flex: 1; text-align: center; }
          .logs-box { height: 340px; font-size: 11.5px; padding: 12px; }
          .samples { gap: 6px; }
        }

        @media (max-width: 400px) {
          .hero h1 { letter-spacing: -1px; }
          .nav-links { gap: 14px; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "Inter, sans-serif" }}>

        {/* Navbar */}
        <nav className="nav">
          <span style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.8px" }}>
            per<span style={{ color: "#11cd2f" }}>cel</span>
            <span style={{ marginLeft: "8px", fontSize: "10px", fontWeight: 500, color: "#444", letterSpacing: "1px", verticalAlign: "middle" }}>mini vercel</span>
          </span>
          <div className="nav-links" style={{ fontSize: "13px", fontWeight: 500 }}>
            {[
              { label: "GitHub", href: "https://github.com/pranavmamatha/vercel-clone" },
              { label: "By Pranav", href: "https://github.com/pranavmamatha" },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                style={{ color: "#444", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#444")}>
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Body */}
        <div className="body">

          {/* Left: main */}
          <div className="main">

            {/* Hero */}
            <div className="hero">
              <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "2.5px", color: "#11cd2f", marginBottom: "10px" }}>
                DEPLOY ANYTHING
              </div>
              <h1>
                <span style={{ color: "#333" }}>Your GitHub repo,</span><br />
                <span style={{ color: "#fff" }}>live in seconds.</span>
              </h1>
              <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                Deploy your React applications here. Powered by AWS ECS Fargate + S3.
              </p>
            </div>

            {/* Mobile: how it works accordion */}
            <div className="how-accordion">
              <button className="how-accordion-btn" onClick={() => setHowOpen(o => !o)}>
                <span>How it works</span>
                <span style={{ color: "#555", transform: howOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>↓</span>
              </button>
              {howOpen && (
                <div className="how-accordion-body">
                  <HowSteps />
                </div>
              )}
            </div>

            {/* Sample repos */}
            <div className="samples">
              {SAMPLE_REPOS.map(r => (
                <button key={r.url} onClick={() => copySample(r.url)} title={r.url}
                  style={{
                    background: copiedSample === r.url ? "#0a2e10" : "#0d0d0d",
                    border: `1px solid ${copiedSample === r.url ? "#11cd2f" : "#1e1e1e"}`,
                    borderRadius: "8px", padding: "7px 13px",
                    color: copiedSample === r.url ? "#11cd2f" : "#777",
                    fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    fontFamily: "Inter, sans-serif", transition: "all 0.15s",
                  }}>
                  {copiedSample === r.url ? "✓ copied" : r.label}
                </button>
              ))}
            </div>

            {/* Deploy input */}
            <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "14px", padding: "18px", marginBottom: "12px", marginTop: "12px" }}>
              <div className="input-row">
                <input
                  type="text"
                  value={gitURL}
                  onChange={e => setGitURL(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && deploy()}
                  placeholder="https://github.com/username/repo"
                  className="deploy-input"
                  onFocus={e => (e.currentTarget.style.borderColor = "#11cd2f")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#222")}
                />
                <button onClick={deploy} disabled={loading || !gitURL.trim()} className="deploy-btn"
                  style={{
                    background: loading ? "#0a5018" : "#11cd2f",
                    opacity: !gitURL.trim() ? 0.4 : 1,
                    cursor: loading ? "wait" : "pointer",
                  }}>
                  {loading ? "Deploying…" : "Deploy →"}
                </button>
              </div>
              {error && <div style={{ marginTop: "10px", color: "#ff4c4c", fontSize: "13px" }}>✕ {error}</div>}
            </div>

            {/* Result */}
            {slug && (
              <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "14px", padding: "16px 18px", marginBottom: "12px" }}>
                <div className="result-row">
                  <div>
                    <div style={{ fontSize: "10px", letterSpacing: "2px", color: done ? "#11cd2f" : "#555", fontWeight: 600, marginBottom: "4px" }}>
                      {done ? "✓ DEPLOYED" : "BUILDING..."}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.3px" }}>{slug}</div>
                    {done && deployUrl && (
                      <div style={{ fontSize: "12px", color: "#555", marginTop: "4px", wordBreak: "break-all" }}>{deployUrl}</div>
                    )}
                  </div>
                  {done && deployUrl && (
                    <div className="result-actions">
                      <button onClick={copyUrl}
                        style={{
                          background: copiedUrl ? "#0a2e10" : "#111",
                          border: `1px solid ${copiedUrl ? "#11cd2f" : "#222"}`,
                          borderRadius: "8px", padding: "8px 16px",
                          color: copiedUrl ? "#11cd2f" : "#888",
                          fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          fontFamily: "Inter, sans-serif", transition: "all 0.15s",
                        }}>
                        {copiedUrl ? "✓ Copied" : "Copy URL"}
                      </button>
                      <a href={deployUrl} target="_blank" rel="noopener noreferrer"
                        style={{
                          background: "#11cd2f", color: "#000", borderRadius: "8px",
                          padding: "8px 18px", fontSize: "13px", fontWeight: 700,
                          textDecoration: "none", display: "inline-block",
                        }}>
                        Visit Site ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Build logs */}
            {active && (
              <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "14px", padding: "16px 18px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#11cd2f", fontWeight: 600, marginBottom: "10px" }}>
                  BUILD LOGS
                </div>
                <div className="logs-box">
                  {logs.length === 0
                    ? <span style={{ color: "#2a2a2a" }}>Waiting for build output…</span>
                    : logs.map(l => (
                      <div key={l.id} style={{ lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        <span style={{ color: "#11cd2f", marginRight: "6px", userSelect: "none" }}>›</span>
                        {l.text}
                      </div>
                    ))
                  }
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Desktop sidebar */}
          <div className="sidebar">
            <div className="sidebar-card">
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#11cd2f", fontWeight: 600, marginBottom: "18px" }}>
                HOW IT WORKS
              </div>
              <HowSteps />
              <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #181818" }}>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#333", fontWeight: 600, marginBottom: "10px" }}>STACK</div>
                {["Next.js", "AWS ECS Fargate", "S3 + Reverse Proxy", "Redis", "Socket.io"].map(s => (
                  <div key={s} style={{ fontSize: "12px", color: "#444", marginBottom: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#11cd2f", flexShrink: 0, display: "inline-block" }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #111", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#333" }}>
            built by{" "}
            <a href="https://github.com/pranavmamatha" target="_blank" rel="noopener noreferrer"
              style={{ color: "#444", textDecoration: "none" }}>pranav</a>
          </span>
          <a href="https://github.com/pranavmamatha/vercel-clone" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "12px", color: "#333", textDecoration: "none" }}>
            view source
          </a>
        </div>
      </div>
    </>
  );
}

function HowSteps() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {[
        { n: "01", title: "Paste repo URL", desc: "Any public GitHub repository." },
        { n: "02", title: "AWS builds it", desc: "ECS Fargate clones your repo and runs npm run build." },
        { n: "03", title: "S3 serves it", desc: "Output uploads to S3. Your slug maps to a live URL." },
      ].map(item => (
        <div key={item.n} style={{ display: "flex", gap: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#11cd2f", minWidth: "20px", paddingTop: "2px" }}>{item.n}</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "#fff" }}>{item.title}</div>
            <div style={{ fontSize: "12px", color: "#444", lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
