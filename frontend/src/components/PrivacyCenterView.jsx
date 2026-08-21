import React, { useState } from 'react'
import { Shield, Eye, Lock, Download, Trash2, CheckCircle2, ToggleLeft, ToggleRight, Sparkles, RefreshCw } from 'lucide-react'

export default function PrivacyCenterView({ user, profile, onToggleAI, onDeleteAccount, onRefresh }) {
  const [aiEnabled, setAiEnabled] = useState(profile?.ai_processing_enabled ?? true)
  const [sampleText, setSampleText] = useState("Patient Jane Doe (jane@example.com, DOB 1994-08-15) logged pelvic cramps.")
  const [sanitizedPreview, setSanitizedPreview] = useState(null)
  const [inspecting, setInspecting] = useState(false)
  const [deleteStreamSuccess, setDeleteStreamSuccess] = useState(null)

  const handleToggleAI = async () => {
    const newVal = !aiEnabled
    setAiEnabled(newVal)
    try {
      await fetch(`/api/privacy/toggle-ai?enabled=${newVal}`, { method: 'POST' })
      onToggleAI(newVal)
    } catch (err) {
      console.error("AI toggle error:", err)
    }
  }

  const handleInspectPII = async () => {
    setInspecting(true)
    try {
      const res = await fetch('/api/ai/privacy-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sampleText })
      })
      const data = await res.json()
      setSanitizedPreview(data)
    } catch (err) {
      console.error("PII inspection error:", err)
    } finally {
      setInspecting(false)
    }
  }

  const handleExportArchive = async () => {
    try {
      const res = await fetch('/api/privacy/export-archive')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ORVEYRA_Health_Archive_${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } catch (err) {
      console.error("Export archive error:", err)
    }
  }

  const handleDeleteStream = async (streamName) => {
    if (!window.confirm(`Are you sure you want to permanently clear your ${streamName} history?`)) return
    try {
      await fetch(`/api/privacy/delete-stream/${streamName}`, { method: 'DELETE' })
      setDeleteStreamSuccess(`Stream '${streamName}' cleared successfully.`)
      setTimeout(() => setDeleteStreamSuccess(null), 3000)
      onRefresh()
    } catch (err) {
      console.error("Delete stream error:", err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Shield className="w-6 h-6 text-rosegold-400" />
          <span>Privacy Center & Data Governance</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Zero client-side secret leaks • Row-level multi-tenant data isolation • User data sovereignty
        </p>
      </div>

      {deleteStreamSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{deleteStreamSuccess}</span>
        </div>
      )}

      {/* SECTION 1: AI PROCESSING CONTROLS */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-amethyst-700/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amethyst-400" />
              <span>Generative AI Processing Controls</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pause or resume AI pattern explanation and timeline search
            </p>
          </div>

          <button
            onClick={handleToggleAI}
            className="flex items-center gap-2 focus:outline-none"
          >
            {aiEnabled ? (
              <ToggleRight className="w-10 h-10 text-emerald-400 transition-all" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-600 transition-all" />
            )}
            <span className="text-xs font-bold text-slate-300">
              {aiEnabled ? 'AI Active' : 'AI Paused'}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-amethyst-950/60 p-3.5 rounded-xl border border-amethyst-800/60">
          When AI processing is enabled, ORVEYRA passes PII-sanitized telemetry logs to LLM explanation services. Your health data is never used for advertising, cross-tenant profiling, or model re-training.
        </p>
      </div>

      {/* SECTION 2: PII SANITIZATION INSPECTOR */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-amethyst-700/60 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Eye className="w-5 h-5 text-rosegold-400" />
            <span>Privacy-Preserving PII Sanitization Inspector</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test how names, emails, dates, and PII are scrubbed before payload transmission
          </p>
        </div>

        <div className="space-y-3">
          <textarea
            rows={2}
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className="w-full px-4 py-2.5 bg-amethyst-950/90 border border-amethyst-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rosegold-500 resize-none"
          />

          <button
            onClick={handleInspectPII}
            disabled={inspecting}
            className="px-4 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-white text-xs font-bold transition-all border border-amethyst-600 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${inspecting ? 'animate-spin' : ''}`} />
            <span>Simulate PII Redaction Pass</span>
          </button>

          {sanitizedPreview && (
            <div className="p-4 rounded-xl bg-amethyst-950 border border-emerald-500/40 space-y-2 animate-in fade-in duration-200">
              <span className="text-[11px] font-extrabold uppercase text-emerald-400 block">
                Sanitized Payload Output:
              </span>
              <p className="text-xs text-slate-200 font-mono bg-amethyst-900/80 p-3 rounded-lg border border-amethyst-800">
                {sanitizedPreview.sanitized_output}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: ARCHIVE EXPORT & DATA STREAM MANAGEMENT */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-amethyst-700/60 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <span>Data Sovereignty & Export Archive</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Download your full health telemetry archive or perform granular stream purges
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Full JSON Data Archive</span>
            <p className="text-[11px] text-slate-400">Includes cycles, symptoms, lifestyle, biomarkers, and meds.</p>
          </div>
          <button
            onClick={handleExportArchive}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Archive</span>
          </button>
        </div>

        {/* Granular Stream Purge */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Granular Data Stream Erasure
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'cycles', label: 'Cycle Logs' },
              { id: 'symptoms', label: 'Symptom Logs' },
              { id: 'lifestyle', label: 'Lifestyle Logs' },
              { id: 'biomarkers', label: 'Biomarkers' },
              { id: 'medications', label: 'Medications' }
            ].map(stream => (
              <button
                key={stream.id}
                onClick={() => handleDeleteStream(stream.id)}
                className="p-3 rounded-xl bg-amethyst-950/80 hover:bg-rose-500/10 border border-amethyst-800 hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-rose-300 flex items-center justify-between transition-colors"
              >
                <span>Clear {stream.label}</span>
                <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Permanent Account Deletion */}
        <div className="pt-4 border-t border-amethyst-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-400 block">Permanent Account Deletion</span>
            <p className="text-[11px] text-slate-400">Irreversibly delete your account and all associated row records.</p>
          </div>
          <button
            onClick={onDeleteAccount}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition-colors"
          >
            Delete Account
          </button>
        </div>

      </div>

    </div>
  )
}
