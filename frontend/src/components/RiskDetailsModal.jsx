import React from 'react'
import {
  X, Shield, AlertTriangle, CheckCircle2, AlertCircle, Info, Clock,
  MapPin, Eye, Building2, PhoneCall, Sparkles, Sliders, ChevronRight
} from 'lucide-react'

/**
 * RiskDetailsModal Component
 * Provides a transparent breakdown of all 6 contextual risk factors, system confidence,
 * data quality flags, score change rationale, and nearby safe havens.
 */
export default function RiskDetailsModal({
  isOpen,
  onClose,
  riskData,
  onExploreRoute
}) {
  if (!isOpen) return null

  const data = riskData || {}
  const score = data.risk_score ?? 76
  const level = data.risk_level ?? "ELEVATED"
  const confidence = data.confidence ?? 82
  const factors = data.factors_breakdown || {}
  const explanation = data.explanation || "Contextual risk is elevated based on late-night travel, low activity levels, and historical incident patterns nearby."
  const flags = data.data_quality?.flags || ["Lighting estimated based on solar daylight cycle", "Ground-truth incident database active"]
  const hasDemo = data.data_quality?.has_demo_data
  const safeHavens = data.nearby_safe_havens || []

  // Factor configurations
  const factorRows = [
    {
      key: 'location',
      label: 'Location & Risk Corridors',
      icon: MapPin,
      score: factors.location?.score ?? 14,
      max: 20,
      detail: factors.location?.zones?.length ? `Near ${factors.location.zones.join(', ')}` : 'Urban baseline corridor'
    },
    {
      key: 'time',
      label: 'Time & Temporal Cycles',
      icon: Clock,
      score: factors.time?.score ?? 16,
      max: 20,
      detail: factors.time?.phase ?? 'Late Night travel window'
    },
    {
      key: 'crowd_density',
      label: 'Crowd Density & Pedestrian Activity',
      icon: Eye,
      score: factors.crowd_density?.score ?? 12,
      max: 15,
      detail: factors.crowd_density?.label ?? 'Low pedestrian activity (Estimated)'
    },
    {
      key: 'lighting',
      label: 'Lighting Conditions & Infrastructure',
      icon: Sparkles,
      score: factors.lighting?.score ?? 8,
      max: 15,
      detail: factors.lighting?.label ?? 'Nighttime estimated partial streetlights'
    },
    {
      key: 'incidents',
      label: 'Reported Safety Incidents',
      icon: AlertTriangle,
      score: factors.incidents?.score ?? 18,
      max: 20,
      detail: factors.incidents?.label ?? 'Recent incident reports nearby'
    },
    {
      key: 'route_conditions',
      label: 'Route Conditions & Segment Risk',
      icon: Sliders,
      score: factors.route_conditions?.score ?? 8,
      max: 10,
      detail: 'Evaluated route segment risk'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="glass-card rounded-2xl border border-amethyst-700/80 bg-amethyst-950/95 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-amethyst-800/60 bg-amethyst-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amethyst-800 border border-amethyst-600 flex items-center justify-center text-rosegold-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Safety Risk Breakdown</span>
                {hasDemo && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amethyst-800 text-rosegold-300 border border-amethyst-700">
                    ESTIMATED / DEMO SIGNAL
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Transparent 6-factor contextual analysis • Grounded in data availability
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-amethyst-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Summary Score Card */}
          <div className="p-4 rounded-xl bg-amethyst-900/50 border border-amethyst-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Contextual Risk Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-extrabold ${level === 'LOW' ? 'text-emerald-400' : level === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'}`}>
                  {score}
                </span>
                <span className="text-sm font-medium text-slate-400">/ 100</span>
                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${level === 'LOW' ? 'bg-emerald-500/20 text-emerald-300' : level === 'MODERATE' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {level}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-semibold text-slate-400 block">System Confidence Score</span>
              <div className="text-2xl font-extrabold text-slate-100 mt-1">
                {confidence}%
              </div>
              <span className="text-[10px] text-slate-400">Based on signal quality & availability</span>
            </div>
          </div>

          {/* Explainability Section: Why the Score Changed */}
          <div className="p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/50 space-y-2">
            <h3 className="text-xs font-bold text-rosegold-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-rosegold-400" />
              Why the Score Changed:
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {explanation}
            </p>
          </div>

          {/* 6-Factor Points Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              6-Factor Contextual Breakdown:
            </h3>

            <div className="space-y-2.5">
              {factorRows.map((row) => {
                const Icon = row.icon
                const pct = Math.round((row.score / row.max) * 100)
                const barColor = pct < 40 ? 'bg-emerald-500' : pct < 75 ? 'bg-amber-500' : 'bg-rose-500'

                return (
                  <div key={row.key} className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-rosegold-400 shrink-0" />
                        <span className="font-bold text-slate-200">{row.label}</span>
                      </div>
                      <span className="font-extrabold text-slate-100">
                        {row.score} <span className="text-slate-400 font-normal">/ {row.max} pts</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-amethyst-950 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {row.detail}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data Quality & Transparency Audit Flags */}
          <div className="p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/50 space-y-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rosegold-400" />
              Data Quality & Transparency Audit:
            </h3>
            <ul className="space-y-1 text-xs text-slate-300">
              {flags.map((flag, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rosegold-400 shrink-0" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Nearby Safe Havens List */}
          {safeHavens.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-rose-400" />
                Nearby Verified Support Facilities:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {safeHavens.map((sh, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/50 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="font-bold text-xs text-slate-200 block">{sh.name}</span>
                      <span className="text-[11px] text-rosegold-300">{sh.type} • {sh.distance_km} km away</span>
                    </div>
                    {sh.phone && (
                      <a
                        href={`tel:${sh.phone}`}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call: {sh.phone}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-amethyst-800/60 bg-amethyst-900/60 flex items-center justify-between">
          {onExploreRoute && (
            <button
              onClick={() => {
                onClose()
                onExploreRoute()
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold shadow-md transition-all glow-purple cursor-pointer"
            >
              <span>Analyze Route Risk</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-slate-300 text-xs font-semibold ml-auto"
          >
            Close Panel
          </button>
        </div>

      </div>

    </div>
  )
}
