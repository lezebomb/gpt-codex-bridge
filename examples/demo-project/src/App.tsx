import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Demo project</p>
        <h1>ChatGPT Codex Orchestrator</h1>
        <p className="summary">
          This small project is safe to use when testing web patches and Codex review jobs.
        </p>
        <div className="actions">
          <button>Start workflow</button>
          <button className="secondary">Read guide</button>
        </div>
      </section>
    </main>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
