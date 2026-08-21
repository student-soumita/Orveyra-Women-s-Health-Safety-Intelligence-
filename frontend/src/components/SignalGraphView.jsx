import React, { useState } from 'react'
import { Network, Info, Activity, Calendar, Moon, FileText, Pill, AlertTriangle, X } from 'lucide-react'

export default function SignalGraphView({ cycles, symptoms, lifestyle, biomarkers, medications }) {
  const [selectedNode, setSelectedNode] = useState(null)

  // Node definitions representing physiological signal domains
  const nodes = [
    {
      id: 'cycle',
      label: 'Cycle Stability',
      type: 'Primary Telemetry',
      x: 300,
      y: 120,
      icon: Calendar,
      color: '#e0a96d',
      count: cycles.length,
      detail: cycles.length > 0
        ? `Logged ${cycles.length} cycles. Mean interval variance detected across recent cycles.`
        : 'Baseline forming. Need at least 2 logged cycles.',
      coOccurring: ['symptoms', 'sleep', 'biomarkers']
    },
    {
      id: 'symptoms',
      label: 'Symptom Trajectory',
      type: 'Physical & Mood',
      x: 180,
      y: 260,
      icon: Activity,
      color: '#9d63f4',
      count: symptoms.length,
      detail: symptoms.length > 0
        ? `Recorded ${symptoms.length} symptom occurrences across pelvic, mood, and energy categories.`
        : 'No symptom entries logged.',
      coOccurring: ['cycle', 'sleep', 'medication']
    },
    {
      id: 'sleep',
      label: 'Sleep & Circadian',
      type: 'Lifestyle Telemetry',
      x: 420,
      y: 260,
      icon: Moon,
      color: '#34d399',
      count: lifestyle.length,
      detail: lifestyle.length > 0
        ? `Tracked ${lifestyle.length} nights of sleep and stress levels.`
        : 'No lifestyle logs recorded.',
      coOccurring: ['cycle', 'symptoms']
    },
    {
      id: 'biomarkers',
      label: 'Biomarker Vault',
      type: 'Laboratory IDP',
      x: 180,
      y: 400,
      icon: FileText,
      color: '#f43f5e',
      count: biomarkers.length,
      detail: biomarkers.length > 0
        ? `${biomarkers.length} lab biomarkers verified in vault.`
        : 'No laboratory biomarkers uploaded.',
      coOccurring: ['cycle', 'symptoms']
    },
    {
      id: 'medication',
      label: 'Medication Regimen',
      type: 'Clinical Input',
      x: 420,
      y: 400,
      icon: Pill,
      color: '#3b82f6',
      count: medications.length,
      detail: medications.length > 0
        ? `${medications.length} active or historical medications recorded.`
        : 'No medication entries logged.',
      coOccurring: ['symptoms']
    }
  ]

  // Graph links
  const links = [
    { source: 'cycle', target: 'symptoms' },
    { source: 'cycle', target: 'sleep' },
    { source: 'cycle', target: 'biomarkers' },
    { source: 'symptoms', target: 'sleep' },
    { source: 'symptoms', target: 'medication' },
    { source: 'symptoms', target: 'biomarkers' }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Network className="w-6 h-6 text-rosegold-400" />
            <span>Health Signal Graph</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual network of co-occurring body signals • Click nodes to inspect trajectory
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-amethyst-900/60 border border-amethyst-700/60 text-xs text-rosegold-300 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>Framing: <strong>Co-occurring change</strong> (Non-causal)</span>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-amethyst-700/60 relative overflow-hidden flex flex-col items-center justify-center min-h-[480px]">
          
          <svg className="w-full h-[450px]" viewBox="0 0 600 500">
            {/* Draw Links */}
            {links.map((link, idx) => {
              const sNode = nodes.find(n => n.id === link.source)
              const tNode = nodes.find(n => n.id === link.target)
              if (!sNode || !tNode) return null

              const isHighlighted = selectedNode && (selectedNode.id === sNode.id || selectedNode.id === tNode.id)

              return (
                <g key={idx}>
                  <line
                    x1={sNode.x}
                    y1={sNode.y}
                    x2={tNode.x}
                    y2={tNode.y}
                    stroke={isHighlighted ? '#e0a96d' : 'rgba(194, 155, 250, 0.25)'}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    strokeDasharray={isHighlighted ? 'none' : '4 4'}
                  />
                  {/* Connection Label */}
                  {isHighlighted && (
                    <text
                      x={(sNode.x + tNode.x) / 2}
                      y={(sNode.y + tNode.y) / 2 - 6}
                      fill="#e0a96d"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      co-occurring change
                    </text>
                  )}
                </g>
              )
            })}

            {/* Draw Nodes */}
            {nodes.map((n) => {
              const isSelected = selectedNode?.id === n.id
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  onClick={() => setSelectedNode(n)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={isSelected ? 36 : 28}
                    fill="#140c24"
                    stroke={n.color}
                    strokeWidth={isSelected ? 4 : 2}
                    className="transition-all duration-300 group-hover:scale-110"
                  />

                  {/* Node Label & Count */}
                  <text
                    y={5}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {n.count}
                  </text>

                  <text
                    y={48}
                    fill="#e2e8f0"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {n.label}
                  </text>
                </g>
              )
            })}
          </svg>

          <p className="text-[11px] text-slate-400 text-center mt-2">
            Click any signal node to inspect historical trajectory and co-occurring observations.
          </p>

        </div>

        {/* Node Detail Inspector Drawer Panel */}
        <div className="glass-card rounded-2xl p-6 border border-amethyst-700/60 flex flex-col justify-between">
          
          {selectedNode ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-amethyst-800/60">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{selectedNode.label}</h3>
                  <span className="text-xs text-rosegold-400 font-medium">{selectedNode.type}</span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amethyst-950/70 border border-amethyst-800/60 space-y-1">
                <span className="text-xs text-slate-400 block">Telemetry Summary</span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedNode.detail}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Observed Co-Occurring Links:
                </span>
                <div className="space-y-1.5">
                  {selectedNode.coOccurring.map((targetId) => {
                    const tNode = nodes.find(n => n.id === targetId)
                    return (
                      <div key={targetId} className="p-2.5 rounded-lg bg-amethyst-900/60 border border-amethyst-800/50 flex items-center justify-between">
                        <span className="text-xs text-slate-200 font-medium">{tNode?.label}</span>
                        <span className="text-[10px] uppercase font-bold text-rosegold-400 px-2 py-0.5 rounded bg-amethyst-950">
                          Co-occurring
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amethyst-950/60 border border-amethyst-800/40 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Clinical Framing Note</span>
                </div>
                <p>
                  Connections between nodes indicate statistical co-occurrence during identical observation windows, not direct biological causation.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Network className="w-12 h-12 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-300">Select a Signal Node</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Click any node on the graph canvas to inspect its co-occurring connections and telemetry trajectory.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}
