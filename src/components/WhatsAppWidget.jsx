import { useState } from "react";
import "./whatsAppWidget.css";

function WhatsAppMark({ size = 24 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16.02 3.2A12.65 12.65 0 0 0 5.14 22.3L3.4 28.7l6.55-1.7a12.7 12.7 0 1 0 6.07-23.8Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12.1 10.1c-.35-.78-.72-.8-1.06-.82h-.9c-.32 0-.83.12-1.27.6-.44.49-1.67 1.64-1.67 4 0 2.35 1.71 4.62 1.95 4.94.25.32 3.3 5.28 8.16 7.19 4.04 1.58 4.87 1.27 5.75 1.19.88-.08 2.83-1.16 3.23-2.28.4-1.12.4-2.08.28-2.28-.12-.2-.44-.32-.92-.56-.48-.24-2.83-1.4-3.27-1.56-.44-.16-.76-.24-1.08.24-.32.48-1.24 1.56-1.52 1.88-.28.32-.56.36-1.04.12-.48-.24-2.02-.74-3.85-2.36-1.43-1.27-2.4-2.84-2.68-3.32-.28-.48-.03-.74.21-.98.21-.21.48-.56.72-.84.24-.28.32-.48.48-.8.16-.32.08-.6-.04-.84-.12-.24-1.04-2.6-1.43-3.56Z" fill="currentColor" transform="translate(3 1) scale(.78)" />
    </svg>
  );
}

export default function WhatsAppWidget({ phone }) {
  const [open, setOpen] = useState(false);
  const number = String(phone || "").replace(/\D/g, "");
  if (!number) return null;

  const message = encodeURIComponent("Hi CabConnect Chennai, can you help me with a cab booking?");
  const whatsappUrl = `https://wa.me/${number}?text=${message}`;

  return (
    <div className={`cc-whatsapp-widget${open ? " is-open" : ""}`}>
      {open && (
        <section className="cc-whatsapp-panel" id="cc-whatsapp-panel" aria-label="WhatsApp support">
          <header className="cc-whatsapp-panel-header">
            <span className="cc-whatsapp-brand"><WhatsAppMark size={27} /> WhatsApp</span>
            <button type="button" className="cc-whatsapp-close" onClick={() => setOpen(false)} aria-label="Close WhatsApp support">×</button>
          </header>
          <div className="cc-whatsapp-panel-body">
            <p className="cc-whatsapp-greeting">Hello 👋<br />Can we help you?</p>
            <a className="cc-whatsapp-open-link" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Open WhatsApp <WhatsAppMark size={22} />
            </a>
          </div>
        </section>
      )}
      <button
        type="button"
        className="cc-whatsapp-launcher"
        aria-label={open ? "Close WhatsApp support" : "Open WhatsApp support"}
        aria-expanded={open}
        aria-controls="cc-whatsapp-panel"
        onClick={() => setOpen((visible) => !visible)}
      >
        {open ? <span className="cc-whatsapp-launcher-close">×</span> : <WhatsAppMark size={34} />}
      </button>
    </div>
  );
}
