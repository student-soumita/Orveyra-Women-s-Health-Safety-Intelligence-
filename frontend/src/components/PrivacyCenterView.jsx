import React, { useState } from 'react'
import { Shield, Lock, Trash2, CheckCircle2, RefreshCw, AlertTriangle, Key, FileCheck, Check } from 'lucide-react'

export default function PrivacyCenterView({ user, profile, onDeleteAccount, onRefresh }) {
  const [deleteStreamSuccess, setDeleteStreamSuccess] = useState(null)
  const [deletingStream, setDeletingStream] = useState(null)

  const handleDeleteStream = async (streamName, displayName) => {
    if (!window.confirm(`Are you sure you want to permanently clear all ${displayName} records? This cannot be undone.`)) return
    setDeletingStream(streamName)
    try {
      const res = await fetch(`/api/privacy/delete-stream/${streamName}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteStreamSuccess(`All ${displayName} records have been permanently cleared.`)
        setTimeout(() => setDeleteStreamSuccess(null), 3500)
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      console.error("Delete stream error:", err)
    } finally {
      setDeletingStream(null)
    }
  }

  const handleClearAllTelemetry = async () => {
    if (!window.confirm("Are you sure you want to clear ALL health logs (Cycles, Symptoms, Sleep, Lab Biomarkers) and reset your baseline?")) return
    try {
      const res = await fetch('/api/logs/clear-all', { method: 'DELETE' })
      if (res.ok) {
        setDeleteStreamSuccess("All telemetry data successfully cleared and baseline matrix reset.")
        setTimeout(() => setDeleteStreamSuccess(null), 3500)
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      console.error("Clear error:", err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Shield className="w-6 h-6 text-rosegold-400" />
          <span>Privacy & Healthcare Security Center</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          HIPAA compliance safeguards • Multi-tenant row-level isolation • Patient data sovereignty
        </p>
      </div>

      {deleteStreamSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteStreamSuccess}</span>
        </div>
      )}

      {/* SECTION 1: HEALTHCARE SECURITY & ENCRYPTION GUARANTEES */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-amethyst-700/60 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-rosegold-400" />
            <span>Healthcare Data Protection & Encryption Architecture</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your telemetry is private, encrypted, and isolated strictly to your account
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-amethyst-950/80 border border-amethyst-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-100">Row-Level Tenant Isolation</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every database query is strictly filtered by your unique encrypted user ID at the database engine layer.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amethyst-950/80 border border-amethyst-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amethyst-500/20 text-rosegold-300 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-100">AES-256 Storage Vault</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Lab reports and health documents are stored in presigned, short-lived HMAC authenticated vaults.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amethyst-950/80 border border-amethyst-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-100">Automatic PII Redaction</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Names, emails, phone numbers, and dates of birth are stripped before clinical pattern evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: GRANULAR DATA STREAM SOVEREIGNTY */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-amethyst-700/60 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-rosegold-400" />
            <span>Patient Data Sovereignty & Stream Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            You maintain 100% ownership over your records. Clear specific telemetry streams anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Menstrual Cycle History</span>
              <span className="text-[11px] text-slate-400">All cycle start/end dates and flow intensity logs</span>
            </div>
            <button
              onClick={() => handleDeleteStream('cycles', 'Cycle')}
              disabled={deletingStream === 'cycles'}
              className="px-3 py-1.5 rounded-lg bg-amethyst-900 hover:bg-rose-500/20 border border-amethyst-700 text-xs text-slate-300 hover:text-rose-300 transition-colors font-medium cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Symptom Log Stream</span>
              <span className="text-[11px] text-slate-400">All recorded physical and affective symptoms</span>
            </div>
            <button
              onClick={() => handleDeleteStream('symptoms', 'Symptom')}
              disabled={deletingStream === 'symptoms'}
              className="px-3 py-1.5 rounded-lg bg-amethyst-900 hover:bg-rose-500/20 border border-amethyst-700 text-xs text-slate-300 hover:text-rose-300 transition-colors font-medium cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Sleep & Lifestyle Telemetry</span>
              <span className="text-[11px] text-slate-400">Nightly sleep hours, quality, and stress tracking</span>
            </div>
            <button
              onClick={() => handleDeleteStream('lifestyle', 'Sleep & Lifestyle')}
              disabled={deletingStream === 'lifestyle'}
              className="px-3 py-1.5 rounded-lg bg-amethyst-900 hover:bg-rose-500/20 border border-amethyst-700 text-xs text-slate-300 hover:text-rose-300 transition-colors font-medium cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Lab Biomarker Records</span>
              <span className="text-[11px] text-slate-400">Verified blood work and parsed biomarker entries</span>
            </div>
            <button
              onClick={() => handleDeleteStream('biomarkers', 'Biomarker')}
              disabled={deletingStream === 'biomarkers'}
              className="px-3 py-1.5 rounded-lg bg-amethyst-900 hover:bg-rose-500/20 border border-amethyst-700 text-xs text-slate-300 hover:text-rose-300 transition-colors font-medium cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amethyst-950/90 border border-amethyst-800/80">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Reset Entire Baseline Matrix</span>
            <span className="text-[11px] text-slate-400">Clears all telemetry entries across all streams and resets baseline</span>
          </div>
          <button
            onClick={handleClearAllTelemetry}
            className="px-4 py-2 rounded-xl bg-amethyst-900 hover:bg-rose-500/20 border border-amethyst-700 text-xs text-rose-300 font-bold transition-all shrink-0 cursor-pointer"
          >
            Reset All Telemetry
          </button>
        </div>
      </div>

      {/* SECTION 3: PERMANENT ACCOUNT ERASURE */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-rose-500/30 bg-rose-950/10 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-bold text-rose-300">Permanent Account Deletion (GDPR & HIPAA Right to Erasure)</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Deleting your account permanently destroys your profile, credentials, all health records, uploaded laboratory documents, and audit trails across all database tables. This action is irreversible.
        </p>

        <button
          onClick={onDeleteAccount}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Permanently Delete My Account & Shred All Data</span>
        </button>
      </div>

    </div>
  )
}
