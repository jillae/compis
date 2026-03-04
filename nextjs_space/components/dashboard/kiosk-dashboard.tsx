'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { DisplayMode } from '@/lib/client-types'

// ─────────────────────────────────────────────────────────────────────────────
// Types — mirrors API shape without importing @prisma/client
// ─────────────────────────────────────────────────────────────────────────────

interface ForecastWeek {
  week: string         // "v.10"
  weekNumber: number
  utilization: number  // 0-100
  bookedSlots: number
  totalSlots: number
  isCurrent?: boolean
}

interface ForecastData {
  weeks: ForecastWeek[]
  insights: { message: string; type: string }[]
  summary: {
    averageUtilization: number
    peakWeek?: string
    trend?: string
  }
}

interface TodaySnapshot {
  total: number
  completed: number
  cancelled: number
  noShow: number
  remaining: number
  staffCheckedIn: number
  staffTotal: number
}

interface WeekDay {
  label: string
  short: string
  booked: number
  total: number
  pct: number
  isToday: boolean
}

interface DashboardOverview {
  todaySnapshot: TodaySnapshot
  weekCapacity: WeekDay[]
  staff: { id: string; name: string; checked_in: boolean }[]
  kpis: { label: string; value: string }[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns fill color class based on utilization percentage */
function utilizationColor(pct: number): string {
  if (pct >= 95) return '#ef4444'   // red-500
  if (pct >= 75) return '#10b981'   // emerald-500
  if (pct >= 50) return '#f59e0b'   // amber-500
  return '#f59e0b'                   // amber-500 for low too
}

/** Returns text class based on utilization */
function utilizationTextClass(pct: number): string {
  if (pct >= 95) return 'text-red-500'
  if (pct >= 75) return 'text-emerald-500'
  return 'text-amber-500'
}

/** Returns label text for the utilization value */
function utilizationLabel(pct: number): string {
  if (pct >= 95) return 'Kritisk'
  if (pct >= 75) return 'Optimal'
  if (pct >= 50) return 'Låg'
  return 'Mycket låg'
}

function getCurrentWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  return Math.ceil(diff / oneWeek)
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Area Chart — no external chart lib
// ─────────────────────────────────────────────────────────────────────────────

interface AreaChartProps {
  weeks: ForecastWeek[]
  extraBookings: number
  avgSlots: number
}

function AreaChart({ weeks, extraBookings, avgSlots }: AreaChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 1000
  const H = 280
  const paddingLeft = 56
  const paddingRight = 24
  const paddingTop = 20
  const paddingBottom = 48

  const chartW = W - paddingLeft - paddingRight
  const chartH = H - paddingTop - paddingBottom

  if (!weeks || weeks.length === 0) return null

  const currentWeekNum = getCurrentWeekNumber()

  // Compute projected data: extra bookings translate to utilization delta
  const slotBase = avgSlots > 0 ? avgSlots : 20
  const extraPct = Math.round((extraBookings / slotBase) * 100)

  const projectedWeeks = weeks.map((w) => ({
    ...w,
    projectedUtilization: Math.min(100, w.utilization + extraPct),
  }))

  // Scale helpers
  function xPos(i: number): number {
    return paddingLeft + (i / (weeks.length - 1)) * chartW
  }
  function yPos(pct: number): number {
    return paddingTop + chartH - (pct / 100) * chartH
  }

  // Build SVG path strings
  function buildPath(values: number[]): string {
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`)
      .join(' ')
  }

  function buildAreaPath(values: number[]): string {
    const linePts = values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`)
      .join(' ')
    const closeRight = `L ${xPos(values.length - 1).toFixed(1)} ${(paddingTop + chartH).toFixed(1)}`
    const closeLeft = `L ${paddingLeft.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} Z`
    return `${linePts} ${closeRight} ${closeLeft}`
  }

  const baseValues = projectedWeeks.map((w) => w.utilization)
  const projValues = projectedWeeks.map((w) => w.projectedUtilization)

  const currentIdx = weeks.findIndex(
    (w) => w.isCurrent || w.weekNumber === currentWeekNum
  )

  // Y-axis grid lines at 0, 25, 50, 75, 85, 100
  const gridLines = [0, 25, 50, 75, 85, 100]
  // Optimal zone: 75-85
  const optimalY1 = yPos(85)
  const optimalY2 = yPos(75)

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: '100%' }}
      aria-label="Beläggningsprognos"
    >
      <defs>
        {/* Base line gradient fill */}
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
        {/* Projected line gradient fill */}
        <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Optimal zone band (75-85%) */}
      <rect
        x={paddingLeft}
        y={optimalY1}
        width={chartW}
        height={optimalY2 - optimalY1}
        fill="#10b981"
        fillOpacity="0.06"
      />
      <text
        x={paddingLeft + 6}
        y={optimalY1 - 5}
        fill="#10b981"
        fontSize="11"
        fontFamily="system-ui, sans-serif"
        opacity="0.7"
      >
        Optimal zon
      </text>

      {/* Horizontal grid lines */}
      {gridLines.map((v) => (
        <g key={v}>
          <line
            x1={paddingLeft}
            y1={yPos(v)}
            x2={W - paddingRight}
            y2={yPos(v)}
            stroke="#27272a"
            strokeWidth="1"
          />
          <text
            x={paddingLeft - 8}
            y={yPos(v) + 4}
            textAnchor="end"
            fill="#71717a"
            fontSize="11"
            fontFamily="system-ui, sans-serif"
          >
            {v}%
          </text>
        </g>
      ))}

      {/* Area fills */}
      {extraBookings > 0 && (
        <path d={buildAreaPath(projValues)} fill="url(#projGrad)" />
      )}
      <path d={buildAreaPath(baseValues)} fill="url(#areaGrad)" />

      {/* Projected line (when slider > 0) */}
      {extraBookings > 0 && (
        <path
          d={buildPath(projValues)}
          fill="none"
          stroke="#818cf8"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />
      )}

      {/* Base line */}
      <path
        d={buildPath(baseValues)}
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current week vertical marker */}
      {currentIdx >= 0 && (
        <line
          x1={xPos(currentIdx)}
          y1={paddingTop}
          x2={xPos(currentIdx)}
          y2={paddingTop + chartH}
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.8"
        />
      )}

      {/* Data point circles */}
      {projectedWeeks.map((w, i) => {
        const isCurr = i === currentIdx
        const pct = w.utilization
        return (
          <g key={i}>
            <circle
              cx={xPos(i)}
              cy={yPos(pct)}
              r={isCurr ? 7 : 5}
              fill={utilizationColor(pct)}
              stroke="#09090b"
              strokeWidth={isCurr ? 3 : 2}
            />
            {/* Projected dot */}
            {extraBookings > 0 && w.projectedUtilization !== pct && (
              <circle
                cx={xPos(i)}
                cy={yPos(w.projectedUtilization)}
                r={4}
                fill="#818cf8"
                stroke="#09090b"
                strokeWidth="1.5"
              />
            )}
          </g>
        )
      })}

      {/* X-axis labels */}
      {weeks.map((w, i) => {
        const isCurr = i === currentIdx
        return (
          <g key={i}>
            <text
              x={xPos(i)}
              y={H - 10}
              textAnchor="middle"
              fill={isCurr ? '#f59e0b' : '#a1a1aa'}
              fontSize={isCurr ? '13' : '12'}
              fontWeight={isCurr ? '700' : '400'}
              fontFamily="system-ui, sans-serif"
            >
              {w.week}
            </text>
            {isCurr && (
              <text
                x={xPos(i)}
                y={H - 24}
                textAnchor="middle"
                fill="#f59e0b"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
                opacity="0.8"
              >
                NU
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function KioskSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 p-4 gap-4 animate-pulse">
      {/* Chart skeleton */}
      <div className="flex-1 bg-zinc-900 rounded-2xl" />
      {/* Slider skeleton */}
      <div className="h-20 bg-zinc-900 rounded-2xl" />
      {/* KPI row skeleton */}
      <div className="grid grid-cols-4 gap-3 h-28">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function KioskEmpty() {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 items-center justify-center gap-4 p-8">
      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <p className="text-zinc-200 text-xl font-semibold text-center">
        Väntar på data
      </p>
      <p className="text-zinc-500 text-base text-center max-w-sm">
        Synka Bokadirekt för att visa beläggningsprognos och realtidsdata.
      </p>
      <a
        href="/dashboard/settings/bokadirekt"
        className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-base transition-colors min-h-[44px] flex items-center"
      >
        Synka Bokadirekt
      </a>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  subValue?: string
  accentClass?: string
}

function KpiCard({ label, value, subValue, accentClass = 'text-white' }: KpiCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider leading-tight">
        {label}
      </span>
      <span className={`text-2xl font-bold leading-none mt-1 ${accentClass}`}>
        {value}
      </span>
      {subValue && (
        <span className="text-zinc-500 text-xs leading-tight mt-0.5">{subValue}</span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main KIOSK Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function KioskDashboard() {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [overviewData, setOverviewData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [extraBookings, setExtraBookings] = useState(0)

  // Fetch both endpoints in parallel
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [forecastRes, overviewRes] = await Promise.all([
        fetch('/api/capacity/forecast?weeks=6'),
        fetch('/api/dashboard/overview'),
      ])

      if (forecastRes.ok) {
        const json = await forecastRes.json()
        if (json.success && json.data) {
          // Normalize forecast weeks to have a "v.XX" label format
          const normalized: ForecastData = {
            ...json.data,
            weeks: (json.data.weeks ?? []).map((w: any, idx: number) => ({
              week: w.week ?? w.label ?? `v.${getCurrentWeekNumber() + idx}`,
              weekNumber: w.weekNumber ?? getCurrentWeekNumber() + idx,
              utilization: typeof w.utilization === 'number' ? Math.round(w.utilization) : Math.round(w.utilizationRate ?? w.pct ?? 0),
              bookedSlots: w.bookedSlots ?? w.booked ?? 0,
              totalSlots: w.totalSlots ?? w.total ?? 0,
              isCurrent: w.isCurrent ?? idx === 0,
            })),
          }
          setForecastData(normalized)
        }
      }

      if (overviewRes.ok) {
        const json = await overviewRes.json()
        if (json.success) {
          setOverviewData(json)
        }
      }
    } catch (err) {
      // Errors handled by empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 2 minutes for kiosk display
    const timer = setInterval(fetchData, 2 * 60 * 1000)
    return () => clearInterval(timer)
  }, [fetchData])

  if (loading) return <KioskSkeleton />

  const hasData =
    forecastData !== null &&
    forecastData.weeks.length > 0

  if (!hasData) return <KioskEmpty />

  // ── Derived KPI values ──────────────────────────────────────────────────
  const snap = overviewData?.todaySnapshot
  const weekDays = overviewData?.weekCapacity ?? []

  const todayDay = weekDays.find((d) => d.isToday)
  const todayBooked = todayDay ? `${todayDay.booked}/${todayDay.total}` : snap ? `${snap.total - snap.cancelled}/${snap.total}` : '—'

  const weekAvgPct = weekDays.length > 0
    ? Math.round(weekDays.reduce((sum, d) => sum + d.pct, 0) / weekDays.length)
    : Math.round(forecastData?.summary?.averageUtilization ?? 0)

  const staffCheckedIn = snap?.staffCheckedIn ?? 0
  const staffTotal = snap?.staffTotal ?? 0
  const staffStr = staffTotal > 0 ? `${staffCheckedIn}/${staffTotal}` : '—'

  // "Nästa lucka": find the next available slot in the week view
  // Proxy: the first future weekday that's below 100%
  const nextAvailable = weekDays.find((d) => !d.isToday && d.pct < 100)
  const nextLucka = nextAvailable ? nextAvailable.label : 'Fullbokat'

  // Projected utilization for the current week with the slider
  const currentWeekIdx = forecastData.weeks.findIndex((w) => w.isCurrent)
  const currentWeek = currentWeekIdx >= 0 ? forecastData.weeks[currentWeekIdx] : null
  const avgSlots = forecastData.weeks.reduce((sum, w) => sum + w.totalSlots, 0) / Math.max(forecastData.weeks.length, 1)
  const slotBase = avgSlots > 0 ? avgSlots : 20
  const extraPct = Math.round((extraBookings / slotBase) * 100)
  const projectedCurrentPct = currentWeek
    ? Math.min(100, currentWeek.utilization + extraPct)
    : weekAvgPct + extraPct

  // Slider feedback string
  const sliderFeedback =
    extraBookings === 0
      ? 'Flytta reglaget för att simulera extra bokningar'
      : `+${extraBookings} bokningar/v → ${projectedCurrentPct}% beläggning (${utilizationLabel(projectedCurrentPct).toLowerCase()})`

  return (
    <div
      className="flex flex-col bg-zinc-950 overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-white text-lg font-bold leading-tight">
            Kapacitetsprognos
          </h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            {new Date().toLocaleDateString('sv-SE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).replace(/^./, (c) => c.toUpperCase())}
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-400 text-xs font-medium">Live</span>
        </div>
      </div>

      {/* ── Central Forecast Graph ──────────────────────────────────── */}
      <div className="flex-1 mx-4 mb-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Beläggning (%) — 6 veckors rullande prognos
          </span>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-4 h-0.5 bg-emerald-500 inline-block rounded" />
              Faktisk
            </span>
            {extraBookings > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="w-4 h-px border-t-2 border-dashed border-indigo-400 inline-block" />
                Prognos
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <AreaChart
            weeks={forecastData.weeks}
            extraBookings={extraBookings}
            avgSlots={avgSlots}
          />
        </div>
      </div>

      {/* ── What-If Slider ──────────────────────────────────────────── */}
      <div className="mx-4 mb-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-300 text-sm font-semibold">
            Simulera extra bokningar
          </span>
          <span
            className={`text-sm font-bold tabular-nums ${
              extraBookings === 0 ? 'text-zinc-600' : utilizationTextClass(projectedCurrentPct)
            }`}
          >
            {extraBookings === 0 ? '±0' : `+${extraBookings}`} / vecka
          </span>
        </div>
        {/* Native range input styled for 44px touch target */}
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={extraBookings}
          onChange={(e) => setExtraBookings(Number(e.target.value))}
          className="w-full"
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            height: '44px',
            background: 'transparent',
            cursor: 'pointer',
            outline: 'none',
            // @ts-ignore -- CSS custom property for track fill
            '--pct': `${(extraBookings / 20) * 100}%`,
          } as React.CSSProperties}
          aria-label="Extra bokningar per vecka"
        />
        <p
          className={`text-xs mt-1 text-center font-medium transition-colors ${
            extraBookings === 0 ? 'text-zinc-600' : utilizationTextClass(projectedCurrentPct)
          }`}
        >
          {sliderFeedback}
        </p>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mx-4 mb-4 flex-shrink-0">
        <KpiCard
          label="Idag"
          value={todayBooked}
          subValue={`${snap?.remaining ?? 0} återstår`}
          accentClass="text-white"
        />
        <KpiCard
          label="Denna vecka"
          value={`${weekAvgPct}%`}
          subValue="genomsnittlig beläggning"
          accentClass={utilizationTextClass(weekAvgPct)}
        />
        <KpiCard
          label="Personal"
          value={staffStr}
          subValue={staffCheckedIn >= staffTotal && staffTotal > 0 ? 'Alla incheckade' : `${staffTotal - staffCheckedIn} ej incheckad`}
          accentClass={staffCheckedIn >= staffTotal && staffTotal > 0 ? 'text-emerald-400' : 'text-amber-400'}
        />
        <KpiCard
          label="Nästa lucka"
          value={nextLucka}
          subValue={nextAvailable ? `${nextAvailable.pct}% beläggning` : undefined}
          accentClass="text-zinc-200"
        />
      </div>

      {/* Slider thumb styles injected inline */}
      <style>{`
        input[type='range']::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(
            to right,
            #10b981 0%,
            #10b981 var(--pct, 0%),
            #3f3f46 var(--pct, 0%),
            #3f3f46 100%
          );
        }
        input[type='range']::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: #3f3f46;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #10b981;
          border: 3px solid #09090b;
          box-shadow: 0 0 0 2px #10b98133;
          margin-top: -19px;
          cursor: pointer;
          transition: background 0.15s;
        }
        input[type='range']::-moz-range-thumb {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #10b981;
          border: 3px solid #09090b;
          cursor: pointer;
        }
        input[type='range']:focus::-webkit-slider-thumb {
          background: #059669;
        }
      `}</style>
    </div>
  )
}
