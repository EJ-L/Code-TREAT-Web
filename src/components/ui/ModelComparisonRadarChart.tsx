import React, { useState } from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer, 
  Tooltip
} from 'recharts';

type RadarChartProps = {
  data: Array<{ 
    metric: string;
    [key: string]: string | number; 
  }>;
  models: string[];
  isDarkMode: boolean;
};

const ModelComparisonRadarChart = ({ data, models, isDarkMode }: RadarChartProps) => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'
  ];

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
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
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568" }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: isDarkMode ? "#1a202c" : "#fff",
              borderColor: isDarkMode ? "#4a5568" : "#e2e8f0",
              color: isDarkMode ? "#e2e8f0" : "#1a202c"
            }}
          />
          <Legend />
          
          {models.map((model, index) => (
            <Radar
              key={model}
              name={model}
              dataKey={model}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModelComparisonRadarChart; 