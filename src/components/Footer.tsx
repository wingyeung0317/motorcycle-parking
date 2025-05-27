import React, { useState } from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const [showDonate, setShowDonate] = useState(false);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} 已複製到剪貼簿！`);
  };

  return (
    <footer className="app-footer">
      <div className="footer-main">
        <span className="footer-text">
          🏍️ 希望大家平安回家，即到即有位泊車。對比某巴士app趕時間仲要睇廣告，此app只為方便各位師兄，有心可以donate支持🙇。
        </span>
        <button 
          className="donate-toggle"
          onClick={() => setShowDonate(!showDonate)}
        >
          ❤️ 支持
        </button>
      </div>
      
      {showDonate && (
        <div className="donate-popup">
          <div className="donate-header">
            <span>感謝您的支持 🙏</span>
            <button 
              className="close-btn"
              onClick={() => setShowDonate(false)}
            >
              ✕
            </button>
          </div>
          <div className="donate-options">
            <a 
              href="https://buymeacoffee.com/wingyeung0317" 
              target="_blank" 
              rel="noopener noreferrer"
              className="donate-link"
            >
              ☕ Buy Me a Coffee
            </a>
            <a 
              href="https://ko-fi.com/wingyeung0317" 
              target="_blank" 
              rel="noopener noreferrer"
              className="donate-link"
            >
              🧋 Ko-fi
            </a>
            <a 
              href="https://patreon.com/wingyeung0317" 
              target="_blank" 
              rel="noopener noreferrer"
              className="donate-link"
            >
              🎁 Patreon
            </a>
            <a 
              href="https://paypal.me/wingyeung0317" 
              target="_blank" 
              rel="noopener noreferrer"
              className="donate-link"
            >
              💳 PayPal
            </a>
            <a 
              href="https://payme.hsbc/killicit"
              target="_blank"
              rel="noopener noreferrer"
              className="donate-link"
            >
              🏦 PayMe
            </a>
            <button 
              className="donate-link"
              onClick={() => copyToClipboard('169743051', 'FPS ID')}
            >
              🏧 FPS ID: 169743051
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;