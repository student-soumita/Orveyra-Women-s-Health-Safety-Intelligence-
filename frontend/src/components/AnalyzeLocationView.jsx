import React, { useState, useEffect, useRef } from 'react'
import {
  Shield, Search, MapPin, Calendar, Clock, User, Car, Briefcase,
  Sliders, ArrowRight, AlertTriangle, CheckCircle2, AlertCircle, Info,
  Sparkles, Layers, Compass, Building2, PhoneCall, ChevronRight, Eye, Navigation,
  Sun, Moon, Users, HelpCircle
} from 'lucide-react'

const TRAVEL_COMPANIONS = [
  { id: 'alone', label: 'Alone (Solo)', icon: User },
  { id: 'friends', label: 'With Friends', icon: Users },
  { id: 'family', label: 'With Family', icon: Users },
  { id: 'group', label: 'In a Group', icon: Users }
]

const TRAVEL_MODES = [
  { id: 'walking', label: 'Walking (Pedestrian)', icon: User },
  { id: 'public_transport', label: 'Public Transit', icon: Navigation },
  { id: 'cab', label: 'Cab / Ride-Hailing', icon: Car },
  { id: 'car', label: 'Private Vehicle / Car', icon: Car },
  { id: 'bicycle', label: 'Bicycle / Two-Wheeler', icon: Navigation }
]

const TRAVEL_PURPOSES = [
  { id: 'work', label: 'Work / Office' },
  { id: 'college', label: 'College / Education' },
  { id: 'shopping', label: 'Shopping / Errands' },
  { id: 'entertainment', label: 'Nightlife / Dining' },
  { id: 'travel', label: 'Transit / Commute' },
  { id: 'other', label: 'General Visit' }
]

const PRESET_PLACES = [
  { name: 'Sector V Tech Corridor, Salt Lake', lat: 22.5726, lon: 88.4331 },
  { name: 'Isolated Industrial Belt East', lat: 22.5820, lon: 88.4210 },
  { name: 'Dimly Lit Canal Overpass', lat: 22.5650, lon: 88.3920 },
  { name: 'Salt Lake Stadium Hub', lat: 22.5695, lon: 88.4022 },
  { name: 'Park Street Commercial District', lat: 22.5530, lon: 88.3520 },
  { name: 'Sealdah Station Hub', lat: 22.5670, lon: 88.3710 }
]

export default function AnalyzeLocationView({ onNavigateTab }) {
  // Search & Manual Input State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCoords, setSelectedCoords] = useState({ lat: 22.5726, lon: 88.4331 })
  const [selectedPlaceName, setSelectedPlaceName] = useState('Sector V Tech Corridor, Salt Lake')
  const [isPinDropMode, setIsPinDropMode] = useState(false)

  // GPS opt-in state
  const [gpsActive, setGpsActive] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(null)

  // Context Form State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState('22:30') // Default late night test
  const [selectedCompanion, setSelectedCompanion] = useState('alone')
  const [selectedMode, setSelectedMode] = useState('walking')
  const [selectedPurpose, setSelectedPurpose] = useState('travel')
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Results State
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [routeComparison, setRouteComparison] = useState(null)
  const [activeRouteId, setActiveRouteId] = useState('safer')

  // Map Ref
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerGroupRef = useRef(null)
  const draggableMarkerRef = useRef(null)

  // Run initial analysis on mount
  useEffect(() => {
    executeAnalysis()
  }, [])

  // Map updates when result or pin mode changes
  useEffect(() => {
    initOrUpdateMap()
  }, [analysisResult, isPinDropMode, routeComparison, activeRouteId])

  // 1. Execute Geocoding Search
  const handleSearchGeocode = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return
    try {
      const res = await fetch(`/api/safety-risk/geocode?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const geo = await res.json()
        setSelectedCoords({ lat: geo.latitude, lon: geo.longitude })
        setSelectedPlaceName(geo.name)
        setGpsActive(false)
        setGpsError(null)
        executeAnalysis({ lat: geo.latitude, lon: geo.longitude, name: geo.name })
      }
    } catch (err) {
      console.error("Geocoding error:", err)
    }
  }

  // 1b. Optional GPS — one-time opt-in location fetch
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const name = `My Current Location (${round4(lat)}, ${round4(lon)})`
        setSelectedCoords({ lat, lon })
        setSelectedPlaceName(name)
        setGpsActive(true)
        setGpsLoading(false)
        executeAnalysis({ lat, lon, name })
      },
      (err) => {
        setGpsLoading(false)
        setGpsActive(false)
        if (err.code === 1) {
          setGpsError('Location access was denied. Please allow it in your browser settings, or use manual search above.')
        } else {
          setGpsError('Could not detect your location. Please search manually.')
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }

  // 2. Execute Manual Location Analysis
  const executeAnalysis = async (coordsOverride = null) => {
    setLoading(true)
    const lat = coordsOverride?.lat ?? selectedCoords.lat
    const lon = coordsOverride?.lon ?? selectedCoords.lon
    const name = coordsOverride?.name ?? selectedPlaceName

    try {
      const res = await fetch('/api/safety-risk/manual-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          location_name: name,
          date_str: selectedDate,
          time_str: selectedTime,
          travel_companion: selectedCompanion,
          travel_mode: selectedMode,
          travel_purpose: selectedPurpose,
          is_demo_mode: isDemoMode
        })
      })

      if (res.ok) {
        const data = await res.json()
        setAnalysisResult(data)
      }

      // Also trigger route comparison for this location against Salt Lake Hub
      fetchRouteComparison(
        { lat: lat, lon: lon, name: name },
        { lat: 22.5695, lon: 88.4022, name: 'Salt Lake Central Hub' }
      )
    } catch (err) {
      console.error("Analysis error:", err)
    } finally {
      setLoading(false)
    }
  }

  // 3. Fetch Triple Route Comparison
  const fetchRouteComparison = async (origin, dest) => {
    try {
      const res = await fetch('/api/safety-risk/route-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination: dest })
      })
      if (res.ok) {
        setRouteComparison(await res.json())
      }
    } catch (e) {}
  }

  // 4. Initialize / Render Leaflet Map with Pin Drop Support
  const initOrUpdateMap = () => {
    if (!mapContainerRef.current || typeof window === 'undefined' || !window.L) return

    const L = window.L

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedCoords.lat, selectedCoords.lon],
        zoom: 14,
        zoomControl: true
      })

      // Dark Matter Map Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }).addTo(map)

      // Map click handler for Pin Drop Mode
      map.on('click', (e) => {
        const newLat = e.latlng.lat
        const newLon = e.latlng.lng
        setSelectedCoords({ lat: newLat, lon: newLon })
        setSelectedPlaceName(`Custom Dropped Pin (${round4(newLat)}, ${round4(newLon)})`)
        executeAnalysis({ lat: newLat, lon: newLon, name: `Custom Pin (${round4(newLat)}, ${round4(newLon)})` })
      })

      mapInstanceRef.current = map
      layerGroupRef.current = L.layerGroup().addTo(map)
    }

    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    layerGroup.clearLayers()

    const currentLat = selectedCoords.lat
    const currentLon = selectedCoords.lon

    // 1. Draw Pin Drop / Selected Location Marker
    const pinColor = analysisResult?.risk?.color === 'rose' ? '#f43f5e' : analysisResult?.risk?.color === 'amber' ? '#f59e0b' : '#10b981'

    const pinIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `<div style="background: ${pinColor}; color: white; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 0 20px ${pinColor}; animation: pulse 2s infinite; cursor: grab;">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })

    const marker = L.marker([currentLat, currentLon], { icon: pinIcon, draggable: true }).addTo(layerGroup)
    marker.bindPopup(`<b>${selectedPlaceName}</b><br/>Click anywhere on map to move pin.`).openPopup()

    marker.on('dragend', (e) => {
      const pos = marker.getLatLng()
      setSelectedCoords({ lat: pos.lat, lon: pos.lng })
      setSelectedPlaceName(`Dropped Pin (${round4(pos.lat)}, ${round4(pos.lng)})`)
      executeAnalysis({ lat: pos.lat, lon: pos.lng, name: `Dropped Pin (${round4(pos.lat)}, ${round4(pos.lng)})` })
    })

    // 2. Draw Spatial Radii Circles (100m, 500m, 1km, 3km)
    const radii = [
      { r: 100, color: '#38bdf8', opacity: 0.1, label: '100m Immediate' },
      { r: 500, color: '#a855f7', opacity: 0.08, label: '500m Nearby' },
      { r: 1000, color: '#f59e0b', opacity: 0.05, label: '1km Local' },
      { r: 3000, color: '#64748b', opacity: 0.03, label: '3km Broader' }
    ]

    radii.forEach((item) => {
      L.circle([currentLat, currentLon], {
        color: item.color,
        fillColor: item.color,
        fillOpacity: item.opacity,
        radius: item.r,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(layerGroup)
    })

    // 3. Draw Safe Havens
    if (analysisResult?.nearby_safe_havens) {
      analysisResult.nearby_safe_havens.forEach((sh) => {
        const shIcon = L.divIcon({
          className: 'custom-sh-pin',
          html: `<div style="background: #059669; color: white; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px;">🏥</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
        L.marker([sh.latitude || (currentLat + 0.003), sh.longitude || (currentLon + 0.003)], { icon: shIcon })
          .addTo(layerGroup)
          .bindPopup(`<b>${sh.name}</b><br/>${sh.type} (${sh.distance_km} km)`)
      })
    }

    map.setView([currentLat, currentLon], 14)
  }

  const round4 = (num) => Math.round(num * 10000) / 10000

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amethyst-500 via-amethyst-700 to-rosegold-500 flex items-center justify-center text-white shadow-lg glow-purple">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                Analyze a Location
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Dynamic Manual Contextual Intelligence • Zero GPS tracking required
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Data Mode Switcher */}
          <button
            onClick={() => {
              setIsDemoMode(!isDemoMode)
              executeAnalysis()
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isDemoMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            }`}
          >
            {isDemoMode ? '● Demo Dataset Mode' : '● Live Sourced Data Mode'}
          </button>
        </div>
      </div>

      {/* 2. MANUAL LOCATION INPUT & CONTEXTUAL FORM */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-amethyst-700/60 bg-amethyst-950/85 space-y-6">
        
        {/* Search Bar + Geocode */}
        <form onSubmit={handleSearchGeocode} className="space-y-2">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
            1. Select or Search Location (Place, Address, Landmark, PIN, or Coordinates):
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Sector V, Park Street, Canal Overpass, 22.5726, 88.4331..."
                className="w-full bg-amethyst-950 border border-amethyst-700/80 rounded-xl text-xs sm:text-sm text-slate-100 pl-10 pr-4 py-2.5 focus:outline-none focus:border-rosegold-400 transition-all placeholder:text-slate-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600/70 text-slate-100 text-xs font-bold transition-all cursor-pointer shadow"
              >
                Search Geocode
              </button>

              <button
                type="button"
                onClick={() => setIsPinDropMode(!isPinDropMode)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isPinDropMode
                    ? 'bg-rosegold-500/20 border-rosegold-400 text-rosegold-300 glow-rose'
                    : 'bg-amethyst-900 border-amethyst-700 text-slate-300 hover:text-white'
                }`}
              >
                📍 {isPinDropMode ? 'Pin Drop Active' : 'Drop a Pin'}
              </button>

              {/* Optional GPS — Opt-In Only */}
              <button
                type="button"
                onClick={useMyLocation}
                disabled={gpsLoading}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  gpsActive
                    ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300'
                    : 'bg-sky-500/10 border-sky-500/50 text-sky-300 hover:bg-sky-500/20'
                }`}
              >
                {gpsLoading ? '⏳ Locating...' : gpsActive ? '📡 GPS Active' : '📡 Use My Location'}
              </button>
            </div>
          </div>

          {/* Quick Landmark Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-semibold">Popular Presets:</span>
            {PRESET_PLACES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedCoords({ lat: p.lat, lon: p.lon })
                  setSelectedPlaceName(p.name)
                  executeAnalysis({ lat: p.lat, lon: p.lon, name: p.name })
                }}
                className="px-2.5 py-1 rounded-lg bg-amethyst-900/80 hover:bg-amethyst-800 border border-amethyst-700/60 text-[11px] text-slate-300 font-medium cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>
        </form>

        {/* Selected Coordinates Display Banner */}
        <div className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 flex items-center justify-between text-xs gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${gpsActive ? 'text-emerald-400' : 'text-rosegold-400'}`} />
            <span className="font-bold text-slate-100">{selectedPlaceName}</span>
            <span className="text-slate-400 font-mono">({round4(selectedCoords.lat)}, {round4(selectedCoords.lon)})</span>
          </div>
          {gpsActive ? (
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              GPS Active • Live Coordinates
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-semibold">Manual Input</span>
          )}
        </div>

        {/* GPS Error Banner */}
        {gpsError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Contextual Intelligence Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* Date & Time Picker */}
          <div className="space-y-3 p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/50">
            <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rosegold-400" />
              Date & Time Context:
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-amethyst-950 border border-amethyst-700 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Time:</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-amethyst-950 border border-amethyst-700 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Travel Companion */}
          <div className="space-y-2 p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/50">
            <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
              <Users className="w-4 h-4 text-rosegold-400" />
              Who are you travelling with?
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {TRAVEL_COMPANIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompanion(c.id)}
                  className={`p-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                    selectedCompanion === c.id
                      ? 'bg-rosegold-500/20 border border-rosegold-400 text-rosegold-300'
                      : 'bg-amethyst-950/70 border border-amethyst-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Mode */}
          <div className="space-y-2 p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/50">
            <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
              <Car className="w-4 h-4 text-rosegold-400" />
              Travel Mode:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {TRAVEL_MODES.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMode(m.id)}
                  className={`p-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                    selectedMode === m.id
                      ? 'bg-rosegold-500/20 border border-rosegold-400 text-rosegold-300'
                      : 'bg-amethyst-950/70 border border-amethyst-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Analyze Safety Submit Button */}
        <button
          onClick={() => executeAnalysis()}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-extrabold text-sm shadow-xl transition-all glow-purple flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <Shield className="w-5 h-5 text-white" />
          <span>{loading ? 'Evaluating Contextual Safety Intelligence...' : 'ANALYZE SAFETY'}</span>
        </button>

      </div>

      {/* 3. SAFETY BREAKDOWN DASHBOARD RESULTS */}
      {analysisResult && (
        <div className="space-y-6">
          
          {/* Main Contextual Score Banner */}
          <div className="glass-card rounded-2xl p-6 border border-amethyst-700/80 bg-amethyst-950/90 shadow-2xl relative overflow-hidden space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amethyst-800/60">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">
                  ORVEYRA SAFETY INTELLIGENCE REPORT
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-1">
                  {analysisResult.location.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluated for {analysisResult.timestamp} • Mode: {selectedMode} • Travel: {selectedCompanion}
                </p>
              </div>

              {/* Risk Level Badge */}
              <div className={`px-4 py-2 rounded-2xl border text-sm sm:text-base font-extrabold flex items-center gap-2 ${
                analysisResult.risk.level === 'LOW' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
                analysisResult.risk.level === 'MODERATE' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                analysisResult.risk.level === 'HIGH' ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' :
                'bg-rose-500/20 border-rose-500/50 text-rose-300'
              }`}>
                <span>
                  {analysisResult.risk.level === 'LOW' ? '🟢 LOW CONTEXTUAL RISK' :
                   analysisResult.risk.level === 'MODERATE' ? '🟡 MODERATE CONTEXTUAL RISK' :
                   analysisResult.risk.level === 'HIGH' ? '🟠 HIGH CONTEXTUAL RISK' :
                   '🔴 ELEVATED CONTEXTUAL RISK'}
                </span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
                <span className="text-[11px] text-slate-400 font-semibold block">Risk Score</span>
                <div className="text-3xl font-extrabold text-slate-100 mt-1">
                  {analysisResult.risk.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
                <span className="text-[11px] text-slate-400 font-semibold block">Confidence Score</span>
                <div className="text-3xl font-extrabold text-slate-100 mt-1">
                  {analysisResult.risk.confidence}%
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
                <span className="text-[11px] text-slate-400 font-semibold block">Data Audit Mode</span>
                <div className="text-sm font-bold text-rosegold-300 mt-2">
                  {analysisResult.data_quality.mode}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 flex flex-col justify-center">
                <span className="text-[11px] text-slate-400 font-semibold block">Safe Havens Nearby</span>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {analysisResult.nearby_safe_havens.length} Facilities Verified
                </div>
              </div>
            </div>

          </div>

          {/* 7-DIMENSION BREAKDOWN & EXPLAINABILITY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 7-Dimension Score Bars */}
            <div className="lg:col-span-6 glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rosegold-400" />
                7-Dimension Multi-Contextual Breakdown:
              </h3>

              <div className="space-y-3">
                {Object.entries(analysisResult.dimensions).map(([key, scoreVal]) => {
                  const label = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  const pct = scoreVal
                  const barColor = pct < 30 ? 'bg-emerald-500' : pct < 60 ? 'bg-amber-500' : 'bg-rose-500'

                  return (
                    <div key={key} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-300">{label}</span>
                        <span className="text-slate-100">{scoreVal} / 100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-amethyst-950 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* "WHY THIS SCORE?" DYNAMIC EXPLAINABILITY ENGINE */}
            <div className="lg:col-span-6 glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-rosegold-400" />
                "Why This Score?" Explainability Engine:
              </h3>

              {/* What Raises Risk */}
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  What elevates contextual risk:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analysisResult.risk_factors.map((rf, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{rf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What Lowers Risk */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  What lowers contextual risk:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analysisResult.protective_factors.map((pf, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{pf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* 24-HOUR HOURLY RISK TREND TIMELINE */}
          <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-rosegold-400" />
                24-Hour Risk Curve (How Safety Shifts Across the Day):
              </h3>
              <span className="text-[11px] text-slate-400">Hover/click hour bars to inspect</span>
            </div>

            <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 pt-2 items-end h-28 border-b border-amethyst-800/50 pb-2">
              {analysisResult.hourly_risk_trend.map((item) => {
                const heightPct = item.risk_score
                const isSelectedHour = parseInt(selectedTime.split(':')[0]) === item.hour
                const barColor = item.risk_score < 30 ? 'bg-emerald-500' : item.risk_score < 60 ? 'bg-amber-500' : item.risk_score < 80 ? 'bg-orange-500' : 'bg-rose-500'

                return (
                  <div
                    key={item.hour}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                    title={`${item.formatted_time}: Risk Score ${item.risk_score} (${item.risk_level})`}
                  >
                    <div
                      className={`w-full rounded-t transition-all ${barColor} ${isSelectedHour ? 'ring-2 ring-white opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                      style={{ height: `${Math.max(12, heightPct * 0.9)}px` }}
                    />
                    <span className={`text-[9px] ${isSelectedHour ? 'font-bold text-white' : 'text-slate-400'}`}>
                      {item.hour % 4 === 0 ? `${item.hour}h` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SPATIAL RADIUS ANALYSIS & MAP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Spatial Radius Cards */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-rosegold-400" />
                Spatial Radius Context:
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {analysisResult.spatial_radius_analysis.map((zone, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{zone.radius} • {zone.label}</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-extrabold ${zone.risk_score < 30 ? 'text-emerald-400' : zone.risk_score < 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {zone.risk_score}
                      </span>
                      <span className="text-[10px] text-slate-400">/ 100</span>
                    </div>
                    <span className="text-[10px] text-slate-300 block">{zone.safe_havens_count} Safe Havens</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Canvas */}
            <div className="lg:col-span-7 glass-card rounded-2xl p-4 border border-amethyst-700/60 bg-amethyst-950/80 flex flex-col h-[320px]">
              <div className="flex items-center justify-between pb-2 border-b border-amethyst-800/60">
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Interactive Spatial Map Overlay
                </span>
                <span className="text-[10px] text-slate-400">Click or drag pin anywhere</span>
              </div>
              <div className="flex-1 w-full rounded-xl overflow-hidden mt-2 border border-amethyst-800/60">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
            </div>

          </div>

          {/* TRIPLE ROUTE COMPARISON CARDS */}
          {routeComparison && (
            <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-rosegold-400" />
                Triple Route Comparison (Fastest vs Safer vs Balanced):
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {routeComparison.routes.map((r) => (
                  <div
                    key={r.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      activeRouteId === r.id
                        ? 'bg-amethyst-900/90 border-rosegold-400/80 shadow-lg glow-purple'
                        : 'bg-amethyst-900/40 border-amethyst-800/50 hover:bg-amethyst-900/60'
                    }`}
                    onClick={() => setActiveRouteId(r.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{r.name}</span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        r.risk_score < 30 ? 'bg-emerald-500/20 text-emerald-300' :
                        r.risk_score < 60 ? 'bg-amber-500/20 text-amber-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {r.risk_score}/100 Risk
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-300">
                      <div>Distance: <b>{r.distance_km} km</b> (~{r.estimated_duration_mins} min)</div>
                    </div>

                    <div className="mt-3 space-y-1 text-[11px] text-slate-300">
                      <span className="text-emerald-400 font-bold block">Key Advantages:</span>
                      {r.key_advantages.map((adv, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          <span>{adv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
