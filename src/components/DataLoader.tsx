'use client';

import { useEffect } from 'react';
import { loadAllData } from '@/lib/dataLoader';

export function DataLoader() {
  useEffect(() => {
    // 在组件挂载时立即开始加载数据
    const preloadData = async () => {
      console.log('开始预加载数据...');
      try {
        await loadAllData();
        console.log('数据预加载完成');
      } catch (error) {
        console.error('数据预加载失败:', error);
      }
    };

    preloadData();
  }, []); // 空依赖数组确保只在组件挂载时执行一次

  return null; // 这是一个纯功能组件，不需要渲染任何内容
} 