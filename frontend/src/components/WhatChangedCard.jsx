import React from 'react'
import { Activity, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Moon, Calendar, Zap, HeartPulse, HelpCircle } from 'lucide-react'

export default function WhatChangedCard({
  cycles = [],
  symptoms = [],
  lifestyle = [],
  biomarkers = [],
  bodyDriftData,
  onOpenEvidence,
  onOpenQuickLog
}) {
  // 1. Calculate Historical Baseline (Usual Pattern)
  // Cycles
  const cycleLengths = cycles.map(c => c.cycle_length_days).filter(Boolean)
  const avgCycle = cycleLengths.length > 0 ? (cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length).toFixed(0) : null
  const cycleRange = cycleLengths.length > 1 ? `${Math.min(...cycleLengths)}–${Math.max(...cycleLengths)} days` : avgCycle ? `${avgCycle} days` : '28–30 days (est)'

  // Sleep
  const sleepVals = lifestyle.map(l => l.sleep_hours).filter(v => v != null)
  const avgSleep = sleepVals.length > 0 ? (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1) : null
  const sleepRange = sleepVals.length > 1 ? `${(Number(avgSleep) - 0.5).toFixed(1)}–${(Number(avgSleep) + 0.5).toFixed(1)} hrs` : avgSleep ? `${avgSleep} hrs` : '7.0–8.0 hrs'

  // Stress & Mood
  const stressVals = lifestyle.map(l => l.stress_level).filter(v => v != null)
  const avgStress = stressVals.length > 0 ? (stressVals.reduce((a, b) => a + b, 0) / stressVals.length) : null
  const usualStress = avgStress != null ? (avgStress > 7 ? 'High' : avgStress > 4 ? 'Moderate' : 'Low–Moderate') : 'Low–Moderate'

  // Symptoms
  const symptomNames = [...new Set(symptoms.map(s => s.symptom_name))]
  const baselineSymptoms = symptomNames.length > 0 ? symptomNames.slice(0, 2).join(', ') : 'Minimal / Stable'

  // 2. Calculate Recent Pattern (Latest entries or body drift flags)
  const latestCycle = cycleLengths.length > 0 ? cycleLengths[0] : null
  const recentSleepVals = sleepVals.slice(0, 5)
  const recentAvgSleep = recentSleepVals.length > 0 ? (recentSleepVals.reduce((a, b) => a + b, 0) / recentSleepVals.length).toFixed(1) : avgSleep

  const recentStressVals = stressVals.slice(0, 5)
  const recentAvgStress = recentStressVals.length > 0 ? (recentStressVals.reduce((a, b) => a + b, 0) / recentStressVals.length) : avgStress
  const recentStress = recentAvgStress != null ? (recentAvgStress > 6.5 ? 'High' : recentAvgStress > 4 ? 'Moderate' : 'Low') : usualStress

  const recentSymptoms = symptoms.slice(0, 3).map(s => `${s.symptom_name} (${s.severity}/10)`).join(', ') || 'None active'

  // Check if drift detected from backend or heuristic
  const driftDetected = bodyDriftData?.drift_detected || (latestCycle && avgCycle && Math.abs(latestCycle - Number(avgCycle)) > 4)
  const bannerTitle = driftDetected ? 'Pattern Changed' : 'Normal Pattern Maintained'

  return (
    <div className={`glass-card rounded-3xl p-6 sm:p-8 border transition-all duration-300 relative overflow-hidden shadow-2xl ${
      driftDetected 
        ? 'border-rosegold-500/60 bg-gradient-to-b from-amethyst-950 via-amethyst-900/60 to-amethyst-950 glow-rose'
        : 'border-emerald-500/40 bg-gradient-to-b from-amethyst-950 via-amethyst-900/30 to-amethyst-950'
    }`}>
      
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rosegold-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amethyst-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rosegold-400 animate-ping" />
            <h2 className="text-xl sm:text-2xl font-black gradient-text tracking-tight">
              Personal Baseline + “What Changed?”
            </h2>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amethyst-800 text-rosegold-300 border border-amethyst-700 font-bold">
              Signature
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            ORVEYRA compares your real-time physiological inputs against your own normal baseline.
          </p>
        </div>

        {/* Change Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-xs shadow-lg ${
            driftDetected 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 glow-rose animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
          }`}>
            {driftDetected ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{driftDetected ? '⚠ Pattern Changed' : '✓ In Baseline Range'}</span>
          </div>

          <button
            onClick={onOpenEvidence}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amethyst-800 hover:bg-rosegold-500 hover:text-amethyst-950 border border-amethyst-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer glow-purple"
          >
            <ShieldCheck className="w-4 h-4 text-rosegold-400" />
            <span>Why? View Records</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison: Usual Pattern vs Recent Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        
        {/* LEFT COLUMN: YOUR USUAL PATTERN */}
        <div className="p-6 rounded-2xl bg-amethyst-950/70 border border-amethyst-800/80 space-y-4 shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-amethyst-800/60">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
              YOUR USUAL PATTERN
            </span>
            <span className="text-[11px] text-amethyst-300 font-mono">Personal Baseline</span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amethyst-400" />
                <span>Period Cycle:</span>
              </span>
              <span className="font-bold text-slate-200">{cycleRange}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-amethyst-400" />
                <span>Sleep Duration:</span>
              </span>
              <span className="font-bold text-slate-200">{sleepRange}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amethyst-400" />
                <span>Stress Level:</span>
              </span>
              <span className="font-bold text-slate-200">{usualStress}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amethyst-400" />
                <span>Baseline Symptoms:</span>
              </span>
              <span className="font-bold text-slate-200 truncate max-w-[160px]">{baselineSymptoms}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT PATTERN (WHAT CHANGED) */}
        <div className={`p-6 rounded-2xl border space-y-4 shadow-inner ${
          driftDetected
            ? 'bg-rose-950/20 border-rose-500/40'
            : 'bg-amethyst-950/70 border-amethyst-800/80'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-amethyst-800/60">
            <span className={`text-xs font-extrabold uppercase tracking-widest font-mono ${
              driftDetected ? 'text-rose-400' : 'text-slate-400'
            }`}>
              RECENT PATTERN
            </span>
            <span className="text-[11px] text-rosegold-300 font-mono">Last 30–45 Days</span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-rosegold-400" />
                <span>Recent Cycle:</span>
              </span>
              <span className={`font-bold ${latestCycle && avgCycle && Math.abs(latestCycle - Number(avgCycle)) > 4 ? 'text-rose-400' : 'text-slate-200'}`}>
                {latestCycle ? `${latestCycle} days` : '40–43 days'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-rosegold-400" />
                <span>Recent Sleep:</span>
              </span>
              <span className={`font-bold ${recentAvgSleep && Number(recentAvgSleep) < 6.5 ? 'text-amber-400' : 'text-slate-200'}`}>
                {recentAvgSleep ? `${recentAvgSleep} hrs` : '5.0–6.0 hrs'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-rosegold-400" />
                <span>Recent Stress:</span>
              </span>
              <span className={`font-bold ${recentStress === 'High' ? 'text-rose-400' : 'text-slate-200'}`}>
                {recentStress}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-rosegold-400" />
                <span>Active Symptoms:</span>
              </span>
              <span className="font-bold text-slate-200 truncate max-w-[160px]">{recentSymptoms}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Observation Summary Footer */}
      <div className="mt-6 p-4 rounded-2xl bg-amethyst-900/60 border border-amethyst-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <p className="text-slate-300">
          <strong className="text-rosegold-300 font-semibold">Clinical Observation: </strong>
          {bodyDriftData?.ai_explanation?.explanation_text 
            ? bodyDriftData.ai_explanation.explanation_text.replace(/###|#|\*|>|-/g, '').slice(0, 180) + '...'
            : 'Your multi-axial biological patterns are being monitored against your personal baseline.'}
        </p>

        <button
          onClick={onOpenEvidence}
          className="shrink-0 text-rosegold-400 hover:text-rosegold-300 font-bold inline-flex items-center gap-1.5 cursor-pointer underline"
        >
          <span>See evidence lineage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  )
}
