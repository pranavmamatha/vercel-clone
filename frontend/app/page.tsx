"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:9001";

type LogEntry = {
  id: string;
  text: string;
  ts: number;
};

export default function Home() {
  const [gitURL, setGitURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const subscribe = (projectSlug: string) => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe", `logs:${projectSlug}`);
    });

    socket.on("message", (msg: string) => {
      setLogs((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text: msg, ts: Date.now() },
      ]);
    });
  };

  const deploy = async () => {
    if (!gitURL.trim()) return;
    setError(null);
    setLogs([]);
    setSlug(null);
    setDeployUrl(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gitURL: gitURL.trim() }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const { projectSlug, url } = data.data;
      setSlug(projectSlug);
      setDeployUrl(url);
      subscribe(projectSlug);
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
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#131315",
        padding: "16px 40px",
        borderRadius: "44px",
        margin: "20px 40px",
        fontSize: "18px",
        fontWeight: 500,
        letterSpacing: "-0.8px",
      }}>
        <span style={{ fontWeight: 700, fontSize: "20px", letterSpacing: "-1px" }}>
          per<span style={{ color: "#11cd2f" }}>cel</span>
        </span>
        <div style={{ display: "flex", gap: "36px", color: "#8a8a93", fontSize: "16px", fontWeight: 600 }}>
          <a href="https://github.com/pranavmamatha/vercel-clone" target="_blank" rel="noopener noreferrer"
            style={{ color: "#8a8a93", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8a8a93")}>
            GitHub
          </a>
          <a href="https://github.com/pranavmamatha" target="_blank" rel="noopener noreferrer"
            style={{ color: "#8a8a93", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8a8a93")}>
            By Pranav
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "80px 11% 40px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Heading card */}
          <div style={{
            flexGrow: 2,
            background: "#131315",
            padding: "40px",
            borderRadius: "20px",
            minWidth: "300px",
          }}>
            <div style={{ color: "#11cd2f", fontSize: "14px", fontWeight: 600, letterSpacing: "2px", marginBottom: "20px" }}>
              DEPLOY ANYTHING
            </div>
            <div style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-2px", color: "#8a8a93", lineHeight: 1.2 }}>
              Your GitHub repo,{" "}
              <span style={{ color: "#fff" }}>live in seconds.</span>
            </div>
          </div>

          {/* Stats card */}
          <div style={{
            background: "#131315",
            padding: "40px",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "16px",
            minWidth: "200px",
          }}>
            <div>
              <div style={{ fontSize: "44px", fontWeight: 700, color: "#11cd2f", letterSpacing: "-2px" }}>∞</div>
              <div style={{ color: "#8a8a93", fontSize: "14px", fontWeight: 600 }}>Deployments</div>
            </div>
            <div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#fff", letterSpacing: "-1px" }}>AWS</div>
              <div style={{ color: "#8a8a93", fontSize: "14px", fontWeight: 600 }}>Powered by ECS Fargate</div>
            </div>
          </div>
        </div>

        {/* Deploy Input */}
        <div style={{
          background: "#131315",
          padding: "40px",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "2px", color: "#11cd2f" }}>
            NEW DEPLOYMENT
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              value={gitURL}
              onChange={(e) => setGitURL(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && deploy()}
              placeholder="https://github.com/username/repo"
              style={{
                flex: 1,
                minWidth: "260px",
                background: "#000",
                border: "1px solid #2a2a2e",
                borderRadius: "12px",
                padding: "14px 20px",
                color: "#fff",
                fontSize: "16px",
                fontFamily: "Inter, sans-serif",
                outline: "none",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#11cd2f")}
              onBlur={e => (e.currentTarget.style.borderColor = "#2a2a2e")}
            />
            <button
              onClick={deploy}
              disabled={loading || !gitURL.trim()}
              style={{
                background: loading ? "#0a6b18" : "#11cd2f",
                color: "#000",
                border: "none",
                borderRadius: "12px",
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                letterSpacing: "-0.5px",
                transition: "all 0.2s",
                opacity: loading || !gitURL.trim() ? 0.7 : 1,
              }}
            >
              {loading ? "Deploying..." : "Deploy →"}
            </button>
          </div>

          {error && (
            <div style={{ color: "#ff4444", fontSize: "14px", fontWeight: 500 }}>
              ✕ {error}
            </div>
          )}
        </div>

        {/* Result + Logs */}
        {(slug || logs.length > 0) && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {slug && (
              <div style={{
                background: "#131315",
                padding: "32px",
                borderRadius: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: "260px",
              }}>
                <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "2px", color: "#11cd2f" }}>
                  DEPLOYMENT QUEUED
                </div>
                <div style={{ color: "#fff", fontSize: "20px", fontWeight: 600, letterSpacing: "-0.5px" }}>
                  {slug}
                </div>
                {deployUrl && (
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#11cd2f",
                      fontSize: "14px",
                      fontWeight: 600,
                      wordBreak: "break-all",
                      textDecoration: "none",
                    }}
                  >
                    {deployUrl} ↗
                  </a>
                )}
              </div>
            )}

            {logs.length > 0 && (
              <div style={{
                flexGrow: 1,
                background: "#131315",
                borderRadius: "20px",
                padding: "32px",
                minWidth: "300px",
              }}>
                <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "2px", color: "#11cd2f", marginBottom: "16px" }}>
                  BUILD LOGS
                </div>
                <div style={{
                  background: "#000",
                  borderRadius: "12px",
                  padding: "20px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: "#ccc",
                  maxHeight: "320px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}>
                  {logs.map((l) => (
                    <div key={l.id} style={{ lineHeight: 1.6 }}>
                      <span style={{ color: "#8a8a93", marginRight: "8px" }}>›</span>
                      {l.text}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "2px", color: "#11cd2f", marginBottom: "16px" }}>
            HOW IT WORKS
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              { step: "01", title: "Paste Repo", desc: "Drop your GitHub URL — public repos only." },
              { step: "02", title: "AWS Builds", desc: "ECS Fargate spins up a container, clones & builds your code." },
              { step: "03", title: "S3 Serves", desc: "Build output goes to S3. Reverse proxy routes traffic to your slug." },
            ].map((item) => (
              <div key={item.step} style={{
                flex: 1,
                minWidth: "200px",
                background: "#131315",
                borderRadius: "20px",
                padding: "32px",
              }}>
                <div style={{ fontSize: "44px", fontWeight: 700, color: "#11cd2f", letterSpacing: "-2px", marginBottom: "12px" }}>
                  {item.step}
                </div>
                <div style={{ fontSize: "22px", fontWeight: 600, color: "#fff", letterSpacing: "-0.5px", marginBottom: "8px" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "16px", color: "#8a8a93", fontWeight: 500 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "40px",
          padding: "32px 40px",
          background: "#131315",
          borderRadius: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <span style={{ color: "#8a8a93", fontSize: "16px", fontWeight: 600 }}>
            built by <span style={{ color: "#fff" }}>pranav</span>
          </span>
          <div style={{ display: "flex", gap: "24px" }}>
            <a href="https://github.com/pranavmamatha/vercel-clone" target="_blank" rel="noopener noreferrer"
              style={{ color: "#8a8a93", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
              Source
            </a>
            <a href="https://github.com/pranavmamatha" target="_blank" rel="noopener noreferrer"
              style={{ color: "#8a8a93", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
