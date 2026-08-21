import React, { useState } from 'react'
import { X, Calendar, Activity, Moon, Plus, CheckCircle2 } from 'lucide-react'

export default function QuickLogModal({ isOpen, onClose, onRefreshData }) {
  const [logType, setLogType] = useState('symptom') // 'cycle', 'symptom', 'lifestyle'
  
  // Cycle form
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [flow, setFlow] = useState('Medium')
  
  // Symptom form
  const [symptomDate, setSymptomDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('Pelvic')
  const [symptomName, setSymptomName] = useState('Pelvic Cramping')
  const [severity, setSeverity] = useState(5)
  const [notes, setNotes] = useState('')

  // Lifestyle form
  const [sleepHours, setSleepHours] = useState(7.5)
  const [stressLevel, setStressLevel] = useState(4)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (logType === 'cycle') {
        await fetch('/api/logs/cycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start_date: startDate, flow_intensity: flow, notes })
        })
      } else if (logType === 'symptom') {
        await fetch('/api/logs/symptom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: symptomDate, category, symptom_name: symptomName, severity: parseInt(severity), notes })
        })
      } else if (logType === 'lifestyle') {
        await fetch('/api/logs/lifestyle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: symptomDate, sleep_hours: parseFloat(sleepHours), stress_level: parseInt(stressLevel) })
        })
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onRefreshData()
        onClose()
      }, 1000)
    } catch (err) {
      console.error("Log submission error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amethyst-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 border border-amethyst-700/60 shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-amethyst-800/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold gradient-text mb-4">Record Health Telemetry</h3>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-amethyst-950/80 p-1 border border-amethyst-800/60 mb-6">
          <button
            onClick={() => setLogType('symptom')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              logType === 'symptom' ? 'bg-amethyst-800 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Symptom
          </button>
          <button
            onClick={() => setLogType('cycle')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              logType === 'cycle' ? 'bg-amethyst-800 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cycle Start
          </button>
          <button
            onClick={() => setLogType('lifestyle')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              logType === 'lifestyle' ? 'bg-amethyst-800 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sleep & Lifestyle
          </button>
        </div>

        {success ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-100">Record Saved</h4>
            <p className="text-xs text-slate-400">Updating Body Drift™ variance models...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {logType === 'cycle' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cycle Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Flow Intensity</label>
                  <select
                    value={flow}
                    onChange={(e) => setFlow(e.target.value)}
                    className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                  >
                    <option value="Spotting">Spotting</option>
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>
              </>
            )}

            {logType === 'symptom' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={symptomDate}
                      onChange={(e) => setSymptomDate(e.target.value)}
                      className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                    >
                      <option value="Pelvic">Pelvic</option>
                      <option value="Mood">Mood</option>
                      <option value="Energy">Energy</option>
                      <option value="Skin">Skin</option>
                      <option value="Digestive">Digestive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Symptom Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Lower abdominal cramping"
                    value={symptomName}
                    onChange={(e) => setSymptomName(e.target.value)}
                    className="w-full px-4 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-300">Severity (1-10)</label>
                    <span className="text-xs font-bold text-rosegold-400">{severity} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full accent-rosegold-500"
                  />
                </div>
              </>
            )}

            {logType === 'lifestyle' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sleep Hours (Night)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full px-4 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Perceived Stress Level (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(e.target.value)}
                    className="w-full accent-amethyst-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Optional Notes</label>
              <textarea
                rows={2}
                placeholder="Context, triggers, or activity notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-semibold text-sm shadow-lg transition-all glow-purple"
            >
              {submitting ? 'Saving Record...' : 'Save Health Entry'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
