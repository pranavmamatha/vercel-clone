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
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "Inter, sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 48px", borderBottom: "1px solid #141414",
      }}>
        <span style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.8px" }}>
          per<span style={{ color: "#11cd2f" }}>cel</span>
          <span style={{
            marginLeft: "8px", fontSize: "10px", fontWeight: 500, color: "#444",
            letterSpacing: "1px", verticalAlign: "middle", textTransform: "uppercase",
          }}>mini vercel</span>
        </span>
        <div style={{ display: "flex", gap: "24px", fontSize: "13px", fontWeight: 500 }}>
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
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 80px", display: "flex", gap: "24px" }}>

        {/* Left: main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Hero */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "2.5px", color: "#11cd2f", marginBottom: "12px" }}>
              DEPLOY ANYTHING
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 700, letterSpacing: "-2px", lineHeight: 1.1, margin: "0 0 12px" }}>
              <span style={{ color: "#333" }}>Your GitHub repo,</span><br />
              <span style={{ color: "#fff" }}>live in seconds.</span>
            </h1>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              Deploy your React applications here. Powered by AWS ECS Fargate + S3.
            </p>
          </div>

          {/* Sample repos */}
          <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SAMPLE_REPOS.map(r => (
              <button key={r.url} onClick={() => copySample(r.url)}
                title={r.url}
                style={{
                  background: copiedSample === r.url ? "#0a2e10" : "#0d0d0d",
                  border: `1px solid ${copiedSample === r.url ? "#11cd2f" : "#1e1e1e"}`,
                  borderRadius: "8px", padding: "7px 14px",
                  color: copiedSample === r.url ? "#11cd2f" : "#888",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  fontFamily: "Inter, sans-serif", transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (copiedSample !== r.url) { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#fff"; }}}
                onMouseLeave={e => { if (copiedSample !== r.url) { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#888"; }}}
              >
                {copiedSample === r.url ? "✓ copied" : r.label}
              </button>
            ))}
          </div>

          {/* Deploy input */}
          <div style={{
            background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "14px",
            padding: "20px", marginBottom: "14px",
          }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={gitURL}
                onChange={e => setGitURL(e.target.value)}
                onKeyDown={e => e.key === "Enter" && deploy()}
                placeholder="https://github.com/username/repo"
                style={{
                  flex: 1, background: "#000", border: "1px solid #222",
                  borderRadius: "9px", padding: "12px 16px", color: "#fff",
                  fontSize: "14px", fontFamily: "Inter, sans-serif", outline: "none",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "#11cd2f")}
                onBlur={e => (e.currentTarget.style.borderColor = "#222")}
              />
              <button onClick={deploy} disabled={loading || !gitURL.trim()}
                style={{
                  background: loading ? "#0a5018" : "#11cd2f",
                  color: "#000", border: "none", borderRadius: "9px",
                  padding: "12px 22px", fontSize: "14px", fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  opacity: !gitURL.trim() ? 0.4 : 1,
                  whiteSpace: "nowrap", transition: "opacity 0.2s",
                  fontFamily: "Inter, sans-serif",
                }}>
                {loading ? "Deploying…" : "Deploy →"}
              </button>
            </div>
            {error && <div style={{ marginTop: "10px", color: "#ff4c4c", fontSize: "13px" }}>✕ {error}</div>}
          </div>

          {/* Result card */}
          {slug && (
            <div style={{
              background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "14px",
              padding: "16px 20px", marginBottom: "14px",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px",
            }}>
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "2px", color: done ? "#11cd2f" : "#555", fontWeight: 600, marginBottom: "5px" }}>
                  {done ? "✓ DEPLOYED" : "BUILDING..."}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.3px" }}>{slug}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                {deployUrl && (
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
                )}
                {done && deployUrl && (
                  <a href={deployUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      background: "#11cd2f", color: "#000", borderRadius: "8px",
                      padding: "8px 18px", fontSize: "13px", fontWeight: 700,
                      textDecoration: "none", transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                    Visit Site ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Build logs */}
          {active && (
            <div style={{
              background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "14px", padding: "18px 20px",
            }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#11cd2f", fontWeight: 600, marginBottom: "12px" }}>
                BUILD LOGS
              </div>
              <div style={{
                background: "#000", borderRadius: "9px", padding: "14px 18px",
                fontFamily: "'Courier New', monospace", fontSize: "12.5px", color: "#999",
                height: "460px", overflowY: "auto",
                display: "flex", flexDirection: "column", gap: "2px",
              }}>
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

        {/* Right: How it works sidebar */}
        <div style={{ width: "240px", flexShrink: 0 }}>
          <div style={{
            background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "14px",
            padding: "20px", position: "sticky", top: "24px",
          }}>
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#11cd2f", fontWeight: 600, marginBottom: "20px" }}>
              HOW IT WORKS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

            <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #181818" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#333", fontWeight: 600, marginBottom: "12px" }}>
                STACK
              </div>
              {["Next.js", "AWS ECS Fargate", "S3 + Reverse Proxy", "Redis", "Socket.io"].map(s => (
                <div key={s} style={{ fontSize: "12px", color: "#444", marginBottom: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#11cd2f", display: "inline-block", flexShrink: 0 }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #111", padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: "#333" }}>
          built by{" "}
          <a href="https://github.com/pranavmamatha" target="_blank" rel="noopener noreferrer"
            style={{ color: "#444", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#444")}>
            pranav
          </a>
        </span>
        <a href="https://github.com/pranavmamatha/vercel-clone" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#333", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#555")}
          onMouseLeave={e => (e.currentTarget.style.color = "#333")}>
          view source
        </a>
      </div>
    </div>
  );
}
