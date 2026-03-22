"use client";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        {/* Column 1 — Brand */}
        <div className="footer-col footer-brand">
          <div className="footer-logo-row">
            <div className="logo-icon">🌿</div>
            <div>
              <div className="footer-wordmark">
                <span className="logo-krishi">Krishi</span>
                <span className="logo-mane">Mane</span>
              </div>
            </div>
          </div>
          <p className="footer-tagline">
            ಒಳ್ಳೇದಾಗಿರಲಿ ದೇಶದಾಗಿರಲಿ
            <br />
            Pure &bull; Natural &bull; Farm Fresh
          </p>
          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
            </a>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2 — Quick Links */}
        <div className="footer-col footer-links">
          <h3 className="footer-heading">Quick Links</h3>
          <nav className="footer-nav">
            <a href="/">Home</a>
            <a href="/about">About Us</a>
            <a href="/faq">FAQ</a>
            <a href="/contact">Contact</a>
          </nav>
        </div>

        {/* Column 3 — Contact Info */}
        <div className="footer-col footer-contact">
          <h3 className="footer-heading">Get in Touch</h3>
          <div className="footer-contact-list">
            <div className="footer-contact-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Humnabad, Karnataka, India</span>
            </div>
            <div className="footer-contact-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>contact@krishimane.com</span>
            </div>
            <div className="footer-contact-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              <span>+91 99015 09789</span>
            </div>
            <div className="footer-contact-item footer-hours">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Mon – Sat, 9AM – 6PM IST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} KrishiMane. All rights reserved. | Made with love from Indian Farms</p>
      </div>
    </footer>
  );
}
