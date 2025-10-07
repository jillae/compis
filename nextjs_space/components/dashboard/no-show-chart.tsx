
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface NoShowChartProps {
  data: number[]
}

export default function NoShowChart({ data }: NoShowChartProps) {
  const chartData = data?.map((count, hour) => ({
    hour: `${hour}:00`,
    noShows: count,
    hourNum: hour
  })) || []

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            label={{ value: 'No-Shows', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <Tooltip 
            contentStyle={{ fontSize: 11 }}
            labelFormatter={(hour) => `Time: ${hour}`}
            formatter={(value) => [value, 'No-Shows']}
          />
          <Bar 
            dataKey="noShows" 
            fill="#FF6B6B" 
            radius={[2, 2, 0, 0]}
            stroke="#FF5252"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
