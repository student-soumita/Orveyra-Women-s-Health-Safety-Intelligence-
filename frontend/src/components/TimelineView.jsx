import React, { useState, useMemo } from 'react'
import { Clock, Search, Filter, Trash2, Calendar, Activity, FileText, Pill, Moon, Rewind, AlertCircle } from 'lucide-react'

export default function TimelineView({ cycles, symptoms, lifestyle, biomarkers, medications, onDeleteLog, onRefresh }) {
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [rewindMonths, setRewindMonths] = useState(12) // 3, 6, 12, or 999 (all)

  // Consolidate into unified timeline stream sorted by date descending
  const unifiedTimeline = useMemo(() => {
    const list = []

    cycles.forEach(c => {
      list.push({
        id: `cycle_${c.id}`,
        rawId: c.id,
        stream: 'cycle',
        date: c.start_date,
        title: `Cycle Start (${c.flow_intensity} Flow)`,
        description: c.notes || `Flow intensity: ${c.flow_intensity}`,
        badge: 'CYCLE',
        badgeColor: 'bg-rosegold-500/20 text-rosegold-300 border-rosegold-500/40',
        icon: Calendar
      })
    })

    symptoms.forEach(s => {
      list.push({
        id: `symptom_${s.id}`,
        rawId: s.id,
        stream: 'symptom',
        date: s.date,
        title: s.symptom_name,
        description: `Category: ${s.category} • Severity: ${s.severity}/10 ${s.notes ? `• "${s.notes}"` : ''}`,
        badge: 'SYMPTOM',
        badgeColor: s.severity >= 7 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amethyst-500/20 text-amethyst-300 border-amethyst-500/40',
        icon: Activity
      })
    })

    lifestyle.forEach(l => {
      list.push({
        id: `lifestyle_${l.id}`,
        rawId: l.id,
        stream: 'lifestyle',
        date: l.date,
        title: `Sleep & Stress Log`,
        description: `Sleep: ${l.sleep_hours || 'N/A'} hrs • Stress Level: ${l.stress_level || 'N/A'}/10`,
        badge: 'LIFESTYLE',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        icon: Moon
      })
    })

    biomarkers.forEach(b => {
      list.push({
        id: `biomarker_${b.id}`,
        rawId: b.id,
        stream: 'biomarker',
        date: b.date,
        title: `Lab Biomarker: ${b.test_name}`,
        description: `Result: ${b.numeric_value} ${b.unit || ''} (Ref: ${b.reference_range || 'N/A'})`,
        badge: b.is_abnormal ? 'ABNORMAL LAB' : 'LAB RESULT',
        badgeColor: b.is_abnormal ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: FileText
      })
    })

    medications.forEach(m => {
      list.push({
        id: `med_${m.id}`,
        rawId: m.id,
        stream: 'medication',
        date: m.start_date,
        title: `Medication: ${m.medication_name}`,
        description: `Dosage: ${m.dosage || 'N/A'} • Frequency: ${m.frequency || 'N/A'}`,
        badge: 'MEDICATION',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        icon: Pill
      })
    })

    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [cycles, symptoms, lifestyle, biomarkers, medications])

  // Filter based on category, search, and Health Rewind time range
  const filteredItems = useMemo(() => {
    const cutoffDate = new Date()
    if (rewindMonths !== 999) {
      cutoffDate.setMonth(cutoffDate.getMonth() - rewindMonths)
    } else {
      cutoffDate.setFullYear(2000)
    }

    return unifiedTimeline.filter(item => {
      const matchesCat = filterCategory === 'ALL' || item.stream.toUpperCase() === filterCategory.toUpperCase()
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const itemDate = new Date(item.date)
      const matchesRewind = itemDate >= cutoffDate

      return matchesCat && matchesSearch && matchesRewind
    })
  }, [unifiedTimeline, filterCategory, searchQuery, rewindMonths])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Clock className="w-6 h-6 text-rosegold-400" />
            <span>Longitudinal Health Timeline & Rewind</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological multi-stream record with historical deviation pinpointing
          </p>
        </div>

        {/* HEALTH REWIND CONTROL */}
        <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-xl border border-amethyst-700/60">
          <Rewind className="w-4 h-4 text-rosegold-400 shrink-0" />
          <span className="text-xs text-slate-300 font-medium">Health Rewind:</span>
          <div className="flex items-center gap-1 bg-amethyst-950/80 p-1 rounded-lg border border-amethyst-800">
            {[
              { label: '3M', val: 3 },
              { label: '6M', val: 6 },
              { label: '12M', val: 12 },
              { label: 'All', val: 999 }
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setRewindMonths(opt.val)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  rewindMonths === opt.val
                    ? 'bg-amethyst-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-xl p-4 border border-amethyst-700/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search symptoms, labs, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-amethyst-950/80 border border-amethyst-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['ALL', 'CYCLE', 'SYMPTOM', 'LIFESTYLE', 'BIOMARKER', 'MEDICATION'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                filterCategory === cat
                  ? 'bg-amethyst-800 border-amethyst-600 text-white shadow-md'
                  : 'bg-amethyst-950/60 border-amethyst-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Timeline Stream Listing */}
      <div className="glass-card rounded-2xl p-6 border border-amethyst-700/60 space-y-6">
        
        {filteredItems.length > 0 ? (
          <div className="relative border-l-2 border-amethyst-800/80 ml-4 space-y-6">
            {filteredItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.id} className="relative pl-6 sm:pl-8 group">
                  
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-amethyst-950 border-2 border-amethyst-500 group-hover:border-rosegold-400 transition-colors" />

                  <div className="p-4 rounded-xl bg-amethyst-950/60 border border-amethyst-800/60 group-hover:border-amethyst-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{item.date}</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pt-0.5">
                        <Icon className="w-4 h-4 text-amethyst-400 shrink-0" />
                        <span>{item.title}</span>
                      </h3>

                      <p className="text-xs text-slate-400">
                        {item.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteLog(item.stream, item.rawId)}
                      title="Delete Entry"
                      className="self-end sm:self-center p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-amethyst-900/60 transition-colors opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No Timeline Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your category filter or Health Rewind range, or log new telemetry entries.
            </p>
          </div>
        )}

      </div>

    </div>
  )
}
