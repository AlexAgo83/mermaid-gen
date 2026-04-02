import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img className="brand-mark" src="/icon.svg" alt="" />
          <div className="brand-copy">
            <h1>Mermaid Generator</h1>
            <p>Focused Mermaid authoring, preview, generation, and export.</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button type="button" disabled>
            Settings
          </button>
        </div>
      </header>

      <main className="foundation-layout">
        <section className="panel panel-side">
          <div className="panel-header">
            <h2>Editor lane</h2>
            <span>Wave 2</span>
          </div>
          <div className="placeholder-block">
            Mermaid source editing will land in the next delivery wave.
          </div>

          <div className="panel-header">
            <h2>Prompt lane</h2>
            <span>Wave 3</span>
          </div>
          <div className="placeholder-block muted">
            Local OpenAI configuration and prompt gating will be added after the
            authoring workspace is in place.
          </div>
        </section>

        <section className="panel panel-main">
          <div className="panel-header">
            <h2>Preview workspace</h2>
            <span>Foundation ready</span>
          </div>
          <div className="placeholder-preview">
            <div className="placeholder-card">
              <p>Static React, Vite, and PWA baseline is active.</p>
              <p>
                Branding, docs, release workflow, and MVP orchestration are now
                connected to the application shell.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
