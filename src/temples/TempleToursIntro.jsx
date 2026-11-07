import { useEffect, useState } from "react";
import "./templeToursIntro.css";

const INTRO_STEPS = {
  loading: 0,
  devotional: 1,
  blessing: 2,
};

/** A short, skippable welcome sequence for the Temple Tours route. */
export default function TempleToursIntro({ onComplete }) {
  const [step, setStep] = useState("loading");
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("temple-intro-active");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const delay = reducedMotion ? 220 : 1050;
    const exitDelay = reducedMotion ? 220 : 850;
    const timers = [
      window.setTimeout(() => setStep("devotional"), delay),
      window.setTimeout(() => setStep("blessing"), delay * 2),
      window.setTimeout(() => setExiting(true), delay * 2 + exitDelay),
      window.setTimeout(onComplete, delay * 2 + exitDelay + (reducedMotion ? 80 : 420)),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.documentElement.classList.remove("temple-intro-active");
    };
  }, [onComplete]);

  function skip() {
    setExiting(true);
    window.setTimeout(onComplete, 160);
  }

  return <div className={`temple-intro${exiting ? " is-exiting" : ""}`} role="dialog" aria-label="Temple Tours welcome" aria-live="polite">
    <div className="temple-intro-backdrop" aria-hidden="true" />
    <button type="button" className="temple-intro-skip" onClick={skip}>Skip intro <span aria-hidden="true">↗</span></button>

    <div className={`temple-intro-screen temple-intro-loading${step === "loading" ? " is-active" : ""}`} aria-hidden={step !== "loading"}>
      <div className="temple-intro-logo" aria-label="CabConnect Temple Tours">
        <span className="temple-intro-logo-mark">C<span>+</span></span>
        <span><strong>Temple Tours</strong><small>CabConnect Chennai</small></span>
      </div>
      <div className="temple-intro-loader" aria-hidden="true"><span /></div>
      <span className="temple-intro-kicker">DIVINE BLESSINGS</span>
      <p>Preparing your sacred journey<span className="temple-intro-dots" aria-hidden="true">…</span></p>
      <div className="temple-intro-progress" aria-hidden="true"><span style={{ width: `${((INTRO_STEPS[step] + 1) / 3) * 100}%` }} /></div>
    </div>

    <div className={`temple-intro-screen temple-intro-devotional${step === "devotional" ? " is-active" : ""}`} aria-hidden={step !== "devotional"}>
      <div className="temple-intro-devotional-image" role="img" aria-label="Lord Murugan in a warmly lit South Indian temple" />
      <div className="temple-intro-devotional-shade" aria-hidden="true" />
      <div className="temple-intro-devotional-copy"><span className="temple-intro-tamil">முருகன் துணை</span><span className="temple-intro-vel" aria-hidden="true"><i /></span></div>
    </div>

    <div className={`temple-intro-screen temple-intro-blessing${step === "blessing" ? " is-active" : ""}`} aria-hidden={step !== "blessing"}>
      <span className="temple-intro-blessing-rule" aria-hidden="true" />
      <p>May Lord Murugan<br /><em>Bless Your Journey</em></p>
      <span className="temple-intro-blessing-tamil">முருகன் துணை</span>
    </div>
  </div>;
}
