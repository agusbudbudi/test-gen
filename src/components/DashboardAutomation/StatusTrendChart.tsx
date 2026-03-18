import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';

interface StatusTrendChartProps {
  data: any[];
}

export const StatusTrendChart = ({ data }: StatusTrendChartProps) => {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis 
            dataKey="createdAt" 
            tickFormatter={(val) => dayjs(val).format('MMM DD')}
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: '12px'
            }}
            labelFormatter={(label) => dayjs(label).format('MMMM DD, YYYY HH:mm')}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          <Bar dataKey="summary.passed" stackId="a" fill="#10b981" name="Passed" radius={[0, 0, 0, 0]} />
          <Bar dataKey="summary.failed" stackId="a" fill="#ef4444" name="Failed" />
          <Bar dataKey="summary.broken" stackId="a" fill="#f59e0b" name="Broken" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
