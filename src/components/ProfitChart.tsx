import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface ProfitChartProps {
  data: any[];
}

export const ProfitChart: React.FC<ProfitChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-lg">
      <h3 className="text-sm text-slate-400 mb-4 flex items-center gap-2">
        <span className="text-green-500">📈</span> Bankroll Growth
      </h3>

      <div className="h-64 min-h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: "#020617", 
                border: "1px solid #1e293b",
                borderRadius: "8px",
                fontSize: "12px"
              }}
              itemStyle={{ color: "#22c55e" }}
              labelStyle={{ color: "#64748b", marginBottom: "4px" }}
            />
            <Line
              type="monotone"
              dataKey="bankroll"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#020617" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
