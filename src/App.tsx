import React from 'react';
import MapComponent from './components/map';
import Footer from './components/Footer';

function App() {
  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <MapComponent />
      <Footer />
    </div>
  );
}

export default App;
