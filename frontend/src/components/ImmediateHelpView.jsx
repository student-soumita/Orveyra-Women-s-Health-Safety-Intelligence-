import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShieldAlert, Phone, MapPin, FileText, Feather, ArrowLeft, Plus, X, Trash2,
  Upload, Download, Clock, AlertTriangle, Copy, Check, ChevronRight, Users,
  Camera, Mic, File, Image, Video, Search, Home, Stethoscope, Compass,
  Shield, Zap, Edit3, Save, Eye, Lock
} from 'lucide-react'

// ─── Configurable emergency numbers by country ───
const EMERGENCY_NUMBERS = {
  IN: { number: '112', label: 'Emergency Services (India)' },
  US: { number: '911', label: 'Emergency Services (US)' },
  GB: { number: '999', label: 'Emergency Services (UK)' },
  AU: { number: '000', label: 'Emergency Services (Australia)' },
  EU: { number: '112', label: 'Emergency Services (EU)' },
  default: { number: '112', label: 'Emergency Services' }
}

const INCIDENT_CATEGORIES = [
  'Harassment', 'Threat', 'Stalking', 'Unsafe interaction', 'Medical concern', 'Other'
]

const RELATIONSHIP_LABELS = ['Mom', 'Dad', 'Friend', 'Sibling', 'Partner', 'Guardian', 'Other']

export default function ImmediateHelpView({ onNavigateTab }) {
  // ─── View state machine ───
  const [view, setView] = useState('home') // home | emergency | share | record | contacts | panic-timeline | evidence-vault | post-incident | quick-capture
  const [previousView, setPreviousView] = useState('home')

  // ─── Data ───
  const [incidents, setIncidents] = useState([])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [trustedContacts, setTrustedContacts] = useState([])
  const [panicTimeline, setPanicTimeline] = useState([])
  const [evidenceList, setEvidenceList] = useState([])

  // ─── Emergency ───
  const [emergencyRegion, setEmergencyRegion] = useState('IN')
  const [showCallConfirm, setShowCallConfirm] = useState(false)
  const [copied, setCopied] = useState(false)

  // ─── Share My Situation ───
  const [shareLocationEnabled, setShareLocationEnabled] = useState(false)
  const [shareMessage, setShareMessage] = useState('I may need help. Please check on me.')
  const [selectedContactIds, setSelectedContactIds] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [shareStatus, setShareStatus] = useState('')

  // ─── Record Incident ───
  const [incidentDescription, setIncidentDescription] = useState('')
  const [incidentCategory, setIncidentCategory] = useState('')
  const [incidentLocation, setIncidentLocation] = useState('')
  const [incidentLat, setIncidentLat] = useState(null)
  const [incidentLng, setIncidentLng] = useState(null)
  const [incidentTime, setIncidentTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')

  // ─── Trusted Contact Form ───
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactRelationship, setContactRelationship] = useState('')
  const [contactCustomLabel, setContactCustomLabel] = useState('')

  // ─── Evidence upload ───
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // ─── Error ───
  const [error, setError] = useState('')

  // ─── Fetch data ───
  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/immediate-help/incidents')
      if (res.ok) setIncidents(await res.json())
    } catch { /* fail silently on network error */ }
  }, [])

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/immediate-help/trusted-contacts')
      if (res.ok) setTrustedContacts(await res.json())
    } catch { /* */ }
  }, [])

  const fetchPanicTimeline = useCallback(async (incidentId) => {
    try {
      const res = await fetch(`/api/immediate-help/incidents/${incidentId}/timeline`)
      if (res.ok) {
        const data = await res.json()
        setPanicTimeline(data.events || [])
      }
    } catch { /* */ }
  }, [])

  const fetchIncidentDetail = useCallback(async (incidentId) => {
    try {
      const res = await fetch(`/api/immediate-help/incidents/${incidentId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedIncident(data)
        setEvidenceList(data.evidence || [])
        setPanicTimeline(data.events || [])
      }
    } catch { /* */ }
  }, [])

  useEffect(() => {
    fetchIncidents()
    fetchContacts()
  }, [fetchIncidents, fetchContacts])

  // ─── Navigation helpers ───
  const navigateTo = (v) => {
    setPreviousView(view)
    setView(v)
    setError('')
    setSaveSuccess('')
  }

  const goBack = () => {
    setView(previousView === view ? 'home' : previousView)
    setError('')
    setSaveSuccess('')
  }

  // ─── Discreet Exit ───
  const discreetExit = () => {
    if (onNavigateTab) onNavigateTab('dashboard')
  }

  // ─── Location handling ───
  const requestLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIncidentLat(pos.coords.latitude)
        setIncidentLng(pos.coords.longitude)
      },
      () => {
        setLocationError('Location permission denied. You can still proceed without location.')
        setShareLocationEnabled(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    if (shareLocationEnabled) requestLocation()
  }, [shareLocationEnabled])

  // ─── Emergency Call ───
  const emergencyInfo = EMERGENCY_NUMBERS[emergencyRegion] || EMERGENCY_NUMBERS.default

  const handleEmergencyCall = async () => {
    try {
      await fetch('/api/immediate-help/emergency-call-log', { method: 'POST' })
    } catch { /* best effort */ }
    // Use tel: protocol for actual call
    window.location.href = `tel:${emergencyInfo.number}`
  }

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(emergencyInfo.number).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ─── Share My Situation ───
  const handleShare = async () => {
    setShareStatus('')
    try {
      const res = await fetch('/api/immediate-help/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: selectedContactIds,
          message: shareMessage,
          include_location: shareLocationEnabled,
          latitude: userLocation?.lat || null,
          longitude: userLocation?.lng || null
        })
      })
      if (res.ok) {
        const data = await res.json()
        // Try Web Share API on mobile
        if (navigator.share) {
          try {
            await navigator.share({ title: 'ORVEYRA — Need Help', text: data.share_text })
            setShareStatus('Shared successfully via your device.')
          } catch {
            setShareStatus('Share cancelled. Your message and contacts are still available.')
          }
        } else {
          setShareStatus(`Share text ready. ${data.contacts.length ? `Contacts: ${data.contacts.map(c => c.name + (c.phone ? ` (${c.phone})` : '')).join(', ')}` : 'No contacts selected.'}\n\nMessage: ${data.share_text}`)
        }
      }
    } catch {
      setError('Could not prepare share. Please check your connection.')
    }
  }

  // ─── Create Incident ───
  const handleCreateIncident = async (isQuick = false) => {
    setSaving(true)
    setError('')
    try {
      const body = {
        description: incidentDescription || (isQuick ? 'Quick capture' : null),
        category: incidentCategory || null,
        location_text: incidentLocation || null,
        latitude: incidentLat,
        longitude: incidentLng,
        incident_at: incidentTime || null
      }
      const res = await fetch('/api/immediate-help/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        const data = await res.json()
        setSaveSuccess('Incident saved.')
        setSelectedIncident(data)
        // Reset form
        setIncidentDescription('')
        setIncidentCategory('')
        setIncidentLocation('')
        setIncidentLat(null)
        setIncidentLng(null)
        setIncidentTime('')
        fetchIncidents()
        // Go to post-incident screen
        setTimeout(() => navigateTo('post-incident'), 800)
      } else {
        const errData = await res.json()
        setError(errData.detail || 'Could not save incident.')
      }
    } catch {
      setError('Network error. Your incident was not saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete Incident ───
  const handleDeleteIncident = async (id) => {
    if (!window.confirm('Permanently delete this incident and all evidence?')) return
    try {
      await fetch(`/api/immediate-help/incidents/${id}`, { method: 'DELETE' })
      fetchIncidents()
      if (selectedIncident?.id === id) setSelectedIncident(null)
    } catch {
      setError('Could not delete incident.')
    }
  }

  // ─── Trusted Contacts ───
  const handleSaveContact = async () => {
    setError('')
    if (!contactName.trim()) { setError('Name is required.'); return }
    try {
      const body = {
        name: contactName.trim(),
        phone: contactPhone.trim() || null,
        relationship_label: contactRelationship || null,
        custom_label: contactCustomLabel.trim() || null
      }
      const method = editingContact ? 'PATCH' : 'POST'
      const url = editingContact
        ? `/api/immediate-help/trusted-contacts/${editingContact.id}`
        : '/api/immediate-help/trusted-contacts'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        fetchContacts()
        resetContactForm()
      } else {
        const errData = await res.json()
        setError(errData.detail || 'Could not save contact.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
  }

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Remove this trusted contact?')) return
    try {
      await fetch(`/api/immediate-help/trusted-contacts/${id}`, { method: 'DELETE' })
      fetchContacts()
    } catch {
      setError('Could not remove contact.')
    }
  }

  const startEditContact = (c) => {
    setEditingContact(c)
    setContactName(c.name)
    setContactPhone(c.phone || '')
    setContactRelationship(c.relationship_label || '')
    setContactCustomLabel(c.custom_label || '')
    setShowContactForm(true)
  }

  const resetContactForm = () => {
    setShowContactForm(false)
    setEditingContact(null)
    setContactName('')
    setContactPhone('')
    setContactRelationship('')
    setContactCustomLabel('')
  }

  // ─── Evidence Upload ───
  const handleEvidenceUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedIncident?.id) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('incident_id', selectedIncident.id)
      formData.append('file', file)
      const res = await fetch('/api/immediate-help/evidence', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        fetchIncidentDetail(selectedIncident.id)
        setSaveSuccess('Evidence uploaded. Integrity metadata recorded.')
      } else {
        const errData = await res.json()
        setError(errData.detail || 'Evidence upload failed.')
      }
    } catch {
      setError('Upload failed. Please check your connection and try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteEvidence = async (evidenceId) => {
    if (!window.confirm('Permanently delete this evidence file?')) return
    try {
      await fetch(`/api/immediate-help/evidence/${evidenceId}`, { method: 'DELETE' })
      if (selectedIncident?.id) fetchIncidentDetail(selectedIncident.id)
    } catch {
      setError('Could not delete evidence.')
    }
  }

  const handleDownloadEvidence = (evidenceId) => {
    window.open(`/api/immediate-help/evidence/${evidenceId}/download`, '_blank')
  }

  // ─── Toggle contact selection for share ───
  const toggleContactSelection = (id) => {
    setSelectedContactIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // ─── Format timestamp ───
  const fmtTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const fmtDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const fmtDateTime = (iso) => {
    if (!iso) return ''
    return `${fmtDate(iso)} ${fmtTime(iso)}`
  }

  // ─── Shared UI pieces ───
  const HeaderBar = ({ title, subtitle, showDiscreetExit = true }) => (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-xl bg-amethyst-900/60 hover:bg-amethyst-800 border border-amethyst-700/50 text-slate-300 hover:text-white transition-all"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold gradient-text">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {showDiscreetExit && (
        <button
          onClick={discreetExit}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amethyst-900/50 hover:bg-amethyst-800 border border-amethyst-700/40 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
          title="Discreet Exit — closes this screen without deleting your records"
          aria-label="Discreet Exit"
        >
          <Feather className="w-4 h-4" />
          <span className="hidden sm:inline">Discreet Exit</span>
        </button>
      )}
    </div>
  )

  const ErrorBanner = () => error ? (
    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{error}</span>
      <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-300"><X className="w-4 h-4" /></button>
    </div>
  ) : null

  const SuccessBanner = () => saveSuccess ? (
    <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
      <Check className="w-4 h-4" />
      <span>{saveSuccess}</span>
    </div>
  ) : null

  // ════════════════════════════════════════════
  //  HOME VIEW — 4 action cards
  // ════════════════════════════════════════════
  if (view === 'home') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-rosegold-400" />
              <span>Immediate Help</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Choose the help you need.</p>
          </div>
          <button
            onClick={discreetExit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amethyst-900/50 hover:bg-amethyst-800 border border-amethyst-700/40 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
            title="Discreet Exit — closes this screen without deleting your records"
            aria-label="Discreet Exit"
          >
            <Feather className="w-4 h-4" />
            <span className="hidden sm:inline">Discreet Exit</span>
          </button>
        </div>

        {/* 4 action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Emergency Call */}
          <button
            onClick={() => navigateTo('emergency')}
            className="group glass-card glass-card-hover rounded-2xl p-6 sm:p-8 border border-rose-500/20 hover:border-rose-400/50 text-left cursor-pointer transition-all"
            aria-label="Emergency Call"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center group-hover:bg-rose-500/25 transition-colors">
                <Phone className="w-6 h-6 text-rose-400" />
              </div>
              <span className="text-2xl">🚨</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">Emergency Call</h3>
            <p className="text-xs text-slate-400">Call emergency services in your region.</p>
          </button>

          {/* Share My Situation */}
          <button
            onClick={() => navigateTo('share')}
            className="group glass-card glass-card-hover rounded-2xl p-6 sm:p-8 border border-amethyst-600/30 hover:border-amethyst-500/50 text-left cursor-pointer transition-all"
            aria-label="Share My Situation"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-amethyst-500/15 flex items-center justify-center group-hover:bg-amethyst-500/25 transition-colors">
                <MapPin className="w-6 h-6 text-amethyst-400" />
              </div>
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">Share My Situation</h3>
            <p className="text-xs text-slate-400">Contact trusted people with your location.</p>
          </button>

          {/* Record Incident */}
          <button
            onClick={() => navigateTo('record')}
            className="group glass-card glass-card-hover rounded-2xl p-6 sm:p-8 border border-rosegold-500/20 hover:border-rosegold-400/50 text-left cursor-pointer transition-all"
            aria-label="Record Incident"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-rosegold-500/15 flex items-center justify-center group-hover:bg-rosegold-500/25 transition-colors">
                <FileText className="w-6 h-6 text-rosegold-400" />
              </div>
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">Record Incident</h3>
            <p className="text-xs text-slate-400">Document what happened quickly and safely.</p>
          </button>

          {/* Discreet Exit */}
          <button
            onClick={discreetExit}
            className="group glass-card glass-card-hover rounded-2xl p-6 sm:p-8 border border-slate-600/30 hover:border-slate-500/50 text-left cursor-pointer transition-all"
            aria-label="Discreet Exit"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-slate-500/15 flex items-center justify-center group-hover:bg-slate-500/25 transition-colors">
                <Feather className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-2xl">🕊️</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">Discreet Exit</h3>
            <p className="text-xs text-slate-400">Leave this screen without deleting records.</p>
          </button>
        </div>

        {/* Quick access: Recent Incidents + Trusted Contacts + Panic Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigateTo('contacts')}
            className="glass-card rounded-xl p-4 border border-amethyst-700/50 hover:border-amethyst-600/60 text-left transition-all flex items-center gap-3"
          >
            <Users className="w-5 h-5 text-amethyst-400" />
            <div>
              <span className="text-sm font-semibold text-slate-200">Trusted Contacts</span>
              <span className="text-[10px] text-slate-500 block">{trustedContacts.length} saved</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
          </button>

          {incidents.length > 0 && (
            <button
              onClick={() => {
                const latest = incidents[0]
                setSelectedIncident(latest)
                fetchIncidentDetail(latest.id)
                navigateTo('panic-timeline')
              }}
              className="glass-card rounded-xl p-4 border border-amethyst-700/50 hover:border-amethyst-600/60 text-left transition-all flex items-center gap-3"
            >
              <Clock className="w-5 h-5 text-rosegold-400" />
              <div>
                <span className="text-sm font-semibold text-slate-200">Panic Timeline</span>
                <span className="text-[10px] text-slate-500 block">{incidents.length} incident(s)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
            </button>
          )}

          {incidents.length > 0 && (
            <button
              onClick={() => {
                const latest = incidents[0]
                setSelectedIncident(latest)
                fetchIncidentDetail(latest.id)
                navigateTo('evidence-vault')
              }}
              className="glass-card rounded-xl p-4 border border-amethyst-700/50 hover:border-amethyst-600/60 text-left transition-all flex items-center gap-3"
            >
              <Lock className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-sm font-semibold text-slate-200">Evidence Vault</span>
                <span className="text-[10px] text-slate-500 block">Secure storage</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════
  //  EMERGENCY CALL VIEW
  // ════════════════════════════════════════════
  if (view === 'emergency') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-lg mx-auto">
        <HeaderBar title="Emergency Call" subtitle="Call emergency services in your region" />
        <ErrorBanner />

        {/* Region selector */}
        <div className="glass-card rounded-xl p-4 border border-amethyst-700/50">
          <label className="text-xs text-slate-400 font-medium block mb-2">Select your region</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EMERGENCY_NUMBERS).filter(([k]) => k !== 'default').map(([code, info]) => (
              <button
                key={code}
                onClick={() => setEmergencyRegion(code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  emergencyRegion === code
                    ? 'bg-amethyst-700 border-amethyst-500 text-white'
                    : 'bg-amethyst-950/60 border-amethyst-800/60 text-slate-400 hover:text-white'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency number display */}
        <div className="glass-card rounded-2xl p-8 border border-rose-500/20 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 flex items-center justify-center">
            <Phone className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">{emergencyInfo.label}</h3>
          <div className="text-4xl font-extrabold text-rose-400 tracking-wider">{emergencyInfo.number}</div>

          {/* Your Current Information */}
          <div className="text-left glass-card rounded-xl p-4 border border-amethyst-700/40 space-y-2 mt-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Your Current Information</h4>
            {userLocation ? (
              <p className="text-xs text-slate-400">📍 Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
            ) : (
              <button onClick={requestLocation} className="text-xs text-amethyst-400 hover:text-amethyst-300 underline">Load current location</button>
            )}
            {trustedContacts.length > 0 && (
              <p className="text-xs text-slate-400">👤 Primary contact: {trustedContacts[0].name}{trustedContacts[0].phone ? ` (${trustedContacts[0].phone})` : ''}</p>
            )}
            <p className="text-xs text-slate-400">🕐 Current time: {new Date().toLocaleTimeString()}</p>
          </div>

          {!showCallConfirm ? (
            <button
              onClick={() => setShowCallConfirm(true)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-lg font-bold shadow-lg transition-all cursor-pointer"
              style={{ minHeight: '56px' }}
            >
              Call Emergency Services
            </button>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <p className="text-sm text-rose-300 font-medium">You are about to call emergency services.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleEmergencyCall}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all"
                  style={{ minHeight: '48px' }}
                >
                  Call
                </button>
                <button
                  onClick={() => setShowCallConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-slate-200 font-bold text-sm border border-amethyst-600/50 transition-all"
                  style={{ minHeight: '48px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Desktop: copy number */}
          <button
            onClick={handleCopyNumber}
            className="flex items-center justify-center gap-2 mx-auto text-xs text-slate-400 hover:text-slate-200 transition-colors mt-2"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy number to clipboard'}</span>
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════
  //  SHARE MY SITUATION VIEW
  // ════════════════════════════════════════════
  if (view === 'share') {
    return (
      <div className="space-y-5 animate-in fade-in duration-300 max-w-lg mx-auto">
        <HeaderBar title="Share My Situation" subtitle="Contact trusted people" />
        <ErrorBanner />

        {/* Location toggle */}
        <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-200 font-medium">Current location</label>
            <button
              onClick={() => setShareLocationEnabled(!shareLocationEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${shareLocationEnabled ? 'bg-emerald-500' : 'bg-amethyst-800'}`}
              role="switch"
              aria-checked={shareLocationEnabled}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${shareLocationEnabled ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
          {shareLocationEnabled && userLocation && (
            <p className="text-xs text-emerald-400">📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
          )}
          {locationError && <p className="text-xs text-amber-400">{locationError}</p>}
          <p className="text-[11px] text-slate-500">Your location will only be shared if you confirm.</p>
        </div>

        {/* Trusted contacts selection */}
        <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-200 font-medium">Trusted contacts</label>
            <button
              onClick={() => navigateTo('contacts')}
              className="text-xs text-amethyst-400 hover:text-amethyst-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Manage
            </button>
          </div>
          {trustedContacts.length === 0 ? (
            <p className="text-xs text-slate-500">No trusted contacts added yet.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {trustedContacts.map(c => (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                    selectedContactIds.includes(c.id)
                      ? 'bg-amethyst-800/60 border-amethyst-600/50'
                      : 'bg-amethyst-950/40 border-amethyst-800/30 hover:border-amethyst-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedContactIds.includes(c.id)}
                    onChange={() => toggleContactSelection(c.id)}
                    className="w-4 h-4 rounded accent-amethyst-500"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-200">{c.name}</span>
                    {c.relationship_label && <span className="text-[10px] text-slate-500 ml-2">{c.relationship_label}</span>}
                    {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Message */}
        <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-2">
          <label className="text-sm text-slate-200 font-medium">Message</label>
          <textarea
            value={shareMessage}
            onChange={e => setShareMessage(e.target.value)}
            rows={3}
            className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500 resize-none"
          />
        </div>

        {shareStatus && (
          <div className="p-3 rounded-xl bg-amethyst-800/50 border border-amethyst-700/40 text-xs text-slate-300 whitespace-pre-wrap">
            {shareStatus}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-bold text-sm shadow-md transition-all"
            style={{ minHeight: '48px' }}
          >
            Share
          </button>
          <button
            onClick={goBack}
            className="flex-1 py-3 rounded-xl bg-amethyst-900/70 hover:bg-amethyst-800 border border-amethyst-700/50 text-slate-200 font-bold text-sm transition-all"
            style={{ minHeight: '48px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════
  //  RECORD INCIDENT (Full + Quick Capture toggle)
  // ════════════════════════════════════════════
  if (view === 'record' || view === 'quick-capture') {
    const isQuick = view === 'quick-capture'

    return (
      <div className="space-y-5 animate-in fade-in duration-300 max-w-lg mx-auto">
        <HeaderBar
          title={isQuick ? 'Quick Capture' : 'Record Incident'}
          subtitle={isQuick ? 'Minimal incident record in seconds' : 'Document what happened'}
        />
        <ErrorBanner />
        <SuccessBanner />

        {/* Toggle between full and quick */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('record')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
              !isQuick ? 'bg-amethyst-700 border-amethyst-500 text-white' : 'bg-amethyst-950/60 border-amethyst-800/60 text-slate-400'
            }`}
          >
            Full Record
          </button>
          <button
            onClick={() => setView('quick-capture')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
              isQuick ? 'bg-amethyst-700 border-amethyst-500 text-white' : 'bg-amethyst-950/60 border-amethyst-800/60 text-slate-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5 inline mr-1" />Quick Capture
          </button>
        </div>

        {/* Category */}
        <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-2">
          <label className="text-sm text-slate-200 font-medium">Category</label>
          <div className="flex flex-wrap gap-2">
            {INCIDENT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setIncidentCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  incidentCategory === cat
                    ? 'bg-amethyst-700 border-amethyst-500 text-white'
                    : 'bg-amethyst-950/60 border-amethyst-800/60 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* What happened */}
        <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-2">
          <label className="text-sm text-slate-200 font-medium">What happened?</label>
          <textarea
            value={incidentDescription}
            onChange={e => setIncidentDescription(e.target.value)}
            rows={isQuick ? 2 : 4}
            placeholder={isQuick ? 'Short note...' : 'Describe the incident...'}
            className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500 resize-none"
          />
        </div>

        {/* Full mode: When + Where + Evidence */}
        {!isQuick && (
          <>
            <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-2">
              <label className="text-sm text-slate-200 font-medium">When?</label>
              <input
                type="datetime-local"
                value={incidentTime}
                onChange={e => setIncidentTime(e.target.value)}
                className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
              />
              <p className="text-[11px] text-slate-500">Leave blank to use current date/time.</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-2">
              <label className="text-sm text-slate-200 font-medium">Where? (optional)</label>
              <input
                type="text"
                value={incidentLocation}
                onChange={e => setIncidentLocation(e.target.value)}
                placeholder="Location description..."
                className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500"
              />
              <button
                onClick={requestLocation}
                className="text-xs text-amethyst-400 hover:text-amethyst-300 flex items-center gap-1 mt-1"
              >
                <MapPin className="w-3.5 h-3.5" /> Use current location
              </button>
              {incidentLat && incidentLng && (
                <p className="text-xs text-emerald-400">📍 {incidentLat.toFixed(4)}, {incidentLng.toFixed(4)}</p>
              )}
            </div>
          </>
        )}

        {/* Save */}
        <button
          onClick={() => handleCreateIncident(isQuick)}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
          style={{ minHeight: '48px' }}
        >
          {saving ? 'Saving...' : 'Save Incident'}
        </button>

        {/* Previous incidents list */}
        {incidents.length > 0 && (
          <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Previous Incidents</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {incidents.map(inc => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-amethyst-950/50 border border-amethyst-800/40 group"
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setSelectedIncident(inc); fetchIncidentDetail(inc.id); navigateTo('panic-timeline') }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/40">
                        {inc.category || 'INCIDENT'}
                      </span>
                      <span className="text-xs text-slate-500">{fmtDateTime(inc.incident_at)}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 truncate">{inc.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteIncident(inc.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-amethyst-900/50 opacity-0 group-hover:opacity-100 transition-all ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════
  //  TRUSTED CONTACTS VIEW
  // ════════════════════════════════════════════
  if (view === 'contacts') {
    return (
      <div className="space-y-5 animate-in fade-in duration-300 max-w-lg mx-auto">
        <HeaderBar title="Trusted Contacts" subtitle="Private contacts for Immediate Help only" />
        <ErrorBanner />

        {/* Add Contact button */}
        {!showContactForm && (
          <button
            onClick={() => { resetContactForm(); setShowContactForm(true) }}
            className="w-full py-3 rounded-xl bg-amethyst-900/60 hover:bg-amethyst-800 border border-amethyst-700/50 border-dashed text-sm text-slate-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-all"
            style={{ minHeight: '48px' }}
          >
            <Plus className="w-4 h-4" /> Add Trusted Contact
          </button>
        )}

        {/* Contact form */}
        {showContactForm && (
          <div className="glass-card rounded-xl p-4 border border-amethyst-600/50 space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">{editingContact ? 'Edit Contact' : 'New Contact'}</h4>
            <input
              type="text"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Name"
              className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500"
            />
            <input
              type="tel"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="Phone number (optional)"
              className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500"
            />
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Relationship</label>
              <div className="flex flex-wrap gap-1.5">
                {RELATIONSHIP_LABELS.map(r => (
                  <button
                    key={r}
                    onClick={() => setContactRelationship(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      contactRelationship === r
                        ? 'bg-amethyst-700 border-amethyst-500 text-white'
                        : 'bg-amethyst-950/60 border-amethyst-800/60 text-slate-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={contactCustomLabel}
              onChange={e => setContactCustomLabel(e.target.value)}
              placeholder="Custom label (optional)"
              className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveContact}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-semibold text-sm transition-all"
              >
                {editingContact ? 'Update' : 'Save'}
              </button>
              <button
                onClick={resetContactForm}
                className="py-2.5 px-4 rounded-xl bg-amethyst-900/70 hover:bg-amethyst-800 border border-amethyst-700/50 text-slate-300 text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Contacts list */}
        {trustedContacts.length === 0 && !showContactForm ? (
          <div className="py-10 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-400">No trusted contacts yet.</p>
            <p className="text-xs text-slate-500">You don't need to add contacts to use Immediate Help.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trustedContacts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl glass-card border border-amethyst-700/40 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{c.name}</span>
                    {c.relationship_label && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amethyst-800/60 text-amethyst-300 border border-amethyst-700/50">{c.relationship_label}</span>
                    )}
                  </div>
                  {c.phone && <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>}
                  {c.custom_label && <p className="text-[10px] text-slate-500">{c.custom_label}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditContact(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-amethyst-300 hover:bg-amethyst-900/50">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteContact(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-amethyst-900/50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-500 text-center">Trusted contacts are private and never shown on your public profile.</p>
      </div>
    )
  }

  // ════════════════════════════════════════════
  //  PANIC TIMELINE VIEW
  // ════════════════════════════════════════════
  if (view === 'panic-timeline') {
    return (
      <div className="space-y-5 animate-in fade-in duration-300 max-w-lg mx-auto">
        <HeaderBar title="Panic Timeline" subtitle={selectedIncident ? `Incident #${selectedIncident.id}` : 'Chronological event log'} />
        <ErrorBanner />

        {/* Incident selector */}
        {incidents.length > 1 && (
          <div className="glass-card rounded-xl p-3 border border-amethyst-700/50">
            <label className="text-xs text-slate-400 block mb-2">Select incident</label>
            <select
              value={selectedIncident?.id || ''}
              onChange={e => {
                const id = parseInt(e.target.value)
                const inc = incidents.find(i => i.id === id)
                if (inc) {
                  setSelectedIncident(inc)
                  fetchIncidentDetail(id)
                }
              }}
              className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
            >
              {incidents.map(i => (
                <option key={i.id} value={i.id}>
                  #{i.id} — {i.category || 'Incident'} — {fmtDateTime(i.incident_at)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Timeline events */}
        <div className="glass-card rounded-2xl p-5 border border-amethyst-700/50">
          {panicTimeline.length > 0 ? (
            <div className="relative border-l-2 border-rosegold-500/30 ml-3 space-y-4">
              {panicTimeline.map((evt, idx) => (
                <div key={evt.id || idx} className="relative pl-6">
                  <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-rosegold-500/80 border-2 border-amethyst-950" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-rosegold-400">{fmtTime(evt.event_at)}</span>
                    <span className="text-[10px] text-slate-500">{fmtDate(evt.event_at)}</span>
                  </div>
                  <p className="text-sm text-slate-200 mt-0.5">{evt.label}</p>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{evt.event_type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">No timeline events yet.</p>
            </div>
          )}
        </div>

        {/* Link to evidence vault */}
        {selectedIncident && (
          <button
            onClick={() => navigateTo('evidence-vault')}
            className="w-full glass-card rounded-xl p-4 border border-amethyst-700/50 hover:border-amethyst-600/50 flex items-center gap-3 transition-all"
          >
            <Lock className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-slate-200">View Evidence Vault</span>
            <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
          </button>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════
  //  EVIDENCE VAULT VIEW
  // ════════════════════════════════════════════
  if (view === 'evidence-vault') {
    return (
      <div className="space-y-5 animate-in fade-in duration-300 max-w-lg mx-auto">
        <HeaderBar title="Evidence Vault" subtitle="Secure evidence storage" />
        <ErrorBanner />
        <SuccessBanner />

        {/* Incident selector */}
        {incidents.length > 0 && (
          <div className="glass-card rounded-xl p-3 border border-amethyst-700/50">
            <label className="text-xs text-slate-400 block mb-2">Select incident</label>
            <select
              value={selectedIncident?.id || ''}
              onChange={e => {
                const id = parseInt(e.target.value)
                const inc = incidents.find(i => i.id === id)
                if (inc) {
                  setSelectedIncident(inc)
                  fetchIncidentDetail(id)
                }
              }}
              className="w-full bg-amethyst-950/80 border border-amethyst-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rosegold-500"
            >
              {incidents.map(i => (
                <option key={i.id} value={i.id}>
                  #{i.id} — {i.category || 'Incident'} — {fmtDateTime(i.incident_at)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload button */}
        {selectedIncident && (
          <div className="glass-card rounded-xl p-4 border border-amethyst-700/50 space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Attach Evidence</h4>
            <p className="text-[11px] text-slate-500">Image, video, audio, screenshot, or document.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleEvidenceUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-amethyst-900/60 hover:bg-amethyst-800 border border-amethyst-700/50 border-dashed text-sm text-slate-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ minHeight: '48px' }}
            >
              {uploading ? (
                <span className="animate-pulse">Uploading...</span>
              ) : (
                <><Upload className="w-4 h-4" /> Upload Evidence</>
              )}
            </button>
          </div>
        )}

        {/* Evidence list */}
        <div className="glass-card rounded-2xl p-5 border border-amethyst-700/50 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Stored Evidence
          </h4>
          {evidenceList.length > 0 ? (
            <div className="space-y-2">
              {evidenceList.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-amethyst-950/50 border border-amethyst-800/40 group">
                  <div className="w-8 h-8 rounded-lg bg-amethyst-800/50 flex items-center justify-center shrink-0">
                    {ev.mime_type?.startsWith('image') ? <Image className="w-4 h-4 text-amethyst-400" /> :
                     ev.mime_type?.startsWith('video') ? <Video className="w-4 h-4 text-amethyst-400" /> :
                     ev.mime_type?.startsWith('audio') ? <Mic className="w-4 h-4 text-amethyst-400" /> :
                     <File className="w-4 h-4 text-amethyst-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{ev.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{ev.file_size_bytes ? `${(ev.file_size_bytes / 1024).toFixed(1)} KB` : ''}</span>
                      <span className="text-[10px] text-slate-500">{fmtDateTime(ev.uploaded_at)}</span>
                    </div>
                    {ev.sha256_hash && (
                      <p className="text-[9px] text-slate-600 mt-0.5 font-mono truncate" title={ev.sha256_hash}>
                        SHA-256: {ev.sha256_hash.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownloadEvidence(ev.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amethyst-300 hover:bg-amethyst-900/50 transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvidence(ev.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-amethyst-900/50 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <Lock className="w-7 h-7 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No evidence uploaded for this incident.</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Evidence is stored securely. Integrity metadata is recorded but does not constitute legal certification.
        </p>
      </div>
    )
  }

  // ════════════════════════════════════════════
  //  POST-INCIDENT VIEW
  // ════════════════════════════════════════════
  if (view === 'post-incident') {
    return (
      <div className="space-y-5 animate-in fade-in duration-300 max-w-lg mx-auto">
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold gradient-text">What would you like to do now?</h2>
          <p className="text-xs text-slate-400 mt-2">Your incident has been saved. Choose what to do next.</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              if (selectedIncident?.id) fetchIncidentDetail(selectedIncident.id)
              navigateTo('evidence-vault')
            }}
            className="w-full glass-card glass-card-hover rounded-xl p-4 border border-amethyst-700/50 flex items-center gap-3 text-left transition-all"
            style={{ minHeight: '56px' }}
          >
            <Upload className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-sm font-semibold text-slate-200">Save Evidence</span>
              <p className="text-[10px] text-slate-500">Upload photos, audio, or documents</p>
            </div>
          </button>

          <button
            onClick={() => {
              if (selectedIncident?.id) fetchIncidentDetail(selectedIncident.id)
              navigateTo('panic-timeline')
            }}
            className="w-full glass-card glass-card-hover rounded-xl p-4 border border-amethyst-700/50 flex items-center gap-3 text-left transition-all"
            style={{ minHeight: '56px' }}
          >
            <Clock className="w-5 h-5 text-rosegold-400" />
            <div>
              <span className="text-sm font-semibold text-slate-200">View Panic Timeline</span>
              <p className="text-[10px] text-slate-500">Review the chronological event log</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('care-finder')}
            className="w-full glass-card glass-card-hover rounded-xl p-4 border border-amethyst-700/50 flex items-center gap-3 text-left transition-all"
            style={{ minHeight: '56px' }}
          >
            <Compass className="w-5 h-5 text-amethyst-400" />
            <div>
              <span className="text-sm font-semibold text-slate-200">Find Care</span>
              <p className="text-[10px] text-slate-500">Open Care Finder</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('doctor-mode')}
            className="w-full glass-card glass-card-hover rounded-xl p-4 border border-amethyst-700/50 flex items-center gap-3 text-left transition-all"
            style={{ minHeight: '56px' }}
          >
            <Stethoscope className="w-5 h-5 text-amethyst-400" />
            <div>
              <span className="text-sm font-semibold text-slate-200">Open Doctor Mode</span>
              <p className="text-[10px] text-slate-500">Prepare a visit summary</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('dashboard')}
            className="w-full glass-card glass-card-hover rounded-xl p-4 border border-amethyst-700/50 flex items-center gap-3 text-left transition-all"
            style={{ minHeight: '56px' }}
          >
            <Home className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-sm font-semibold text-slate-200">Return Home</span>
              <p className="text-[10px] text-slate-500">Go back to dashboard</p>
            </div>
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          Discreet Exit closes this screen without deleting your records.
        </p>
      </div>
    )
  }

  // Fallback
  return null
}
