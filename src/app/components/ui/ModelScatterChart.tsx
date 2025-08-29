import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Label,
  LabelList,
  ReferenceLine
} from 'recharts';
import { MODEL_PUBLISH_DATES, hasDataLeakage, getBaseModelName, canonicalizeModelName } from '@/lib/constants';
import { TimelineSlider } from './TimelineSlider';

type ScatterChartProps = {
  data: Array<Record<string, unknown>>;
  currentMetric: string;
  availableMetrics: string[];
  onMetricChange: (metric: string) => void;
  isDarkMode: boolean;
  currentTask: string;
  // Optional props for showing leaderboard timeline range as reference lines
  leaderboardTimelineRange?: { start: Date; end: Date } | null;
};

interface ScatterDataPoint {
  x: number; // Date as timestamp
  y: number; // Metric value
  model: string;
  displayDate: string;
  metricValue: string;
  hasDataLeakage: boolean;
  isCoTModel: boolean;
}

interface ZoomState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  isZoomed: boolean;
}

interface PanState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
}

interface AreaSelectState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Helper function to check if a model is using Chain-of-Thought
const isCoTModel = (modelName: string): boolean => {
  return modelName.includes('(CoT)');
};

const ModelScatterChart = ({ 
  data, 
  currentMetric, 
  availableMetrics, 
  onMetricChange, 
  isDarkMode,
  currentTask,
  leaderboardTimelineRange
}: ScatterChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<ScatterDataPoint | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setShowCrosshair] = useState(false);
  // Graph's own timeline state, independent from leaderboard
  const [graphTimelineRange, setGraphTimelineRange] = useState<{ start: Date; end: Date } | null>(null);
  
  // Reset graph timeline when leaderboard timeline changes to sync both filters
  useEffect(() => {
    setGraphTimelineRange(leaderboardTimelineRange || null);
  }, [leaderboardTimelineRange]);
  // Filter states for model types
  const [showCoTModels, setShowCoTModels] = useState(true);
  const [showRegularModels, setShowRegularModels] = useState(true);
  
  // Zoom and pan state
  const [zoomState, setZoomState] = useState<ZoomState | null>(null);
  const [panState, setPanState] = useState<PanState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0
  });
  const [areaSelectState, setAreaSelectState] = useState<AreaSelectState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  });
  
  // Refs for chart interaction
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const chartRef = useRef<any>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // Transform data for scatter plot
  const scatterData = useMemo(() => {
    if (!data || !currentMetric) return [];

    const points: ScatterDataPoint[] = [];
    
    data.forEach(result => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modelName = (result as any).model || (result as any).modelName;
      let publishDate = MODEL_PUBLISH_DATES[modelName];
      
      // If no date found and model is CoT variant, try base model name
      if (!publishDate && modelName.includes('(CoT)')) {
        const baseName = getBaseModelName(modelName);
        const canonicalBaseName = canonicalizeModelName(baseName);
        publishDate = MODEL_PUBLISH_DATES[canonicalBaseName] || MODEL_PUBLISH_DATES[baseName];
      }
      
      const metricValue = result[currentMetric];

      // Only include points that have both date and metric data
      if (publishDate && metricValue !== undefined && metricValue !== '-') {
        const dateObj = new Date(publishDate);
        const timestamp = dateObj.getTime();
        
        // Parse the metric value - handle both string and number formats
        let numericValue: number;
        
        if (typeof metricValue === 'string') {
          // Remove any percentage symbols and parse
          const cleanValue = metricValue.replace('%', '').trim();
          numericValue = parseFloat(cleanValue);
        } else {
          numericValue = Number(metricValue);
        }
        
        // Skip if the parsed value is not a valid number
        if (isNaN(numericValue)) {
          console.warn(`Invalid metric value for ${modelName}: ${metricValue}`);
          return;
        }
        
        // Debug log for problematic values
        if (numericValue > 1000) {
          console.warn(`Suspiciously large value for ${modelName} ${currentMetric}: ${numericValue}, original: ${metricValue}`);
          return;
        }
        
        // Handle different value ranges
        let displayValue: number;
        
        if (numericValue < 0) {
          // Negative values shouldn't exist for most metrics
          console.warn(`Negative value for ${modelName}: ${numericValue}`);
          return;
        } else if (numericValue <= 1 && numericValue >= 0) {
          // Values in 0-1 range, convert to percentage (0-100)
          displayValue = numericValue * 100;
        } else if (numericValue <= 100) {
          // Values already in percentage range (0-100)
          displayValue = numericValue;
        } else {
          // Values above 100 - cap at 100% for percentage-based metrics
          console.warn(`Value above 100% for ${modelName}: ${numericValue}, capping at 100%`);
          displayValue = 100;
        }
        
        // Ensure we don't exceed 100% for any metric displayed as percentage
        displayValue = Math.min(displayValue, 100);
        
        points.push({
          x: timestamp,
          y: displayValue,
          model: modelName as string,
          displayDate: publishDate,
          metricValue: `${displayValue.toFixed(1)}%`,
          hasDataLeakage: hasDataLeakage(modelName as string, currentTask),
          isCoTModel: isCoTModel(modelName as string)
        });
      }
    });

    return points;
  }, [data, currentMetric, currentTask]);

  // Filter data based on graph's own timeline range
  const timelineFilteredData = useMemo(() => {
    if (!graphTimelineRange) return scatterData;
    
    const startTimestamp = graphTimelineRange.start.getTime();
    const endTimestamp = graphTimelineRange.end.getTime();
    
    return scatterData.filter(point => 
      point.x >= startTimestamp && point.x <= endTimestamp
    );
  }, [scatterData, graphTimelineRange]);

  // Apply model type filtering and zoom filtering on top of timeline filtering
  const filteredData = useMemo(() => {
    let data = timelineFilteredData.filter(point => {
      if (point.isCoTModel && !showCoTModels) return false;
      if (!point.isCoTModel && !showRegularModels) return false;
      return true;
    });

    // Apply zoom filtering - only show points within the current zoom bounds
    if (zoomState) {
      data = data.filter(point => {
        return point.x >= zoomState.xMin && 
               point.x <= zoomState.xMax && 
               point.y >= zoomState.yMin && 
               point.y <= zoomState.yMax;
      });
    }

    return data;
  }, [timelineFilteredData, showCoTModels, showRegularModels, zoomState]);

  // Calculate date bounds for timeline slider
  const dateBounds = useMemo(() => {
    const modelDates = Object.values(MODEL_PUBLISH_DATES)
      .map(dateStr => new Date(dateStr))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (modelDates.length === 0) {
      return {
        min: new Date('2021-01-01'),
        max: new Date()
      };
    }
    
    return {
      min: modelDates[0],
      max: modelDates[modelDates.length - 1]
    };
  }, []);

  // Calculate domain ranges based on timeline filtered data (before zoom filtering) and zoom state
  const { xDomain, yDomain, originalXDomain, originalYDomain } = useMemo(() => {
    if (!timelineFilteredData.length) {
      return {
        xDomain: ['auto', 'auto'] as ['auto', 'auto'],
        yDomain: [0, 100] as [number, number],
        originalXDomain: ['auto', 'auto'] as ['auto', 'auto'],
        originalYDomain: [0, 100] as [number, number]
      };
    }
    
    // Calculate original domain based on timeline filtered data (before zoom filtering)
    // This ensures we have stable bounds regardless of zoom level
    const allDataInTimeline = timelineFilteredData.filter(point => {
      if (point.isCoTModel && !showCoTModels) return false;
      if (!point.isCoTModel && !showRegularModels) return false;
      return true;
    });
    
    const dates = allDataInTimeline.map(d => d.x);
    const values = allDataInTimeline.map(d => d.y);
    
    const padding = 90 * 24 * 60 * 60 * 1000; // 90 days padding
    const valuePadding = 5; // 5% padding for y values
    
    const originalX = [
      Math.min(...dates) - padding,
      Math.max(...dates) + padding
    ] as [number, number];
    
    const originalY = [
      Math.max(0, Math.min(...values) - valuePadding),
      Math.min(100, Math.max(...values) + valuePadding)
    ] as [number, number];
    
    // Use zoom state if available, otherwise use original domain
    return {
      xDomain: zoomState ? [zoomState.xMin, zoomState.xMax] : originalX,
      yDomain: zoomState ? [zoomState.yMin, zoomState.yMax] : originalY,
      originalXDomain: originalX,
      originalYDomain: originalY
    };
  }, [timelineFilteredData, showCoTModels, showRegularModels, zoomState]);

  // Custom tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          isDarkMode 
            ? 'bg-[#1a202c] border-slate-600 text-slate-200' 
            : 'bg-white border-slate-300 text-slate-800'
        }`}>
          <p className="font-semibold">{data.model}</p>
          <p className="text-sm">Release Date: {data.displayDate}</p>
          <p className="text-sm">{currentMetric}: {data.metricValue}</p>
        </div>
      );
    }
    return null;
  };

  // Format x-axis dates
  const formatXAxisDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // Handle mouse events for hover display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback((event: any) => {
    if (!event) return;
    
    setShowCrosshair(true);
    
    // More precise hover detection - only set hovered point when activeTooltipIndex is valid
    // This ensures we're actually hovering over a data point, not just near it
    if (event.activePayload && event.activePayload[0] && event.activeTooltipIndex !== undefined) {
      setHoveredPoint(event.activePayload[0].payload);
    } else {
      setHoveredPoint(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    setShowCrosshair(false);
  }, []);

  // Graph timeline change handler
  const handleGraphTimelineChange = useCallback((startDate: Date, endDate: Date) => {
    setGraphTimelineRange({ start: startDate, end: endDate });
  }, []);

  // Reset graph timeline filter
  const handleResetGraphTimeline = useCallback(() => {
    setGraphTimelineRange(null);
  }, []);

  // Format Y-axis values with proper significant figures
  const formatYAxisValue = (value: number) => {
    // Round to 4 significant figures
    const rounded = parseFloat(value.toPrecision(4));
    return rounded.toString();
  };

  // Utility functions for zoom calculations
  const handleZoomIn = useCallback((centerX?: number, centerY?: number) => {
    const zoomFactor = 0.8; // Zoom in by 20%
    
    const currentXDomain = zoomState ? [zoomState.xMin, zoomState.xMax] : (originalXDomain as [number, number]);
    const currentYDomain = zoomState ? [zoomState.yMin, zoomState.yMax] : (originalYDomain as [number, number]);
    
    const xRange = currentXDomain[1] - currentXDomain[0];
    const yRange = currentYDomain[1] - currentYDomain[0];
    
    const newXRange = xRange * zoomFactor;
    const newYRange = yRange * zoomFactor;
    
    // Use provided center or default to middle of current view
    const xCenter = centerX || (currentXDomain[0] + currentXDomain[1]) / 2;
    const yCenter = centerY || (currentYDomain[0] + currentYDomain[1]) / 2;
    
    setZoomState({
      xMin: xCenter - newXRange / 2,
      xMax: xCenter + newXRange / 2,
      yMin: yCenter - newYRange / 2,
      yMax: yCenter + newYRange / 2,
      isZoomed: true
    });
  }, [zoomState, originalXDomain, originalYDomain]);

  const handleZoomOut = useCallback((centerX?: number, centerY?: number) => {
    const zoomFactor = 1.25; // Zoom out by 25%
    
    const currentXDomain = zoomState ? [zoomState.xMin, zoomState.xMax] : (originalXDomain as [number, number]);
    const currentYDomain = zoomState ? [zoomState.yMin, zoomState.yMax] : (originalYDomain as [number, number]);
    
    const xRange = currentXDomain[1] - currentXDomain[0];
    const yRange = currentYDomain[1] - currentYDomain[0];
    
    const newXRange = xRange * zoomFactor;
    const newYRange = yRange * zoomFactor;
    
    // Use provided center or default to middle of current view
    const xCenter = centerX || (currentXDomain[0] + currentXDomain[1]) / 2;
    const yCenter = centerY || (currentYDomain[0] + currentYDomain[1]) / 2;
    
    const newXMin = xCenter - newXRange / 2;
    const newXMax = xCenter + newXRange / 2;
    const newYMin = yCenter - newYRange / 2;
    const newYMax = yCenter + newYRange / 2;
    
    // Check if we're zooming out beyond original bounds
    const originalXDomainNum = originalXDomain as [number, number];
    const originalYDomainNum = originalYDomain as [number, number];
    const isAtOriginalBounds = (
      newXMin <= originalXDomainNum[0] && 
      newXMax >= originalXDomainNum[1] &&
      newYMin <= originalYDomainNum[0] && 
      newYMax >= originalYDomainNum[1]
    );
    
    if (isAtOriginalBounds) {
      // Reset to original view
      setZoomState(null);
    } else {
      setZoomState({
        xMin: newXMin,
        xMax: newXMax,
        yMin: newYMin,
        yMax: newYMax,
        isZoomed: true
      });
    }
  }, [zoomState, originalXDomain, originalYDomain]);

  const handleResetZoom = useCallback(() => {
    setZoomState(null);
  }, []);

  // Keyboard event handlers for zoom
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(true);
      }
      
      // Check if chart container is focused or if we should respond to global keys
      const isChartFocused = chartContainerRef.current?.contains(document.activeElement);
      if (!isChartFocused) return;
      
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handleZoomIn();
      } else if (event.key === '-') {
        event.preventDefault();
        handleZoomOut();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleZoomIn, handleZoomOut]);

  // Convert screen coordinates to chart coordinates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const screenToChartCoords = useCallback((screenX: number, screenY: number, chartElement: any) => {
    if (!chartElement) return { x: 0, y: 0 };
    
    const rect = chartElement.getBoundingClientRect();
    const containerRect = chartContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: 0, y: 0 };
    
    // Calculate relative position within the chart area
    const relativeX = (screenX - rect.left) / rect.width;
    const relativeY = (screenY - rect.top) / rect.height;
    
    // Convert to chart coordinates
    const currentXDomain = zoomState ? [zoomState.xMin, zoomState.xMax] : (originalXDomain as [number, number]);
    const currentYDomain = zoomState ? [zoomState.yMin, zoomState.yMax] : (originalYDomain as [number, number]);
    
    const chartX = currentXDomain[0] + relativeX * (currentXDomain[1] - currentXDomain[0]);
    const chartY = currentYDomain[1] - relativeY * (currentYDomain[1] - currentYDomain[0]); // Y is flipped
    
    return { x: chartX, y: chartY };
  }, [zoomState, originalXDomain, originalYDomain]);

  // Mouse wheel handler removed - no longer supporting scroll zoom

  // Mouse down handler for area selection and drag pan
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return; // Only left mouse button
    
    const chartElement = chartContainerRef.current?.querySelector('.recharts-wrapper');
    if (!chartElement) return;
    
    if (isCtrlPressed) {
      // Start area selection
      setAreaSelectState({
        isSelecting: true,
        startX: event.clientX,
        startY: event.clientY,
        endX: event.clientX,
        endY: event.clientY
      });
    } else {
      // Start pan drag
      setPanState({
        isDragging: true,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY
      });
    }
    
    event.preventDefault();
  }, [isCtrlPressed]);

  // Mouse move handler for area selection and drag pan
  const handleMouseMoveCapture = useCallback((event: React.MouseEvent) => {
    if (areaSelectState.isSelecting) {
      // Update area selection
      setAreaSelectState(prev => ({
        ...prev,
        endX: event.clientX,
        endY: event.clientY
      }));
    } else if (panState.isDragging && zoomState) {
      // Handle pan drag
      const deltaX = event.clientX - panState.lastX;
      const deltaY = event.clientY - panState.lastY;
      
      const chartElement = chartContainerRef.current?.querySelector('.recharts-wrapper');
      if (!chartElement) return;
      
      const rect = chartElement.getBoundingClientRect();
      
      // Convert pixel delta to chart coordinate delta
      const xRange = zoomState.xMax - zoomState.xMin;
      const yRange = zoomState.yMax - zoomState.yMin;
      
      const deltaChartX = (deltaX / rect.width) * xRange;
      const deltaChartY = -(deltaY / rect.height) * yRange; // Y is flipped
      
      setZoomState(prev => prev ? {
        ...prev,
        xMin: prev.xMin - deltaChartX,
        xMax: prev.xMax - deltaChartX,
        yMin: prev.yMin - deltaChartY,
        yMax: prev.yMax - deltaChartY
      } : null);
      
      setPanState(prev => ({
        ...prev,
        lastX: event.clientX,
        lastY: event.clientY
      }));
    }
  }, [areaSelectState.isSelecting, panState.isDragging, panState.lastX, panState.lastY, zoomState]);

  // Mouse up handler for area selection and drag pan
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (areaSelectState.isSelecting) {
      // Complete area selection zoom
      const chartElement = chartContainerRef.current?.querySelector('.recharts-wrapper');
      if (!chartElement) return;
      
      const rect = chartElement.getBoundingClientRect();
      const containerRect = chartContainerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      
      // Calculate selection area in chart coordinates
      const startRelX = (areaSelectState.startX - rect.left) / rect.width;
      const startRelY = (areaSelectState.startY - rect.top) / rect.height;
      const endRelX = (areaSelectState.endX - rect.left) / rect.width;
      const endRelY = (areaSelectState.endY - rect.top) / rect.height;
      
      const currentXDomain = zoomState ? [zoomState.xMin, zoomState.xMax] : (originalXDomain as [number, number]);
      const currentYDomain = zoomState ? [zoomState.yMin, zoomState.yMax] : (originalYDomain as [number, number]);
      
      const x1 = currentXDomain[0] + Math.min(startRelX, endRelX) * (currentXDomain[1] - currentXDomain[0]);
      const x2 = currentXDomain[0] + Math.max(startRelX, endRelX) * (currentXDomain[1] - currentXDomain[0]);
      const y1 = currentYDomain[1] - Math.max(startRelY, endRelY) * (currentYDomain[1] - currentYDomain[0]);
      const y2 = currentYDomain[1] - Math.min(startRelY, endRelY) * (currentYDomain[1] - currentYDomain[0]);
      
      // Only zoom if the selected area is significant
      const minSelectionSize = 0.05; // 5% of current view
      const xRange = currentXDomain[1] - currentXDomain[0];
      const yRange = currentYDomain[1] - currentYDomain[0];
      
      if ((x2 - x1) > xRange * minSelectionSize && (y2 - y1) > yRange * minSelectionSize) {
        setZoomState({
          xMin: x1,
          xMax: x2,
          yMin: y1,
          yMax: y2,
          isZoomed: true
        });
      }
      
      setAreaSelectState({
        isSelecting: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      });
    } else if (panState.isDragging) {
      setPanState(prev => ({
        ...prev,
        isDragging: false
      }));
    }
  }, [areaSelectState, panState.isDragging, zoomState, originalXDomain, originalYDomain]);

  // Double click handler for reset zoom
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    handleResetZoom();
  }, [handleResetZoom]);

  // Wheel event listener removed - no longer supporting scroll zoom

  if (!availableMetrics.length) {
    return (
      <div className={`flex items-center justify-center h-96 ${
        isDarkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <p>No metrics available for scatter plot visualization</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Metric selector buttons - Responsive */}
      <div className="mt-6 sm:mt-8 mb-2 sm:mb-4 flex flex-wrap gap-2 sm:gap-3 justify-center">
        {availableMetrics.map((metric) => (
          <button
            key={metric}
            onClick={() => onMetricChange(metric)}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-all ${
              currentMetric === metric
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <span className="hidden sm:inline">{metric}</span>
            <span className="sm:hidden text-xs">{metric.length > 10 ? metric.substring(0, 8) + '...' : metric}</span>
          </button>
        ))}
      </div>

      {/* Model Type Filter Buttons - only show for Code-Robustness leaderboard - Responsive */}
      {currentTask === 'code-robustness' && (
        <div className="mb-2 sm:mb-4 flex flex-wrap gap-2 sm:gap-3 justify-center">
          <button
            onClick={() => setShowCoTModels(!showCoTModels)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1 sm:gap-2 ${
              showCoTModels
                ? isDarkMode
                  ? 'text-green-400 border border-green-400/30'
                  : 'text-green-600 border border-green-600/30'
                : isDarkMode
                ? 'text-slate-400 border border-slate-600 opacity-50'
                : 'text-slate-500 border border-slate-300 opacity-50'
            }`}
          >
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
              showCoTModels
                ? isDarkMode 
                  ? 'bg-green-400' 
                  : 'bg-green-600'
                : 'bg-transparent border border-current'
            }`}></div>
            <span className="hidden sm:inline">CoT Models</span>
            <span className="sm:hidden">CoT</span>
          </button>
          
          <button
            onClick={() => setShowRegularModels(!showRegularModels)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1 sm:gap-2 ${
              showRegularModels
                ? isDarkMode
                  ? 'text-blue-400 border border-blue-400/30'
                  : 'text-blue-600 border border-blue-600/30'
                : isDarkMode
                ? 'text-slate-400 border border-slate-600 opacity-50'
                : 'text-slate-500 border border-slate-300 opacity-50'
            }`}
          >
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
              showRegularModels
                ? isDarkMode 
                  ? 'bg-blue-400' 
                  : 'bg-blue-600'
                : 'bg-transparent border border-current'
            }`}></div>
            <span className="hidden sm:inline">Regular Models</span>
            <span className="sm:hidden">Regular</span>
          </button>
        </div>
      )}

      {/* Graph's Independent Timeline Filter - Responsive */}
      <div className="mb-4 sm:mb-6">
        <TimelineSlider
          minDate={dateBounds.min}
          maxDate={dateBounds.max}
          startDate={graphTimelineRange?.start || dateBounds.min}
          endDate={graphTimelineRange?.end || dateBounds.max}
          onDateRangeChange={handleGraphTimelineChange}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Y-axis label and chart controls - Responsive */}
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="text-left pl-4 sm:pl-16 order-2 sm:order-1">
          <span className={`text-sm sm:text-lg font-semibold ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {currentMetric}
          </span>
        </div>
        
        {/* Chart Controls - Responsive */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 pr-2 sm:pr-8 order-1 sm:order-2">
          <button
            onClick={handleResetGraphTimeline}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              graphTimelineRange
                ? isDarkMode
                  ? 'bg-slate-600 text-white hover:bg-slate-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                : isDarkMode
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-50 border border-slate-200'
            }`}
            title="Reset Chart Timeline Filter"
            disabled={!graphTimelineRange}
          >
            <span className="hidden sm:inline">🗓️ Reset Timeline</span>
            <span className="sm:hidden">🗓️</span>
          </button>
          <button
            onClick={() => handleZoomIn()}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              isDarkMode
                ? 'bg-slate-600 text-white hover:bg-slate-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
            title="Zoom In (+)"
          >
            🔍+
          </button>
          <button
            onClick={() => handleZoomOut()}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              isDarkMode
                ? 'bg-slate-600 text-white hover:bg-slate-500'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
            title="Zoom Out (-)"
          >
            🔍-
          </button>
          <button
            onClick={handleResetZoom}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              zoomState
                ? isDarkMode
                  ? 'bg-slate-600 text-white hover:bg-slate-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                : isDarkMode
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-50 border border-slate-200'
            }`}
            title="Reset Zoom (Double Click)"
            disabled={!zoomState}
          >
            <span className="hidden sm:inline">🔄 Reset Zoom</span>
            <span className="sm:hidden">🔄</span>
          </button>
          <span className={`text-xs sm:text-sm whitespace-nowrap ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span className="hidden sm:inline">{filteredData.length} models</span>
            <span className="sm:hidden">{filteredData.length}</span>
            {graphTimelineRange && <span className="hidden sm:inline"> (filtered)</span>}
            {zoomState && <span className="hidden sm:inline"> (zoomed)</span>}
          </span>
        </div>
      </div>

      {/* Chart or No Results Message */}
      {filteredData.length === 0 ? (
        // Show no results message when chart timeline filter returns 0 results - consistent with table view
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px'
        }}>
          <svg style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{
            color: isDarkMode ? '#cbd5e1' : '#475569',
            fontSize: '18px',
            fontWeight: '500'
          }}>No results found</span>
          <span style={{
            color: isDarkMode ? '#94a3b8' : '#64748b',
            fontSize: '14px',
            marginTop: '8px'
          }}>Try adjusting your filters</span>
        </div>
      ) : (
        // Show chart when there are results
        <div 
          ref={chartContainerRef}
          className="h-[400px] sm:h-[500px] lg:h-[700px] relative"
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMoveCapture}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{ 
            cursor: isCtrlPressed ? 'crosshair' : (panState.isDragging ? 'grabbing' : (zoomState ? 'grab' : 'default'))
          }}
        >
          {/* Area selection overlay */}
          {areaSelectState.isSelecting && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20 pointer-events-none z-10"
              style={{
                left: Math.min(areaSelectState.startX, areaSelectState.endX) - (chartContainerRef.current?.getBoundingClientRect().left || 0),
                top: Math.min(areaSelectState.startY, areaSelectState.endY) - (chartContainerRef.current?.getBoundingClientRect().top || 0),
                width: Math.abs(areaSelectState.endX - areaSelectState.startX),
                height: Math.abs(areaSelectState.endY - areaSelectState.startY),
              }}
            />
          )}
          
          {/* Info icon with hover tooltip */}
          <div className="absolute top-2 left-2 z-20 group">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center cursor-help ${
              isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
            } hover:${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'} transition-colors`}>
              <span className="text-sm font-bold">i</span>
            </div>
            {/* Tooltip */}
            <div className={`absolute left-8 top-0 hidden group-hover:block text-xs p-2 rounded-lg ${
              isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'
            } bg-opacity-95 shadow-lg border whitespace-nowrap z-30`}>
              <div>🖱️ Drag: Pan around</div>
              <div>Ctrl + Drag: Select area to zoom</div>
              <div>Double click: Reset zoom</div>
              <div>+/- keys: Zoom in/out</div>
              <div className="text-xs opacity-75 mt-1">
                {zoomState ? 'Showing only points in zoomed area' : 'Showing all points'}
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={filteredData}
              margin={{
                top: window.innerWidth < 640 ? 15 : 20,
                right: window.innerWidth < 640 ? 20 : 30,
                left: window.innerWidth < 640 ? 50 : 60,
                bottom: window.innerWidth < 640 ? 60 : 80
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkMode ? "#4a5568" : "#cbd5e0"}
              />
              <XAxis 
                type="number"
                dataKey="x"
                domain={xDomain}
                tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568", fontSize: window.innerWidth < 640 ? 10 : 12 }}
                tickFormatter={formatXAxisDate}
                angle={window.innerWidth < 640 ? -60 : -45}
                textAnchor="end"
                height={window.innerWidth < 640 ? 60 : 80}
              >
                <Label 
                  value="Model Release Date" 
                  position="bottom" 
                  offset={window.innerWidth < 640 ? -10 : -20}
                  fill={isDarkMode ? "#cbd5e0" : "#4a5568"}
                  style={{ fontWeight: 'bold', fontSize: window.innerWidth < 640 ? '12px' : '14px' }}
                />
              </XAxis>
              <YAxis 
                type="number"
                dataKey="y"
                domain={yDomain}
                tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568", fontSize: window.innerWidth < 640 ? 10 : 12 }}
                tickFormatter={formatYAxisValue}
                width={window.innerWidth < 640 ? 50 : 60}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '5 5', stroke: isDarkMode ? '#60a5fa' : '#3b82f6', strokeWidth: 1 }}
                allowEscapeViewBox={{ x: false, y: false }}
              />
              
              {/* Reference lines for leaderboard timeline range */}
              {leaderboardTimelineRange && (
                <>
                  <ReferenceLine 
                    x={leaderboardTimelineRange.start.getTime()}
                    stroke={isDarkMode ? "#fbbf24" : "#f59e0b"}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: "Leaderboard Start", 
                      position: "top",
                      fill: isDarkMode ? "#fbbf24" : "#f59e0b",
                      fontSize: 12
                    }}
                  />
                  <ReferenceLine 
                    x={leaderboardTimelineRange.end.getTime()}
                    stroke={isDarkMode ? "#fbbf24" : "#f59e0b"}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: "Leaderboard End", 
                      position: "top",
                      fill: isDarkMode ? "#fbbf24" : "#f59e0b",
                      fontSize: 12
                    }}
                  />
                </>
              )}
              
                             {/* Scatter points with conditional coloring */}
               <Scatter 
                 data={filteredData} 
                 shape={(props: { payload?: ScatterDataPoint; cx?: number; cy?: number }) => {
                                     const { payload, cx, cy } = props;
                  const color = payload?.hasDataLeakage 
                    ? (isDarkMode ? "#f472b6" : "#ec4899") // Pink for data leakage
                    : payload?.isCoTModel 
                      ? (isDarkMode ? "#22c55e" : "#16a34a") // Green for CoT models
                      : (isDarkMode ? "#60a5fa" : "#3b82f6"); // Blue for normal
                   
                   // Check if this point is being hovered
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   const isHovered = hoveredPoint && hoveredPoint.model === (payload as any).model;
                   
                   // Only pass valid DOM attributes to the circle element
                   return (
                     <circle 
                       cx={cx}
                       cy={cy}
                       fill={color}
                       stroke={payload?.hasDataLeakage 
                         ? (isDarkMode ? "#f9a8d4" : "#be185d")
                         : payload?.isCoTModel 
                           ? (isDarkMode ? "#4ade80" : "#15803d") // Green stroke for CoT models
                           : (isDarkMode ? "#93c5fd" : "#1d4ed8") // Blue stroke for normal
                       }
                       fillOpacity={isHovered ? 0.9 : (hoveredPoint ? 0.3 : 0.7)}
                       strokeWidth={isHovered ? 2 : 1}
                       r={isHovered ? 8 : 6}
                       style={{
                         filter: hoveredPoint && !isHovered ? 'blur(1px)' : 'none',
                         transition: 'all 0.2s ease'
                       }}
                     />
                   );
                 }}
               >
                                 {/* Add model name labels with conditional coloring */}
                 <LabelList 
                   dataKey="model" 
                   position="top"
                   offset={8}
                                     content={(props: { x?: number | string; y?: number | string; value?: string | number }) => {
                    const { x, y, value } = props;
                    if (!value || !x || !y) return null;
                     
                                         // Get the data point from timelineFilteredData to check for data leakage and CoT status
                    const dataPoint = filteredData.find(d => d.model === value);
                    const hasLeakage = dataPoint?.hasDataLeakage;
                    const isCotModel = dataPoint?.isCoTModel;
                     
                     // Check if this label is for the hovered point
                     const isHovered = hoveredPoint && hoveredPoint.model === value;
                     
                     const valueStr = String(value);
                     // Show full name if hovered, otherwise truncate
                     const displayName = isHovered ? valueStr : (valueStr.length > 15 ? valueStr.substring(0, 15) + '...' : valueStr);
                     
                     return (
                       <text
                         x={Number(x)}
                         y={Number(y) - (isHovered ? 12 : 8)} // Move hovered labels slightly higher
                         textAnchor="middle"
                         fontSize={isHovered ? "14px" : "12px"} // Larger font for hovered
                         fontWeight="bold"
                         fill={
                           hasLeakage 
                             ? (isDarkMode ? '#f472b6' : '#ec4899') // Pink for data leakage
                             : isCotModel 
                               ? (isDarkMode ? '#22c55e' : '#16a34a') // Green for CoT models
                               : (isDarkMode ? '#e2e8f0' : '#475569') // Normal color
                         }
                         opacity={hoveredPoint && !isHovered ? 0.3 : 1}
                         style={{
                           filter: hoveredPoint && !isHovered ? 'blur(0.5px)' : 'none',
                           transition: 'all 0.2s ease'
                         }}
                       >
                         {displayName}
                       </text>
                     );
                   }}
                 />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ModelScatterChart;