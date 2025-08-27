import React, { useState } from 'react';
import './Footer.css';
import { trackEvent, trackClarityEvent } from '../utils/analytics';

const Footer: React.FC = () => {
  const [showDonate, setShowDonate] = useState(false);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} 已複製到剪貼簿！`);
    
    // 追蹤複製事件
    trackEvent('copy_payment_info', 'donation', type);
    trackClarityEvent('copy_payment_info', { type, text });
  };

  const handleDonateToggle = () => {
    const newState = !showDonate;
    setShowDonate(newState);
    
    // 追蹤捐款彈窗開啟/關閉
    const action = newState ? 'donate_popup_open' : 'donate_popup_close';
    trackEvent(action, 'donation');
    trackClarityEvent(action);
  };

  const handleDonateClick = (platform: string, url: string) => {
    // 追蹤捐款連結點擊
    trackEvent('donate_link_click', 'donation', platform);
    trackClarityEvent('donate_link_click', { platform, url });
    window.open(url, '_blank', 'noopener noreferrer');
  };

  return (
    <footer className="app-footer">
      <div className="footer-main">
        <span className="footer-text">
          🏍️ 警告：導航前請先查看街景狀況，某些泊車位會設在天橋底下，直接導航或會帶了你上橋。
        </span>
        <button 
          className="donate-toggle"
          onClick={handleDonateToggle}
        >
          ❤️ Donate
        </button>
      </div>
      
      {showDonate && (
        <div className="donate-popup">
          <div className="donate-header">
            <span>Thx for your support. 🙏</span>
            <button 
              className="close-btn"
              onClick={() => {
                setShowDonate(false);
                trackEvent('donate_popup_close', 'donation');
                trackClarityEvent('donate_popup_close');
              }}
            >
              ✕
            </button>
          </div>
          <div className="donate-options">
            {/* <button
              className="donate-link"
              onClick={() => handleDonateClick('Buy Me a Coffee', 'https://buymeacoffee.com/wingyeung0317')}
            >
              ☕ Buy Me a Coffee
            </button>
            <button
              className="donate-link"
              onClick={() => handleDonateClick('Ko-fi', 'https://ko-fi.com/wingyeung0317')}
            >
              🧋 Ko-fi
            </button>
            <button
              className="donate-link"
              onClick={() => handleDonateClick('Patreon', 'https://patreon.com/wingyeung0317')}
            >
              🎁 Patreon
            </button> */}
            <button
              className="donate-link"
              onClick={() => handleDonateClick('PayPal', 'https://paypal.me/wingyeung0317')}
            >
              💳 PayPal
            </button>
            <button
              className="donate-link"
              onClick={() => handleDonateClick('PayMe', 'https://payme.hsbc/killicit')}
            >
              🏦 PayMe
            </button>
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