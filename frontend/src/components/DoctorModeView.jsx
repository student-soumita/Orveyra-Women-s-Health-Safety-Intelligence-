import React, { useState, useEffect } from 'react'
import { Stethoscope, Printer, Share2, Clock, CheckCircle2, Copy, ShieldAlert, FileText } from 'lucide-react'

export default function DoctorModeView() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shareToken, setShareToken] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/doctor/summary')
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      console.error("Doctor summary error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateShareToken = async () => {
    try {
      const res = await fetch('/api/doctor/share-token', { method: 'POST' })
      const data = await res.json()
      setShareToken(data)
    } catch (err) {
      console.error("Share token error:", err)
    }
  }

  const handleCopyShareLink = () => {
    if (!shareToken) return
    const fullUrl = `${window.location.origin}${shareToken.share_url}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 animate-pulse space-y-2">
        <Stethoscope className="w-10 h-10 text-rosegold-400 mx-auto" />
        <p className="text-sm font-semibold">Compiling Clinician Health Summary...</p>
      </div>
    )
  }

  const metrics = summary?.longitudinal_metrics || {}
  const patient = summary?.patient_info || {}
  const aiObs = summary?.ai_body_drift_summary || {}

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:p-0">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-rosegold-400" />
            <span>Doctor Mode Clinician Summary</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Printable PDF summary & temporary expiring share link generator
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateShareToken}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600 text-white text-xs font-bold transition-all shadow-md"
          >
            <Share2 className="w-4 h-4 text-rosegold-400" />
            <span>Generate 48h Share Link</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold shadow-lg transition-all glow-rose"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Share Token Banner */}
      {shareToken && (
        <div className="glass-card rounded-xl p-4 border border-rosegold-500/60 bg-gradient-to-r from-amethyst-950 via-amethyst-900 to-amethyst-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE SHARE LINK
              </span>
              <span className="text-xs text-slate-300">Expires: {new Date(shareToken.expires_at).toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {window.location.origin}{shareToken.share_url}
            </p>
          </div>

          <button
            onClick={handleCopyShareLink}
            className="px-4 py-2 rounded-lg bg-rosegold-500 text-amethyst-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-rosegold-400 transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      )}

      {/* PRINTABLE CLINICIAN SUMMARY REPORT CONTAINER */}
      <div id="printable-doctor-summary" className="glass-card rounded-2xl p-8 sm:p-10 border border-amethyst-700/60 space-y-8 bg-amethyst-950/95 print:bg-white print:text-slate-900 print:shadow-none print:border-none">
        
        {/* Document Header */}
        <div className="flex items-center justify-between pb-6 border-b border-amethyst-800/80 print:border-slate-300">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-rosegold-400 print:text-indigo-600">
              ORVEYRA CLINICIAN HEALTH SUMMARY
            </span>
            <h2 className="text-2xl font-bold text-slate-100 print:text-slate-900">
              Patient: {patient.name}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600">
              DOB: {patient.date_of_birth} • Reference Cycle Baseline: {patient.typical_cycle_baseline}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 print:text-slate-600">
            <span>Generated: {new Date(summary?.generated_at).toLocaleDateString()}</span>
            <p className="font-bold text-slate-300 print:text-slate-800">Longitudinal Telemetry Audit</p>
          </div>
        </div>

        {/* 1. Cycle Variability & Longitudinal Metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-slate-900 uppercase tracking-wider border-b border-amethyst-800/60 pb-1">
            1. Menstrual Cycle Stability & Range
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 print:bg-slate-50 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block">Logged Cycle Count:</span>
              <strong className="text-sm text-slate-100 print:text-slate-900">{metrics.logged_cycles} entries recorded</strong>
            </div>
            <div className="p-3 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 print:bg-slate-50 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block">Observed Cycle Range:</span>
              <strong className="text-sm text-slate-100 print:text-slate-900">{metrics.recorded_cycle_range}</strong>
            </div>
          </div>
        </div>

        {/* 2. Top Reported Symptoms & Severity */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-slate-900 uppercase tracking-wider border-b border-amethyst-800/60 pb-1">
            2. Symptom Concentration & Frequency
          </h3>
          {metrics.top_symptoms && metrics.top_symptoms.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {metrics.top_symptoms.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 print:bg-slate-50 print:border-slate-300 text-xs">
                  <span className="font-bold text-slate-100 print:text-slate-900 block">{s.name}</span>
                  <span className="text-slate-400 print:text-slate-600">Logged {s.frequency} times</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No symptoms recorded.</p>
          )}
        </div>

        {/* 3. Biomarker Vault & Abnormal Findings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-slate-900 uppercase tracking-wider border-b border-amethyst-800/60 pb-1">
            3. Verified Laboratory Biomarkers
          </h3>
          {metrics.abnormal_biomarkers && metrics.abnormal_biomarkers.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-amethyst-800 print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-amethyst-900/80 print:bg-slate-100 text-slate-300 print:text-slate-800 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Test Name</th>
                    <th className="p-2.5">Value</th>
                    <th className="p-2.5">Reference Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amethyst-800/60 print:divide-slate-200 text-slate-200 print:text-slate-900">
                  {metrics.abnormal_biomarkers.map((b, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">{b.date}</td>
                      <td className="p-2.5 font-bold">{b.test_name}</td>
                      <td className="p-2.5 font-bold text-rose-400 print:text-rose-700">{b.numeric_value} {b.unit}</td>
                      <td className="p-2.5 text-slate-400 print:text-slate-600">{b.reference_range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No abnormal lab findings recorded.</p>
          )}
        </div>

        {/* 4. AI Body Drift Observational Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-slate-900 uppercase tracking-wider border-b border-amethyst-800/60 pb-1">
            4. Deterministic Body Drift™ Summary
          </h3>
          <div className="p-4 rounded-xl bg-amethyst-950/80 border border-amethyst-800/80 print:bg-slate-50 print:border-slate-300 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rosegold-400 print:text-indigo-600">{aiObs.banner_title}</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amethyst-900 text-slate-300">
                Signal: {aiObs.signal_quality}
              </span>
            </div>
            <p className="text-slate-300 print:text-slate-800 leading-relaxed font-medium">
              {aiObs.explanation_text}
            </p>
          </div>
        </div>

        {/* 5. Potential Clinician Discussion Questions */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-slate-900 uppercase tracking-wider border-b border-amethyst-800/60 pb-1">
            5. Recommended Clinician Discussion Questions
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 print:text-slate-800">
            {summary?.clinician_discussion_questions?.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rosegold-400 print:bg-indigo-600 mt-1.5 shrink-0" />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mandatory Disclaimer */}
        <div className="pt-6 border-t border-amethyst-800/60 text-[10px] text-slate-400 print:text-slate-600 text-center">
          {summary?.disclaimer}
        </div>

      </div>

    </div>
  )
}
