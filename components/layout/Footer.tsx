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
            <Link href="/terms" className="app-footer-link">
              Terms of Service
            </Link>
            <Link href="/privacy" className="app-footer-link">
              Privacy Policy
            </Link>
            <a
              href="https://github.com/NillionNetwork/blacklight-contracts"
              target="_blank"
              rel="noopener noreferrer"
              className="app-footer-link"
            >
              GitHub
            </a>
            <a
              href="https://nillion.com/news/"
              target="_blank"
              rel="noopener noreferrer"
              className="app-footer-link"
            >
              Blog
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
