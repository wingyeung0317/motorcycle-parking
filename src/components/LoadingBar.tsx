import React from 'react';
import './LoadingBar.css';

interface LoadingBarProps {
    progress: number;
    message?: string;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ progress, message }) => {
    return (
        <div className="loading-overlay">
            <div className="loading-container">
                <div className="loading-title">載入地圖資料中...</div>
                {message && <div className="loading-message">{message}</div>}
                <div className="progress-bar">
                    <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="progress-text">{progress}%</div>
            </div>
        </div>
    );
};

export default LoadingBar;