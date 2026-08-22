import React, { useState, useEffect } from 'react'
import { X, Calendar, Activity, Moon, Plus, CheckCircle2, Sparkles, Clock, AlertCircle } from 'lucide-react'

export default function QuickLogModal({ isOpen, onClose, onRefreshData, initialTab = 'symptom' }) {
  const [logType, setLogType] = useState(initialTab) // 'cycle', 'symptom', 'lifestyle'
  
  // Cycle form
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [flow, setFlow] = useState('Medium')
  const [periodDays, setPeriodDays] = useState(5)
  const [recentCycles, setRecentCycles] = useState([])
  
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
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setLogType(initialTab || 'symptom')
      fetchRecentCycles()
    }
  }, [isOpen, initialTab])

  const fetchRecentCycles = async () => {
    try {
      const res = await fetch('/api/logs/cycle')
      if (res.ok) {
        const data = await res.json()
        setRecentCycles(data)
      }
    } catch (err) {
      console.error("Error fetching cycles:", err)
    }
  }

  if (!isOpen) return null

  // Quick Date Helpers for Cycles
  const setDateToday = () => {
    setStartDate(new Date().toISOString().split('T')[0])
  }

  const setDateDaysAgo = (days) => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    setStartDate(d.toISOString().split('T')[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)
    try {
      let res
      if (logType === 'cycle') {
        res = await fetch('/api/logs/cycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            start_date: startDate, 
            flow_intensity: flow, 
            period_duration_days: parseInt(periodDays) || 5,
            notes 
          })
        })
      } else if (logType === 'symptom') {
        res = await fetch('/api/logs/symptom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            date: symptomDate, 
            category, 
            symptom_name: symptomName, 
            severity: parseInt(severity), 
            notes 
          })
        })
      } else if (logType === 'lifestyle') {
        res = await fetch('/api/logs/lifestyle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            date: symptomDate, 
            sleep_hours: parseFloat(sleepHours), 
            stress_level: parseInt(stressLevel),
            notes
          })
        })
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to save record")
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        if (onRefreshData) onRefreshData()
        onClose()
      }, 1000)
    } catch (err) {
      console.error("Log submission error:", err)
      setErrorMsg(err.message || "Failed to save entry. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amethyst-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 border border-amethyst-700/60 shadow-2xl bg-amethyst-950/95">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-amethyst-800/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold gradient-text mb-4">Record Health Entry</h3>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-amethyst-950/80 p-1 border border-amethyst-800/60 mb-5">
          <button
            type="button"
            onClick={() => setLogType('cycle')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              logType === 'cycle' ? 'bg-amethyst-800 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-rosegold-400" />
            <span>Cycle / Period</span>
          </button>
          
          <button
            type="button"
            onClick={() => setLogType('symptom')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              logType === 'symptom' ? 'bg-amethyst-800 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rosegold-400" />
            <span>Symptom</span>
          </button>
          
          <button
            type="button"
            onClick={() => setLogType('lifestyle')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              logType === 'lifestyle' ? 'bg-amethyst-800 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sleep & Lifestyle</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-100">Record Saved Successfully!</h4>
            <p className="text-xs text-slate-400">Updating Personal Baseline Matrix & Cycle Stability...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CYCLE FORM */}
            {logType === 'cycle' && (
              <div className="space-y-4">
                
                {/* Helpful Cycle Stability Tip */}
                <div className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-700/50 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rosegold-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>How Cycle Stability is Calculated:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Log at least <strong>2 period start dates</strong> (e.g. this month and last month). ORVEYRA will calculate your exact average cycle length (e.g. 28 days) and stability variance (±days).
                  </p>
                </div>

                {/* Quick Date Presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Period Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rosegold-500 font-mono"
                  />
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-400">Quick fill:</span>
                    <button
                      type="button"
                      onClick={setDateToday}
                      className="px-2 py-0.5 rounded bg-amethyst-900 hover:bg-amethyst-800 text-[10px] text-rosegold-300 border border-amethyst-700 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateDaysAgo(28)}
                      className="px-2 py-0.5 rounded bg-amethyst-900 hover:bg-amethyst-800 text-[10px] text-slate-300 border border-amethyst-700 transition-colors"
                    >
                      4 weeks ago (-28d)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateDaysAgo(56)}
                      className="px-2 py-0.5 rounded bg-amethyst-900 hover:bg-amethyst-800 text-[10px] text-slate-300 border border-amethyst-700 transition-colors"
                    >
                      8 weeks ago (-56d)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Flow Intensity</label>
                    <select
                      value={flow}
                      onChange={(e) => setFlow(e.target.value)}
                      className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500"
                    >
                      <option value="Light">Light Flow</option>
                      <option value="Medium">Medium Flow</option>
                      <option value="Heavy">Heavy Flow</option>
                      <option value="Spotting">Spotting Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Period Length (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={periodDays}
                      onChange={(e) => setPeriodDays(e.target.value)}
                      className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500"
                    />
                  </div>
                </div>

                {/* Previously Logged Cycles List */}
                {recentCycles.length > 0 && (
                  <div className="pt-2 border-t border-amethyst-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Recorded Cycle Dates ({recentCycles.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {recentCycles.map((c, i) => (
                        <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amethyst-900/80 border border-amethyst-800 text-slate-300">
                          {c.start_date} ({c.flow_intensity || 'Medium'})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* SYMPTOM FORM */}
            {logType === 'symptom' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={symptomDate}
                      onChange={(e) => setSymptomDate(e.target.value)}
                      className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500"
                    >
                      <option value="Pelvic">Pelvic & Cramps</option>
                      <option value="Mood">Mood & Affect</option>
                      <option value="Energy">Energy & Fatigue</option>
                      <option value="Skin">Skin & Acne</option>
                      <option value="Digestive">Digestive / Bloating</option>
                      <option value="Sleep">Sleep Quality</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Symptom Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pelvic Cramping, Acne breakout, Brain fog"
                    value={symptomName}
                    onChange={(e) => setSymptomName(e.target.value)}
                    className="w-full px-4 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500"
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
              </div>
            )}

            {/* LIFESTYLE FORM */}
            {logType === 'lifestyle' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={symptomDate}
                      onChange={(e) => setSymptomDate(e.target.value)}
                      className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Sleep (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-300">Stress Level (1-10)</label>
                    <span className="text-xs font-bold text-indigo-400">{stressLevel} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(e.target.value)}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Optional Notes</label>
              <textarea
                rows={2}
                placeholder="Context, triggers, or how you felt..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-bold text-xs shadow-lg transition-all glow-purple cursor-pointer"
            >
              {submitting ? 'Saving Entry...' : logType === 'cycle' ? 'Save Period Start Date' : 'Save Health Entry'}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}
