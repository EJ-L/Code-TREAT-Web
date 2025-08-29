import React, { useState, useMemo, useEffect } from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  Tooltip
} from 'recharts';

type RadarChartProps = {
  data: Array<{ 
    metric: string;
    [key: string]: string | number; 
  }>;
  models: string[];
  activeModels?: Record<string, boolean>;
  isDarkMode: boolean;
};

const ModelComparisonRadarChart = ({ data, models, activeModels, isDarkMode }: RadarChartProps) => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'
  ];
  
  // Track which models are active for toggling
  const [visibleModels, setVisibleModels] = useState<Record<string, boolean>>(
    activeModels || models.reduce((acc, model) => ({ ...acc, [model]: true }), {})
  );
  
  // Update visible models when activeModels or models change
  useEffect(() => {
    if (activeModels) {
      setVisibleModels(activeModels);
    }
  }, [activeModels, models]);

  // Calculate optimal min/max domain based on data to enhance visibility of differences
  const domainRange = useMemo(() => {
    // If no data, use default range
    if (!data.length || !models.length) return [0, 100];
    
    // Get min and max values across all metrics and models
    const allValues: number[] = [];
    data.forEach(item => {
      models.forEach(model => {
        if (typeof item[model] === 'number' && visibleModels[model]) {
          allValues.push(item[model] as number);
        }
      });
    });
    
    if (!allValues.length) return [0, 100];
    
    // Calculate min and max, handling edge cases
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    // If values are very similar, create a custom range to highlight differences
    if (maxValue - minValue < 10) {
      // Create a range that's ±15% around the average to highlight small differences
      const avgValue = (minValue + maxValue) / 2;
      const range = Math.max(10, (maxValue - minValue) * 3); // At least 10 units wide
      
      const newMin = Math.max(0, avgValue - range/2);
      const newMax = Math.min(100, avgValue + range/2);
      
      return [Math.floor(newMin), Math.ceil(newMax)];
    }
    
    // Otherwise use a range that accommodates all values with some padding
    return [
      Math.max(0, Math.floor(minValue - 5)),
      Math.min(100, Math.ceil(maxValue + 5))
    ];
  }, [data, models, visibleModels]);

  // Handle clicking on a model in the legend to toggle visibility
  const handleLegendClick = (model: string) => {
    setVisibleModels(prev => ({
      ...prev,
      [model]: !prev[model]
    }));
  };

  return (
    <div className="w-full h-96">
      <div className="flex justify-center mb-2 flex-wrap gap-2">
        {models.map((model, index) => (
          <button
            key={model}
            className={`px-2 py-1 text-xs rounded-md transition-all ${
              visibleModels[model] 
                ? 'bg-opacity-100'
                : 'bg-opacity-30'
            }`}
            style={{ 
              backgroundColor: colors[index % colors.length], 
              color: isDarkMode ? 'white' : '#333'
            }}
            onClick={() => handleLegendClick(model)}
          >
            {model}
          </button>
        ))}
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="80%"
          data={data}
        >
          <PolarGrid 
            stroke={isDarkMode ? "#4a5568" : "#cbd5e0"} 
          />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568" }}
            tickSize={5}
            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 12)}...` : value}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={domainRange}
            tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568" }}
            tickCount={5}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: isDarkMode ? "#1a202c" : "#fff",
              borderColor: isDarkMode ? "#4a5568" : "#e2e8f0",
              color: isDarkMode ? "#e2e8f0" : "#1a202c"
            }}
            formatter={(value) => [`${value}%`, '']}
            labelFormatter={(value) => `Metric: ${value}`}
          />
          
          {models.map((model, index) => (
            visibleModels[model] && (
              <Radar
                key={model}
                name={model}
                dataKey={model}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ 
                  r: 4, 
                  fill: colors[index % colors.length],
                  strokeWidth: 2,
                  stroke: isDarkMode ? "#fff" : "#333"
                }}
              />
            )
          ))}
        </RadarChart>
      </ResponsiveContainer>
      
      <div className={`text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        Click model names above to toggle visibility
      </div>
    </div>
  );
};

export default ModelComparisonRadarChart; 