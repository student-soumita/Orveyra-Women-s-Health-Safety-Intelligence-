import React, { useState } from 'react'
import {
  FileText, UploadCloud, CheckCircle2, AlertTriangle, ShieldCheck,
  Download, X, Trash2, FlaskConical, TrendingUp, TrendingDown,
  Minus, Activity, Clock, Zap, Lock, ChevronDown, ChevronRight
} from 'lucide-react'

export default function LabVaultView({ documents, biomarkers, onUploadDocument, onVerifyDocument, onRefresh, onDeleteDocument }) {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [verificationFields, setVerificationFields] = useState([])
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [expandedDocId, setExpandedDocId] = useState(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/vault/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        onRefresh()
        setSelectedDoc(data)
        setVerificationFields(data.idp_extraction?.extracted_fields || [])
      }
    } catch (err) {
      console.error('Document upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmVerification = async (docId, status) => {
    try {
      await fetch(`/api/vault/verify/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: status, approved_fields: verificationFields })
      })
      setSelectedDoc(null)
      onRefresh()
    } catch (err) {
      console.error('Verification gatekeeper error:', err)
    }
  }

  const handleDeleteConfirm = async (docId) => {
    if (onDeleteDocument) {
      await onDeleteDocument(docId)
    }
    setDeleteConfirmId(null)
  }

  const biomarkerMap = biomarkers
    ? Object.entries(
        biomarkers.reduce((acc, b) => {
          if (!acc[b.test_name]) acc[b.test_name] = []
          acc[b.test_name].push(b)
          return acc
        }, {})
      ).map(([testName, entries]) => {
        const sorted = [...entries].sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
        const latest = sorted[sorted.length - 1]
        const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null
        const pct = prev && prev.value !== 0 ? (((latest.value - prev.value) / prev.value) * 100).toFixed(0) : null
        return { testName, latest, prev, pct }
      })
    : []

  const verifiedCount = documents.filter(d => d.verification_status === 'VERIFIED').length
  const pendingCount = documents.filter(d => d.verification_status !== 'VERIFIED').length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="relative rounded-3xl overflow-hidden border border-amethyst-700/40 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #1e0a3c 0%, #2d1060 40%, #1a0535 100%)' }}>
        <div className="pointer-events-none absolute -top-10 -right-10 w-52 h-52 rounded-full bg-rosegold-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-40 h-40 rounded-full bg-amethyst-500/10 blur-2xl" />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rosegold-500/30 to-amethyst-500/30 border border-rosegold-500/30 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-rosegold-400" />
              </div>
              <h1 className="text-2xl font-black gradient-text tracking-tight">Lab Vault</h1>
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/40 text-emerald-300">
                IDP v2
              </span>
            </div>
            <p className="text-xs text-slate-400 pl-[52px]">
              Intelligent document processing · Verification gatekeeper · Longitudinal delta engine
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2.5 rounded-2xl bg-amethyst-900/60 border border-amethyst-700/40 text-center min-w-[72px]">
              <div className="text-lg font-black text-slate-100">{documents.length}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-900/30 border border-emerald-700/40 text-center min-w-[72px]">
              <div className="text-lg font-black text-emerald-300">{verifiedCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Verified</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-amber-900/30 border border-amber-700/40 text-center min-w-[72px]">
              <div className="text-lg font-black text-amber-300">{pendingCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Pending</div>
            </div>
            <label id="upload-lab-btn"
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-extrabold shadow-lg transition-all hover:scale-105 active:scale-95 glow-rose select-none">
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Parsing…' : 'Upload Report'}</span>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="border-t border-amethyst-800/50 px-6 sm:px-8 py-3 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-mono">
          {[
            { step: '01', label: 'Upload Report', color: 'text-amethyst-300' },
            { step: '02', label: 'IDP Extraction', color: 'text-slate-400' },
            { step: '03', label: 'Gatekeeper Review', color: 'text-amber-300' },
            { step: '04', label: 'Timeline Push', color: 'text-emerald-300' },
            { step: '05', label: 'Signal Graph', color: 'text-rosegold-300' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.step}>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amethyst-950/60 border border-amethyst-800/60 ${s.color}`}>
                <span className="opacity-50">{s.step}</span>
                <span>{s.label}</span>
              </span>
              {i < arr.length - 1 && <span className="text-rosegold-600">›</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* VERIFICATION GATEKEEPER MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amethyst-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl space-y-5"
            style={{ background: 'linear-gradient(135deg, #1a0535 0%, #261040 100%)' }}>
            <button onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-amethyst-800/60 transition-all">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">Verification Gatekeeper</h3>
                <p className="text-xs text-amber-300 font-semibold mt-0.5">Review extracted values before saving to your biomarker log</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-amethyst-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-amethyst-900/90 text-slate-300 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5">Test Name</th>
                    <th className="p-3.5">Value</th>
                    <th className="p-3.5">Unit</th>
                    <th className="p-3.5">Ref Range</th>
                    <th className="p-3.5">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amethyst-800/50 text-slate-200">
                  {verificationFields.map((f, idx) => (
                    <tr key={idx} className="hover:bg-amethyst-900/40 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-100">{f.test_name}</td>
                      <td className={`p-3.5 font-black text-base ${f.is_abnormal ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {f.numeric_value}{f.is_abnormal && <span className="ml-1 text-[10px]">⚠</span>}
                      </td>
                      <td className="p-3.5 text-slate-400">{f.unit || '—'}</td>
                      <td className="p-3.5 text-slate-400">{f.reference_range || '—'}</td>
                      <td className="p-3.5">
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                          f.confidence >= 0.9 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : f.confidence >= 0.7 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>{Math.round(f.confidence * 100)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => handleConfirmVerification(selectedDoc.document_id || selectedDoc.id, 'REJECTED')}
                className="px-4 py-2 rounded-xl bg-amethyst-900 hover:bg-rose-900/40 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all">
                Reject Extraction
              </button>
              <button onClick={() => handleConfirmVerification(selectedDoc.document_id || selectedDoc.id, 'VERIFIED')}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-extrabold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                <CheckCircle2 className="w-4 h-4" />
                Verify & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 border border-rose-500/40 shadow-2xl space-y-5 text-center"
            style={{ background: 'linear-gradient(135deg, #1a0535 0%, #2d0a1a 100%)' }}>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100">Delete Document?</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                This will permanently remove the document and all associated extracted biomarkers from your vault.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amethyst-900 hover:bg-amethyst-800 text-slate-300 text-xs font-bold border border-amethyst-700/40 transition-all">
                Cancel
              </button>
              <button onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white text-xs font-extrabold shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIOMARKER DELTA CARDS */}
      {biomarkerMap.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-rosegold-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Biomarker Delta Engine</h2>
            <span className="ml-auto text-[10px] font-mono text-amethyst-300 bg-amethyst-900/60 px-3 py-1 rounded-full border border-amethyst-700/60">
              {biomarkerMap.length} tracked
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {biomarkerMap.map(({ testName, latest, prev, pct }, idx) => {
              const up = pct !== null && Number(pct) > 0
              const down = pct !== null && Number(pct) < 0
              const neutral = pct === null
              return (
                <div key={idx}
                  className="group relative p-5 rounded-2xl border transition-all hover:scale-[1.02] cursor-default"
                  style={{ background: 'linear-gradient(135deg, rgba(30,10,60,0.9) 0%, rgba(20,5,40,0.95) 100%)', borderColor: 'rgba(100,60,160,0.35)' }}>
                  <div className="pointer-events-none absolute top-0 left-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-30 transition-opacity"
                    style={{ background: up ? '#f59e0b' : down ? '#f43f5e' : '#8b5cf6', filter: 'blur(28px)' }} />
                  <div className="relative space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-slate-100 leading-tight">{testName}</span>
                      <span className="shrink-0 text-[10px] font-mono text-slate-500">{latest.unit}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-50">{latest.value}</span>
                      {!neutral && (
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${up ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
                          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {up ? `+${pct}%` : `${pct}%`}
                        </span>
                      )}
                      {neutral && (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border bg-amethyst-500/20 text-amethyst-300 border-amethyst-500/40">
                          <Minus className="w-3 h-3" /> Baseline
                        </span>
                      )}
                    </div>
                    {prev && <div className="text-[10px] text-slate-500 font-mono">Was {prev.value} {prev.unit} · {prev.test_date}</div>}
                    {latest.reference_range && (
                      <div className="pt-2 border-t border-amethyst-900/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Ref: {latest.reference_range}</span>
                        <span className="text-slate-600">{latest.test_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* VAULT DOCUMENTS */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-amethyst-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Vault Documents</h2>
          <span className="ml-auto text-[10px] font-mono text-amethyst-300 bg-amethyst-900/60 px-3 py-1 rounded-full border border-amethyst-700/60">
            {documents.length} file{documents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => {
              const isExpanded = expandedDocId === doc.id
              const isVerified = doc.verification_status === 'VERIFIED'
              return (
                <div key={doc.id}
                  className="rounded-2xl border overflow-hidden transition-all"
                  style={{ borderColor: isVerified ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)', background: 'linear-gradient(135deg, rgba(20,5,45,0.95) 0%, rgba(15,5,35,1) 100%)' }}>

                  <div className="flex items-center gap-3 p-4">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${isVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                      <FileText className={`w-5 h-5 ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-100 truncate">{doc.filename}</div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-amethyst-300 font-mono flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {Math.round(doc.confidence_score * 100)}% confidence
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${isVerified ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                          {doc.verification_status}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isVerified && (
                        <button id={`verify-btn-${doc.id}`}
                          onClick={() => { setSelectedDoc(doc); setVerificationFields(doc.idp_extraction?.extracted_fields || []) }}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                          Verify
                        </button>
                      )}

                      <a href={doc.presigned_url} target="_blank" rel="noreferrer"
                        id={`download-btn-${doc.id}`}
                        className="p-2 rounded-xl bg-amethyst-800/60 hover:bg-amethyst-700/60 text-slate-300 border border-amethyst-700/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                        title="Download">
                        <Download className="w-4 h-4" />
                      </a>

                      <button id={`expand-btn-${doc.id}`}
                        onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                        className="p-2 rounded-xl bg-amethyst-800/60 hover:bg-amethyst-700/60 text-slate-300 border border-amethyst-700/40 transition-all hover:scale-105 active:scale-95"
                        title="View extracted fields">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {/* DELETE BUTTON */}
                      <button id={`delete-doc-btn-${doc.id}`}
                        onClick={() => setDeleteConfirmId(doc.id)}
                        className="p-2 rounded-xl bg-rose-900/30 hover:bg-rose-600/30 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/50 transition-all hover:scale-105 active:scale-95"
                        title="Delete document">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && doc.idp_extraction?.extracted_fields?.length > 0 && (
                    <div className="border-t border-amethyst-800/40 bg-amethyst-950/60 px-4 pb-4 pt-3">
                      <p className="text-[10px] text-slate-500 font-mono uppercase font-bold mb-2 flex items-center gap-1.5">
                        <Activity className="w-3 h-3" /> Extracted Fields ({doc.idp_extraction.extracted_fields.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {doc.idp_extraction.extracted_fields.map((f, i) => (
                          <div key={i} className="px-3 py-2 rounded-xl bg-amethyst-900/60 border border-amethyst-800/50 flex items-center justify-between gap-2">
                            <div>
                              <div className="text-[11px] font-bold text-slate-200">{f.test_name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{f.reference_range || '—'}</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-black ${f.is_abnormal ? 'text-rose-400' : 'text-emerald-400'}`}>{f.numeric_value}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{f.unit || ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-amethyst-700/50 py-16 flex flex-col items-center gap-4 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(20,5,45,0.5) 0%, rgba(15,5,35,0.7) 100%)' }}>
            <div className="w-16 h-16 rounded-2xl bg-amethyst-800/40 border border-amethyst-700/40 flex items-center justify-center">
              <FlaskConical className="w-8 h-8 text-amethyst-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-300">No Documents in Vault</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Upload your lab PDFs or images to extract biomarkers with confidence scoring and start tracking trends.
              </p>
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amethyst-700 to-rosegold-700 hover:from-amethyst-600 hover:to-rosegold-600 text-white text-xs font-extrabold shadow-lg transition-all hover:scale-105 active:scale-95 select-none">
              <UploadCloud className="w-4 h-4" />
              Upload Your First Report
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}
      </section>

    </div>
  )
}
