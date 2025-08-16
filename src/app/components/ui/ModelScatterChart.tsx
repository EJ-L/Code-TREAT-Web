import React, { useState, useMemo, useCallback } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Label,
  ReferenceLine,
  LabelList
} from 'recharts';
import { MODEL_PUBLISH_DATES, hasDataLeakage } from '@/lib/constants';

type ScatterChartProps = {
  data: any[];
  currentMetric: string;
  availableMetrics: string[];
  onMetricChange: (metric: string) => void;
  isDarkMode: boolean;
  currentTask: string;
};

interface ScatterDataPoint {
  x: number; // Date as timestamp
  y: number; // Metric value
  model: string;
  displayDate: string;
  metricValue: string;
  hasDataLeakage: boolean;
}

const ModelScatterChart = ({ 
  data, 
  currentMetric, 
  availableMetrics, 
  onMetricChange, 
  isDarkMode,
  currentTask
}: ScatterChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<ScatterDataPoint | null>(null);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Transform data for scatter plot
  const scatterData = useMemo(() => {
    if (!data || !currentMetric) return [];

    const points: ScatterDataPoint[] = [];
    
    data.forEach(result => {
      const modelName = result.model || result.modelName;
      const publishDate = MODEL_PUBLISH_DATES[modelName];
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
          model: modelName,
          displayDate: publishDate,
          metricValue: `${displayValue.toFixed(1)}%`,
          hasDataLeakage: hasDataLeakage(modelName, currentTask)
        });
      }
    });

    return points;
  }, [data, currentMetric, currentTask]);

  // Calculate domain ranges with zoom and pan
  const xDomain = useMemo(() => {
    if (!scatterData.length) return ['auto', 'auto'];
    const dates = scatterData.map(d => d.x);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    // Add some padding (3 months on each side)
    const padding = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
    const baseMin = minDate - padding;
    const baseMax = maxDate + padding;
    
    // Apply zoom and pan
    const range = (baseMax - baseMin) / zoomLevel;
    const center = (baseMax + baseMin) / 2 + panOffset.x;
    
    return [center - range / 2, center + range / 2];
  }, [scatterData, zoomLevel, panOffset.x]);

  const yDomain = useMemo(() => {
    if (!scatterData.length) return [0, 100];
    const values = scatterData.map(d => d.y);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Cap maximum at 100% for percentage metrics and ensure proper range
    const cappedMaxValue = Math.min(maxValue, 100);
    
    // Add 10% padding but ensure we don't go below 0 or above 100
    const padding = (cappedMaxValue - minValue) * 0.1;
    const baseMin = Math.max(0, minValue - padding);
    const baseMax = Math.min(100, cappedMaxValue + padding);
    
    // Apply zoom and pan
    const range = (baseMax - baseMin) / zoomLevel;
    const center = (baseMax + baseMin) / 2 + panOffset.y;
    
    return [center - range / 2, center + range / 2];
  }, [scatterData, zoomLevel, panOffset.y]);

  // Custom tooltip
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
  const handleMouseMove = useCallback((event: any) => {
    if (!event) return;
    
    setShowCrosshair(true);
    
    // Set hovered point only when mouse is directly over a data point
    if (event.activePayload && event.activePayload[0]) {
      setHoveredPoint(event.activePayload[0].payload);
    } else {
      setHoveredPoint(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    setShowCrosshair(false);
  }, []);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10)); // Max zoom level 10x
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5)); // Min zoom level 0.5x
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Format Y-axis values with proper significant figures
  const formatYAxisValue = (value: number) => {
    // Round to 4 significant figures
    const rounded = parseFloat(value.toPrecision(4));
    return rounded.toString();
  };



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
      {/* Metric selector buttons */}
      <div className="mb-6 flex flex-wrap gap-3 justify-center">
        {availableMetrics.map((metric) => (
          <button
            key={metric}
            onClick={() => onMetricChange(metric)}
            className={`px-6 py-4 text-l font-medium rounded-lg transition-all ${
              currentMetric === metric
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {metric}
          </button>
        ))}
      </div>



      {/* Y-axis label and zoom controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-left pl-16">
          <span className={`text-lg font-semibold ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {currentMetric}
          </span>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-2 pr-8">
          <button
            onClick={handleZoomIn}
            className={`px-3 py-2 rounded-md font-medium transition-all ${
              isDarkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title="Zoom In"
          >
            🔍+
          </button>
          <button
            onClick={handleZoomOut}
            className={`px-3 py-2 rounded-md font-medium transition-all ${
              isDarkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title="Zoom Out"
          >
            🔍-
          </button>
          <button
            onClick={handleResetZoom}
            className={`px-3 py-2 rounded-md font-medium transition-all ${
              isDarkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title="Reset Zoom"
          >
            ↻
          </button>
          <span className={`text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {zoomLevel.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[850px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            data={scatterData}
            margin={{
              top: 20,
              right: 30,
              left: 60,
              bottom: 80
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
              tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568", fontSize: 12 }}
              tickFormatter={formatXAxisDate}
              angle={-45}
              textAnchor="end"
              height={80}
            >
              <Label 
                value="Model Release Date" 
                position="bottom" 
                offset={-20}
                fill={isDarkMode ? "#cbd5e0" : "#4a5568"}
                style={{ fontWeight: 'bold' }}
              />
            </XAxis>
            <YAxis 
              type="number"
              dataKey="y"
              domain={yDomain}
              tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568" }}
              tickFormatter={formatYAxisValue}
              width={60}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '5 5', stroke: isDarkMode ? '#60a5fa' : '#3b82f6', strokeWidth: 1 }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            

            
            {/* Scatter points with conditional coloring */}
            <Scatter 
              data={scatterData} 
              shape={(props: any) => {
                const { payload, cx, cy } = props;
                const color = payload?.hasDataLeakage 
                  ? (isDarkMode ? "#f472b6" : "#ec4899") // Pink for data leakage
                  : (isDarkMode ? "#60a5fa" : "#3b82f6"); // Blue for normal
                
                // Only pass valid DOM attributes to the circle element
                return (
                  <circle 
                    cx={cx}
                    cy={cy}
                    fill={color}
                    stroke={payload?.hasDataLeakage 
                      ? (isDarkMode ? "#f9a8d4" : "#be185d")
                      : (isDarkMode ? "#93c5fd" : "#1d4ed8")
                    }
                    fillOpacity={0.7}
                    strokeWidth={1}
                    r={6}
                  />
                );
              }}
            >
              {/* Add model name labels with conditional coloring */}
              <LabelList 
                dataKey="model" 
                position="top"
                offset={8}
                content={(props: any) => {
                  const { x, y, value } = props;
                  if (!value || !x || !y) return null;
                  
                  // Get the data point from scatterData to check for data leakage
                  const dataPoint = scatterData.find(d => d.model === value);
                  const hasLeakage = dataPoint?.hasDataLeakage;
                  
                  const valueStr = String(value);
                  const shortName = valueStr.length > 15 ? valueStr.substring(0, 15) + '...' : valueStr;
                  
                  return (
                    <text
                      x={Number(x)}
                      y={Number(y) - 8}
                      textAnchor="middle"
                      fontSize="10px"
                      fontWeight="bold"
                      fill={
                        hasLeakage 
                          ? (isDarkMode ? '#f472b6' : '#ec4899') // Pink for data leakage
                          : (isDarkMode ? '#e2e8f0' : '#475569') // Normal color
                      }
                    >
                      {shortName}
                    </text>
                  );
                }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ModelScatterChart;

