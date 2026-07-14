import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  ExternalLink,
  Github,
  Menu,
  Play,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';

const PRODUCT_URL = 'https://jk.experienceplus.ai';
const REPO_URL = 'https://github.com/RHI-Org/jikken';

const walkthrough = [
  ['01', 'Catch the conflict', 'The CLI identifies exactly who would lose access and returns exit code 1.', '01-cli-conflict-gradient.jpg'],
  ['02', 'Review the portfolio', 'The Dashboard makes rollout exposure and flag health scannable before a reviewer opens a flag.', '02-flags-portfolio-gradient.jpg'],
  ['03', 'Inspect audience impact', 'Decision counts, governance signals, provenance, and per-user reasoning share one view.', '03-flag-simulation-gradient.jpg'],
  ['04', 'Preserve the audit trail', 'Every verdict stays searchable, attributable, and expandable in Simulation History.', '04-simulation-history-gradient.jpg'],
  ['05', 'Verify the workspace', 'Settings makes the active data source, environments, and authentication model explicit.', '05-settings-gradient.jpg'],
  ['06', 'Use the same contract', 'The SDK asks the same safety question in application code and maps it to process behavior.', '06-sdk-contract-gradient.jpg'],
  ['07', 'Read the machine response', 'Automation receives the same simulation ID, verdict, exit code, and audience summary.', '07-sdk-response-gradient.jpg'],
  ['08', 'Block the risky deploy', 'The CI gate consumes exit code 1 and prevents the change from reaching production.', '08-ci-gate-gradient.jpg'],
];

const principles = [
  'Scannable in 3 seconds',
  'Color is functional',
  'Exit codes are the product',
  'Suggestions beat diagnoses',
  'Consistency is the feature',
  'Reasoning stays transparent',
  'Roles shape the surface',
  'Restraint is intentional',
  'Validate before compute',
  'Failure stays graceful',
];

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const nav = [['Story', '#story'], ['Product', '#product'], ['System', '#system'], ['Principles', '#principles']];
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="wordmark" href="#top" aria-label="Jikken home"><span className="mark">実験</span><span>Jikken</span></a>
        <nav className={open ? 'nav open' : 'nav'} aria-label="Main navigation">
          {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
          <a className="nav-cta" href={PRODUCT_URL} target="_blank" rel="noreferrer">Open product <ExternalLink size={14} /></a>
        </nav>
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      </div>
      <div className="header-line"><span /></div>
    </header>
  );
}

function App() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible'));
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div id="top">
      <Header />

      <main>
        <section className="hero">
          <div className="hero-art" aria-hidden="true">
            <div className="mesh-orb">
              <svg viewBox="0 0 800 800" role="presentation">
                <defs>
                  <radialGradient id="mesh-fill" cx="32%" cy="26%" r="72%"><stop offset="0" stopColor="#fef3c7" /><stop offset=".34" stopColor="#86efac" /><stop offset=".7" stopColor="#22c55e" /><stop offset="1" stopColor="#166534" /></radialGradient>
                  <linearGradient id="mesh-line" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".82" /><stop offset=".55" stopColor="#14532d" stopOpacity=".28" /><stop offset="1" stopColor="#052e16" stopOpacity=".7" /></linearGradient>
                  <clipPath id="mesh-clip"><circle cx="400" cy="400" r="352" /></clipPath>
                  <filter id="mesh-shadow"><feDropShadow dx="0" dy="34" stdDeviation="28" floodColor="#14532d" floodOpacity=".2" /></filter>
                </defs>
                <circle cx="400" cy="400" r="352" fill="url(#mesh-fill)" filter="url(#mesh-shadow)" />
                <g clipPath="url(#mesh-clip)" fill="none" stroke="url(#mesh-line)" strokeWidth="1.4">
                  {[80,140,200,260,320,380,440,500,560,620,680,740].map((y,i)=><path key={`h${y}`} d={`M 22 ${y} Q 210 ${y-90+i*8}, 400 ${y+8} T 778 ${y-25}`} />)}
                  {[70,130,190,250,310,370,430,490,550,610,670,730].map((x,i)=><path key={`v${x}`} d={`M ${x} 20 Q ${x+100-i*7} 210, ${x-4} 400 T ${x+35} 780`} />)}
                  <ellipse cx="400" cy="400" rx="310" ry="122" /><ellipse cx="400" cy="400" rx="348" ry="225" />
                </g>
              </svg>
            </div>
            <div className="mesh-glow" />
          </div>
          <div className="wrap hero-inner">
            <Reveal className="hero-copy">
              <p className="eyebrow">Product engineering · UX systems · 2026</p>
              <h1>One decision.<br /><span>Four surfaces.</span></h1>
              <p className="hero-lede">Jikken governs feature-flag changes across CLI, Dashboard, SDK, and CI—so a decision keeps the same meaning everywhere it is read.</p>
              <div className="pills"><span>Seeded engine</span><span>Explainable decisions</span><span>Governed rollout</span></div>
              <div className="actions">
                <a className="button light" href={PRODUCT_URL} target="_blank" rel="noreferrer"><Play size={17} fill="currentColor" /> Explore the product</a>
                <a className="button ghost" href="#story">Read the case study <ArrowRight size={17} /></a>
              </div>
            </Reveal>
            <Reveal className="hero-terminal">
              <div className="terminal-bar"><i /><i /><i /><span>jikken — simulate</span></div>
              <div className="terminal-body">
                <p><b>$</b> jikken diff dark-mode --rollout 25</p>
                <p className="dim">Evaluating 10 representative users…</p>
                <div className="terminal-rule" />
                <p><span className="good">7 receive</span> · <span className="bad">3 excluded</span></p>
                <p className="bad">CONFLICT — deployment held</p>
                <p className="dim">exit code 1 · sim_49c2eec8</p>
              </div>
            </Reveal>
          </div>
          <a className="scroll-cue" href="#story">Scroll to the story <span /></a>
        </section>

        <section className="section intro" id="story">
          <div className="wrap split">
            <Reveal><p className="eyebrow dark">The premise</p><h2>Code is cheap.<br />Coherence is not.</h2></Reveal>
            <Reveal className="prose"><p>Feature flags begin as a simple switch. At scale, that switch becomes a policy read by engineers, product managers, application code, and delivery pipelines.</p><p>Jikken makes that policy legible and enforceable. A decision is made once, then carried through every surface with its reason, machine contract, and audit trail intact.</p></Reveal>
          </div>
          <div className="wrap stats">
            <Reveal><strong>4</strong><span>coherent product surfaces</span></Reveal>
            <Reveal><strong>1</strong><span>shared decision engine</span></Reveal>
            <Reveal><strong>0–6</strong><span>defined process exit codes</span></Reveal>
            <Reveal><strong>1 day</strong><span>from spec to deployed product</span></Reveal>
          </div>
        </section>

        <section className="section dark-section" id="product">
          <div className="wrap section-heading">
            <Reveal><p className="eyebrow">The product flow</p><h2>A verdict that survives the journey.</h2><p>Follow one targeting change from a developer’s terminal to the production gate.</p></Reveal>
          </div>
          <div className="walkthrough wrap">
            {walkthrough.map(([n, title, text, image], index) => (
              <Reveal className={`walk-row ${index % 2 ? 'reverse' : ''}`} key={n}>
                <div className="walk-copy"><span className="step">{n} / 08</span><h3>{title}</h3><p>{text}</p><a href={PRODUCT_URL} target="_blank" rel="noreferrer">See it live <ChevronRight size={16} /></a></div>
                <div className="product-frame"><img src={`/images/${image}`} alt={`${title} — Jikken product interface`} loading="lazy" /></div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section system" id="system">
          <div className="wrap section-heading dark-copy"><Reveal><p className="eyebrow dark">The system</p><h2>One engine, three runtimes,<br />four ways to consume it.</h2></Reveal></div>
          <div className="wrap runtime-grid">
            <Reveal><Terminal /><span>01</span><h3>CLI</h3><p>Fast, terse, machine-readable. The real process exit code is part of the interface.</p></Reveal>
            <Reveal><CircleDot /><span>02</span><h3>Dashboard</h3><p>Review audience impact, provenance, and history without hiding the rules underneath.</p></Reveal>
            <Reveal><Code2 /><span>03</span><h3>SDK</h3><p>A typed client returns the same verdict and teaches callers how to recover from errors.</p></Reveal>
            <Reveal><ShieldCheck /><span>04</span><h3>CI gate</h3><p>The pipeline enforces the contract and blocks an unsafe rollout before production.</p></Reveal>
          </div>
          <div className="wrap contract">
            <Reveal className="contract-copy"><p className="eyebrow dark">The executable thesis</p><h3>Consistency fails the build.</h3><p>Integration tests enforce color parity, exit-code parity, terminology, and byte-identical engine copies. Coherence is not a design aspiration—it is a release requirement.</p><a className="text-link" href={`${REPO_URL}/blob/main/tests/integration/coherence.test.ts`} target="_blank" rel="noreferrer">Read the coherence suite <ArrowRight size={16} /></a></Reveal>
            <Reveal className="code-card"><div><i /><i /><i /></div><code><span className="muted">// identical input → identical decision</span>{'\n'}expect(cli.exitCode).toBe(engine.exit_code);{'\n'}expect(ui.conflict).toBe(<span className="red">'#dc2626'</span>);{'\n'}expect(edgeEngine).toEqual(sharedEngine);{'\n\n'}<span className="green">✓  coherence contract passed</span></code></Reveal>
          </div>
        </section>

        <section className="section principles" id="principles">
          <div className="wrap split">
            <Reveal><p className="eyebrow dark">Design philosophy</p><h2>Functional color.<br />Transparent reasoning.<br />Intentional restraint.</h2></Reveal>
            <Reveal className="prose"><p>The product avoids a decorative brand palette. Green means receives, red means excluded, and yellow means review—everywhere. The surrounding presentation can tell the story; the interface stays focused on the decision.</p></Reveal>
          </div>
          <div className="wrap principles-grid">
            {principles.map((item, i) => <Reveal key={item}><span>{String(i + 1).padStart(2, '0')}</span><Check size={18} /><p>{item}</p></Reveal>)}
          </div>
        </section>

        <section className="section ai-section">
          <div className="wrap ai-card">
            <Reveal><p className="eyebrow">How it was built</p><h2>AI-native.<br />Human-governed.</h2></Reveal>
            <Reveal className="ai-copy"><p>A written spec led to an implementation plan, agentic build, design review, and automated verification in roughly one working day.</p><p>Models produced options and implementation. Human judgment set the architecture, rejected incoherent output, and decided what was ready to ship.</p><div className="build-flow"><span>Specify</span><ArrowRight /><span>Delegate</span><ArrowRight /><span>Evaluate</span><ArrowRight /><span>Verify</span></div></Reveal>
          </div>
        </section>

        <section className="final-cta">
          <div className="wrap"><Reveal><p className="eyebrow">Jikken means experiment</p><h2>See the decision move.</h2><p>Try the guided product, inspect the real interfaces, or read the source.</p><div className="actions centered"><a className="button light" href={PRODUCT_URL} target="_blank" rel="noreferrer">Launch Jikken <ExternalLink size={17} /></a><a className="button ghost" href={REPO_URL} target="_blank" rel="noreferrer"><Github size={18} /> View source</a></div></Reveal></div>
        </section>
      </main>

      <footer><div className="wrap"><a className="wordmark" href="#top"><span className="mark">実験</span><span>Jikken</span></a><p>A product engineering and UX systems case study.</p><span>© 2026 Ryan Hanau</span></div></footer>
    </div>
  );
}

export default App;
