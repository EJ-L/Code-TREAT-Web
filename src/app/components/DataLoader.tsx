'use client';

import { useEffect, useRef } from 'react';
import { initializeDataLoader, loadAllData } from '@/lib/dataLoader';

export function DataLoader() {
  const hasLoaded = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      // 避免重复加载
      if (hasLoaded.current) return;
      
      hasLoaded.current = true;
      console.log('开始初始化数据加载系统...');
      
      try {
        // Initialize the data loading system first
        await initializeDataLoader({
          strategy: 'precomputed-first',
          fallbackToMockData: true,
          enableCaching: true
        });
        
        console.log('数据加载系统初始化完成');
        
        // Preload data for better performance
        await loadAllData({
          strategy: 'precomputed-first',
          useCache: true
        });
        
        console.log('数据预加载完成');
      } catch (error) {
        console.error('数据预加载失败:', error);
        // Reset on error so we can try again
        hasLoaded.current = false;
      }
    };

    loadData();
  }, []); // Run only once on mount

  return null; // 这是一个纯功能组件，不需要渲染任何内容
} 