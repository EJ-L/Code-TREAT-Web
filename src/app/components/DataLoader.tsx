'use client';

import { useEffect, useState } from 'react';
import { loadAllData } from '@/lib/dataLoader';

export function DataLoader() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // 避免重复加载
      if (isLoading) return;
      
      setIsLoading(true);
      console.log('开始预加载数据...');
      
      try {
        await loadAllData();
        console.log('数据预加载完成');
      } catch (error) {
        console.error('数据预加载失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // 仅在组件挂载时执行一次

  return null; // 这是一个纯功能组件，不需要渲染任何内容
} 