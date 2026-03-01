'use client'

import { useState, useEffect } from 'react'
import { Habit, HabitLog } from '@/types'
import { getSleepStatus } from '@/lib/streaks'
import HabitBlock from '@/components/ui/HabitBlock'
import StreakBadge from '@/components/ui/StreakBadge'

interface Props {
  habit: Habit
  todayLog: HabitLog | null
  onSave: (hours: number, quality: number) => void
  dragHandle?: React.ReactNode
}

export default function SleepBlock({ habit, todayLog, onSave, dragHandle }: Props) {
  const [hours, setHours] = useState(todayLog?.value?.toString() ?? '')
  const [quality, setQuality] = useState(todayLog?.quality ?? 0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (todayLog) {
      setHours(todayLog.value.toString())
      setQuality(todayLog.quality ?? 0)
    }
  }, [todayLog])

  const hoursNum = parseFloat(hours) || 0
  const status = hoursNum > 0 ? getSleepStatus(hoursNum) : null
  const alreadySaved = !!todayLog
  // Si el usuario modifica los valores, permitir volver a guardar
  const valuesChanged = todayLog
    ? hoursNum !== todayLog.value || quality !== (todayLog.quality ?? 0)
    : false
  const isConfirmed = (alreadySaved || saved) && !valuesChanged

  function handleSave() {
    if (hoursNum <= 0 || quality === 0) return
    onSave(hoursNum, quality)
    setSaved(true)
  }

  return (
    <HabitBlock icon={habit.icon ?? '💤'} title={habit.name} dragHandle={dragHandle}>
      <div className="flex gap-3 items-center">
        {/* Horas */}
        <div className="flex-1">
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
            Horas
          </label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="7.5"
            className="w-full rounded-xl px-3 py-2 text-lg font-bold outline-none transition-all"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>

        {/* Calidad */}
        <div className="flex-1">
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
            Calidad
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className="w-8 h-8 rounded-full transition-all duration-150 text-sm"
                style={{
                  background: quality >= q ? 'var(--accent)' : 'var(--surface2)',
                  border: '1px solid var(--border)',
                }}
              >
                {quality >= q ? '●' : '○'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estado dinámico */}
      {status && (
        <div className="flex items-center justify-between">
          <StreakBadge status={status} />
          <button
            onClick={handleSave}
            disabled={hoursNum <= 0 || quality === 0 || isConfirmed}
            className="text-xs px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95"
            style={{
              background: isConfirmed ? 'var(--green)' : 'var(--accent)',
              color: '#fff',
              opacity: hoursNum <= 0 || quality === 0 ? 0.4 : 1,
            }}
          >
            {isConfirmed ? '✓ Guardado' : alreadySaved ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      )}
    </HabitBlock>
  )
}
