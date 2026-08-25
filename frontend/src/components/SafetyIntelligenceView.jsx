import React, { useState, useEffect, useRef } from 'react'
import {
  Shield, ShieldCheck, Search, MapPin, Navigation, Clock, Calendar,
  Users, Car, Sliders, AlertTriangle, CheckCircle2, Info, Compass,
  HelpCircle, Layers, Sun, Moon, RefreshCw, PhoneCall, Building2,
  ChevronRight, ArrowRight, Eye, Sparkles
} from 'lucide-react'
import DynamicSafetyRiskCard from './DynamicSafetyRiskCard'
import RiskDetailsModal from './RiskDetailsModal'

// ─── CONSTANTS ───────────────────────────────────────────────
const TRAVEL_COMPANIONS = [
  { id: 'alone', label: 'Alone' },
  { id: 'friends', label: 'With Friends' },
  { id: 'family', label: 'With Family' },
  { id: 'group', label: 'In a Group' }
]

const TRAVEL_MODES = [
  { id: 'walking', label: 'Walking' },
  { id: 'public_transport', label: 'Public Transit' },
  { id: 'cab', label: 'Cab / Rideshare' },
  { id: 'car', label: 'Private Car' },
  { id: 'bicycle', label: 'Bicycle' }
]

const PRESET_PLACES = [
  { name: 'Sector V Tech Corridor, Salt Lake', lat: 22.5726, lon: 88.4331 },
  { name: 'Isolated Industrial Belt East', lat: 22.5820, lon: 88.4210 },
  { name: 'Dimly Lit Canal Overpass', lat: 22.5650, lon: 88.3920 },
  { name: 'Salt Lake Stadium Hub', lat: 22.5695, lon: 88.4022 },
  { name: 'Park Street Commercial District', lat: 22.5530, lon: 88.3520 },
  { name: 'Sealdah Station Hub', lat: 22.5670, lon: 88.3710 }
]

const PRESET_ROUTES = [
  {
    id: 'route-1',
    name: 'Sector V to Salt Lake Stadium',
    origin: { name: 'Sector V Tech Corridor', lat: 22.5726, lon: 88.4331 },
    destination: { name: 'Salt Lake Stadium Metro', lat: 22.5695, lon: 88.4022 }
  },
  {
    id: 'route-2',
    name: 'Industrial Belt East to Park Circus',
    origin: { name: 'Isolated Industrial Belt East', lat: 22.5820, lon: 88.4210 },
    destination: { name: 'Park Circus Seven Point', lat: 22.5450, lon: 88.3680 }
  },
  {
    id: 'route-3',
    name: 'Dimly Lit Canal Overpass to Sealdah Hub',
    origin: { name: 'Dimly Lit Canal Overpass', lat: 22.5650, lon: 88.3920 },
    destination: { name: 'Sealdah Central Station', lat: 22.5670, lon: 88.3710 }
  }
]

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function SafetyIntelligenceView({ onNavigateTab }) {
  // Top-level mode: 'analyze' (manual) or 'live' (GPS/scenario)
  const [mode, setMode] = useState('analyze')

  // ── ANALYZE MODE STATE ──
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCoords, setSelectedCoords] = useState({ lat: 22.5726, lon: 88.4331 })
  const [selectedPlaceName, setSelectedPlaceName] = useState('Sector V Tech Corridor, Salt Lake')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState('22:30')
  const [selectedCompanion, setSelectedCompanion] = useState('alone')
  const [selectedMode, setSelectedMode] = useState('walking')
  const [selectedPurpose, setSelectedPurpose] = useState('travel')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [gpsActive, setGpsActive] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [routeComparison, setRouteComparison] = useState(null)
  const [activeRouteId, setActiveRouteId] = useState('safer')
  const [analyzeLoading, setAnalyzeLoading] = useState(false)

  // ── LIVE MODE STATE ──
  const [liveCoords, setLiveCoords] = useState({ lat: 22.5726, lon: 88.4331 })
  const [liveLocationName, setLiveLocationName] = useState('Bidhannagar / Sector V Corridor')
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveRiskData, setLiveRiskData] = useState(null)
  const [riskZones, setRiskZones] = useState([])
  const [simulatedHour, setSimulatedHour] = useState(new Date().getHours())
  const [crowdOverride, setCrowdOverride] = useState('')
  const [lightingOverride, setLightingOverride] = useState('')
  const [lastUpdated, setLastUpdated] = useState('Just now')
  
  // Live Route state
  const [selectedPresetRoute, setSelectedPresetRoute] = useState(PRESET_ROUTES[0].id)
  const [routeOriginText, setRouteOriginText] = useState(PRESET_ROUTES[0].origin.name)
  const [routeDestText, setRouteDestText] = useState(PRESET_ROUTES[0].destination.name)
  const [routeOriginCoords, setRouteOriginCoords] = useState(PRESET_ROUTES[0].origin)
  const [routeDestCoords, setRouteDestCoords] = useState(PRESET_ROUTES[0].destination)
  const [routeRiskData, setRouteRiskData] = useState(null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [liveSubTab, setLiveSubTab] = useState('location') // 'location' | 'route'
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // ── MAP REFS ──
  const analyzeMapContainerRef = useRef(null)
  const analyzeMapInstanceRef = useRef(null)
  const analyzeLayerGroupRef = useRef(null)

  const liveMapContainerRef = useRef(null)
  const liveMapInstanceRef = useRef(null)
  const liveLayerGroupRef = useRef(null)

  const round4 = (n) => Math.round(n * 10000) / 10000

  // Tile layer helper with standard dark tiles and reliable subdomains
  const setupTileLayer = (map) => {
    if (!window.L) return
    const L = window.L
    const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    })
    darkTile.on('tileerror', () => {
      // Fallback to OSM standard tile server
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)
    })
    darkTile.addTo(map)
  }

  // Cleanup maps on unmount
  useEffect(() => {
    return () => {
      if (analyzeMapInstanceRef.current) {
        try { analyzeMapInstanceRef.current.remove() } catch (e) {}
        analyzeMapInstanceRef.current = null
        analyzeLayerGroupRef.current = null
      }
      if (liveMapInstanceRef.current) {
        try { liveMapInstanceRef.current.remove() } catch (e) {}
        liveMapInstanceRef.current = null
        liveLayerGroupRef.current = null
      }
    }
  }, [])

  // Handle window resizing for proper map dimensions
  useEffect(() => {
    const handleResize = () => {
      if (analyzeMapInstanceRef.current) analyzeMapInstanceRef.current.invalidateSize()
      if (liveMapInstanceRef.current) liveMapInstanceRef.current.invalidateSize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ─── INITIALIZATION & AUTO RE-ANALYSIS ─────────────────────────────────
  useEffect(() => {
    if (mode === 'analyze') {
      runAnalysis()
    } else {
      fetchLiveRisk()
      fetchRiskZones()
      fetchRouteRisk(routeOriginCoords, routeDestCoords)
    }
  }, [mode, selectedCoords, selectedDate, selectedTime, selectedCompanion, selectedMode, selectedPurpose, isDemoMode])

  // Re-fetch live risk on scenario change
  useEffect(() => {
    if (mode === 'live') fetchLiveRisk()
  }, [liveCoords, simulatedHour, crowdOverride, lightingOverride])

  // Map redraws on state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === 'analyze') {
        initAnalyzeMap()
      } else {
        initLiveMap()
      }
    }, 60)
    return () => clearTimeout(timer)
  }, [mode, analysisResult, routeComparison, activeRouteId, liveRiskData, riskZones, routeRiskData, liveSubTab, routeOriginCoords, routeDestCoords])

  // ─── ANALYZE MODE LOGIC ────────────────────────────────────────

  const handleGeocode = async (e) => {
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
        runAnalysis({ lat: geo.latitude, lon: geo.longitude, name: geo.name })
      }
    } catch (err) { console.error(err) }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported by your browser.'); return }
    setGpsLoading(true); setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude
        const name = `My Location (${round4(lat)}, ${round4(lon)})`
        setSelectedCoords({ lat, lon }); setSelectedPlaceName(name)
        setGpsActive(true); setGpsLoading(false)
        runAnalysis({ lat, lon, name })
      },
      (err) => {
        setGpsLoading(false); setGpsActive(false)
        setGpsError(err.code === 1
          ? 'Location access denied. Enable it in browser settings or use manual search.'
          : 'Could not detect location. Please search manually.')
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }

  const runAnalysis = async (coordsOverride = null) => {
    setAnalyzeLoading(true)
    const lat = coordsOverride?.lat ?? selectedCoords.lat
    const lon = coordsOverride?.lon ?? selectedCoords.lon
    const name = coordsOverride?.name ?? selectedPlaceName
    try {
      const res = await fetch('/api/safety-risk/manual-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat, longitude: lon, location_name: name,
          date_str: selectedDate, time_str: selectedTime,
          travel_companion: selectedCompanion, travel_mode: selectedMode,
          travel_purpose: selectedPurpose, is_demo_mode: isDemoMode
        })
      })
      if (res.ok) setAnalysisResult(await res.json())

      const rRes = await fetch('/api/safety-risk/route-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat, lon, name },
          destination: { lat: 22.5695, lon: 88.4022, name: 'Salt Lake Stadium Metro' }
        })
      })
      if (rRes.ok) setRouteComparison(await rRes.json())
    } catch (err) { console.error(err) }
    finally { setAnalyzeLoading(false) }
  }

  // ─── LIVE MODE LOGIC ───────────────────────────────────────────

  const fetchLiveRisk = async () => {
    setLiveLoading(true)
    try {
      const d = new Date(); d.setHours(simulatedHour, 0, 0, 0)
      const q = new URLSearchParams({ lat: liveCoords.lat.toString(), lon: liveCoords.lon.toString(), timestamp: d.toISOString() })
      if (crowdOverride) q.append('crowd', crowdOverride)
      if (lightingOverride) q.append('lighting', lightingOverride)
      const res = await fetch(`/api/safety-risk/assess?${q}`)
      if (res.ok) {
        setLiveRiskData(await res.json())
        setLastUpdated(`Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
      }
    } catch (err) { console.error(err) }
    finally { setLiveLoading(false) }
  }

  const fetchRiskZones = async () => {
    try {
      const res = await fetch('/api/safety-risk/zones')
      if (res.ok) { const d = await res.json(); setRiskZones(d.risk_zones || []) }
    } catch (err) { console.error(err) }
  }

  const fetchRouteRisk = async (originObj, destObj) => {
    setLoadingRoute(true)
    try {
      const res = await fetch('/api/safety-risk/route-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: originObj.lat, lon: originObj.lon },
          destination: { lat: destObj.lat, lon: destObj.lon }
        })
      })
      if (res.ok) setRouteRiskData(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoadingRoute(false) }
  }

  const handlePresetRoute = (routeId) => {
    setSelectedPresetRoute(routeId)
    const match = PRESET_ROUTES.find(r => r.id === routeId)
    if (match) {
      setRouteOriginCoords(match.origin)
      setRouteDestCoords(match.destination)
      setRouteOriginText(match.origin.name)
      setRouteDestText(match.destination.name)
      fetchRouteRisk(match.origin, match.destination)
    }
  }

  const handleEvaluateCustomRoute = async (e) => {
    e?.preventDefault()
    setLoadingRoute(true)
    try {
      let oCoords = routeOriginCoords
      let dCoords = routeDestCoords

      if (routeOriginText.trim()) {
        const oRes = await fetch(`/api/safety-risk/geocode?q=${encodeURIComponent(routeOriginText)}`)
        if (oRes.ok) {
          const oData = await oRes.json()
          oCoords = { lat: oData.latitude, lon: oData.longitude, name: oData.name }
          setRouteOriginCoords(oCoords)
        }
      }

      if (routeDestText.trim()) {
        const dRes = await fetch(`/api/safety-risk/geocode?q=${encodeURIComponent(routeDestText)}`)
        if (dRes.ok) {
          const dData = await dRes.json()
          dCoords = { lat: dData.latitude, lon: dData.longitude, name: dData.name }
          setRouteDestCoords(dCoords)
        }
      }

      await fetchRouteRisk(oCoords, dCoords)
    } catch (err) {
      console.error("Error evaluating custom route:", err)
    } finally {
      setLoadingRoute(false)
    }
  }

  const handleUseGPSForRouteOrigin = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude
      const coords = { lat, lon, name: `My Location (${round4(lat)}, ${round4(lon)})` }
      setRouteOriginCoords(coords)
      setRouteOriginText(coords.name)
      fetchRouteRisk(coords, routeDestCoords)
    })
  }

  const handleLiveGPS = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLiveLocationName('Your Current GPS Location')
      },
      () => alert('Geolocation unavailable. Using default Kolkata coordinates.')
    )
  }

  // ─── MAP: ANALYZE MODE ─────────────────────────────────────────
  const initAnalyzeMap = () => {
    if (!analyzeMapContainerRef.current || typeof window === 'undefined' || !window.L) return
    const L = window.L

    if (analyzeMapContainerRef.current._leaflet_id && !analyzeMapInstanceRef.current) {
      analyzeMapContainerRef.current._leaflet_id = null
    }

    if (!analyzeMapInstanceRef.current) {
      const map = L.map(analyzeMapContainerRef.current, {
        center: [selectedCoords.lat, selectedCoords.lon],
        zoom: 14,
        zoomControl: true
      })
      setupTileLayer(map)
      map.on('click', (e) => {
        const lat = e.latlng.lat, lon = e.latlng.lng
        setSelectedCoords({ lat, lon })
        setSelectedPlaceName(`Dropped Pin (${round4(lat)}, ${round4(lon)})`)
        runAnalysis({ lat, lon, name: `Dropped Pin (${round4(lat)}, ${round4(lon)})` })
      })
      analyzeMapInstanceRef.current = map
      analyzeLayerGroupRef.current = L.layerGroup().addTo(map)
    }

    const map = analyzeMapInstanceRef.current
    const lg = analyzeLayerGroupRef.current
    if (lg) lg.clearLayers()

    // 1. Current Target Marker
    const pinColor = analysisResult?.risk?.level === 'LOW' ? '#10b981' : analysisResult?.risk?.level === 'MODERATE' ? '#f59e0b' : analysisResult?.risk?.level === 'HIGH' ? '#f97316' : '#f43f5e'
    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background:${pinColor};color:white;width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 16px ${pinColor};cursor:grab;">📍</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16]
    })
    const marker = L.marker([selectedCoords.lat, selectedCoords.lon], { icon: pinIcon, draggable: true }).addTo(lg)
    marker.bindPopup(`<b>${selectedPlaceName}</b><br/>Drag or click map to move pin`)
    marker.on('dragend', (e) => {
      const p = marker.getLatLng()
      setSelectedCoords({ lat: p.lat, lon: p.lng })
      setSelectedPlaceName(`Pin (${round4(p.lat)}, ${round4(p.lng)})`)
      runAnalysis({ lat: p.lat, lon: p.lng, name: `Pin (${round4(p.lat)}, ${round4(p.lng)})` })
    })

    // 2. Spatial radius rings
    ;[[100,'#38bdf8',0.12],[500,'#a855f7',0.08],[1000,'#f59e0b',0.05],[3000,'#64748b',0.02]].forEach(([r,c,o]) => {
      L.circle([selectedCoords.lat, selectedCoords.lon], { color: c, fillColor: c, fillOpacity: o, radius: r, weight: 1.5, dashArray: '4,4' }).addTo(lg)
    })

    // 3. Draw Route on Map if Route Comparison is available
    if (routeComparison && routeComparison.routes) {
      const currentRoute = routeComparison.routes.find(r => r.id === activeRouteId) || routeComparison.routes[0]
      if (currentRoute && currentRoute.coordinates) {
        const routeColor = currentRoute.id === 'safer' ? '#10b981' : currentRoute.id === 'fastest' ? '#f97316' : '#38bdf8'
        L.polyline(currentRoute.coordinates, {
          color: routeColor,
          weight: 6,
          opacity: 0.9,
          dashArray: currentRoute.id === 'fastest' ? '6,6' : null
        }).addTo(lg).bindPopup(`<b>${currentRoute.name}</b><br/>Score: <b>${currentRoute.risk_score}/100</b> · Distance: <b>${currentRoute.distance_km} km</b>`)

        // Destination pin
        const destIcon = L.divIcon({
          className: 'dest-pin',
          html: `<div style="background:#f43f5e;color:white;width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 0 12px #f43f5e;">🏁</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14]
        })
        const dCoords = routeComparison.destination
        L.marker([dCoords.lat, dCoords.lon], { icon: destIcon }).addTo(lg).bindPopup(`<b>Destination: ${dCoords.name || 'Central Hub'}</b>`)
      }
    }

    map.setView([selectedCoords.lat, selectedCoords.lon], 14)
    map.invalidateSize()
    setTimeout(() => { if (analyzeMapInstanceRef.current) analyzeMapInstanceRef.current.invalidateSize() }, 150)
  }

  // ─── MAP: LIVE MODE ────────────────────────────────────────────
  const initLiveMap = () => {
    if (!liveMapContainerRef.current || typeof window === 'undefined' || !window.L) return
    const L = window.L

    if (liveMapContainerRef.current._leaflet_id && !liveMapInstanceRef.current) {
      liveMapContainerRef.current._leaflet_id = null
    }

    if (!liveMapInstanceRef.current) {
      const map = L.map(liveMapContainerRef.current, {
        center: [liveCoords.lat, liveCoords.lon],
        zoom: 13,
        zoomControl: true
      })
      setupTileLayer(map)
      liveMapInstanceRef.current = map
      liveLayerGroupRef.current = L.layerGroup().addTo(map)
    }

    const map = liveMapInstanceRef.current
    const lg = liveLayerGroupRef.current
    if (lg) lg.clearLayers()

    if (liveSubTab === 'location') {
      // 1. Spatial risk zones
      riskZones.forEach((zone) => {
        const isEl = zone.risk_level === 'ELEVATED', isMod = zone.risk_level === 'MODERATE'
        const color = isEl ? '#f43f5e' : isMod ? '#f59e0b' : '#10b981'
        L.circle([zone.lat, zone.lon], {
          color, fillColor: color, fillOpacity: 0.2, radius: zone.radius_m || 600, weight: 2
        }).addTo(lg).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong style="color:${color};font-size:13px;">${zone.name}</strong><br/>
            <span>Contextual Risk Level: <b>${zone.risk_level}</b></span><br/>
            <span style="color:#94a3b8;">${zone.description || ''}</span>
          </div>
        `)
      })

      // 2. Verified Safe Havens
      if (liveRiskData?.nearby_safe_havens) {
        liveRiskData.nearby_safe_havens.forEach((sh) => {
          const icon = L.divIcon({
            className: 'sh-pin',
            html: `<div style="background:#059669;color:white;width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 12px rgba(16,185,129,0.8);">🏥</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14]
          })
          L.marker([sh.latitude || sh.lat || 22.571, sh.longitude || sh.lon || 88.412], { icon })
            .addTo(lg).bindPopup(`<b>${sh.name}</b><br/>${sh.type} · ${sh.distance_km} km<br/>📞 ${sh.phone || 'N/A'}`)
        })
      }

      // 3. User Location Center
      const userPin = L.divIcon({
        className: 'user-pin',
        html: `<div style="background:#ec4899;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 0 16px #f43f5e;"></div>`,
        iconSize: [22, 22], iconAnchor: [11, 11]
      })
      L.marker([liveCoords.lat, liveCoords.lon], { icon: userPin })
        .addTo(lg).bindPopup(`<b>${liveLocationName}</b><br/>Live Assessment Center`)

      map.setView([liveCoords.lat, liveCoords.lon], 13)
    } else if (liveSubTab === 'route') {
      const coords = []

      // 1. Draw route segments
      if (routeRiskData?.segments && routeRiskData.segments.length > 0) {
        routeRiskData.segments.forEach((seg) => {
          const sLat = seg.start?.lat ?? seg.start_coords?.lat ?? seg.start_lat
          const sLon = seg.start?.lon ?? seg.start_coords?.lon ?? seg.start_lon
          const eLat = seg.end?.lat ?? seg.end_coords?.lat ?? seg.end_lat
          const eLon = seg.end?.lon ?? seg.end_coords?.lon ?? seg.end_lon

          if (sLat != null && sLon != null && eLat != null && eLon != null) {
            const startPt = [sLat, sLon]
            const endPt = [eLat, eLon]
            coords.push(startPt, endPt)

            const sc = seg.risk_level === 'ELEVATED' ? '#f43f5e' : seg.risk_level === 'MODERATE' ? '#f59e0b' : '#10b981'
            L.polyline([startPt, endPt], { color: sc, weight: 7, opacity: 0.9 }).addTo(lg)
              .bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; color: #1e1b4b;">
                  <strong style="color:${sc}; font-size: 13px;">${seg.label || seg.description}</strong><br/>
                  Risk Score: <b>${seg.risk_score || seg.score}/100</b> (${seg.risk_level})<br/>
                  <span>Lighting: <b>${seg.lighting || 'Standard'}</b></span><br/>
                  <span>Crowd: <b>${seg.crowd_density || 'Active'}</b></span>
                </div>
              `)
          }
        })
      }

      // 2. Start Marker
      const startIcon = L.divIcon({
        className: 'route-start-pin',
        html: `<div style="background:#10b981;color:white;width:30px;height:30px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 14px #10b981;">🟢</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15]
      })
      L.marker([routeOriginCoords.lat, routeOriginCoords.lon], { icon: startIcon })
        .addTo(lg).bindPopup(`<b>Start Point: ${routeOriginText}</b>`)
      coords.push([routeOriginCoords.lat, routeOriginCoords.lon])

      // 3. Destination Marker
      const destIcon = L.divIcon({
        className: 'route-dest-pin',
        html: `<div style="background:#f43f5e;color:white;width:30px;height:30px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 14px #f43f5e;">🏁</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15]
      })
      L.marker([routeDestCoords.lat, routeDestCoords.lon], { icon: destIcon })
        .addTo(lg).bindPopup(`<b>Destination: ${routeDestText}</b>`)
      coords.push([routeDestCoords.lat, routeDestCoords.lon])

      // 4. Safe Havens Along Route
      if (routeRiskData?.safe_havens_along_route) {
        routeRiskData.safe_havens_along_route.forEach((sh) => {
          const shIcon = L.divIcon({
            className: 'sh-pin',
            html: `<div style="background:#059669;color:white;width:26px;height:26px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 0 10px rgba(16,185,129,0.8);">🏥</div>`,
            iconSize: [26, 26], iconAnchor: [13, 13]
          })
          L.marker([sh.latitude || sh.lat || 22.571, sh.longitude || sh.lon || 88.412], { icon: shIcon })
            .addTo(lg).bindPopup(`<b>${sh.name}</b><br/>${sh.type} · ${sh.distance_km} km<br/>📞 ${sh.phone || 'N/A'}`)
        })
      }

      if (coords.length > 1) {
        map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })
      } else {
        map.setView([routeOriginCoords.lat, routeOriginCoords.lon], 13)
      }
    }

    map.invalidateSize()
    setTimeout(() => { if (liveMapInstanceRef.current) liveMapInstanceRef.current.invalidateSize() }, 150)
  }

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ════════════════ HEADER ════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amethyst-500 via-amethyst-700 to-rosegold-500 flex items-center justify-center shadow-xl glow-purple">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
              Safety Intelligence
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              ORVEYRA Contextual Risk Engine • Multi-dimensional • Dynamic Spatial Safety
            </p>
          </div>
        </div>

        {/* Mode Toggle Pill */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-amethyst-900/80 border border-amethyst-700/60 shrink-0">
          <button
            onClick={() => setMode('analyze')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'analyze'
                ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow-lg glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Analyze Location
          </button>
          <button
            onClick={() => setMode('live')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'live'
                ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow-lg glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Live Risk Monitor
          </button>
        </div>
      </div>

      {/* ════════════════ MODE: ANALYZE LOCATION ════════════════ */}
      {mode === 'analyze' && (
        <div className="space-y-6">
          {/* Input Panel */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-amethyst-700/60 bg-amethyst-950/85 space-y-5">

            {/* Search Row */}
            <form onSubmit={handleGeocode} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Select Location (Search Manually, Drop a Pin, or Use Live GPS):
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Sector V, Park Street, 22.5726 88.4331..."
                    className="w-full bg-amethyst-950 border border-amethyst-700/80 rounded-xl text-sm text-slate-100 pl-10 pr-4 py-2.5 focus:outline-none focus:border-rosegold-400 placeholder:text-slate-500 font-medium"
                  />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <button type="submit" className="px-4 py-2.5 rounded-xl bg-amethyst-800 hover:bg-amethyst-700 border border-amethyst-600 text-xs font-bold text-white cursor-pointer transition-all flex items-center gap-1.5 shadow">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                  <button type="button" onClick={useMyLocation} disabled={gpsLoading}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                      gpsActive
                        ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300 glow-green'
                        : 'bg-sky-500/20 border-sky-400/60 text-sky-300 hover:bg-sky-500/30'
                    }`}>
                    <Compass className="w-3.5 h-3.5" />
                    <span>{gpsLoading ? '⏳ Locating...' : gpsActive ? '📡 GPS Active' : '📡 Use Live GPS'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold self-center">Quick select:</span>
                {PRESET_PLACES.map((p, i) => (
                  <button key={i} type="button"
                    onClick={() => { setSelectedCoords({ lat: p.lat, lon: p.lon }); setSelectedPlaceName(p.name); setGpsActive(false); runAnalysis({ lat: p.lat, lon: p.lon, name: p.name }) }}
                    className="px-2.5 py-1 rounded-lg bg-amethyst-900/80 hover:bg-amethyst-800 border border-amethyst-700/60 text-[11px] text-slate-300 cursor-pointer font-medium transition-all">
                    {p.name}
                  </button>
                ))}
              </div>
            </form>

            {/* GPS Error */}
            {gpsError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Interactive Map Picker Box */}
            <div className="glass-card rounded-xl p-3 border border-amethyst-800/80 bg-amethyst-950/90 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rosegold-400" />
                  Map Location Picker (Click or drag pin anywhere to recalibrate):
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate max-w-xs">
                  {selectedPlaceName}
                </span>
              </div>
              <div className="w-full h-72 rounded-xl overflow-hidden relative border border-amethyst-800/70 shadow-inner">
                <div ref={analyzeMapContainerRef} className="w-full h-full z-10" />
                <div className="absolute top-3 left-3 z-20 bg-amethyst-950/90 backdrop-blur border border-amethyst-700/80 px-3 py-1.5 rounded-lg text-[11px] text-slate-200 font-semibold shadow-lg flex items-center gap-1.5 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-rosegold-400 animate-ping inline-block" />
                  <span>📍 Click anywhere on the map to evaluate risk at that location</span>
                </div>
              </div>
            </div>

            {/* Location Banner with Mode Badges */}
            <div className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 flex items-center justify-between text-xs gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${gpsActive ? 'text-emerald-400' : 'text-rosegold-400'}`} />
                <span className="font-bold text-slate-100">{selectedPlaceName}</span>
                <span className="font-mono text-slate-400">({round4(selectedCoords.lat)}, {round4(selectedCoords.lon)})</span>
              </div>
              <div className="flex items-center gap-2">
                {gpsActive ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Live GPS Mode
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300 font-bold bg-amethyst-800/60 border border-amethyst-700/60 px-2.5 py-1 rounded-full">
                    Manual Pin / Search
                  </span>
                )}
              </div>
            </div>

            {/* Context Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date & Time */}
              <div className="p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/50 space-y-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rosegold-400" /> Date & Time:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Date</label>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-amethyst-950 border border-amethyst-700 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Time</label>
                    <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full bg-amethyst-950 border border-amethyst-700 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400 font-semibold" />
                  </div>
                </div>
              </div>

              {/* Travel Companion */}
              <div className="p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/50 space-y-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-rosegold-400" /> Travelling With:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {TRAVEL_COMPANIONS.map((c) => (
                    <button key={c.id} type="button" onClick={() => setSelectedCompanion(c.id)}
                      className={`p-2 rounded-lg text-xs font-semibold text-left cursor-pointer transition-all ${selectedCompanion === c.id ? 'bg-rosegold-500/20 border border-rosegold-400 text-rosegold-300' : 'bg-amethyst-950/70 border border-amethyst-800 text-slate-400 hover:text-slate-200'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Mode */}
              <div className="p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/50 space-y-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-rosegold-400" /> Travel Mode:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {TRAVEL_MODES.slice(0, 4).map((m) => (
                    <button key={m.id} type="button" onClick={() => setSelectedMode(m.id)}
                      className={`p-2 rounded-lg text-xs font-semibold text-left cursor-pointer transition-all ${selectedMode === m.id ? 'bg-rosegold-500/20 border border-rosegold-400 text-rosegold-300' : 'bg-amethyst-950/70 border border-amethyst-800 text-slate-400 hover:text-slate-200'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data mode + Analyze button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button onClick={() => { setIsDemoMode(!isDemoMode) }}
                className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isDemoMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'}`}>
                {isDemoMode ? '● Demo Dataset Mode' : '● Live Sourced Data Mode'}
              </button>
              <button onClick={() => runAnalysis()} disabled={analyzeLoading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:opacity-90 text-white font-extrabold text-sm shadow-xl glow-purple flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider">
                <Shield className="w-5 h-5" />
                {analyzeLoading ? 'Evaluating Intelligence...' : 'Analyze Safety'}
              </button>
            </div>
          </div>

          {/* ── ANALYSIS RESULTS ── */}
          {analysisResult && (
            <div className="space-y-6">

              {/* Score Banner */}
              <div className="glass-card rounded-2xl p-6 border border-amethyst-700/80 bg-amethyst-950/90 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amethyst-800/60">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">ORVEYRA Safety Intelligence Report</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-1">{analysisResult.location.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{analysisResult.timestamp} • {selectedMode} • {selectedCompanion}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border text-sm font-extrabold flex items-center gap-2 ${
                    analysisResult.risk.level === 'LOW' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
                    analysisResult.risk.level === 'MODERATE' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                    analysisResult.risk.level === 'HIGH' ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' :
                    'bg-rose-500/20 border-rose-500/50 text-rose-300'}`}>
                    {analysisResult.risk.level === 'LOW' ? '🟢 LOW RISK' : analysisResult.risk.level === 'MODERATE' ? '🟡 MODERATE RISK' : analysisResult.risk.level === 'HIGH' ? '🟠 HIGH RISK' : '🔴 ELEVATED RISK'}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Risk Score', value: `${analysisResult.risk.score}`, unit: '/ 100' },
                    { label: 'Confidence', value: `${analysisResult.risk.confidence}%`, unit: '' },
                    { label: 'Data Mode', value: analysisResult.data_quality.mode, unit: '' },
                    { label: 'Safe Havens', value: `${analysisResult.nearby_safe_havens.length}`, unit: 'nearby' }
                  ].map((m, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
                      <span className="text-[11px] text-slate-400 font-semibold block">{m.label}</span>
                      <div className="text-2xl font-extrabold text-slate-100 mt-1">{m.value} <span className="text-xs text-slate-400 font-normal">{m.unit}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dimensions + Explainability */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-rosegold-400" /> 7-Dimension Contextual Breakdown:
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(analysisResult.dimensions).map(([key, val]) => {
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      const bar = val < 30 ? 'bg-emerald-500' : val < 60 ? 'bg-amber-500' : 'bg-rose-500'
                      return (
                        <div key={key} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-300">{label}</span>
                            <span className="text-slate-100">{val}/100</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-amethyst-950 overflow-hidden">
                            <div className={`h-full rounded-full ${bar}`} style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-rosegold-400" /> Why This Score?
                  </h3>
                  <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> What elevates risk:</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysisResult.risk_factors.map((f, i) => <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />{f}</li>)}
                    </ul>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> What lowers risk:</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysisResult.protective_factors.map((f, i) => <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />{f}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 24-Hour Risk Curve */}
              <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rosegold-400" /> 24-Hour Risk Curve:
                </h3>
                <div className="flex items-end gap-0.5 pt-2 h-20 border-b border-amethyst-800/50 pb-2">
                  {analysisResult.hourly_risk_trend.map((item) => {
                    const isNow = parseInt(selectedTime.split(':')[0]) === item.hour
                    const bc = item.risk_score < 30 ? 'bg-emerald-500' : item.risk_score < 60 ? 'bg-amber-500' : item.risk_score < 80 ? 'bg-orange-500' : 'bg-rose-500'
                    return (
                      <div key={item.hour} className="flex flex-col items-center group cursor-pointer flex-1" title={`${item.formatted_time}: ${item.risk_score}`}>
                        <div className={`w-full rounded-t ${bc} ${isNow ? 'ring-1 ring-white' : 'opacity-60 group-hover:opacity-100'} transition-all`}
                          style={{ height: `${Math.max(6, item.risk_score * 0.7)}px` }} />
                        <span className={`text-[8px] mt-0.5 ${isNow ? 'font-bold text-white' : 'text-slate-500'}`}>
                          {item.hour % 6 === 0 ? `${item.hour}` : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Spatial Radii Analysis Cards */}
              <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-rosegold-400" /> Spatial Radius Context (100m, 500m, 1km, 3km):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {analysisResult.spatial_radius_analysis.map((z, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">{z.radius} • {z.label}</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-extrabold ${z.risk_score < 30 ? 'text-emerald-400' : z.risk_score < 60 ? 'text-amber-400' : 'text-rose-400'}`}>{z.risk_score}</span>
                        <span className="text-[10px] text-slate-400">/ 100</span>
                      </div>
                      <span className="text-[10px] text-slate-300 block">{z.safe_havens_count} Safe Havens</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triple Route Comparison */}
              {routeComparison && (
                <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-rosegold-400" /> Triple Route Comparison (Fastest vs Safer vs Balanced):
                    </h3>
                    <span className="text-[11px] text-slate-400">Click a route to view its path on the map above</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {routeComparison.routes.map((r) => (
                      <div key={r.id} onClick={() => setActiveRouteId(r.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${activeRouteId === r.id ? 'bg-amethyst-900/90 border-rosegold-400/80 glow-purple ring-1 ring-rosegold-400' : 'bg-amethyst-900/40 border-amethyst-800/50 hover:bg-amethyst-900/60'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{r.name}</span>
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${r.risk_score < 30 ? 'bg-emerald-500/20 text-emerald-300' : r.risk_score < 60 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {r.risk_score}/100
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1.5">{r.distance_km} km · ~{r.estimated_duration_mins} min</div>
                        <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                          {r.key_advantages.map((adv, i) => (
                            <div key={i} className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-400" />{adv}</div>
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
      )}

      {/* ════════════════ MODE: LIVE RISK MONITOR ════════════════ */}
      {mode === 'live' && (
        <div className="space-y-6">
          {/* Sub-Tab Toggle */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-amethyst-900/80 border border-amethyst-700/60 w-fit">
            {[{ id: 'location', icon: MapPin, label: 'Location Risk' }, { id: 'route', icon: Navigation, label: 'Route Analyzer' }].map((t) => (
              <button key={t.id} onClick={() => setLiveSubTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${liveSubTab === t.id ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow glow-purple' : 'text-slate-400 hover:text-slate-200'}`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Scenario Simulator Panel */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rosegold-400" /> Scenario Simulator — Adjust & Watch Risk Recalculate:
              </span>
              <button onClick={handleLiveGPS} className="text-xs font-semibold text-rosegold-400 hover:text-rosegold-300 flex items-center gap-1 cursor-pointer">
                <Compass className="w-3.5 h-3.5" /> Use My GPS
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    {simulatedHour >= 7 && simulatedHour < 18 ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-rosegold-400" />}
                    Time of Day:
                  </span>
                  <span className="font-bold text-rosegold-300">{simulatedHour.toString().padStart(2,'0')}:00 {simulatedHour >= 12 ? 'PM' : 'AM'}</span>
                </div>
                <input type="range" min="0" max="23" value={simulatedHour} onChange={(e) => setSimulatedHour(parseInt(e.target.value))}
                  className="w-full accent-rosegold-500 cursor-pointer h-1.5 bg-amethyst-950 rounded-lg" />
                <div className="flex justify-between text-[10px] text-slate-400"><span>12 AM</span><span>12 PM</span><span>11 PM</span></div>
              </div>

              <div className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Crowd Density Signal:</label>
                <select value={crowdOverride} onChange={(e) => setCrowdOverride(e.target.value)}
                  className="w-full bg-amethyst-950 border border-amethyst-700/80 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400">
                  <option value="">Auto / Estimated</option>
                  <option value="high">🟢 High — Crowded / Busy</option>
                  <option value="moderate">🟡 Moderate Activity</option>
                  <option value="low">🟠 Low Pedestrian</option>
                  <option value="isolated">🔴 Isolated / Deserted</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Lighting Conditions:</label>
                <select value={lightingOverride} onChange={(e) => setLightingOverride(e.target.value)}
                  className="w-full bg-amethyst-950 border border-amethyst-700/80 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400">
                  <option value="">Auto / Solar Cycle</option>
                  <option value="well_lit">🟢 Well-Lit Streetlights</option>
                  <option value="moderate">🟡 Partial Lighting</option>
                  <option value="poor">🔴 Poorly Lit / Dark</option>
                  <option value="unavailable">⚠️ Data Unavailable</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Content: Location or Route */}
          {liveSubTab === 'location' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-5">
                <DynamicSafetyRiskCard
                  riskData={liveRiskData} loading={liveLoading} lastUpdatedText={lastUpdated}
                  onOpenDetails={() => setIsDetailsOpen(true)}
                  onExploreRoute={() => setLiveSubTab('route')}
                  onRefresh={fetchLiveRisk}
                />
                <div className="glass-card rounded-2xl p-4 border border-amethyst-700/60 bg-amethyst-950/80 space-y-2">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-rosegold-400" /> How Risk Scores Adapt:
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Drag the <strong>Time Slider</strong> to 11 PM or set <strong>Lighting</strong> to "Poorly Lit" and watch the score recalibrate. The engine uses normalized location, temporal, activity, incident, and infrastructure weights.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="glass-card rounded-2xl p-4 border border-amethyst-700/60 bg-amethyst-950/80 flex flex-col h-[520px]">
                  <div className="flex items-center justify-between pb-3 border-b border-amethyst-800/60">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-rosegold-400" />
                      <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">Spatial Safety Risk Layer</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Low</span>
                      <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Moderate</span>
                      <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Elevated</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full rounded-xl overflow-hidden mt-3 border border-amethyst-800/60 relative shadow-inner">
                    <div ref={liveMapContainerRef} className="w-full h-full z-10" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-amethyst-800/60">
                    <Navigation className="w-5 h-5 text-rosegold-400" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Route Risk Evaluation</h3>
                      <p className="text-[11px] text-slate-400">Identify highest-risk segments and safer corridors</p>
                    </div>
                  </div>

                  {/* Preset Corridor Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Select Preset Corridor:</label>
                    <select value={selectedPresetRoute} onChange={(e) => handlePresetRoute(e.target.value)}
                      className="w-full bg-amethyst-950 border border-amethyst-700/80 rounded-xl text-xs text-slate-200 p-2.5 focus:outline-none focus:border-rosegold-400 font-semibold cursor-pointer">
                      {PRESET_ROUTES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  {/* Custom Origin & Destination Input */}
                  <form onSubmit={handleEvaluateCustomRoute} className="space-y-2 pt-1 border-t border-amethyst-800/50">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Custom Route Coordinates / Search:</span>
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={routeOriginText}
                          onChange={(e) => setRouteOriginText(e.target.value)}
                          placeholder="Origin location..."
                          className="flex-1 bg-amethyst-950 border border-amethyst-700 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400"
                        />
                        <button
                          type="button"
                          onClick={handleUseGPSForRouteOrigin}
                          title="Use current GPS location"
                          className="p-2 rounded-lg bg-amethyst-800 hover:bg-amethyst-700 text-rosegold-400 text-xs font-bold border border-amethyst-600 cursor-pointer"
                        >
                          <Compass className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={routeDestText}
                        onChange={(e) => setRouteDestText(e.target.value)}
                        placeholder="Destination location..."
                        className="w-full bg-amethyst-950 border border-amethyst-700 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400"
                      />
                      <button
                        type="submit"
                        disabled={loadingRoute}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-amethyst-700 to-rosegold-700 hover:from-amethyst-600 hover:to-rosegold-600 text-white text-xs font-bold transition-all shadow cursor-pointer"
                      >
                        {loadingRoute ? 'Evaluating Route...' : 'Recalculate Custom Route'}
                      </button>
                    </div>
                  </form>

                  {loadingRoute && <div className="p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/40 animate-pulse text-xs text-slate-400">Calculating route risk segments...</div>}

                  {!loadingRoute && routeRiskData && (
                    <div className="space-y-3">
                      {/* Overall Route Risk Badge */}
                      <div className="p-4 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block">Overall Route Risk</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className={`text-2xl font-extrabold ${routeRiskData.overall_route_level === 'LOW' ? 'text-emerald-400' : routeRiskData.overall_route_level === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'}`}>
                              {routeRiskData.overall_route_score}/100
                            </span>
                            <span className="text-xs font-bold text-slate-300">({routeRiskData.overall_route_label})</span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-300 font-semibold">
                          <div>{routeRiskData.total_distance_km || 2.4} km</div>
                          <div className="text-[11px] text-slate-400">~{routeRiskData.estimated_duration_mins || 8} min</div>
                        </div>
                      </div>

                      {/* Highest Risk Segment */}
                      {routeRiskData.highest_risk_segment && (
                        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 space-y-1.5">
                          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs"><AlertTriangle className="w-4 h-4 text-rose-400" /> Highest-Risk Segment:</div>
                          <p className="text-xs text-slate-200 font-semibold">{routeRiskData.highest_risk_segment.description}</p>
                          <div className="text-[11px] text-slate-300">Score: <span className="font-bold text-rose-300">{routeRiskData.highest_risk_segment.score || routeRiskData.highest_risk_segment.risk_score}/100</span></div>
                        </div>
                      )}

                      {/* Safer Alternative Recommendation */}
                      {routeRiskData.alternative_route && (
                        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recommended Safer Alternative:</span>
                            <span className="text-emerald-400 font-extrabold">{routeRiskData.alternative_route.risk_score}/100</span>
                          </div>
                          <p className="text-xs text-slate-200 font-bold">{routeRiskData.alternative_route.name}</p>
                          <ul className="space-y-1 text-[11px] text-slate-300 pt-1">
                            {routeRiskData.alternative_route.key_advantages?.map((adv, i) => (
                              <li key={i} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />{adv}</li>
                            ))}
                          </ul>
                          {routeRiskData.alternative_route.additional_distance_km && (
                            <p className="text-[10px] text-slate-400 italic pt-1">
                              + {routeRiskData.alternative_route.additional_distance_km} km (~{routeRiskData.alternative_route.additional_time_mins} min extra).
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Route Polyline Map */}
              <div className="lg:col-span-7">
                <div className="glass-card rounded-2xl p-4 border border-amethyst-700/60 bg-amethyst-950/80 flex flex-col h-[520px]">
                  <div className="flex items-center justify-between pb-3 border-b border-amethyst-800/60">
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-rosegold-400" /> Route Risk Segment Overlay
                    </span>
                    <span className="text-[11px] text-slate-400">Color-coded: 🟢 Low · 🟡 Moderate · 🔴 Elevated</span>
                  </div>
                  <div className="flex-1 w-full rounded-xl overflow-hidden mt-3 border border-amethyst-800/60 relative shadow-inner">
                    <div ref={liveMapContainerRef} className="w-full h-full z-10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Details Modal */}
          <RiskDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} riskData={liveRiskData}
            onExploreRoute={() => { setIsDetailsOpen(false); setLiveSubTab('route') }} />
        </div>
      )}

    </div>
  )
}
