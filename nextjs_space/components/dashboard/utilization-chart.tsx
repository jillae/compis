
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface UtilizationChartProps {
  utilizationRate: number
}

export default function UtilizationChart({ utilizationRate }: UtilizationChartProps) {
  const data = [
    { name: 'Utilized', value: utilizationRate, color: '#72BF78' },
    { name: 'Available', value: 100 - utilizationRate, color: '#E5E7EB' }
  ]

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Capacity']}
            contentStyle={{ fontSize: 11 }}
          />
          <Legend 
            verticalAlign="top" 
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <div className="text-2xl font-bold text-gray-900">{utilizationRate}%</div>
        <div className="text-sm text-gray-600">Current Utilization</div>
      </div>
    </div>
  )
}
