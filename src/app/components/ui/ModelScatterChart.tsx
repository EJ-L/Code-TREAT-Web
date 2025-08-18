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
  LabelList,
  ReferenceLine
} from 'recharts';
import { MODEL_PUBLISH_DATES, hasDataLeakage } from '@/lib/constants';
import { TimelineSlider } from './TimelineSlider';

type ScatterChartProps = {
  data: any[];
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
}

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
  const [showCrosshair, setShowCrosshair] = useState(false);
  // Graph's own timeline state, independent from leaderboard
  const [graphTimelineRange, setGraphTimelineRange] = useState<{ start: Date; end: Date } | null>(null);

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

  // Filter data based on graph's own timeline range
  const timelineFilteredData = useMemo(() => {
    if (!graphTimelineRange) return scatterData;
    
    const startTimestamp = graphTimelineRange.start.getTime();
    const endTimestamp = graphTimelineRange.end.getTime();
    
    return scatterData.filter(point => 
      point.x >= startTimestamp && point.x <= endTimestamp
    );
  }, [scatterData, graphTimelineRange]);

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

  // Calculate domain ranges based on filtered data
  const { xDomain, yDomain } = useMemo(() => {
    if (!timelineFilteredData.length) {
      return {
        xDomain: ['auto', 'auto'] as ['auto', 'auto'],
        yDomain: [0, 100] as [number, number]
      };
    }
    
    // Show all filtered data with padding
    const dates = timelineFilteredData.map(d => d.x);
    const values = timelineFilteredData.map(d => d.y);
    
    const padding = 90 * 24 * 60 * 60 * 1000; // 90 days padding
    const valuePadding = 5; // 5% padding for y values
    
    return {
      xDomain: [
        Math.min(...dates) - padding,
        Math.max(...dates) + padding
      ] as [number, number],
      yDomain: [
        Math.max(0, Math.min(...values) - valuePadding),
        Math.min(100, Math.max(...values) + valuePadding)
      ] as [number, number]
    };
  }, [timelineFilteredData]);

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

      {/* Graph's Independent Timeline Filter */}
      <div className="mb-6">
        <TimelineSlider
          minDate={dateBounds.min}
          maxDate={dateBounds.max}
          startDate={graphTimelineRange?.start || dateBounds.min}
          endDate={graphTimelineRange?.end || dateBounds.max}
          onDateRangeChange={handleGraphTimelineChange}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Y-axis label and chart controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-left pl-16">
          <span className={`text-lg font-semibold ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {currentMetric}
          </span>
        </div>
        
        {/* Chart Controls */}
        <div className="flex items-center gap-2 pr-8">
          <button
            onClick={handleResetGraphTimeline}
            className={`px-3 py-2 rounded-md font-medium transition-all ${
              isDarkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            } ${!graphTimelineRange ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Reset Chart Timeline Filter"
            disabled={!graphTimelineRange}
          >
            🗓️ Reset Timeline
          </button>
          <span className={`text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {timelineFilteredData.length} models
            {graphTimelineRange && ' (filtered)'}
          </span>
        </div>
      </div>

      {/* Chart or No Results Message */}
      {timelineFilteredData.length === 0 ? (
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
        <div className="h-[700px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={timelineFilteredData}
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
                 data={timelineFilteredData} 
                 shape={(props: any) => {
                   const { payload, cx, cy } = props;
                   const color = payload?.hasDataLeakage 
                     ? (isDarkMode ? "#f472b6" : "#ec4899") // Pink for data leakage
                     : (isDarkMode ? "#60a5fa" : "#3b82f6"); // Blue for normal
                   
                   // Check if this point is being hovered
                   const isHovered = hoveredPoint && hoveredPoint.model === payload.model;
                   
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
                   content={(props: any) => {
                     const { x, y, value } = props;
                     if (!value || !x || !y) return null;
                     
                     // Get the data point from timelineFilteredData to check for data leakage
                     const dataPoint = timelineFilteredData.find(d => d.model === value);
                     const hasLeakage = dataPoint?.hasDataLeakage;
                     
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