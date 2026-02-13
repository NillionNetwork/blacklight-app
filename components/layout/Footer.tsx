import Link from 'next/link';
import './footer.css';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-container">
        <div className="app-footer-content">
          {/* Left side - Brand text */}
          <div className="app-footer-brand">
            Nillion Blacklight
          </div>

          {/* Right side - Links */}
          <div className="app-footer-links">
            <a
              href="https://nillion.notion.site/blacklight-terms-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="app-footer-link"
            >
              Terms of Service
            </a>
            <Link href="https://nillion.notion.site/blacklight-terms-conditions#2f51827799b4808e95bdc5f239a97246"
              target="_blank"
              rel="noopener noreferrer"
              className="app-footer-link">
              Privacy Policy
            </Link>
            <a
              href="https://github.com/NillionNetwork/blacklight-app"
              target="_blank"
              rel="noopener noreferrer"
              className="app-footer-link"
            >
              GitHub
            </a>
            <a
              href="https://discord.com/invite/nillionnetwork"
              target="_blank"
              rel="noopener noreferrer"
              className="app-footer-link"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
