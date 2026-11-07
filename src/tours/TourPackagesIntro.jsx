import { useEffect, useState } from "react";
import "./tourPackagesIntro.css";

const INTRO_STEPS = {
  loading: 0,
  journey: 1,
  ready: 2,
};

/** A short, skippable welcome sequence for the Tour Packages route. */
export default function TourPackagesIntro({ onComplete }) {
  const [step, setStep] = useState("loading");
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("tour-intro-active");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const delay = reducedMotion ? 220 : 1050;
    const exitDelay = reducedMotion ? 180 : 720;
    const timers = [
      window.setTimeout(() => setStep("journey"), delay),
      window.setTimeout(() => setStep("ready"), delay * 2),
      window.setTimeout(() => setExiting(true), delay * 2 + exitDelay),
      window.setTimeout(onComplete, delay * 2 + exitDelay + (reducedMotion ? 80 : 380)),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.documentElement.classList.remove("tour-intro-active");
    };
  }, [onComplete]);

  function skip() {
    setExiting(true);
    window.setTimeout(onComplete, 160);
  }

  return <div className={`tour-intro${exiting ? " is-exiting" : ""}`} role="dialog" aria-label="Tour Packages welcome" aria-live="polite">
    <div className="tour-intro-skip-wrap">
      <button type="button" className="tour-intro-skip" onClick={skip}>Skip intro <span aria-hidden="true">↗</span></button>
    </div>

    <div className={`tour-intro-screen tour-intro-loading${step === "loading" ? " is-active" : ""}`} aria-hidden={step !== "loading"}>
      <div className="tour-intro-logo" aria-label="CabConnect Tour Packages">
        <span className="tour-intro-logo-mark">C<span>+</span></span>
        <span><strong>Tour Packages</strong><small>CabConnect Chennai</small></span>
      </div>
      <div className="tour-intro-loader" aria-hidden="true"><span /></div>
      <span className="tour-intro-kicker">SOUTH INDIA ESCAPES</span>
      <p>Preparing your next getaway<span className="tour-intro-dots" aria-hidden="true">…</span></p>
      <div className="tour-intro-progress" aria-hidden="true"><span style={{ width: `${((INTRO_STEPS[step] + 1) / 3) * 100}%` }} /></div>
    </div>

    <div className={`tour-intro-screen tour-intro-journey${step === "journey" ? " is-active" : ""}`} aria-hidden={step !== "journey"}>
      <div className="tour-intro-journey-copy"><span className="tour-intro-journey-kicker">FROM COAST TO HILLS</span><p>One route.<br /><em>Many stories.</em></p><span className="tour-intro-route" aria-hidden="true"><i /> Chennai <b>→</b> South India</span></div>
    </div>

    <div className={`tour-intro-screen tour-intro-ready${step === "ready" ? " is-active" : ""}`} aria-hidden={step !== "ready"}>
      <span className="tour-intro-ready-rule" aria-hidden="true" />
      <p>Your next great escape<br /><em>starts here.</em></p>
      <span className="tour-intro-ready-subtitle">Choose a place, then make the road part of the story.</span>
    </div>
  </div>;
}
