import React, { useEffect } from 'react';
import MapComponent from './components/map';
import Footer from './components/Footer';
import { trackPageView, initClarity } from './utils/analytics';

function App() {
  useEffect(() => {
    // 初始化 Microsoft Clarity
    initClarity();
    
    // 追蹤首頁載入
    trackPageView('/');
    
    // 追蹤頁面載入性能
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.fetchStart;
            console.log('頁面載入時間:', loadTime, 'ms');
          }
        }, 0);
      });
    }
  }, []);

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <MapComponent />
      <Footer />
    </div>
  );
}

export default App;
