'use client';

import { useState, useEffect } from 'react';
import { debug, getDebugConfig, setDebugConfig, type DebugConfig } from '@/lib/debug';

const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DebugConfig>(getDebugConfig());
  const [shouldShow, setShouldShow] = useState(false);

  // Use useEffect to check conditions client-side only to avoid hydration mismatch
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.endsWith('.local');
    
    const hasDevIndicators = window.location.port === '3000' || 
      window.location.port === '3001' || 
      window.location.search.includes('debug=true');
    
    setShouldShow(isDevelopment && (isLocalhost || hasDevIndicators));
  }, []);

  useEffect(() => {
    setConfig(getDebugConfig());
  }, [isOpen]);

  const handleToggle = (category: keyof DebugConfig) => {
    const newConfig = {
      ...config,
      [category]: !config[category]
    };
    setConfig(newConfig);
    setDebugConfig(newConfig);
  };

  const handleToggleAll = (enabled: boolean) => {
    const newConfig = {
      dataLoader: enabled,
      dataSource: enabled,
      leaderboard: enabled,
      api: enabled,
      general: enabled
    };
    setConfig(newConfig);
    setDebugConfig(newConfig);
  };

  // Don't render anything during SSR or if conditions aren't met
  if (!shouldShow) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#1f2937',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        🐛 DEBUG {isOpen ? '▼' : '▲'}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '0',
          backgroundColor: '#1f2937',
          color: '#ffffff',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '16px',
          minWidth: '240px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ 
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 'bold',
            borderBottom: '1px solid #374151',
            paddingBottom: '8px'
          }}>
            Debug Configuration
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => handleToggleAll(true)}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                marginRight: '8px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Enable All
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Disable All
            </button>
          </div>

          {/* Individual Controls */}
          <div>
            {Object.entries(config).map(([category, enabled]) => (
              <div key={category} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '12px'
              }}>
                <span style={{ 
                  textTransform: 'capitalize',
                  color: enabled ? '#10b981' : '#6b7280'
                }}>
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <button
                  onClick={() => handleToggle(category as keyof DebugConfig)}
                  style={{
                    backgroundColor: enabled ? '#10b981' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    minWidth: '50px'
                  }}
                >
                  {enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>

          {/* Info */}
          <div style={{
            marginTop: '16px',
            paddingTop: '8px',
            borderTop: '1px solid #374151',
            fontSize: '10px',
            color: '#9ca3af'
          }}>
            <div>Open browser console to see debug messages</div>
            <div>Settings saved to localStorage</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel; 