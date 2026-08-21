import React, { useState } from 'react'
import { Sparkles, Calendar, Activity, Moon, CheckCircle2, ArrowRight, SkipForward } from 'lucide-react'

export default function OnboardingFlow({ onComplete, onSkip }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    typicalCycleLength: 28,
    typicalPeriodLength: 5,
    primarySymptoms: [],
    avgSleep: 7.5,
    baselineNotes: ''
  })
  const [saving, setSaving] = useState(false)

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      finishOnboarding()
    }
  }

  const finishOnboarding = async () => {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          dob: formData.dob,
          typical_cycle_length: parseInt(formData.typicalCycleLength),
          typical_period_length: parseInt(formData.typicalPeriodLength),
          baseline_notes: formData.baselineNotes
        })
      })
    } catch (err) {
      console.error("Onboarding profile sync error:", err)
    } finally {
      setSaving(false)
      onComplete()
    }
  }

  const symptomsList = [
    'Pelvic Cramping', 'Bloating', 'Fatigue / Low Energy',
    'Mood Fluctuations', 'Acne / Skin Breakouts', 'Migraines / Headaches',
    'Insomnia', 'Breast Tenderness', 'Brain Fog'
  ]

  const toggleSymptom = (sym) => {
    if (formData.primarySymptoms.includes(sym)) {
      setFormData({ ...formData, primarySymptoms: formData.primarySymptoms.filter(s => s !== sym) })
    } else {
      setFormData({ ...formData, primarySymptoms: [...formData.primarySymptoms, sym] })
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="glass-card rounded-2xl p-6 sm:p-10 border border-amethyst-700/60 shadow-2xl">
        
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-amethyst-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amethyst-500 to-rosegold-500 flex items-center justify-center glow-purple">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">Welcome to ORVEYRA</h2>
              <p className="text-xs text-slate-400">Step {step} of 4 • Personal Baseline Setup</p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amethyst-900/60 hover:bg-amethyst-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip for now</span>
          </button>
        </div>

        {/* Step 1: Basic Demographics */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-slate-100">1. Baseline Profile Context</h3>
            <p className="text-xs text-slate-400">
              ORVEYRA compares your health telemetry against YOUR personal baseline rather than static population averages.
            </p>
            
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Name / Alias</label>
                <input
                  type="text"
                  placeholder="e.g. Maya"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth (Optional)</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cycle Context */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rosegold-400" />
              <span>2. Menstrual Cycle History</span>
            </h3>
            <p className="text-xs text-slate-400">
              Set your initial reference expectations. Dynamic Body Drift™ will adjust these as actual cycles are logged.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Typical Cycle Length (Days)</label>
                <input
                  type="number"
                  min="18"
                  max="60"
                  value={formData.typicalCycleLength}
                  onChange={(e) => setFormData({ ...formData, typicalCycleLength: e.target.value })}
                  className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Typical Menses Duration (Days)</label>
                <input
                  type="number"
                  min="2"
                  max="14"
                  value={formData.typicalPeriodLength}
                  onChange={(e) => setFormData({ ...formData, typicalPeriodLength: e.target.value })}
                  className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Symptom Focus Areas */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amethyst-400" />
              <span>3. Recurring Symptoms & Concerns</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select symptoms you want ORVEYRA to track for persistence and co-occurrence:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {symptomsList.map((sym) => {
                const isSelected = formData.primarySymptoms.includes(sym)
                return (
                  <button
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                      isSelected
                        ? 'bg-amethyst-800 border-rosegold-500 text-white shadow-md glow-purple'
                        : 'bg-amethyst-950/60 border-amethyst-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sym}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Lifestyle & Notes */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Moon className="w-5 h-5 text-emerald-400" />
              <span>4. Baseline Lifestyle & Context Notes</span>
            </h3>
            <p className="text-xs text-slate-400">
              Provide context regarding sleep, stress, or existing health goals.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Average Sleep Hours per Night</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.avgSleep}
                  onChange={(e) => setFormData({ ...formData, avgSleep: e.target.value })}
                  className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Baseline Notes / Goals</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Tracking cycle regularity and post-exercise fatigue variations..."
                  value={formData.baselineNotes}
                  onChange={(e) => setFormData({ ...formData, baselineNotes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rosegold-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-amethyst-800/60">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg bg-amethyst-900 hover:bg-amethyst-800 text-slate-300 text-xs font-medium transition-colors"
            >
              Back
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-sm font-semibold shadow-lg transition-all glow-purple"
          >
            {saving ? (
              <span>Saving Baseline...</span>
            ) : (
              <>
                <span>{step === 4 ? 'Complete Onboarding' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
