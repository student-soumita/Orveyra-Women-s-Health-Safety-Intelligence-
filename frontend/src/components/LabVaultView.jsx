import React, { useState } from 'react'
import { FileText, UploadCloud, CheckCircle2, AlertTriangle, ShieldCheck, Download, Eye, X } from 'lucide-react'

export default function LabVaultView({ documents, biomarkers, onUploadDocument, onVerifyDocument, onRefresh }) {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [verificationFields, setVerificationFields] = useState([])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        onRefresh()
        setSelectedDoc(data)
        setVerificationFields(data.idp_extraction?.extracted_fields || [])
      }
    } catch (err) {
      console.error("Document upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmVerification = async (docId, status) => {
    try {
      await fetch(`/api/vault/verify/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: status,
          approved_fields: verificationFields
        })
      })
      setSelectedDoc(null)
      onRefresh()
    } catch (err) {
      console.error("Verification gatekeeper error:", err)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <FileText className="w-6 h-6 text-rosegold-400" />
            <span>Layout-Aware Lab Report Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent Document Processing (IDP) with mandatory User Verification Gatekeeper
          </p>
        </div>

        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold shadow-lg transition-all glow-rose">
          <UploadCloud className="w-4 h-4" />
          <span>{uploading ? 'Parsing IDP Layout...' : 'Upload Lab PDF / Image'}</span>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* VERIFICATION GATEKEEPER MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amethyst-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl glass-card rounded-2xl p-6 sm:p-8 border border-rosegold-500/60 shadow-2xl space-y-6">
            
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Verification Gatekeeper</h3>
                <p className="text-xs text-amber-300 font-semibold">
                  "AI extracted this information. Please verify before saving."
                </p>
              </div>
            </div>

            {/* Extracted Fields Table */}
            <div className="overflow-x-auto rounded-xl border border-amethyst-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-amethyst-900/80 text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Test Name</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Reference Range</th>
                    <th className="p-3">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amethyst-800/60 text-slate-200">
                  {verificationFields.map((f, idx) => (
                    <tr key={idx} className="hover:bg-amethyst-900/40">
                      <td className="p-3 font-semibold text-slate-100">{f.test_name}</td>
                      <td className={`p-3 font-bold ${f.is_abnormal ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {f.numeric_value}
                      </td>
                      <td className="p-3 text-slate-400">{f.unit || '-'}</td>
                      <td className="p-3 text-slate-400">{f.reference_range || '-'}</td>
                      <td className="p-3 font-bold text-rosegold-400">
                        {Math.round(f.confidence * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleConfirmVerification(selectedDoc.document_id || selectedDoc.id, 'REJECTED')}
                className="px-4 py-2 rounded-lg bg-amethyst-900 hover:bg-amethyst-800 text-rose-300 text-xs font-semibold"
              >
                Reject Extraction
              </button>
              <button
                onClick={() => handleConfirmVerification(selectedDoc.document_id || selectedDoc.id, 'VERIFIED')}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Save to BiomarkerLog</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Uploaded Documents Vault Table */}
      <div className="glass-card rounded-2xl p-6 border border-amethyst-700/60 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Vault Documents ({documents.length})
        </h2>

        {documents.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-amethyst-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-amethyst-900/90 text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Upload Date</th>
                  <th className="p-3.5">Confidence</th>
                  <th className="p-3.5">Verification Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amethyst-800/60 text-slate-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-amethyst-900/40">
                    <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rosegold-400" />
                      <span>{doc.filename}</span>
                    </td>
                    <td className="p-3.5 text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td className="p-3.5 font-bold text-amethyst-300">
                      {Math.round(doc.confidence_score * 100)}%
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        doc.verification_status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {doc.verification_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {doc.verification_status === 'UNVERIFIED' && (
                        <button
                          onClick={() => {
                            setSelectedDoc(doc)
                            setVerificationFields(doc.idp_extraction?.extracted_fields || [])
                          }}
                          className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold hover:bg-amber-500/30"
                        >
                          Verify Now
                        </button>
                      )}
                      <a
                        href={doc.presigned_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded bg-amethyst-800 hover:bg-amethyst-700 text-slate-200 inline-flex items-center gap-1 font-semibold"
                      >
                        <Download className="w-3 h-3" />
                        <span>Presigned URL</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <UploadCloud className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No Documents Uploaded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload laboratory PDF or image documents to extract tabular lab results with field confidence scoring.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
