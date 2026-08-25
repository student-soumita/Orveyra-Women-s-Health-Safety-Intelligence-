import React, { useState, useEffect, useRef } from 'react'
import {
  MapPin, Search, Navigation, Filter, Star, Phone, Globe, Clock,
  Calendar, ShieldCheck, Heart, Share2, Compass, AlertCircle, CheckCircle2,
  ExternalLink, ChevronRight, X, Sparkles, Building2, Stethoscope, Activity,
  SlidersHorizontal, RefreshCw, Trash2, Lock, Copy, Brain, Utensils, Baby, HeartPulse
} from 'lucide-react'

const SPECIALTY_OPTIONS = [
  { id: 'all', label: 'All Domains', icon: Compass },
  { id: 'Gynecologist', label: 'Gynecology & PCOS', icon: Stethoscope },
  { id: 'Endocrinologist', label: 'Endocrinology & Thyroid', icon: Activity },
  { id: 'Women\'s Health Clinic', label: 'Women\'s Clinics', icon: Building2 },
  { id: 'Diagnostic Laboratory', label: 'Diagnostic Labs', icon: Activity },
  { id: 'Mental Health & Therapy', label: 'Mental Health & Therapy', icon: Brain },
  { id: 'Nutritionist & Dietitian', label: 'Nutrition & Dietetics', icon: Utensils },
  { id: 'Fertility & IVF', label: 'Fertility & IVF', icon: Baby },
  { id: 'Hospital', label: 'Hospitals & Hubs', icon: Building2 },
  { id: 'General Physician', label: 'General Physician', icon: Stethoscope },
  { id: 'Pelvic Physical Therapy', label: 'Pelvic Rehabilitation', icon: HeartPulse }
]

const DISTANCE_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' }
]

export default function CareFinderView({ defaultSpecialty = 'all', onNavigateTab }) {
  // Location & Search State
  const [hasLocationPermission, setHasLocationPermission] = useState(null) // null: prompt, true: granted, false: manual
  const [userCoords, setUserCoords] = useState(null) // { lat, lon }
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState(defaultSpecialty)
  const [selectedRadius, setSelectedRadius] = useState(25)
  const [openNowOnly, setOpenNowOnly] = useState(false)
  const [consultationType, setConsultationType] = useState('all') // 'all', 'in-person', 'teleconsult'

  // View & Data State
  const [viewMode, setViewMode] = useState('map') // 'map', 'list', 'saved'
  const [providers, setProviders] = useState([])
  const [centerInfo, setCenterInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [savedProviders, setSavedProviders] = useState([])
  const [searchHistory, setSearchHistory] = useState([])

  // Sharing Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareStep, setShareStep] = useState(1) // 1: Select sections, 2: Confirm, 3: Generated Token
  const [shareSections, setShareSections] = useState({
    cycle: true,
    symptoms: true,
    biomarkers: true,
    doctor_mode: false,
    medications: true
  })
  const [createdShareToken, setCreatedShareToken] = useState(null)
  const [copiedShare, setCopiedShare] = useState(false)

  // Map reference
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // Initialize: Fetch saved providers, search history, and initial healthcare centers
  useEffect(() => {
    fetchSavedProviders()
    fetchSearchHistory()
    executeSearch()
  }, [])

  // When location or filters change, trigger search
  useEffect(() => {
    executeSearch()
  }, [userCoords, selectedSpecialty, selectedRadius, openNowOnly, consultationType])

  // Handle specialty override from props
  useEffect(() => {
    if (defaultSpecialty && defaultSpecialty !== 'all') {
      setSelectedSpecialty(defaultSpecialty)
    }
  }, [defaultSpecialty])

  // 1. Permission Request Handlers
  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      setHasLocationPermission(false)
      executeSearch({ query: 'Kolkata' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        }
        setUserCoords(coords)
        setHasLocationPermission(true)
      },
      (err) => {
        console.warn("Geolocation denied or unavailable:", err.message)
        setHasLocationPermission(false)
        executeSearch({ query: 'Kolkata' })
      },
      { timeout: 8000 }
    )
  }

  const handleManualLocation = (city = 'Kolkata') => {
    setHasLocationPermission(false)
    setSearchQuery(city)
    executeSearch({ query: city })
  }

  // 2. Search Execution
  const executeSearch = async (overrideParams = {}) => {
    setLoading(true)
    try {
      const q = overrideParams.query !== undefined ? overrideParams.query : searchQuery
      const spec = overrideParams.specialty || selectedSpecialty
      const rad = overrideParams.radius || selectedRadius

      const params = new URLSearchParams()
      if (q) params.append('query', q)
      if (userCoords?.lat && userCoords?.lon && !q) {
        params.append('lat', userCoords.lat)
        params.append('lon', userCoords.lon)
      }
      if (spec && spec !== 'all') params.append('specialty', spec)
      params.append('radius', rad)
      if (openNowOnly) params.append('open_now', 'true')
      if (consultationType !== 'all') params.append('consultation_type', consultationType)

      const res = await fetch(`/api/care-finder/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProviders(data.providers || [])
        setCenterInfo(data.center || null)
        updateMapMarkers(data.center, data.providers || [])
        fetchSearchHistory()
      }
    } catch (err) {
      console.error("Care finder search error:", err)
    } finally {
      setLoading(false)
    }
  }

  // 3. Leaflet Map Initialization & Updates
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Ensure Leaflet is loaded from window
    const L = window.L
    if (!L) return

    if (!mapInstanceRef.current) {
      const initialLat = userCoords?.lat || 22.5726
      const initialLon = userCoords?.lon || 88.3639

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 13,
        zoomControl: true
      })

      // Dark/Amethyst-friendly high contrast CartoDB Voyager tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map)

      mapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 150)
    } else {
      setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize() }, 100)
    }

    return () => {
      // Keep instance intact across minor state toggles
    }
  }, [hasLocationPermission])


  const updateMapMarkers = (center, providerList) => {
    const L = window.L
    if (!L || !mapInstanceRef.current) return

    const map = mapInstanceRef.current
    setTimeout(() => map.invalidateSize(), 100)

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    // Center map
    if (center?.latitude && center?.longitude) {
      map.setView([center.latitude, center.longitude], selectedRadius <= 5 ? 14 : selectedRadius <= 10 ? 13 : 12)

      // User location pulsing marker
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `<div style="background: #9333ea; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #c084fc; animation: pulse 2s infinite;"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      })
      const userMarker = L.marker([center.latitude, center.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>Your Location / Search Center</b><br/>${center.location_name || ''}`)
      markersRef.current.push(userMarker)
    }

    // Add provider markers
    providerList.forEach((prov) => {
      const isGyn = prov.specialty?.toLowerCase().includes('gynec') || prov.category?.toLowerCase().includes('gynec')
      const isEndo = prov.specialty?.toLowerCase().includes('endo')
      const isLab = prov.specialty?.toLowerCase().includes('lab')
      const pinColor = isGyn ? '#e0a96d' : isEndo ? '#38bdf8' : isLab ? '#34d399' : '#a855f7'

      const customIcon = L.divIcon({
        className: 'custom-provider-pin',
        html: `<div style="background: ${pinColor}; color: #0a0512; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); cursor: pointer;">🏥</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })

      const marker = L.marker([prov.latitude, prov.longitude], { icon: customIcon }).addTo(map)
      
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1e1b4b; line-height: 1.4;">
          <strong style="font-size: 13px; color: #4c1d95;">${prov.name}</strong><br/>
          <span style="color: #701a75; font-weight: bold;">${prov.specialty}</span><br/>
          <span>${prov.facility_name || ''}</span><br/>
          <span style="color: #64748b;">${prov.distance_km} km away</span>
        </div>
      `)

      marker.on('click', () => {
        setSelectedProvider(prov)
      })

      markersRef.current.push(marker)
    })
  }

  // 4. Saved Providers Actions
  const fetchSavedProviders = async () => {
    try {
      const res = await fetch('/api/care-finder/saved')
      if (res.ok) {
        setSavedProviders(await res.json())
      }
    } catch (e) {}
  }

  const isProviderSaved = (provId) => {
    return savedProviders.some(s => s.provider_id === provId)
  }

  const handleToggleSave = async (prov) => {
    const isSaved = isProviderSaved(prov.id)
    if (isSaved) {
      await fetch(`/api/care-finder/saved/${prov.id}`, { method: 'DELETE' })
      setSavedProviders(prev => prev.filter(p => p.provider_id !== prov.id))
    } else {
      const res = await fetch('/api/care-finder/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: prov.id,
          name: prov.name,
          specialty: prov.specialty,
          facility_name: prov.facility_name,
          address: prov.address,
          phone: prov.phone,
          rating: prov.rating,
          latitude: prov.latitude,
          longitude: prov.longitude
        })
      })
      if (res.ok) {
        fetchSavedProviders()
      }
    }
  }

  const fetchSearchHistory = async () => {
    try {
      const res = await fetch('/api/care-finder/history')
      if (res.ok) {
        setSearchHistory(await res.json())
      }
    } catch (e) {}
  }

  const handleClearHistory = async () => {
    await fetch('/api/care-finder/history', { method: 'DELETE' })
    setSearchHistory([])
  }

  // 5. Secure Share Link Generator
  const handleOpenShareModal = (prov) => {
    setSelectedProvider(prov)
    setIsShareModalOpen(true)
    setShareStep(1)
    setCreatedShareToken(null)
  }

  const handleCreateShareLink = async () => {
    if (!selectedProvider) return
    const activeSections = Object.entries(shareSections)
      .filter(([_, active]) => active)
      .map(([key]) => key)

    try {
      const res = await fetch('/api/care-finder/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: selectedProvider.id,
          provider_name: selectedProvider.name,
          shared_sections: activeSections,
          duration_hours: 48
        })
      })
      if (res.ok) {
        const data = await res.json()
        setCreatedShareToken(data)
        setShareStep(3)
      }
    } catch (err) {
      console.error("Care share error:", err)
    }
  }

  const handleCopyShareLink = () => {
    if (!createdShareToken) return
    const fullUrl = `${window.location.origin}${createdShareToken.share_url}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. HEADER & EMERGENCY NOTICE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Compass className="w-6 h-6 text-rosegold-400" />
              <span>Care Finder</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-amethyst-800 text-rosegold-300 border border-amethyst-700 font-bold">
              Healthcare Discovery
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Discover verified gynecologists, endocrinologists, women's health clinics, and diagnostic labs near you.
          </p>
        </div>

        {/* View Mode Toggle: Map vs List vs Saved */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'map'
                ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow-lg glow-purple'
                : 'bg-amethyst-900/80 hover:bg-amethyst-800 text-slate-300 border border-amethyst-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow-lg glow-purple'
                : 'bg-amethyst-900/80 hover:bg-amethyst-800 text-slate-300 border border-amethyst-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>List ({providers.length})</span>
          </button>

          <button
            onClick={() => setViewMode('saved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'saved'
                ? 'bg-gradient-to-r from-rosegold-500 to-amber-400 text-amethyst-950 shadow-lg glow-rose'
                : 'bg-amethyst-900/80 hover:bg-amethyst-800 text-slate-300 border border-amethyst-700'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rosegold-400 fill-current" />
            <span>Saved ({savedProviders.length})</span>
          </button>
        </div>
      </div>

      {/* Non-Emergency Advisory */}
      <div className="p-3 rounded-xl bg-amethyst-950/80 border border-amethyst-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rosegold-400 shrink-0" />
          <span>Care Finder is for non-urgent appointment discovery. For medical emergencies, please call local emergency services (112 / 108).</span>
        </span>
      </div>

      {/* 2. LOCATION PERMISSION GATE (IF NOT YET DECIDED) */}
      {hasLocationPermission === null && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rosegold-500/60 bg-gradient-to-r from-amethyst-950 via-amethyst-900 to-amethyst-950 shadow-2xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amethyst-500 to-rosegold-500 mx-auto flex items-center justify-center shadow-lg glow-purple">
            <Navigation className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-lg font-extrabold text-white">Find Healthcare Near You</h2>
            <p className="text-xs text-slate-300">
              Allow location access to discover healthcare providers, clinics, and diagnostic facilities closest to you.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleAllowLocation}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rosegold-500 to-amber-400 hover:from-rosegold-400 hover:to-amber-300 text-amethyst-950 text-xs font-black shadow-lg transition-all glow-rose cursor-pointer"
            >
              Allow Location Access
            </button>
            <button
              onClick={() => handleManualLocation('Kolkata')}
              className="px-5 py-2.5 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-slate-200 text-xs font-semibold border border-amethyst-600 transition-all cursor-pointer"
            >
              Enter Location Manually
            </button>
          </div>
        </div>
      )}

      {/* 3. SEARCH BAR & FILTERS */}
      <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 space-y-4">
        
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
              placeholder="What kind of care or location? (e.g. Gynecologist, Kolkata, Salt Lake, New Town)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-amethyst-950/90 border border-amethyst-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-400"
            />
          </div>

          <button
            onClick={() => executeSearch()}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold shadow-md transition-all glow-purple cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Search Care</span>
          </button>
        </div>

        {/* Specialty Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SPECIALTY_OPTIONS.map((spec) => {
            const Icon = spec.icon
            const isSelected = selectedSpecialty.toLowerCase() === spec.id.toLowerCase()
            return (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rosegold-500 text-amethyst-950 font-bold shadow-md glow-rose'
                    : 'bg-amethyst-900/60 hover:bg-amethyst-800 text-slate-300 border border-amethyst-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{spec.label}</span>
              </button>
            )
          })}
        </div>

        {/* Availability Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1 border-t border-amethyst-800/60 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={openNowOnly}
                onChange={(e) => setOpenNowOnly(e.target.checked)}
                className="rounded accent-rosegold-400"
              />
              <span>Open Now</span>
            </label>

            <select
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value)}
              className="bg-amethyst-950/80 border border-amethyst-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Consult Types</option>
              <option value="in-person">In-Person</option>
              <option value="teleconsult">Teleconsult</option>
            </select>
          </div>
        </div>

        {/* Search History Chips */}
        {searchHistory.length > 0 && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-amethyst-800/60 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin py-0.5 max-w-full">
              <span className="text-[11px] text-slate-400 font-mono shrink-0">Recent:</span>
              {searchHistory.map((h) => {
                const label = [h.specialty, h.location_name || h.query].filter(Boolean).join(' — ') || h.query || 'Nearby Care'
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      if (h.query) setSearchQuery(h.query)
                      if (h.specialty) setSelectedSpecialty(h.specialty)
                      executeSearch({ query: h.query, specialty: h.specialty })
                    }}
                    className="px-2.5 py-0.5 rounded-lg bg-amethyst-900/60 hover:bg-amethyst-800 text-slate-300 hover:text-rosegold-300 text-[11px] border border-amethyst-700/50 shrink-0 transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-slate-400 hover:text-rose-400 shrink-0 cursor-pointer font-mono whitespace-nowrap pl-2"
              title="Clear search history"
            >
              [ Clear History ]
            </button>
          </div>
        )}

      </div>

      {/* 4. MAIN STAGE: MAP VIEW OR LIST VIEW OR SAVED */}
      {viewMode === 'saved' ? (
        /* SAVED PROVIDERS VIEW */
        <div className="glass-card rounded-2xl p-6 border border-amethyst-700/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amethyst-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-rosegold-400 fill-current" />
              <span>Saved Healthcare Providers ({savedProviders.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Personal Care Bookmark</span>
          </div>

          {savedProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProviders.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-amethyst-950/80 border border-amethyst-800 space-y-3 relative group shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{p.name}</h3>
                      <span className="text-xs font-semibold text-rosegold-300">{p.specialty}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.facility_name}</p>
                    </div>
                    <button
                      onClick={() => handleToggleSave({ id: p.provider_id })}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                      title="Remove from saved"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{p.address}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-amethyst-900">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-rosegold-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </a>

                    <button
                      onClick={() => handleOpenShareModal({ id: p.provider_id, name: p.name })}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Share Summary</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Heart className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold">No saved healthcare providers yet.</p>
              <p className="text-xs text-slate-500">Tap the heart icon on any doctor or clinic card to save them for quick access.</p>
            </div>
          )}
        </div>
      ) : (
        /* MAP + LIST SPLIT STAGE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* MAP CONTAINER (Visible in Map Mode, or on lg screens) */}
          <div className={`${viewMode === 'map' ? 'lg:col-span-7' : 'hidden lg:block lg:col-span-5'} space-y-3`}>
            <div className="relative rounded-3xl overflow-hidden border border-amethyst-700/60 shadow-2xl h-[480px] bg-amethyst-950">
              <div ref={mapContainerRef} className="w-full h-full z-10" />

              {/* Map Floating Location Pill */}
              {centerInfo && (
                <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-amethyst-950/90 border border-amethyst-700 text-xs text-slate-200 shadow-lg backdrop-blur-md flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rosegold-400" />
                  <span className="font-semibold truncate max-w-[200px]">{centerInfo.location_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* PROVIDERS LIST CONTAINER */}
          <div className={`${viewMode === 'map' ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin`}>
            <div className="flex items-center justify-between pb-2 border-b border-amethyst-800/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Nearby Healthcare ({providers.length})
              </span>
              <span className="text-[11px] text-slate-400">Sorted by Distance</span>
            </div>

            {providers.length > 0 ? (
              <div className="space-y-3">
                {providers.map((p) => {
                  const isSaved = isProviderSaved(p.id)
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 shadow-md ${
                        selectedProvider?.id === p.id
                          ? 'bg-amethyst-900/90 border-rosegold-500/70 glow-purple'
                          : 'bg-amethyst-950/80 hover:bg-amethyst-900/60 border-amethyst-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-100">{p.name}</h3>
                            {p.domain && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amethyst-800/80 text-rosegold-300 border border-amethyst-700/80">
                                {p.domain}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-rosegold-400">{p.specialty}</span>
                          {p.facility_name && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{p.facility_name}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleSave(p); }}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isSaved
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                : 'bg-amethyst-900/60 text-slate-400 border-amethyst-700 hover:text-white'
                            }`}
                            title={isSaved ? "Saved" : "Save Provider"}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>

                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amethyst-800/80 text-cyan-300 border border-amethyst-700">
                            {p.distance_km} km
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-1">{p.address}</p>

                      {/* Info Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400">
                        {p.rating && (
                          <span className="flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{p.rating} ({p.rating_count || 0})</span>
                          </span>
                        )}
                        <span className="bg-amethyst-900/60 px-2 py-0.5 rounded text-slate-300">
                          {p.consultation_type}
                        </span>
                        {p.open_now && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                            Open Now
                          </span>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center justify-between pt-2 border-t border-amethyst-900/80 text-xs">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedProvider(p); }}
                          className="text-rosegold-400 hover:text-rosegold-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-3">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Directions</span>
                          </a>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenShareModal(p); }}
                            className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Share Summary</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            ) : (
              /* PREMIUM EMPTY STATE */
              <div className="glass-card rounded-2xl p-8 border border-amethyst-800 text-center space-y-4">
                <Compass className="w-8 h-8 text-slate-500 mx-auto animate-spin-slow" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-200">No Providers Found in this Radius</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    We couldn't find matching verified healthcare providers within {selectedRadius} km. Try expanding your search radius.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setSelectedRadius(25)}
                    className="px-4 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-white text-xs font-bold"
                  >
                    Expand to 25 km
                  </button>
                  <button
                    onClick={() => handleManualLocation('Kolkata')}
                    className="px-4 py-2 rounded-xl bg-rosegold-500/20 text-rosegold-300 border border-rosegold-500/40 text-xs font-bold"
                  >
                    Search Kolkata Hub
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 5. PROVIDER DETAIL MODAL */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amethyst-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl p-6 sm:p-8 border border-amethyst-700 shadow-2xl space-y-6 bg-amethyst-950">
            
            <button
              onClick={() => setSelectedProvider(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-amethyst-900/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amethyst-800 text-rosegold-300 border border-amethyst-700 font-bold">
                  {selectedProvider.category || selectedProvider.specialty}
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedProvider.name}</h2>
                <p className="text-xs text-rosegold-400 font-semibold">{selectedProvider.facility_name}</p>
              </div>

              <button
                onClick={() => handleToggleSave(selectedProvider)}
                className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                  isProviderSaved(selectedProvider.id)
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-amethyst-900 text-slate-400 border-amethyst-700 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isProviderSaved(selectedProvider.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Provider Information Sections */}
            <div className="space-y-4 text-xs">
              
              {/* About */}
              <div className="p-4 rounded-2xl bg-amethyst-900/40 border border-amethyst-800 space-y-1.5">
                <h3 className="font-bold text-slate-200">About Provider</h3>
                <p className="text-slate-300 leading-relaxed">
                  {selectedProvider.about || "Information unavailable."}
                </p>
              </div>

              {/* Location & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-amethyst-900/40 border border-amethyst-800 space-y-1">
                  <span className="text-slate-400 flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>Address & Distance</span>
                  </span>
                  <p className="text-slate-200 font-medium">{selectedProvider.address}</p>
                  <span className="text-[11px] text-cyan-400 font-mono block pt-1">
                    {selectedProvider.distance_km} km from current search point
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amethyst-900/40 border border-amethyst-800 space-y-1">
                  <span className="text-slate-400 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-rosegold-400" />
                    <span>Hours & Availability</span>
                  </span>
                  <p className="text-slate-200 font-medium">{selectedProvider.opening_hours || "Information unavailable."}</p>
                  <p className="text-slate-400 text-[11px] pt-1">
                    Phone: {selectedProvider.phone || "Information unavailable."}
                  </p>
                </div>
              </div>

              {/* Services List */}
              {selectedProvider.services && selectedProvider.services.length > 0 && (
                <div className="p-4 rounded-2xl bg-amethyst-900/40 border border-amethyst-800 space-y-2">
                  <h3 className="font-bold text-slate-200">Available Specialized Services</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProvider.services.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-amethyst-950 border border-amethyst-700 text-rosegold-300 font-mono text-[11px]">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amethyst-800">
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedProvider.latitude},${selectedProvider.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>

                {selectedProvider.website && (
                  <a
                    href={selectedProvider.website}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-slate-200 font-semibold flex items-center gap-1.5 border border-amethyst-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Website / Booking</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => handleOpenShareModal(selectedProvider)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold flex items-center gap-1.5 shadow-lg cursor-pointer glow-purple"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Health Summary</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. OPTIONAL TEMPORARY HEALTH SUMMARY SHARING MODAL */}
      {isShareModalOpen && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amethyst-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/60 shadow-2xl space-y-6 bg-amethyst-950">
            
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-amethyst-900/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: SELECT WHAT TO SHARE */}
            {shareStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">What would you like to share?</h3>
                    <p className="text-xs text-slate-400">Sharing with: <strong className="text-rosegold-300">{selectedProvider.name}</strong></p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-amethyst-900/50 border border-amethyst-800 cursor-pointer text-xs">
                    <span className="font-semibold text-slate-200">Cycle Summary (Last 6 Months)</span>
                    <input
                      type="checkbox"
                      checked={shareSections.cycle}
                      onChange={(e) => setShareSections({ ...shareSections, cycle: e.target.checked })}
                      className="rounded accent-emerald-400 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-amethyst-900/50 border border-amethyst-800 cursor-pointer text-xs">
                    <span className="font-semibold text-slate-200">Symptom Summary (Pelvic, Mood, Energy)</span>
                    <input
                      type="checkbox"
                      checked={shareSections.symptoms}
                      onChange={(e) => setShareSections({ ...shareSections, symptoms: e.target.checked })}
                      className="rounded accent-emerald-400 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-amethyst-900/50 border border-amethyst-800 cursor-pointer text-xs">
                    <span className="font-semibold text-slate-200">Selected Lab Results (Biomarkers)</span>
                    <input
                      type="checkbox"
                      checked={shareSections.biomarkers}
                      onChange={(e) => setShareSections({ ...shareSections, biomarkers: e.target.checked })}
                      className="rounded accent-emerald-400 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-amethyst-900/50 border border-amethyst-800 cursor-pointer text-xs">
                    <span className="font-semibold text-slate-200">Current Medications & Supplements</span>
                    <input
                      type="checkbox"
                      checked={shareSections.medications}
                      onChange={(e) => setShareSections({ ...shareSections, medications: e.target.checked })}
                      className="rounded accent-emerald-400 w-4 h-4"
                    />
                  </label>
                </div>

                <div className="pt-3 border-t border-amethyst-800 flex justify-end gap-2">
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-amethyst-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShareStep(2)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONFIRMATION PROMPT */}
            {shareStep === 2 && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">Confirm Health Summary Share</h3>
                  <blockquote className="p-3.5 rounded-2xl bg-amethyst-900/80 border border-amethyst-700 text-xs text-slate-300 leading-relaxed italic">
                    “You are about to share selected health information with this provider. This action is optional.”
                  </blockquote>
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => setShareStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-amethyst-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateShareLink}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                  >
                    Confirm Share (48-Hour Secure Token)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: GENERATED TEMPORARY REVOCABLE TOKEN */}
            {shareStep === 3 && createdShareToken && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="text-base font-bold">Temporary Share Link Generated</h3>
                </div>

                <p className="text-xs text-slate-300">
                  This secure link allows <strong>{createdShareToken.provider_name}</strong> to view only your selected summary. It automatically expires in 48 hours and can be revoked anytime.
                </p>

                <div className="p-3 rounded-xl bg-amethyst-900/90 border border-amethyst-700 flex items-center justify-between gap-2 font-mono text-xs text-rosegold-300">
                  <span className="truncate">{window.location.origin}{createdShareToken.share_url}</span>
                  <button
                    onClick={handleCopyShareLink}
                    className="p-1.5 rounded-lg bg-rosegold-500 text-amethyst-950 font-bold hover:bg-rosegold-400 cursor-pointer shrink-0"
                    title="Copy Link"
                  >
                    {copiedShare ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 text-white text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
