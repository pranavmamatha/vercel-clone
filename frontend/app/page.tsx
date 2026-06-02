"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:9001";

type LogEntry = { id: string; text: string };

export default function Home() {
  const [gitURL, setGitURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
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
    socket.on("message", (msg: string) =>
      setLogs(prev => [...prev, { id: crypto.randomUUID(), text: msg }])
    );
  };

  const deploy = async () => {
    if (!gitURL.trim()) return;
    setError(null); setLogs([]); setSlug(null); setDeployUrl(null); setLoading(true);
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

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "Inter, sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 48px", borderBottom: "1px solid #1a1a1a",
      }}>
        <span style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.8px" }}>
          per<span style={{ color: "#11cd2f" }}>cel</span>
          <span style={{ marginLeft: "10px", fontSize: "11px", fontWeight: 500, color: "#555", letterSpacing: "1px", verticalAlign: "middle" }}>
            mini vercel
          </span>
        </span>
        <div style={{ display: "flex", gap: "28px", fontSize: "14px", fontWeight: 500 }}>
          <a href="https://github.com/pranavmamatha/vercel-clone" target="_blank" rel="noopener noreferrer"
            style={{ color: "#555", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
            GitHub
          </a>
          <a href="https://github.com/pranavmamatha" target="_blank" rel="noopener noreferrer"
            style={{ color: "#555", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
            By Pranav
          </a>
        </div>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Hero */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "2.5px", color: "#11cd2f", marginBottom: "14px" }}>
            DEPLOY ANYTHING
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-2px", lineHeight: 1.1, margin: 0 }}>
            <span style={{ color: "#444" }}>Your GitHub repo,</span><br />
            <span style={{ color: "#fff" }}>live in seconds.</span>
          </h1>
          <p style={{ marginTop: "16px", color: "#555", fontSize: "15px", fontWeight: 400, lineHeight: 1.6 }}>
            Deploy your React applications here. Powered by AWS ECS Fargate + S3.
          </p>
        </div>

        {/* Deploy input */}
        <div style={{
          background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "16px",
          padding: "24px", marginBottom: "16px",
        }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={gitURL}
              onChange={e => setGitURL(e.target.value)}
              onKeyDown={e => e.key === "Enter" && deploy()}
              placeholder="https://github.com/username/repo"
              style={{
                flex: 1,
                background: "#000", border: "1px solid #222", borderRadius: "10px",
                padding: "13px 16px", color: "#fff", fontSize: "14px",
                fontFamily: "Inter, sans-serif", outline: "none",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#11cd2f")}
              onBlur={e => (e.currentTarget.style.borderColor = "#222")}
            />
            <button
              onClick={deploy}
              disabled={loading || !gitURL.trim()}
              style={{
                background: loading ? "#0a5018" : "#11cd2f",
                color: "#000", border: "none", borderRadius: "10px",
                padding: "13px 24px", fontSize: "14px", fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                opacity: !gitURL.trim() ? 0.5 : 1,
                whiteSpace: "nowrap", transition: "opacity 0.2s",
              }}
            >
              {loading ? "Deploying…" : "Deploy →"}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: "12px", color: "#ff4c4c", fontSize: "13px" }}>
              ✕ {error}
            </div>
          )}
        </div>

        {/* Result row */}
        {slug && (
          <div style={{
            background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "16px",
            padding: "20px 24px", marginBottom: "16px",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px",
          }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#11cd2f", fontWeight: 600, marginBottom: "6px" }}>
                DEPLOYMENT QUEUED
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.3px" }}>{slug}</div>
            </div>
            {deployUrl && (
              <a href={deployUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: "#11cd2f", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                {deployUrl} ↗
              </a>
            )}
          </div>
        )}

        {/* Build logs */}
        {(slug || logs.length > 0) && (
          <div style={{
            background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "16px",
            padding: "20px 24px", marginBottom: "16px",
          }}>
            <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#11cd2f", fontWeight: 600, marginBottom: "14px" }}>
              BUILD LOGS
            </div>
            <div style={{
              background: "#000", borderRadius: "10px", padding: "16px 20px",
              fontFamily: "'Courier New', monospace", fontSize: "13px", color: "#aaa",
              height: "420px", overflowY: "auto",
              display: "flex", flexDirection: "column", gap: "3px",
            }}>
              {logs.length === 0 ? (
                <span style={{ color: "#333" }}>Waiting for build output…</span>
              ) : (
                logs.map(l => (
                  <div key={l.id} style={{ lineHeight: 1.7 }}>
                    <span style={{ color: "#11cd2f", marginRight: "8px" }}>›</span>
                    {l.text}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* How it works — accordion */}
        <div style={{
          background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "16px",
          overflow: "hidden",
        }}>
          <button
            onClick={() => setHowOpen(o => !o)}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
              color: "#fff", fontFamily: "Inter, sans-serif",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.3px" }}>How it works</span>
            <span style={{ color: "#555", fontSize: "16px", transition: "transform 0.2s", transform: howOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              ↓
            </span>
          </button>
          {howOpen && (
            <div style={{ borderTop: "1px solid #1a1a1a", padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  { n: "01", title: "Paste your repo URL", desc: "Any public GitHub repository works." },
                  { n: "02", title: "AWS builds it", desc: "ECS Fargate spins up a container, clones your repo, runs npm run build." },
                  { n: "03", title: "S3 serves it", desc: "Build output is uploaded to S3. A reverse proxy maps your slug to a live URL." },
                ].map(item => (
                  <div key={item.n} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#11cd2f", minWidth: "24px" }}>{item.n}</span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{item.title}</div>
                      <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "#333" }}>
            built by <a href="https://github.com/pranavmamatha" target="_blank" rel="noopener noreferrer"
              style={{ color: "#555", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#555")}>pranav</a>
          </span>
          <a href="https://github.com/pranavmamatha/vercel-clone" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "13px", color: "#333", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#555")}
            onMouseLeave={e => (e.currentTarget.style.color = "#333")}>
            view source
          </a>
        </div>
      </div>
    </div>
  );
}
