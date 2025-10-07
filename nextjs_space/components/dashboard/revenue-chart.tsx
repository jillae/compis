
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface RevenueChartProps {
  data: Array<{ bookings: number; noShows: number }>
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data?.map((item, index) => ({
    day: dayNames[index],
    bookings: item.bookings,
    noShows: item.noShows,
    dayIndex: index
  })) || []

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <Tooltip 
            contentStyle={{ fontSize: 11 }}
          />
          <Legend 
            verticalAlign="top" 
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line 
            type="monotone" 
            dataKey="bookings" 
            stroke="#60B5FF" 
            strokeWidth={3}
            dot={{ fill: '#60B5FF', strokeWidth: 2, r: 4 }}
            name="Total Bookings"
          />
          <Line 
            type="monotone" 
            dataKey="noShows" 
            stroke="#FF9898" 
            strokeWidth={3}
            dot={{ fill: '#FF9898', strokeWidth: 2, r: 4 }}
            name="No-Shows"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
