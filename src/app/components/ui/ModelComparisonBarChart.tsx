import { constant } from 'lodash';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Label,
  ReferenceLine
} from 'recharts';

type BarChartProps = {
  data: Array<{ 
    metric: string;
    [key: string]: string | number; 
  }>;
  models: string[];
  activeModels?: Record<string, boolean>;
  isDarkMode: boolean;
};

const ModelComparisonBarChart = ({ data, models, activeModels, isDarkMode }: BarChartProps) => {
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

  // Transform data to better fit bar chart format
  const transformedData = useMemo(() => {
    return data.map(item => {
      const newItem: { name: string; [key: string]: string | number } = { name: item.metric };
      models.forEach(model => {
        if (visibleModels[model]) {
          newItem[model] = item[model];
        }
      });
      return newItem;
    });
  }, [data, models, visibleModels]);

  // Calculate optimal domain range to show differences clearly
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

  // Handle toggling model visibility
  const handleModelToggle = (model: string) => {
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
            onClick={() => handleModelToggle(model)}
          >
            {model}
          </button>
        ))}
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={transformedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60
          }}
          layout="vertical"
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? "#4a5568" : "#cbd5e0"} 
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            type="number"
            domain={domainRange}
            tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568" }}
            tickCount={5}
          >
            <Label 
              value="Value (%)" 
              position="bottom" 
              offset={0}
              fill={isDarkMode ? "#cbd5e0" : "#4a5568"}
            />
          </XAxis>
          <YAxis 
            type="category"
            dataKey="name" 
            tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568" }}
            width={120}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: isDarkMode ? "#1a202c" : "#fff",
              borderColor: isDarkMode ? "#4a5568" : "#e2e8f0",
              color: isDarkMode ? "#e2e8f0" : "#1a202c"
            }}
            formatter={(value) => [`${value}%`, '']}
            labelFormatter={(value) => `Metric: ${value}`}
            cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          />
          
          {/* Reference lines to help visualize the scale */}
          {domainRange[1] - domainRange[0] < 30 && (
            Array.from({ length: 5 }).map((_, i) => {
              const value = domainRange[0] + (domainRange[1] - domainRange[0]) * (i / 4);
              return (
                <ReferenceLine 
                  key={`ref-${i}`}
                  x={value} 
                  stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                  strokeDasharray="3 3"
                />
              );
            })
          )}
          
          {models.map((model, index) => (
            visibleModels[model] && (
              <Bar 
                key={model} 
                dataKey={model} 
                name={model}
                fill={colors[index % colors.length]}
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            )
          ))}
        </BarChart>
      </ResponsiveContainer>
      
      <div className={`text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        Click model names above to toggle visibility
      </div>
    </div>
  );
};

export default ModelComparisonBarChart; 