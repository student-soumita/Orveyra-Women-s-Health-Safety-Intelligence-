import React, { useState } from 'react'
import { Activity, AlertCircle, Sparkles, PlusCircle, FileText, Calendar, Moon, ArrowUpRight, HelpCircle, ShieldCheck, ChevronRight, Database, RefreshCw, Info, CheckCircle2, Headphones } from 'lucide-react'
import WhatChangedCard from './WhatChangedCard'

export default function Dashboard({
  user,
  profile,
  bodyDriftData,
  cycles,
  symptoms,
  lifestyle,
  biomarkers,
  documents,
  onOpenQuickLog,
  onOpenEvidence,
  onNavigateTab,
  onRefreshData
}) {
  const [loadingSeed, setLoadingSeed] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState(null)
  const [seedSuccessMsg, setSeedSuccessMsg] = useState(null)

  const isNewAccount = (cycles.length === 0 && symptoms.length === 0 && lifestyle.length === 0 && biomarkers.length === 0)

  const driftOutput = bodyDriftData?.math_engine_output || {}
  const aiExplanation = bodyDriftData?.ai_explanation || {}
  const baselines = driftOutput.personal_baselines || {}

  const driftDetected = driftOutput.drift_detected
  const bannerTitle = aiExplanation.banner_title || driftOutput.banner_title || "STABLE BASELINE"
  const signalQuality = aiExplanation.signal_quality || driftOutput.signal_quality || "INSUFFICIENT DATA"

  // Direct authoritative calculations from user's actual database records
  const sleepEntries = lifestyle.filter(l => l.sleep_hours != null && !isNaN(l.sleep_hours))
  const calculatedSleepAvg = sleepEntries.length > 0 
    ? (sleepEntries.reduce((acc, curr) => acc + Number(curr.sleep_hours), 0) / sleepEntries.length).toFixed(1)
    : null

  const symptomEntries = symptoms.filter(s => s.severity != null && !isNaN(s.severity))
  const calculatedSymptomAvg = symptomEntries.length > 0
    ? (symptomEntries.reduce((acc, curr) => acc + Number(curr.severity), 0) / symptomEntries.length).toFixed(1)
    : null

  let calculatedCycleAvg = null
  let calculatedCycleStdDev = null
  if (cycles.length >= 2) {
    const sortedCycles = [...cycles].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    const diffs = []
    for (let i = 1; i < sortedCycles.length; i++) {
      const d1 = new Date(sortedCycles[i-1].start_date)
      const d2 = new Date(sortedCycles[i].start_date)
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
      if (diffDays >= 15 && diffDays <= 60) diffs.push(diffDays)
    }
    if (diffs.length > 0) {
      calculatedCycleAvg = (diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1)
      if (diffs.length >= 2) {
        const mean = Number(calculatedCycleAvg)
        const variance = diffs.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / diffs.length
        calculatedCycleStdDev = Math.sqrt(variance).toFixed(1)
      } else {
        calculatedCycleStdDev = "0.0"
      }
    }
  }

  const finalCycleAvg = (baselines.cycle?.avg_length != null && cycles.length >= 2) ? baselines.cycle.avg_length : calculatedCycleAvg
  const finalCycleStdDev = baselines.cycle?.std_dev != null ? baselines.cycle.std_dev : calculatedCycleStdDev
  const finalSleepAvg = baselines.sleep?.avg_hours != null ? baselines.sleep.avg_hours : calculatedSleepAvg
  const finalSleepStdDev = baselines.sleep?.std_dev != null ? baselines.sleep.std_dev : null
  const finalSymptomAvg = baselines.symptoms?.avg_severity != null ? baselines.symptoms.avg_severity : calculatedSymptomAvg

  const handleSeedSampleData = async () => {
    setLoadingSeed(true)
    try {
      const res = await fetch('/api/logs/seed-sample', { method: 'POST' })
      const data = await res.json()
      setSeedSuccessMsg("Sample health telemetry loaded! Explore your populated metrics below.")
      setTimeout(() => setSeedSuccessMsg(null), 4000)
      onRefreshData()
    } catch (err) {
      console.error("Seed error:", err)
    } finally {
      setLoadingSeed(false)
    }
  }

  const handleClearAllData = async () => {
    if (!window.confirm("Are you sure you want to clear all health telemetry logs and reset to an empty baseline?")) return
    setLoadingSeed(true)
    try {
      const res = await fetch('/api/logs/clear-all', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Failed to clear logs")
      }
      setSeedSuccessMsg("Health telemetry reset! All logs cleared and baseline matrix reset.")
      setTimeout(() => setSeedSuccessMsg(null), 4000)
      if (onRefreshData) onRefreshData()
    } catch (err) {
      console.error("Clear error:", err)
      alert("Error resetting data: " + err.message)
    } finally {
      setLoadingSeed(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome & Signal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
            {profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Health Telemetry Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personalized longitudinal signal detection • Grounded strictly in your database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('mood-space')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amethyst-800 to-rosegold-950 hover:from-amethyst-700 hover:to-rosegold-900 border border-rosegold-500/50 text-rosegold-300 text-xs font-bold transition-all shadow-md glow-purple cursor-pointer"
            title="Open Mood Space Instrumental Music Sanctuary"
          >
            <Headphones className="w-4 h-4 text-rosegold-400" />
            <span>🎧 Mood Space</span>
          </button>

          <button
            onClick={handleSeedSampleData}
            disabled={loadingSeed}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600/60 text-rosegold-300 text-xs font-bold transition-all shadow-md"
            title="Populate 90 days of realistic sample telemetry to test all system features"
          >
            <Database className="w-4 h-4 text-rosegold-400" />
            <span>{loadingSeed ? 'Loading...' : 'Load Sample Data'}</span>
          </button>

          {!isNewAccount && (
            <button
              onClick={handleClearAllData}
              disabled={loadingSeed}
              className="px-3 py-2 rounded-xl bg-amethyst-950 hover:bg-rose-500/10 border border-amethyst-800 text-slate-400 hover:text-rose-300 text-xs font-semibold"
            >
              Reset
            </button>
          )}

          <button
            onClick={onOpenQuickLog}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold shadow-lg glow-rose transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Telemetry</span>
          </button>
        </div>
      </div>

      {seedSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{seedSuccessMsg}</span>
        </div>
      )}

      {/* SYSTEM SIMPLE EXPLANATION BANNER */}
      <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amethyst-800/80 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-rosegold-400" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <span>How ORVEYRA Works in 3 Simple Steps</span>
            </h3>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-rosegold-300">1. Log Telemetry:</strong> Record your cycle dates, symptoms, and sleep duration using <em>Quick Log</em> or upload lab PDFs in <em>Lab Vault</em>.<br/>
              <strong className="text-rosegold-300">2. Personal Baseline:</strong> The system automatically calculates your normal baseline (mean & variation range) instead of blind population averages.<br/>
              <strong className="text-rosegold-300">3. Body Drift™ & Intelligence:</strong> If your pattern shifts, ORVEYRA flags <em>"Body Drift Detected"</em> with evidence links and an intelligent grounded health guide.
            </p>
          </div>
        </div>
      </div>

      {/* CLEAN FUNCTIONAL EMPTY STATE FOR NEW ACCOUNTS */}
      {isNewAccount && (
        <div className="glass-card rounded-2xl p-8 sm:p-12 border border-amethyst-700/60 text-center space-y-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amethyst-500/10 rounded-full blur-3xl" />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amethyst-600 via-amethyst-700 to-rosegold-500 mx-auto flex items-center justify-center shadow-xl glow-purple">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-xl font-bold text-slate-100">Building Your Personal Health Baseline</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              ORVEYRA does not use fictional patient data as a default. Click <strong>"Load Sample Data"</strong> above to test all features instantly with sample metrics, or start logging your own entries below!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSeedSampleData}
              disabled={loadingSeed}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-bold text-xs shadow-lg transition-all glow-purple inline-flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>Load 90-Day Sample Health Data</span>
            </button>

            <button
              onClick={onOpenQuickLog}
              className="px-6 py-3 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Your First Entry</span>
            </button>
          </div>
        </div>
      )}

      {/* SIGNATURE FEATURE: PERSONAL BASELINE + "WHAT CHANGED?" */}
      {!isNewAccount && (
        <WhatChangedCard
          cycles={cycles}
          symptoms={symptoms}
          lifestyle={lifestyle}
          biomarkers={biomarkers}
          bodyDriftData={bodyDriftData}
          onOpenEvidence={onOpenEvidence}
          onOpenQuickLog={onOpenQuickLog}
        />
      )}

      {/* BODY DRIFT DETECTED BANNER */}
      {!isNewAccount && (
        <div className={`glass-card rounded-2xl p-6 border transition-all ${
          driftDetected
            ? 'border-rosegold-500/60 bg-gradient-to-r from-amethyst-950 via-amethyst-900/90 to-amethyst-950 shadow-xl glow-rose'
            : 'border-emerald-500/40 bg-amethyst-950/60'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-extrabold tracking-wider uppercase px-3 py-1 rounded-full border ${
                  driftDetected
                    ? 'bg-rosegold-500/20 text-rosegold-400 border-rosegold-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {bannerTitle}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Deterministic Time-Series Analysis
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {aiExplanation.explanation_text ? (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-100">Observational Signal Analysis:</p>
                    <p className="text-slate-300">{aiExplanation.explanation_text.replace(/###|#|\*|>|-/g, '')}</p>
                  </div>
                ) : (
                  <p>Your health metrics align with your personal baseline.</p>
                )}
              </div>

              {/* Statistical flags list */}
              {driftOutput.statistical_flags && driftOutput.statistical_flags.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {driftOutput.statistical_flags.map((flag, idx) => (
                    <span key={idx} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-amethyst-900/90 border border-amethyst-700/60 text-rosegold-300">
                      {flag.metric}: {flag.variance} (z={flag.z_score})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 pt-2 md:pt-0">
              <button
                onClick={onOpenEvidence}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 glow-purple"
              >
                <ShieldCheck className="w-4 h-4 text-rosegold-400" />
                <span>[ WHY? ] Evidence Breakdown</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PERSONAL BASELINE CARD ("What is normal for THIS user?") */}
      <div className="glass-card rounded-2xl p-6 border border-amethyst-700/60">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-amethyst-800/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rosegold-400" />
              <span>Personal Baseline Matrix</span>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'matrix' ? null : 'matrix')}
                className="text-slate-400 hover:text-rosegold-400 transition-colors"
                title="What is this?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </h2>
            <p className="text-xs text-slate-400">Calculated strictly from your historical data</p>
          </div>
          <span className="text-xs text-amethyst-300 font-semibold bg-amethyst-900/60 px-3 py-1 rounded-full border border-amethyst-700/50">
            N={cycles.length + symptoms.length + lifestyle.length + biomarkers.length} entries
          </span>
        </div>

        {activeTooltip === 'matrix' && (
          <div className="mb-4 p-3 rounded-xl bg-amethyst-900/80 border border-amethyst-700/60 text-xs text-slate-300">
            <strong>What is Personal Baseline?</strong> ORVEYRA calculates standard deviation ranges specifically for your body. It doesn't compare you blindly to standard population averages.
          </div>
        )}

        {cycles.length + symptoms.length + lifestyle.length + biomarkers.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-amethyst-800/80 rounded-xl bg-amethyst-950/40 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amethyst-900/60 border border-amethyst-800 flex items-center justify-center mx-auto text-slate-400">
              <Activity className="w-6 h-6 text-amethyst-400 animate-pulse" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-200">Baseline Matrix Empty (0 Entries Recorded)</h3>
              <p className="text-xs text-slate-400">
                No personal baseline data logged yet. Start recording your health telemetry or load sample data to establish your baseline matrix.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={onOpenQuickLog}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 glow-rose"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log First Entry</span>
              </button>
              <button
                onClick={handleSeedSampleData}
                disabled={loadingSeed}
                className="px-4 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600/60 text-rosegold-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              >
                <Database className="w-4 h-4 text-rosegold-400" />
                <span>{loadingSeed ? 'Loading...' : 'Load Sample Data'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Cycle Stability Baseline Card */}
            <div 
              onClick={() => onOpenQuickLog('cycle')}
              className="p-4 rounded-xl bg-amethyst-950/70 hover:bg-amethyst-900/60 border border-amethyst-800/60 hover:border-rosegold-500/50 space-y-2 transition-all cursor-pointer group shadow-sm"
              title="Click to record or update menstrual cycle dates"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold group-hover:text-rosegold-300 transition-colors">Cycle Stability</span>
                <div className="p-1 rounded-md bg-amethyst-900/80 group-hover:bg-rosegold-500/20 text-rosegold-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-extrabold text-slate-100 flex items-baseline justify-between">
                <div>
                  {finalCycleAvg != null ? (
                    <>
                      {finalCycleAvg} <span className="text-xs text-slate-400 font-normal">days</span>
                    </>
                  ) : cycles.length === 1 ? (
                    <>
                      {profile?.typical_cycle_length || 28} <span className="text-xs text-slate-400 font-normal">days (est)</span>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenQuickLog('cycle'); }}
                      className="text-xs text-rosegold-300 font-bold bg-rosegold-500/10 hover:bg-rosegold-500/20 px-2.5 py-1 rounded border border-rosegold-500/30 transition-colors"
                    >
                      + Log Period Start
                    </button>
                  )}
                </div>

                {cycles.length >= 2 && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    finalCycleStdDev != null && Number(finalCycleStdDev) <= 2.5
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : finalCycleStdDev != null && Number(finalCycleStdDev) <= 5.0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {finalCycleStdDev != null && Number(finalCycleStdDev) <= 2.5 ? 'Stable' : finalCycleStdDev != null && Number(finalCycleStdDev) <= 5.0 ? 'Mild Variance' : 'Irregular'}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>
                  {cycles.length >= 2
                    ? `±${finalCycleStdDev || '0.0'}d variance • ${cycles.length} cycles`
                    : cycles.length === 1
                    ? `1 cycle logged (${cycles[0]?.start_date}) • Add 2nd`
                    : 'Click to add period start dates'}
                </span>
                <span className="text-rosegold-400 group-hover:underline font-bold text-[10px]">+ Log</span>
              </div>
            </div>

            {/* Sleep Baseline */}
            <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Sleep Duration</span>
                <Moon className="w-4 h-4 text-amethyst-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-100">
                {finalSleepAvg != null ? (
                  <>
                    {finalSleepAvg} <span className="text-xs text-slate-400 font-normal">hrs/night</span>
                  </>
                ) : (
                  <span className="text-slate-500 font-bold">--</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {finalSleepStdDev != null
                  ? `Std Dev: ±${finalSleepStdDev} hrs • ${lifestyle.length} nights`
                  : `${lifestyle.length} nights recorded`}
              </p>
            </div>

            {/* Symptom Severity Baseline */}
            <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Symptom Intensity</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-100">
                {finalSymptomAvg != null ? (
                  <>
                    {finalSymptomAvg} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                  </>
                ) : (
                  <span className="text-slate-500 font-bold">--</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {symptoms.length} total symptoms recorded
              </p>
            </div>

            {/* Biomarkers Baseline */}
            <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Lab Vault</span>
                <FileText className="w-4 h-4 text-rosegold-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-100">
                {biomarkers.length} <span className="text-xs text-slate-400 font-normal">biomarkers</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {documents.length} lab documents stored
              </p>
            </div>

          </div>
        )}
      </div>

      {/* QUICK WIDGETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Health Signals Widget */}
        <div className="glass-card rounded-2xl p-6 border border-amethyst-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200">Recent Symptom Logs</h3>
              <button
                onClick={() => onNavigateTab('timeline')}
                className="text-xs text-rosegold-400 hover:underline flex items-center gap-1"
              >
                <span>View Timeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {symptoms.length > 0 ? (
              <div className="space-y-2.5">
                {symptoms.slice(0, 4).map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-amethyst-950/60 border border-amethyst-800/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200">{s.symptom_name}</span>
                      <span className="text-[11px] text-slate-400 block">{s.category} • {s.date}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      s.severity >= 7 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amethyst-800 text-slate-300'
                    }`}>
                      Severity: {s.severity}/10
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">No recent symptoms logged.</p>
            )}
          </div>
        </div>

        {/* Lab Vault Verification Summary */}
        <div className="glass-card rounded-2xl p-6 border border-amethyst-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200">Lab Vault Documents</h3>
              <button
                onClick={() => onNavigateTab('lab-vault')}
                className="text-xs text-rosegold-400 hover:underline flex items-center gap-1"
              >
                <span>Upload & Verify</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2.5">
                {documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-amethyst-950/60 border border-amethyst-800/50 flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-xs font-bold text-slate-200 truncate block">{doc.filename}</span>
                      <span className="text-[11px] text-slate-400">Confidence: {Math.round(doc.confidence_score * 100)}%</span>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                      doc.verification_status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {doc.verification_status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">No lab reports uploaded yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* 🎧 MOOD SPACE BANNER */}
      <div 
        onClick={() => onNavigateTab('mood-space')}
        className="glass-card rounded-2xl p-6 border border-amethyst-700/60 bg-gradient-to-r from-amethyst-950 via-amethyst-900/70 to-amethyst-950 hover:border-rosegold-500/50 transition-all cursor-pointer group shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amethyst-600 via-amethyst-700 to-rosegold-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
            <Headphones className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 group-hover:text-rosegold-300 transition-colors">
                Mood Space • Somatic Nervous System Sanctuary
              </span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amethyst-800 text-rosegold-300 border border-amethyst-700/60">
                Ambient Soundscapes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Not music. Select your state (Calm • Anxious • Low • Stressed • Focused • Sleep) for 4-7-8 breathing, rain & ocean soundscapes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-rosegold-400 group-hover:translate-x-1 transition-transform shrink-0">
          <span>Enter Mood Space</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

    </div>
  )
}
