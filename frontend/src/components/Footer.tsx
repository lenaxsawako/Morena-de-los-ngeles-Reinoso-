import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { landingService } from '../services/landing';
import './Footer.css';

export default function Footer() {
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    landingService.getLandingData().then(data => {
      if (data.siteName) setSiteName(data.siteName);
    }).catch(() => {});
  }, []);

  return (
    <footer className="footer-container">
      {/* Main Footer Content */}
      <div className="footer-content">
        {/* Brand Section */}
        <div className="footer-brand">
          <div className="footer-logo">{siteName}</div>
          <p className="footer-description">
            Exploring the intersection of classical literary depth and modern digital precision.
          </p>
        </div>

        {/* Links Grid */}
        <div className="footer-links-grid">
          {/* Connect Section */}
          <div className="footer-links-section">
            <h5 className="footer-links-title">Connect</h5>
            <ul className="footer-links-list">
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
              </li>
              <li>
                <a href="mailto:subscribe@aurelius.com">Newsletter</a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="footer-links-section">
            <h5 className="footer-links-title">Legal</h5>
            <ul className="footer-links-list">
              <li>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-of-service">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="footer-divider">
        <p className="footer-copyright">
          © 2026 Independent Author. Crafted for the Discerning Reader.
        </p>
      </div>
    </footer>
  );
}