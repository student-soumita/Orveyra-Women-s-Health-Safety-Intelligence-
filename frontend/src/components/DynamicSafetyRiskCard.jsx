import React from 'react'
import {
  Shield, AlertTriangle, CheckCircle2, AlertCircle, Clock, Info,
  MapPin, ChevronRight, Eye, Navigation, Building2, PhoneCall, Sparkles
} from 'lucide-react'

/**
 * Dynamic Safety Risk Card Component
 * Renders contextual safety risk metrics (Score 0-100, Level, Confidence %, Contributing Factors, Data Quality).
 * Extends Orveyra safety intelligence without replacing any existing workflows.
 */
export default function DynamicSafetyRiskCard({
  riskData,
  loading = false,
  onOpenDetails,
  onExploreRoute,
  onRefresh,
  lastUpdatedText = "Updated just now",
  compact = false
}) {
  if (loading && !riskData) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-amethyst-800/50 bg-amethyst-950/70 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amethyst-800/60" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-amethyst-800/60 rounded w-1/3" />
            <div className="h-3 bg-amethyst-800/40 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  // Fallback demo data if riskData is null
  const defaultData = {
    risk_score: 76,
    risk_level: "ELEVATED",
    risk_label: "Elevated Contextual Risk",
    risk_color: "rose",
    confidence: 82,
    contributing_factors: [
      "Recent incidents nearby",
      "Low activity level",
      "Late-night conditions",
      "Poor lighting data"
    ],
    explanation: "Contextual risk is elevated due to late-night travel and low pedestrian density.",
    data_quality: {
      confidence_score: 82,
      flags: ["Lighting estimated based on daylight cycle", "Ground-truth incidents integrated"],
      has_demo_data: true
    },
    nearby_safe_havens: [
      { name: "Central City Hospital & ER", type: "Hospital", distance_km: 0.4, phone: "+91-33-2357-0001" },
      { name: "Bidhannagar Police Station", type: "Police Station", distance_km: 0.7, phone: "100 / 112" },
      { name: "24/7 Apollo Pharmacy", type: "Safe Haven Pharmacy", distance_km: 0.3, phone: "+91-33-2357-4400" }
    ]
  }

  const data = riskData || defaultData
  const score = data.risk_score ?? 50
  const level = data.risk_level ?? "MODERATE"
  const confidence = data.confidence ?? 85
  const factors = data.contributing_factors || []
  const safeHavens = data.nearby_safe_havens || []
  const hasDemo = data.data_quality?.has_demo_data

  // Theme styles based on risk level
  const isLow = level === "LOW"
  const isMod = level === "MODERATE"
  const isElevated = level === "ELEVATED"

  const badgeBg = isLow
    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
    : isMod
    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
    : "bg-rose-500/15 border-rose-500/40 text-rose-300"

  const scoreColor = isLow ? "text-emerald-400" : isMod ? "text-amber-400" : "text-rose-400"
  const iconColor = isLow ? "text-emerald-400" : isMod ? "text-amber-400" : "text-rose-400"
  const LevelIcon = isLow ? CheckCircle2 : isMod ? AlertCircle : AlertTriangle

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-amethyst-700/60 bg-amethyst-950/80 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-amethyst-600/80">
      
      {/* Decorative top accent glow */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isLow ? 'bg-emerald-500' : isMod ? 'bg-amber-500' : 'bg-rose-500'}`} />

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amethyst-800/50">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-amethyst-900 border border-amethyst-700/80 ${iconColor}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-100 uppercase">
                Dynamic Safety Intelligence
              </h3>
              {hasDemo && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amethyst-800 text-rosegold-300 border border-amethyst-700">
                  DEMO SIGNAL
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{lastUpdatedText}</span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="ml-2 text-rosegold-400 hover:text-rosegold-300 underline text-[11px] cursor-pointer"
                >
                  Refresh now
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold ${badgeBg}`}>
          <LevelIcon className="w-4 h-4 shrink-0" />
          <span>{level === "LOW" ? "🟢 Low Risk" : level === "MODERATE" ? "🟡 Moderate Risk" : "🔴 Elevated Risk"}</span>
        </div>
      </div>

      {/* Main Score & Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        {/* Risk Score */}
        <div className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
          <span className="text-[11px] font-semibold text-slate-400 block">Contextual Risk Score</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${scoreColor}`}>
              {score}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
        </div>

        {/* System Confidence */}
        <div className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
          <span className="text-[11px] font-semibold text-slate-400 block">System Confidence</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {confidence}%
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold ml-1">
              {confidence >= 80 ? 'High Quality' : 'Partial Data'}
            </span>
          </div>
        </div>

        {/* Primary Signal Status */}
        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 flex flex-col justify-center">
          <span className="text-[11px] font-semibold text-slate-400 block">Data Quality Audit</span>
          <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-rosegold-300">
            <Sparkles className="w-3.5 h-3.5 text-rosegold-400 shrink-0" />
            <span className="truncate">
              {hasDemo ? 'Ground-Truth + Estimated' : 'Ground-Truth Incident Stream'}
            </span>
          </div>
        </div>
      </div>

      {/* Contributing Factors */}
      {factors.length > 0 && (
        <div className="space-y-2 my-4 p-3.5 rounded-xl bg-amethyst-900/40 border border-amethyst-800/40">
          <span className="text-xs font-bold text-slate-300 block">
            Main Contributing Factors:
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
            {factors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${scoreColor.replace('text-', 'bg-')}`} />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Surface Nearby Safe Havens if Risk is Elevated or Moderate */}
      {(isElevated || isMod) && safeHavens.length > 0 && (
        <div className="my-4 p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-rose-400" />
              Nearby Verified Support & Safe Havens:
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Proximity Ranked</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {safeHavens.slice(0, 3).map((sh, i) => (
              <div key={i} className="p-2 rounded-lg bg-amethyst-900/80 border border-amethyst-700/60 text-xs flex flex-col justify-between space-y-1">
                <div>
                  <span className="font-bold text-slate-200 block truncate">{sh.name}</span>
                  <span className="text-[10px] text-rosegold-300">{sh.type} • {sh.distance_km} km</span>
                </div>
                {sh.phone && (
                  <a
                    href={`tel:${sh.phone}`}
                    className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 hover:underline pt-0.5"
                  >
                    <PhoneCall className="w-3 h-3 text-emerald-400" />
                    <span>Call: {sh.phone}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amethyst-800/50">
        <div className="flex items-center gap-2">
          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600/70 text-slate-100 text-xs font-bold transition-all shadow cursor-pointer"
            >
              <Eye className="w-4 h-4 text-rosegold-400" />
              <span>View Risk Details</span>
            </button>
          )}

          {onExploreRoute && (
            <button
              onClick={onExploreRoute}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amethyst-700 to-rosegold-700 hover:from-amethyst-600 hover:to-rosegold-600 text-white text-xs font-bold transition-all shadow cursor-pointer glow-purple"
            >
              <Navigation className="w-4 h-4 text-rosegold-300" />
              <span>Explore Safer Route</span>
            </button>
          )}
        </div>

        <span className="text-[10px] text-slate-400 italic">
          Contextual pattern indicator • Not a guarantee of safety/danger
        </span>
      </div>

    </div>
  )
}
