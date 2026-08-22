import React, { useState, useEffect } from 'react'
import { Stethoscope, Printer, Share2, CheckCircle2, Copy, Heart, Sparkles, HelpCircle, Check, Activity, FileText, Moon, Zap, Calendar, MessageSquareText, Compass, ShieldAlert } from 'lucide-react'

export default function DoctorModeView({ onNavigateCareFinder, incidents = [] }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shareToken, setShareToken] = useState(null)
  const [copied, setCopied] = useState(false)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [checkedQuestions, setCheckedQuestions] = useState({})
  const [isVisitPrepOpen, setIsVisitPrepOpen] = useState(false)
  const [customQuestion, setCustomQuestion] = useState('')
  const [userQuestions, setUserQuestions] = useState([
    "Why has my cycle length and frequency changed recently?",
    "Could my fatigue or sleep changes be related to iron / ferritin levels?",
    "Do you recommend running a targeted metabolic or hormonal panel?",
    "Are there lifestyle or dietary adjustments to help stabilize my baseline?"
  ])

  useEffect(() => {
    fetchSummary()
  }, [])

  const handleAddQuestion = (e) => {
    e.preventDefault()
    if (!customQuestion.trim()) return
    setUserQuestions(prev => [...prev, customQuestion.trim()])
    setCustomQuestion('')
  }

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

  const toggleQuestion = (idx) => {
    setCheckedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 animate-pulse space-y-3">
        <Stethoscope className="w-10 h-10 text-rosegold-400 mx-auto animate-bounce" />
        <p className="text-sm font-semibold">Preparing your simple Doctor Visit Summary...</p>
      </div>
    )
  }

  const patient = summary?.patient_info || {}
  const overview = summary?.health_overview || {}
  const metrics = summary?.longitudinal_metrics || {}
  const questions = overview.suggested_questions || summary?.clinician_discussion_questions || []

  // Simple Badge Colors helper
  const getBadgeStyle = (color) => {
    if (color === 'rose') return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    if (color === 'amber') return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    if (color === 'emerald') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    return 'bg-slate-800 text-slate-400 border-slate-700'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:p-0">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-rosegold-400" />
            <span>Doctor Visit Summary</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            A simple, clear summary of your health patterns to share with your doctor or gynecologist
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNavigateCareFinder && (
            <button
              onClick={() => onNavigateCareFinder('Gynecologist')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-rosegold-500/50 text-rosegold-300 text-xs font-bold transition-all shadow-md cursor-pointer glow-purple"
              title="Find nearby verified doctors & clinics"
            >
              <Compass className="w-4 h-4 text-rosegold-400" />
              <span>Find Care Near Me</span>
            </button>
          )}

          <button
            onClick={() => setIsVisitPrepOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rosegold-500 via-amber-400 to-rosegold-500 text-amethyst-950 text-xs font-black shadow-xl hover:scale-105 transition-all glow-rose cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-amethyst-950" />
            <span>🩺 Prepare My Doctor Visit</span>
          </button>

          <button
            onClick={handleGenerateShareToken}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-rosegold-400" />
            <span>Share Link</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold shadow-lg transition-all glow-purple cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* 🩺 PREPARE MY DOCTOR VISIT MODAL / INTERACTIVE COMPANION */}
      {isVisitPrepOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amethyst-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl p-6 sm:p-8 border border-rosegold-500/70 shadow-2xl space-y-6 bg-gradient-to-b from-amethyst-950 via-amethyst-900 to-amethyst-950">
            
            <button
              onClick={() => setIsVisitPrepOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-amethyst-800/60 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rosegold-400 to-amber-500 flex items-center justify-center text-amethyst-950 shadow-lg glow-rose">
                <Stethoscope className="w-6 h-6 text-amethyst-950" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Your Doctor Visit Prep Pack</h2>
                <p className="text-xs text-rosegold-300">
                  Concise clinical checklist ready for your consultation with your doctor.
                </p>
              </div>
            </div>

            {/* Visit Prep Sections */}
            <div className="space-y-4">
              
              {/* 1. My Symptoms & Duration */}
              <div className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rosegold-300 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>1. My Reported Symptoms & Onset</span>
                </h3>
                <p className="text-xs text-slate-300">
                  {overview.symptoms_card?.description || "Fatigue, mild cramping, and sleep interruptions logged over the last 60 days."}
                </p>
              </div>

              {/* 2. Cycle & Longitudinal Telemetry */}
              <div className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>2. Cycle History & Sleep/Stress Drift</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-amethyst-900/60 border border-amethyst-700/50">
                    <span className="text-slate-400 block text-[11px]">Period Cycles:</span>
                    <span className="font-bold text-slate-200">{overview.cycle_card?.headline || "Recent variation detected"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amethyst-900/60 border border-amethyst-700/50">
                    <span className="text-slate-400 block text-[11px]">Sleep & Rest:</span>
                    <span className="font-bold text-slate-200">{overview.sleep_card?.headline || "Nightly variations logged"}</span>
                  </div>
                </div>
              </div>

              {/* 3. Relevant Lab Reports */}
              {metrics.abnormal_biomarkers && metrics.abnormal_biomarkers.length > 0 && (
                <div className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>3. Relevant Lab Biomarkers & Deltas</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {metrics.abnormal_biomarkers.map((b, idx) => (
                      <span key={idx} className="text-xs px-3 py-1 rounded-lg bg-amethyst-900 border border-amethyst-700 font-mono text-slate-200">
                        {b.test_name}: <strong className="text-rosegold-400">{b.numeric_value} {b.unit}</strong> ({b.date})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Questions I Want to Ask My Doctor */}
              <div className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4" />
                  <span>4. Questions I Want to Ask</span>
                </h3>

                <div className="space-y-2">
                  {userQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amethyst-900/50 border border-amethyst-800/80 text-xs text-slate-200">
                      <span className="text-rosegold-400 font-bold">•</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>

                {/* Add Custom Question Form */}
                <form onSubmit={handleAddQuestion} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Add your own custom question to ask your doctor..."
                    className="flex-1 px-3 py-2 rounded-xl bg-amethyst-900/90 border border-amethyst-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-400"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-amethyst-700 hover:bg-amethyst-600 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    + Add
                  </button>
                </form>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amethyst-800">
              <span className="text-[11px] text-slate-400">
                You can print or download this prep summary before your appointment.
              </span>
              <div className="flex items-center gap-2">
                {onNavigateCareFinder && (
                  <button
                    onClick={() => { setIsVisitPrepOpen(false); onNavigateCareFinder('Gynecologist'); }}
                    className="px-4 py-2.5 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-rosegold-300 text-xs font-bold border border-rosegold-500/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Find Care Near Me</span>
                  </button>
                )}
                <button
                  onClick={() => { setIsVisitPrepOpen(false); handlePrint(); }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold shadow-lg transition-all glow-rose cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setIsVisitPrepOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Share Link Banner */}
      {shareToken && (
        <div className="glass-card rounded-xl p-4 border border-rosegold-500/60 bg-gradient-to-r from-amethyst-950 via-amethyst-900 to-amethyst-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE 48-HOUR DOCTOR LINK
              </span>
              <span className="text-xs text-slate-300">Expires: {new Date(shareToken.expires_at).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {window.location.origin}{shareToken.share_url}
            </p>
          </div>

          <button
            onClick={handleCopyShareLink}
            className="px-4 py-2 rounded-lg bg-rosegold-500 text-amethyst-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-rosegold-400 transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      )}

      {/* MAIN EASY-TO-READ HEALTH REPORT */}
      <div id="printable-doctor-summary" className="glass-card rounded-3xl p-6 sm:p-8 border border-amethyst-700/60 space-y-6 bg-amethyst-950/95 print:bg-white print:text-slate-900 print:shadow-none print:border-none">
        
        {/* Patient Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-amethyst-800/80 print:border-slate-300 gap-2">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rosegold-400 print:text-indigo-700">
              ORVEYRA Health Summary
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 print:text-slate-900">
              Patient: {patient.name}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              {patient.age ? `Age: ${patient.age} yrs • ` : ''}
              {patient.blood_group ? `Blood: ${patient.blood_group} • ` : ''}
              Target Cycle: {patient.typical_cycle_baseline || '28 days'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 print:text-slate-600">
              Date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 1. BIG FRIENDLY OVERVIEW CARD ("WHAT'S HAPPENING") */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amethyst-900/90 via-amethyst-950 to-amethyst-900/80 border-2 border-rosegold-500/50 print:bg-slate-50 print:border-slate-400 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rosegold-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-rosegold-300 print:text-indigo-900">
              What My Logs Show (Plain English Summary)
            </h3>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-100 print:text-slate-900 leading-snug">
            {overview.headline || "Baseline establishment phase"}
          </p>
        </div>

        {/* 2. 4 SIMPLE HEALTH STATUS CARDS */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-700">
            Health Check Across 4 Key Areas:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Card 1: Cycle Health */}
            <div className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 print:bg-white print:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rosegold-400" />
                  <span className="font-bold text-xs text-slate-200 print:text-slate-900">Period & Cycle Regularity</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(overview.cycle_card?.color)}`}>
                  {overview.cycle_card?.status || "Analyzing"}
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                {overview.cycle_card?.description || "Start logging your period dates to track regularity."}
              </p>
            </div>

            {/* Card 2: PCOS / Hormone Balance */}
            <div className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 print:bg-white print:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rosegold-400" />
                  <span className="font-bold text-xs text-slate-200 print:text-slate-900">PCOS / Hormones</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(overview.pcos_card?.color)}`}>
                  {overview.pcos_card?.status || "Analyzing"}
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                {overview.pcos_card?.description || "Checks cycle length patterns and symptoms like acne or hair changes."}
              </p>
            </div>

            {/* Card 3: Iron & Energy */}
            <div className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 print:bg-white print:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-slate-200 print:text-slate-900">Iron & Energy Reserves</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(overview.iron_card?.color)}`}>
                  {overview.iron_card?.status || "Analyzing"}
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                {overview.iron_card?.description || "Upload a Ferritin blood test in Lab Vault to check iron reserves."}
              </p>
            </div>

            {/* Card 4: Sleep & Recovery */}
            <div className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 print:bg-white print:border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-xs text-slate-200 print:text-slate-900">Sleep & Rest</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(overview.sleep_card?.color)}`}>
                  {overview.sleep_card?.status || "Analyzing"}
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                {overview.sleep_card?.description || "Record your sleep hours to check nightly rest patterns."}
              </p>
            </div>

          </div>
        </div>

        {/* 3. QUESTIONS TO ASK YOUR DOCTOR (SIMPLE CHECKLIST) */}
        {questions && questions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-700 flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-rosegold-400" />
              <span>Recommended Questions to Ask Your Doctor:</span>
            </h3>
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleQuestion(idx)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    checkedQuestions[idx]
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                      : 'bg-amethyst-950/80 hover:bg-amethyst-900/80 border-amethyst-800 text-slate-200 print:bg-white print:border-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                    checkedQuestions[idx] ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-amethyst-600'
                  }`}>
                    {checkedQuestions[idx] && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-medium leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. RECENT LAB TESTS (IF UPLOADED) */}
        {metrics.abnormal_biomarkers && metrics.abnormal_biomarkers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-700">
              Lab Tests Recorded:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {metrics.abnormal_biomarkers.map((b, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-amethyst-950/80 border border-amethyst-800 print:bg-white print:border-slate-300 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 print:text-slate-900">{b.test_name}</span>
                    <span className="text-[11px] text-slate-400 block">{b.date}</span>
                  </div>
                  <span className="font-mono font-bold text-rosegold-400 print:text-indigo-700">
                    {b.numeric_value} {b.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. DOCTOR'S VISIT NOTES */}
        <div className="space-y-2 print:block">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-700">
            Notes from Your Doctor Visit:
          </h3>
          <textarea
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="Write down what your doctor recommended, prescriptions, or follow-up tests here..."
            rows="3"
            className="w-full p-3.5 rounded-xl bg-amethyst-950/90 border border-amethyst-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-rosegold-400 print:bg-white print:border-slate-400 print:text-slate-900"
          />
        </div>

        {/* 6. SMART CONTEXT: FIND CARE NEAR ME */}
        {onNavigateCareFinder && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amethyst-950 via-amethyst-900/80 to-amethyst-950 border border-rosegold-500/50 space-y-3 print:hidden shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-rosegold-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Find Healthcare Providers & Facilities Near You
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amethyst-800 text-rosegold-300 border border-amethyst-700">
                Care Finder
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reviewed your symptoms and ready to consult a professional? Discover nearby specialists with verified locations and consultation hours:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => onNavigateCareFinder('Gynecologist')}
                className="px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-xs font-bold text-slate-200 border border-amethyst-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🩺 Find Gynecologist</span>
              </button>
              <button
                onClick={() => onNavigateCareFinder('Endocrinologist')}
                className="px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-xs font-bold text-slate-200 border border-amethyst-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🧬 Find Endocrinologist</span>
              </button>
              <button
                onClick={() => onNavigateCareFinder('Diagnostic Laboratory')}
                className="px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-xs font-bold text-slate-200 border border-amethyst-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🔬 Diagnostic Labs</span>
              </button>
              <button
                onClick={() => onNavigateCareFinder('Mental Health & Therapy')}
                className="px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-xs font-bold text-slate-200 border border-amethyst-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🧠 Mental Health & Therapy</span>
              </button>
              <button
                onClick={() => onNavigateCareFinder('Nutritionist & Dietitian')}
                className="px-3.5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-xs font-bold text-slate-200 border border-amethyst-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🥗 Nutrition & Diet</span>
              </button>
              <button
                onClick={() => onNavigateCareFinder('Women\'s Health Clinic')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rosegold-500 to-amber-400 text-amethyst-950 text-xs font-black shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🏥 Women's Health Clinics</span>
              </button>
              <button
                onClick={() => onNavigateCareFinder('all')}
                className="px-3.5 py-2 rounded-xl bg-amethyst-900 hover:bg-amethyst-800 text-rosegold-300 border border-rosegold-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🧭 Browse All Domains</span>
              </button>
            </div>
          </div>
        )}

        {/* Optional: Safety Incident Records (Immediate Help) */}
        {incidents.filter(i => i.include_in_doctor_report).length > 0 && (
          <div className="mt-6 glass-card rounded-xl p-5 border border-amber-500/30 bg-amber-500/5 print:border-amber-400 print:bg-amber-50">
            <h3 className="text-sm font-bold text-amber-300 print:text-amber-700 flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4" />
              Safety Records (Patient-Reported)
            </h3>
            <p className="text-[10px] text-slate-400 print:text-slate-500 mb-3">
              The following incidents were voluntarily flagged by the patient for inclusion in clinical documentation.
            </p>
            <div className="space-y-2">
              {incidents.filter(i => i.include_in_doctor_report).map(inc => (
                <div key={inc.id} className="flex items-start gap-3 p-3 rounded-lg bg-amethyst-950/60 print:bg-white border border-amethyst-800/60 print:border-slate-200">
                  <ShieldAlert className="w-4 h-4 text-amber-400 print:text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {inc.category && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 print:text-amber-700 print:bg-amber-100 border border-amber-500/30">
                          {inc.category}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {inc.incident_at ? new Date(inc.incident_at).toLocaleDateString() : 'Date not specified'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 print:text-slate-700">
                      {inc.description || 'No description provided'}
                    </p>
                    {inc.location_text && (
                      <p className="text-[10px] text-slate-500">📍 {inc.location_text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer Footer */}
        <div className="pt-4 border-t border-amethyst-800/80 print:border-slate-300 text-center">
          <p className="text-[10px] text-slate-500 italic max-w-xl mx-auto">
            {summary?.disclaimer}
          </p>
        </div>

      </div>

    </div>
  )
}
