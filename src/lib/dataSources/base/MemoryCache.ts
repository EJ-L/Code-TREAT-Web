import { IDataCache } from '../interfaces';

/**
 * Simple in-memory cache implementation
 */
export class MemoryCache implements IDataCache {
  private cache = new Map<string, { value: unknown; expiry: number | null }>();
  
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiry });
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return allKeys;
    }
    
    // Simple pattern matching with * wildcard
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;
    
    for (const [, item] of this.cache) {
      if (item.expiry && now > item.expiry) {
        expiredCount++;
      } else {
        validCount++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount
    };
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache) {
      if (item.expiry && now > item.expiry) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
} 