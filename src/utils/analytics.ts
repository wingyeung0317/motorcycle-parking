import Clarity from '@microsoft/Clarity';

// Google Analytics 設置
export const GA_MEASUREMENT_ID = 'G-TKSNYS15YM';
export const Clarity_PROJECT_ID = 'rzfactk7ri';

// 宣告全域類型
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    Clarity: (...args: any[]) => void;
  }
}

// 初始化 Clarity
export const initClarity = () => {
    Clarity.init(Clarity_PROJECT_ID);
};

// Google Analytics 頁面瀏覽追蹤
export const trackPageView = (page: string) => {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: page,
    });
};

// Google Analytics 事件追蹤
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
};

// Microsoft Clarity 事件追蹤 (修正 API 調用)
export const trackClarityEvent = (eventName: string, data?: any) => {
  // 使用 Clarity.event() 只接受一個參數
  try {
    Clarity.event(eventName);
  } catch (error) {
    console.warn('Clarity tracking error:', error);
  }
  try {
    // 如果需要傳遞額外數據，使用 Clarity.setTag()
    if (data) {
      // 將數據轉換為字符串鍵值對
      Object.keys(data).forEach(key => {
        const value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]);
        Clarity.setTag(key, value);
      });
    }
  } catch (error) {
    console.warn('Clarity tracking error:', error);
  }
};

// 設置 Clarity 用戶 ID
export const setClarityUserId = (userId: string) => {
  try {
    Clarity.identify(userId);
  } catch (error) {
    console.warn('Clarity identify error:', error);
  }
};

// 追蹤用戶位置
export const trackUserLocation = (location: { lat: number; lng: number }) => {
  trackEvent('user_location', 'geolocation', `${location.lat},${location.lng}`);
  trackClarityEvent('user_location', location);
};

// 追蹤停車位搜尋
export const trackParkingSearch = (searchTerm: string) => {
  trackEvent('search', 'parking_location', searchTerm);
  trackClarityEvent('parking_search', { searchTerm });
};

// 追蹤導航點擊
export const trackNavigationClick = (appName: string, coordinates: { lat: number; lng: number }) => {
  trackEvent('navigation_click', 'map_interaction', appName);
  trackClarityEvent('navigation_click', { appName, coordinates });
};

// 追蹤 KML 載入性能
export const trackKmlLoadPerformance = (loadTime: number, markerCount: number) => {
  trackEvent('kml_load_time', 'performance', 'load_duration', loadTime);
  trackEvent('marker_count', 'data_loading', 'total_markers', markerCount);
  trackClarityEvent('kml_performance', { loadTime, markerCount });
};

// 追蹤錯誤
export const trackError = (error: string, context?: string) => {
  trackEvent('error', 'application', `${context}: ${error}`);
  trackClarityEvent('application_error', { error, context });
};

// 追蹤頁面性能
export const trackPerformance = (metric: string, value: number) => {
  trackEvent('performance', 'timing', metric, value);
  trackClarityEvent('performance_metric', { metric, value });
};