import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

/* ─────────────────────────────────────────────
   Animated ECG SVG (looping draw)
───────────────────────────────────────────── */
const AnimatedECG = () => (
  <svg viewBox="0 0 800 120" className="hero-ecg-svg" aria-hidden="true">
    <defs>
      <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#00d4aa" stopOpacity="0" />
        <stop offset="30%"  stopColor="#00d4aa" stopOpacity="1" />
        <stop offset="70%"  stopColor="#00d4aa" stopOpacity="1" />
        <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    {/* Background grid lines */}
    {[20,40,60,80,100].map(y => (
      <line key={y} x1="0" y1={y} x2="800" y2={y}
        stroke="rgba(0,212,170,0.06)" strokeWidth="1" />
    ))}
    {[0,80,160,240,320,400,480,560,640,720,800].map(x => (
      <line key={x} x1={x} y1="0" x2={x} y2="120"
        stroke="rgba(0,212,170,0.06)" strokeWidth="1" />
    ))}
    {/* Main ECG trace */}
    <polyline
      className="ecg-trace"
      points="
        0,60 30,60 40,55 45,65 50,60
        80,60 90,55 95,65 100,60
        130,60 140,55 145,65 150,60
        160,60 165,20 170,100 175,10 180,95 185,60
        210,60 220,55 225,65 230,60
        260,60 265,20 270,100 275,10 280,95 285,60
        310,60 315,72 320,48 325,60
        350,60 360,55 365,65 370,60
        400,60 405,20 410,100 415,10 420,95 425,60
        450,60 460,55 465,65 470,60
        500,60 505,20 510,100 515,10 520,95 525,60
        550,60 565,72 570,48 575,60
        600,60 610,55 615,65 620,60
        650,60 655,20 660,100 665,10 670,95 675,60
        700,60 710,55 715,65 720,60
        750,60 755,20 760,100 765,10 770,95 775,60
        800,60"
      fill="none"
      stroke="url(#ecgGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#glow)"
    />
    {/* Anomaly markers */}
    {[175, 415, 665].map((x, i) => (
      <g key={i}>
        <circle cx={x} cy="10" r="5" fill="rgba(255,71,87,0)" className="anomaly-ring" />
        <circle cx={x} cy="10" r="3" fill="#ff4757" className="anomaly-dot-lp" />
      </g>
    ))}
  </svg>
);

/* ─────────────────────────────────────────────
   Floating Stat Card
───────────────────────────────────────────── */
const FloatCard = ({ value, label, color, delay, icon }) => (
  <div className="float-card fade-up" style={{ animationDelay: delay, '--fc-color': color }}>
    <span className="float-card-icon">{icon}</span>
    <span className="float-card-value">{value}</span>
    <span className="float-card-label">{label}</span>
  </div>
);

/* ─────────────────────────────────────────────
   Feature Card
───────────────────────────────────────────── */
const FeatureCard = ({ icon, title, desc, color, delay }) => (
  <div className="feature-card fade-up" style={{ animationDelay: delay, '--fc-accent': color }}>
    <div className="feature-icon" style={{ background: `${color}18`, color }}>
      {icon}
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{desc}</p>
  </div>
);

/* ─────────────────────────────────────────────
   Step Card
───────────────────────────────────────────── */
const StepCard = ({ num, title, desc, delay }) => (
  <div className="step-card fade-up" style={{ animationDelay: delay }}>
    <div className="step-num">{num}</div>
    <div>
      <h4 className="step-title">{title}</h4>
      <p className="step-desc">{desc}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Stat metric (model performance row)
───────────────────────────────────────────── */
const MetricBar = ({ label, value, pct, color, delay }) => (
  <div className="metric-bar-row fade-up" style={{ animationDelay: delay }}>
    <span className="metric-bar-label">{label}</span>
    <div className="metric-bar-track">
      <div
        className="metric-bar-fill"
        style={{ '--bar-pct': `${pct}%`, '--bar-color': color }}
      />
    </div>
    <span className="metric-bar-value" style={{ color }}>{value}</span>
  </div>
);

/* ─────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing">

      {/* ── NAV ── */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <svg viewBox="0 0 32 32" width={20} height={20} fill="none" aria-hidden="true">
              <polyline points="2,16 8,16 11,8 14,24 17,4 20,28 23,16 30,16"
                stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Cardio<b>Scan</b></span>
          </div>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#model">Model</a>
            <a href="#how">How it works</a>
          </div>
          <button className="lp-cta-btn" onClick={() => navigate('/dashboard')}>
            Open Dashboard →
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════ */}
      <section className="hero">
        {/* Radial glow background */}
        <div className="hero-glow hero-glow-teal" aria-hidden="true" />
        <div className="hero-glow hero-glow-blue" aria-hidden="true" />

        {/* Grid overlay */}
        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-badge fade-up">
            <span className="hero-badge-dot" />
            AI-Powered Cardiac Analysis
          </div>

          <h1 className="hero-heading fade-up" style={{ animationDelay: '80ms' }}>
            Detect ECG Anomalies<br />
            <span className="hero-heading-accent">at the Speed of Light</span>
          </h1>

          <p className="hero-subtext fade-up" style={{ animationDelay: '160ms' }}>
            Upload any ECG CSV and our Dense Autoencoder model — trained on
            ECG5000 — flags cardiac anomalies with <strong>99.2% precision</strong> in
            seconds. Real-time visualization. Medical-grade results.
          </p>

          <div className="hero-actions fade-up" style={{ animationDelay: '240ms' }}>
            <button className="hero-btn-primary" onClick={() => navigate('/dashboard')}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Launch Dashboard
            </button>
            <a className="hero-btn-ghost" href="#how">
              See how it works ↓
            </a>
          </div>

          {/* Floating stat pills */}
          <div className="hero-stats fade-up" style={{ animationDelay: '320ms' }}>
            <FloatCard value="94.4%" label="Accuracy"  color="#00d4aa" delay="0ms"   icon="🎯" />
            <FloatCard value="99.2%" label="Precision" color="#3d7fff" delay="60ms"  icon="🔬" />
            <FloatCard value="90.7%" label="Recall"    color="#ffa502" delay="120ms" icon="📡" />
            <FloatCard value="140pt" label="Window"    color="#ff4757" delay="180ms" icon="🪟" />
          </div>
        </div>

        {/* ECG waveform strip */}
        <div className="hero-ecg-strip fade-up" style={{ animationDelay: '400ms' }}>
          <AnimatedECG />
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="section-badge">Features</div>
          <h2 className="section-heading">
            Everything you need for<br />
            <span className="accent-text">clinical-grade ECG analysis</span>
          </h2>
          <p className="section-sub">
            A complete pipeline from raw CSV to annotated anomaly report —
            beautifully visualized, instantly downloadable.
          </p>

          <div className="features-grid">
            <FeatureCard
              icon={<svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
              title="Dense Autoencoder"
              desc="Encoder 32→16→8, Decoder 8→16→32→140. Reconstruction loss (MAE) flags anomalous 140-point beat windows with surgical precision."
              color="#00d4aa"
              delay="0ms"
            />
            <FeatureCard
              icon={<svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              title="Live ECG Waveform"
              desc="Interactive Recharts ComposedChart with teal signal line, pulsing red anomaly dots, and a brush zoom control for deep inspection."
              color="#3d7fff"
              delay="80ms"
            />
            <FeatureCard
              icon={<svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
              title="Heart Rate Detection"
              desc="R-peak detection via scipy finds BPM in real-time. An animated beating heart icon syncs to the measured heart rate."
              color="#ff4757"
              delay="160ms"
            />
            <FeatureCard
              icon={<svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
              title="Smart CSV Parsing"
              desc="Auto-detects ECG column from 'ecg, signal, amplitude, mv, value'. Handles any numeric CSV. Exports annotated results instantly."
              color="#ffa502"
              delay="240ms"
            />
            <FeatureCard
              icon={<svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              title="Real-time Pipeline"
              desc="Window-based segmentation, normalization, autoencoder reconstruction, and MAE threshold classification — all in one API call."
              color="#2ed573"
              delay="320ms"
            />
            <FeatureCard
              icon={<svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>}
              title="Window Analysis Table"
              desc="Every anomaly shows its 140-pt window number, position within the window, amplitude, σ deviation, and CRITICAL/HIGH/MODERATE badge."
              color="#a855f7"
              delay="400ms"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          MODEL PERFORMANCE
      ════════════════════════════════════════ */}
      <section className="lp-section lp-section--dark" id="model">
        <div className="lp-section-inner">
          <div className="model-section-grid">

            {/* Left: metrics */}
            <div className="model-metrics-col">
              <div className="section-badge">ML Model</div>
              <h2 className="section-heading" style={{ textAlign: 'left' }}>
                Trained on<br />
                <span className="accent-text">ECG5000 Dataset</span>
              </h2>
              <p className="section-sub" style={{ textAlign: 'left' }}>
                94.4% overall accuracy with 99.2% precision — built to minimize
                false positives in clinical settings.
              </p>

              <div className="metrics-bars">
                <MetricBar label="Accuracy"  value="94.4%" pct={94.4} color="#00d4aa" delay="0ms"   />
                <MetricBar label="Precision" value="99.2%" pct={99.2} color="#3d7fff" delay="80ms"  />
                <MetricBar label="Recall"    value="90.7%" pct={90.7} color="#ffa502" delay="160ms" />
              </div>
            </div>

            {/* Right: architecture card */}
            <div className="model-arch-col">
              <div className="arch-card">
                <div className="arch-card-header">
                  <span className="arch-badge">Architecture</span>
                </div>

                <div className="arch-flow">
                  <div className="arch-block arch-block--input">
                    <span className="arch-block-label">INPUT</span>
                    <span className="arch-block-dim">140</span>
                    <span className="arch-block-note">beat window</span>
                  </div>

                  <div className="arch-arrow arch-arrow--down">↓ Encoder</div>

                  <div className="arch-encoder">
                    {[{d:'Dense 32', a:'ReLU'},{d:'Dense 16', a:'ReLU'},{d:'Dense 8', a:'ReLU · Bottleneck'}].map((l,i) => (
                      <div key={i} className="arch-layer arch-layer--enc">
                        <span className="arch-layer-name">{l.d}</span>
                        <span className="arch-layer-act">{l.a}</span>
                      </div>
                    ))}
                  </div>

                  <div className="arch-arrow arch-arrow--down">↓ Decoder</div>

                  <div className="arch-decoder">
                    {[{d:'Dense 16', a:'ReLU'},{d:'Dense 32', a:'ReLU'},{d:'Dense 140', a:'Sigmoid · Output'}].map((l,i) => (
                      <div key={i} className="arch-layer arch-layer--dec">
                        <span className="arch-layer-name">{l.d}</span>
                        <span className="arch-layer-act">{l.a}</span>
                      </div>
                    ))}
                  </div>

                  <div className="arch-threshold">
                    <span className="arch-threshold-label">MAE Threshold</span>
                    <span className="arch-threshold-value">0.020763</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section className="lp-section" id="how">
        <div className="lp-section-inner">
          <div className="section-badge">How It Works</div>
          <h2 className="section-heading">
            From raw CSV to<br />
            <span className="accent-text">cardiac insights in seconds</span>
          </h2>

          <div className="steps-grid">
            <StepCard num="01" title="Upload your ECG CSV" desc="Drag & drop or browse. Any CSV with a numeric column — auto-detected. Minimum 140 samples required." delay="0ms" />
            <StepCard num="02" title="Normalize & Segment" desc="Signal is normalized to [0,1] using ECG5000 bounds, then sliced into 140-point beat windows." delay="100ms" />
            <StepCard num="03" title="Autoencoder Reconstructs" desc="Each window passes through the Dense Autoencoder. Normal beats reconstruct well; anomalies produce high MAE." delay="200ms" />
            <StepCard num="04" title="Threshold Flagging" desc="Windows with MAE > 0.020763 (mean + 1σ of training loss) are flagged. Peak-error sample index is extracted." delay="300ms" />
            <StepCard num="05" title="Visualize & Analyze" desc="Interactive ECG chart with glowing anomaly markers, 6 KPI cards, heart rate estimate, and severity table." delay="400ms" />
            <StepCard num="06" title="Export Results" desc="Download annotated CSV with index, amplitude, and is_anomaly columns for every sample in your recording." delay="500ms" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════ */}
      <section className="cta-section">
        <div className="cta-glow" aria-hidden="true" />
        <div className="cta-inner">
          <h2 className="cta-heading">Ready to analyze your ECG?</h2>
          <p className="cta-sub">
            No setup required. Open the dashboard, upload a CSV, and get results in seconds.
          </p>
          <button className="hero-btn-primary cta-btn" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Launch CardioScan →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo" style={{ marginBottom: 0 }}>
            <svg viewBox="0 0 32 32" width={16} height={16} fill="none" aria-hidden="true">
              <polyline points="2,16 8,16 11,8 14,24 17,4 20,28 23,16 30,16"
                stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 13 }}>Cardio<b>Scan</b></span>
          </div>
          <span className="footer-copy">
            Built for ACM VibeCode Hackathon · Dense Autoencoder · ECG5000 · FastAPI + React
          </span>
          <div className="footer-links">
            <a href="https://github.com/Vrajesh-Sharma/ECG-Anomaly" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="/dashboard">Dashboard</a>
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">API Docs</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
