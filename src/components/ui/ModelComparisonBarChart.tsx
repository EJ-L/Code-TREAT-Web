import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Label
} from 'recharts';

type BarChartProps = {
  data: Array<{ 
    metric: string;
    [key: string]: string | number; 
  }>;
  models: string[];
  isDarkMode: boolean;
};

const ModelComparisonBarChart = ({ data, models, isDarkMode }: BarChartProps) => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'
  ];

  // Transform data to better fit bar chart format
  const transformedData = data.map(item => {
    const newItem: { name: string; [key: string]: string | number } = { name: item.metric };
    models.forEach(model => {
      newItem[model] = item[model];
    });
    return newItem;
  });

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 100  // Increase bottom margin to accommodate labels
          }}
          layout="vertical"  // Change to vertical layout for better label display
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? "#4a5568" : "#cbd5e0"} 
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            type="number"
            domain={[0, 100]} 
            tick={{ fill: isDarkMode ? "#cbd5e0" : "#4a5568" }}
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
            width={120}  // Set a fixed width for the y-axis to ensure metric names are visible
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
          <Legend 
            verticalAlign="bottom" 
            height={80}  // Increased height for the legend area
            wrapperStyle={{ paddingTop: '20px' }}
          />
          
          {models.map((model, index) => (
            <Bar 
              key={model} 
              dataKey={model} 
              name={model}
              fill={colors[index % colors.length]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModelComparisonBarChart; 