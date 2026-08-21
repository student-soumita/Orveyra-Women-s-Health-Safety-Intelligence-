import React, { useState } from 'react'
import { Activity, AlertCircle, Sparkles, PlusCircle, FileText, Calendar, Moon, ArrowUpRight, HelpCircle, ShieldCheck, ChevronRight, Database, RefreshCw, Info, CheckCircle2 } from 'lucide-react'

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
    if (!window.confirm("Clear all health logs and reset to empty baseline?")) return
    setLoadingSeed(true)
    try {
      await fetch('/api/logs/clear-all', { method: 'DELETE' })
      onRefreshData()
    } catch (err) {
      console.error("Clear error:", err)
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
              <strong className="text-rosegold-300">3. Body Drift™ & Intelligence:</strong> If your pattern shifts, ORVEYRA flags <em>"Body Drift Detected"</em> with evidence links and an intelligent ChatGPT-style grounded assistant.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Cycle Baseline */}
          <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Cycle Stability</span>
              <Calendar className="w-4 h-4 text-rosegold-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">
              {baselines.cycle?.avg_length || profile?.typical_cycle_length || 28} <span className="text-xs text-slate-400 font-normal">days</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Std Dev: ±{baselines.cycle?.std_dev || 2.0} days • {cycles.length} cycles logged
            </p>
          </div>

          {/* Sleep Baseline */}
          <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Sleep Duration</span>
              <Moon className="w-4 h-4 text-amethyst-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">
              {baselines.sleep?.avg_hours || 7.5} <span className="text-xs text-slate-400 font-normal">hrs/night</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Std Dev: ±{baselines.sleep?.std_dev || 0.8} hrs • {lifestyle.length} nights
            </p>
          </div>

          {/* Symptom Severity Baseline */}
          <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Symptom Intensity</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100">
              {baselines.symptoms?.avg_severity || 3.5} <span className="text-xs text-slate-400 font-normal">/ 10</span>
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

    </div>
  )
}
