/**
 * Debug configuration for the application
 */
interface DebugConfig {
  dataLoader: boolean;
  dataSource: boolean;
  leaderboard: boolean;
  api: boolean;
  general: boolean;
}

// Default debug configuration - can be overridden by environment variables
// Always disabled in production for security and performance
const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  dataLoader: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_DATA_LOADER !== 'false',
  dataSource: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_DATA_SOURCE !== 'false',
  leaderboard: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_LEADERBOARD !== 'false',
  api: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_API !== 'false',
  general: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_GENERAL !== 'false'
};

class DebugLogger {
  private config: DebugConfig;

  constructor() {
    this.config = { ...DEFAULT_DEBUG_CONFIG };
    
    // Allow runtime configuration via localStorage (browser only)
    if (typeof window !== 'undefined') {
      try {
        const storedConfig = localStorage.getItem('debug-config');
        if (storedConfig) {
          const parsed = JSON.parse(storedConfig);
          this.config = { ...this.config, ...parsed };
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Update debug configuration (only works in development)
   */
  setConfig(newConfig: Partial<DebugConfig>): void {
    // Prevent configuration changes in production
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    this.config = { ...this.config, ...newConfig };
    
    // Save to localStorage if in browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('debug-config', JSON.stringify(this.config));
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Get current debug configuration
   */
  getConfig(): DebugConfig {
    return { ...this.config };
  }

  /**
   * Data loader debug logging
   */
  dataLoader(...args: any[]): void {
    if (process.env.NODE_ENV === 'development' && this.config.dataLoader) {
      console.log('🔄 [DataLoader]', ...args);
    }
  }

  /**
   * Data source debug logging
   */
  dataSource(...args: any[]): void {
    if (process.env.NODE_ENV === 'development' && this.config.dataSource) {
      console.log('📦 [DataSource]', ...args);
    }
  }

  /**
   * Leaderboard debug logging
   */
  leaderboard(...args: any[]): void {
    if (process.env.NODE_ENV === 'development' && this.config.leaderboard) {
      console.log('🏆 [Leaderboard]', ...args);
    }
  }

  /**
   * API debug logging
   */
  api(...args: any[]): void {
    if (process.env.NODE_ENV === 'development' && this.config.api) {
      console.log('🌐 [API]', ...args);
    }
  }

  /**
   * General debug logging
   */
  general(...args: any[]): void {
    if (process.env.NODE_ENV === 'development' && this.config.general) {
      console.log('💡 [Debug]', ...args);
    }
  }

  /**
   * Error logging (always enabled)
   */
  error(...args: any[]): void {
    console.error('❌ [Error]', ...args);
  }

  /**
   * Warning logging (always enabled)
   */
  warn(...args: any[]): void {
    console.warn('⚠️ [Warning]', ...args);
  }

  /**
   * Info logging (always enabled)
   */
  info(...args: any[]): void {
    console.info('ℹ️ [Info]', ...args);
  }
}

// Global debug instance
export const debug = new DebugLogger();

// Utility functions for easy access
export const setDebugConfig = (config: Partial<DebugConfig>) => debug.setConfig(config);
export const getDebugConfig = () => debug.getConfig();

// Export for advanced usage
export type { DebugConfig };

// Development helper - expose debug controls globally in browser
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debug = {
    setConfig: setDebugConfig,
    getConfig: getDebugConfig,
    enable: (category: keyof DebugConfig) => setDebugConfig({ [category]: true }),
    disable: (category: keyof DebugConfig) => setDebugConfig({ [category]: false }),
    enableAll: () => setDebugConfig({
      dataLoader: true,
      dataSource: true,
      leaderboard: true,
      api: true,
      general: true
    }),
    disableAll: () => setDebugConfig({
      dataLoader: false,
      dataSource: false,
      leaderboard: false,
      api: false,
      general: false
    })
  };
} 