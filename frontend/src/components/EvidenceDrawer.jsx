import React from 'react'
import { X, ShieldCheck, Database, Clock, HelpCircle, Stethoscope, AlertTriangle } from 'lucide-react'

export default function EvidenceDrawer({ isOpen, onClose, evidenceData, signalQuality }) {
  if (!isOpen || !evidenceData) return null

  const {
    observed_pattern,
    supporting_records = [],
    persistence_duration,
    missing_context = [],
    clinician_discussion_points = []
  } = evidenceData

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-amethyst-950/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-amethyst-950 border-l border-amethyst-700/60 p-6 sm:p-8 overflow-y-auto h-full shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amethyst-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amethyst-600 to-rosegold-600 flex items-center justify-center glow-purple">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold gradient-text">[ WHY? ] Evidence Breakdown</h3>
              <p className="text-xs text-slate-400">Strict Data Lineage & Deterministic Uncertainty Chain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-amethyst-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signal Quality Badge */}
        <div className="mb-6 p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-700/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">Signal Resolution State:</span>
          <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border ${
            signalQuality === 'STRONG SIGNAL'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : signalQuality === 'POSSIBLE TREND'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-amethyst-800 text-slate-300 border-amethyst-600'
          }`}>
            {signalQuality || 'MISSING CONTEXT'}
          </span>
        </div>

        <div className="space-y-6">
          
          {/* 1. Observed Pattern */}
          <div className="glass-card rounded-xl p-4 border border-amethyst-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
              <AlertTriangle className="w-4 h-4 text-rosegold-400" />
              <span>1. Observed Pattern</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {observed_pattern || 'Statistical variance observed across baseline time-series.'}
            </p>
          </div>

          {/* 2. Supporting User Data Records */}
          <div className="glass-card rounded-xl p-4 border border-amethyst-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
              <Database className="w-4 h-4 text-amethyst-400" />
              <span>2. Supporting Grounded Database Records</span>
            </div>
            <ul className="space-y-1.5">
              {supporting_records.length > 0 ? (
                supporting_records.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rosegold-400 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400">No database records linked.</li>
              )}
            </ul>
          </div>

          {/* 3. Persistence Duration */}
          <div className="glass-card rounded-xl p-4 border border-amethyst-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>3. Persistence Duration</span>
            </div>
            <p className="text-xs text-slate-300">
              {persistence_duration || 'Observed continuously over recent logs.'}
            </p>
          </div>

          {/* 4. Missing Context / Information Needed */}
          <div className="glass-card rounded-xl p-4 border border-amethyst-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>4. Missing Context & Information Needed</span>
            </div>
            <ul className="space-y-1.5">
              {missing_context.length > 0 ? (
                missing_context.map((ctx, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{ctx}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400">Baseline resolution is complete.</li>
              )}
            </ul>
          </div>

          {/* 5. Potential Clinician Discussion Points */}
          <div className="glass-card rounded-xl p-4 border border-amethyst-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2">
              <Stethoscope className="w-4 h-4 text-rosegold-400" />
              <span>5. Potential Clinician Discussion Points</span>
            </div>
            <ul className="space-y-1.5">
              {clinician_discussion_points.length > 0 ? (
                clinician_discussion_points.map((pt, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rosegold-400 mt-1.5 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400">Discuss general cycle maintenance.</li>
              )}
            </ul>
          </div>

        </div>

      </div>
    </div>
  )
}
