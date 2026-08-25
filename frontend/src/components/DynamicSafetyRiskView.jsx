import React, { useState, useEffect, useRef } from 'react'
import {
  Shield, MapPin, Navigation, Clock, Eye, Sparkles, AlertTriangle,
  CheckCircle2, AlertCircle, RefreshCw, PhoneCall, Building2, Sliders,
  ArrowRight, Info, Compass, ShieldAlert, ChevronRight, Layers, Sun, Moon
} from 'lucide-react'
import DynamicSafetyRiskCard from './DynamicSafetyRiskCard'
import RiskDetailsModal from './RiskDetailsModal'

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

export default function DynamicSafetyRiskView({ onNavigateTab }) {
  // Location & Context State
  const [currentCoords, setCurrentCoords] = useState({ lat: 22.5726, lon: 88.4331 })
  const [locationName, setLocationName] = useState('Bidhannagar / Sector V Corridor')
  const [loading, setLoading] = useState(false)
  const [riskData, setRiskData] = useState(null)
  const [riskZones, setRiskZones] = useState([])
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Simulation Controls (Scenario Testing)
  const [simulatedHour, setSimulatedHour] = useState(new Date().getHours())
  const [crowdOverride, setCrowdOverride] = useState('')
  const [lightingOverride, setLightingOverride] = useState('')
  const [lastUpdated, setLastUpdated] = useState('Updated just now')

  // Route Risk Analysis State
  const [selectedPresetRoute, setSelectedPresetRoute] = useState(PRESET_ROUTES[0].id)
  const [routeOrigin, setRouteOrigin] = useState(PRESET_ROUTES[0].origin)
  const [routeDest, setRouteDest] = useState(PRESET_ROUTES[0].destination)
  const [routeRiskData, setRouteRiskData] = useState(null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [activeTabSub, setActiveTabSub] = useState('location') // 'location', 'route'

  // Map reference
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerGroupRef = useRef(null)

  // Fetch initial location risk and spatial zones
  useEffect(() => {
    fetchLocationRisk()
    fetchRiskZones()
    fetchRouteRisk(PRESET_ROUTES[0].origin, PRESET_ROUTES[0].destination)
  }, [])

  // Re-fetch when simulation parameters change
  useEffect(() => {
    fetchLocationRisk()
  }, [currentCoords, simulatedHour, crowdOverride, lightingOverride])

  // Map initialization & redraw
  useEffect(() => {
    initOrUpdateMap()
  }, [riskData, riskZones, routeRiskData, activeTabSub])

  // 1. Fetch Location Risk Assessment from API
  const fetchLocationRisk = async () => {
    setLoading(true)
    try {
      // Build ISO timestamp matching simulated hour
      const d = new Date()
      d.setHours(simulatedHour, 0, 0, 0)
      const isoTs = d.toISOString()

      const query = new URLSearchParams({
        lat: currentCoords.lat.toString(),
        lon: currentCoords.lon.toString(),
        timestamp: isoTs
      })
      if (crowdOverride) query.append('crowd', crowdOverride)
      if (lightingOverride) query.append('lighting', lightingOverride)

      const res = await fetch(`/api/safety-risk/assess?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRiskData(data)
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setLastUpdated(`Updated ${timeStr}`)
      }
    } catch (err) {
      console.error("Error fetching location risk:", err)
    } finally {
      setLoading(false)
    }
  }

  // 2. Fetch Spatial Risk Zones
  const fetchRiskZones = async () => {
    try {
      const res = await fetch('/api/safety-risk/zones')
      if (res.ok) {
        const data = await res.json()
        setRiskZones(data.risk_zones || [])
      }
    } catch (err) {
      console.error("Error fetching risk zones:", err)
    }
  }

  // 3. Fetch Route Risk Assessment
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
      if (res.ok) {
        const data = await res.json()
        setRouteRiskData(data)
      }
    } catch (err) {
      console.error("Error evaluating route risk:", err)
    } finally {
      setLoadingRoute(false)
    }
  }

  // Handle Preset Route Change
  const handleSelectPresetRoute = (routeId) => {
    setSelectedPresetRoute(routeId)
    const match = PRESET_ROUTES.find(r => r.id === routeId)
    if (match) {
      setRouteOrigin(match.origin)
      setRouteDest(match.destination)
      fetchRouteRisk(match.origin, match.destination)
    }
  }

  // Geolocation trigger
  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude }
          setCurrentCoords(coords)
          setLocationName("Your Current GPS Location")
        },
        (err) => {
          alert("Geolocation unavailable. Using default Kolkata coordinates.")
        }
      )
    }
  }

  // Leaflet Map Renderer
  const initOrUpdateMap = () => {
    if (!mapContainerRef.current || typeof window === 'undefined' || !window.L) return

    const L = window.L

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lon],
        zoom: 13,
        zoomControl: true
      })

      // Dark Matter Map Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map)

      mapInstanceRef.current = map
      layerGroupRef.current = L.layerGroup().addTo(map)
    }

    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    layerGroup.clearLayers()

    // 1. Draw Risk Zone circles (Green / Amber / Rose overlays)
    if (riskZones && riskZones.length > 0) {
      riskZones.forEach((zone) => {
        const isElevated = zone.risk_level === "ELEVATED"
        const isMod = zone.risk_level === "MODERATE"
        const color = isElevated ? "#f43f5e" : isMod ? "#f59e0b" : "#10b981"

        const circle = L.circle([zone.lat, zone.lon], {
          color: color,
          fillColor: color,
          fillOpacity: 0.18,
          radius: zone.radius_m || 600,
          weight: 2
        }).addTo(layerGroup)

        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e1b4b;">
            <strong style="color: ${color}; font-size: 13px;">${zone.name}</strong><br/>
            <span>Contextual Risk Level: <b>${zone.risk_level}</b></span><br/>
            <span style="color: #64748b;">Radius: ${zone.radius_m || 600} m</span>
          </div>
        `)
      })
    }

    // 2. Draw Safe Havens Markers
    if (riskData && riskData.nearby_safe_havens) {
      riskData.nearby_safe_havens.forEach((sh) => {
        const shIcon = L.divIcon({
          className: 'custom-sh-pin',
          html: `<div style="background: #059669; color: white; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 0 10px rgba(16,185,129,0.8);">🏥</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })

        L.marker([sh.latitude || 22.571, sh.longitude || 88.412], { icon: shIcon })
          .addTo(layerGroup)
          .bindPopup(`<b>${sh.name}</b><br/>${sh.type} (${sh.distance_km} km)<br/>Phone: ${sh.phone || 'N/A'}`)
      })
    }

    // 3. User Current Location Pin
    const userPin = L.divIcon({
      className: 'custom-user-pin',
      html: `<div style="background: #ec4899; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px #f43f5e; animation: pulse 2s infinite;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
    L.marker([currentCoords.lat, currentCoords.lon], { icon: userPin })
      .addTo(layerGroup)
      .bindPopup(`<b>Location Assessment Center</b><br/>${locationName}`)

    // 4. Draw Route Risk Polylines if viewing Route Tab
    if (activeTabSub === 'route' && routeRiskData && routeRiskData.segments) {
      const routeCoords = []
      routeRiskData.segments.forEach((seg) => {
        const start = [seg.start_coords.lat, seg.start_coords.lon]
        const end = [seg.end_coords.lat, seg.end_coords.lon]
        routeCoords.push(start, end)

        const segColor = seg.risk_level === "ELEVATED" ? "#f43f5e" : seg.risk_level === "MODERATE" ? "#f59e0b" : "#10b981"

        const line = L.polyline([start, end], {
          color: segColor,
          weight: 6,
          opacity: 0.85
        }).addTo(layerGroup)

        line.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong style="color: ${segColor};">${seg.label}</strong><br/>
            Risk Score: <b>${seg.risk_score} / 100</b> (${seg.risk_level})
          </div>
        `)
      })

      if (routeCoords.length > 0) {
        map.fitBounds(L.latLngBounds(routeCoords), { padding: [40, 40] })
      }
    } else {
      map.setView([currentCoords.lat, currentCoords.lon], 13)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. VIEW HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amethyst-500 to-rosegold-500 flex items-center justify-center text-white shadow-lg glow-purple">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                Dynamic Safety Risk Engine
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Contextual safety risk calculation • 6 normalized factors • Dynamic updates & route intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs: Live Location vs Route Analyzer */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-amethyst-900/80 border border-amethyst-700/60 shrink-0">
          <button
            onClick={() => setActiveTabSub('location')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabSub === 'location'
                ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Location Risk</span>
          </button>

          <button
            onClick={() => setActiveTabSub('route')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabSub === 'route'
                ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Route Risk Analyzer</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC CONTEXT SIMULATION CONTROLS (SCENARIO TESTER) */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rosegold-400" />
            Interactive Scenario Simulator (Test Real-Time Recalculations):
          </span>
          <button
            onClick={handleUseGPS}
            className="text-xs font-semibold text-rosegold-400 hover:text-rosegold-300 flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Use My GPS Location</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Time Slider */}
          <div className="space-y-1.5 p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                {simulatedHour >= 7 && simulatedHour < 18 ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-rosegold-400" />
                )}
                Time of Day:
              </span>
              <span className="font-bold text-rosegold-300">
                {simulatedHour.toString().padStart(2, '0')}:00 {simulatedHour >= 12 ? 'PM' : 'AM'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={simulatedHour}
              onChange={(e) => setSimulatedHour(parseInt(e.target.value))}
              className="w-full accent-rosegold-500 cursor-pointer h-1.5 bg-amethyst-950 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>12 AM</span>
              <span>12 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          {/* Crowd Override */}
          <div className="space-y-1.5 p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
            <label className="text-xs font-semibold text-slate-300 block">
              Crowd Density Signal:
            </label>
            <select
              value={crowdOverride}
              onChange={(e) => setCrowdOverride(e.target.value)}
              className="w-full bg-amethyst-950 border border-amethyst-700/80 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400"
            >
              <option value="">Auto / Estimated Signal</option>
              <option value="high">🟢 High (Crowded / Busy Transit)</option>
              <option value="moderate">🟡 Moderate Activity</option>
              <option value="low">🟠 Low Pedestrian Activity</option>
              <option value="isolated">🔴 Isolated / Deserted Street</option>
            </select>
          </div>

          {/* Lighting Override */}
          <div className="space-y-1.5 p-3 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60">
            <label className="text-xs font-semibold text-slate-300 block">
              Lighting Conditions:
            </label>
            <select
              value={lightingOverride}
              onChange={(e) => setLightingOverride(e.target.value)}
              className="w-full bg-amethyst-950 border border-amethyst-700/80 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-rosegold-400"
            >
              <option value="">Auto / Solar Day-Night Cycle</option>
              <option value="well_lit">🟢 Well-Lit Streetlights</option>
              <option value="moderate">🟡 Partial Lighting</option>
              <option value="poor">🔴 Poorly Lit / Dark Corridor</option>
              <option value="unavailable">⚠️ Data Unavailable (Confidence Decrease)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT */}
      {activeTabSub === 'location' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Dynamic Risk Card */}
          <div className="lg:col-span-5 space-y-6">
            <DynamicSafetyRiskCard
              riskData={riskData}
              loading={loading}
              lastUpdatedText={lastUpdated}
              onOpenDetails={() => setIsDetailsOpen(true)}
              onExploreRoute={() => setActiveTabSub('route')}
              onRefresh={fetchLocationRisk}
            />

            {/* Quick Safety Guidance Banner */}
            <div className="glass-card rounded-2xl p-4 border border-amethyst-700/60 bg-amethyst-950/80 space-y-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-rosegold-400" />
                How Risk Scores Adapt Dynamically:
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Notice how the score changes when you drag the <strong>Time Slider</strong> to 11:30 PM or set <strong>Lighting</strong> to "Poorly Lit". The engine continuously recalibrates risk using normalized location, temporal, activity, and incident weights.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Risk Map */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-card rounded-2xl p-4 border border-amethyst-700/60 bg-amethyst-950/80 flex flex-col h-[520px]">
              <div className="flex items-center justify-between pb-3 border-b border-amethyst-800/60">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rosegold-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Spatial Safety Risk Layer
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Low Risk
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Moderate
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Elevated Zone
                  </span>
                </div>
              </div>

              {/* Map Canvas */}
              <div className="flex-1 w-full rounded-xl overflow-hidden mt-3 relative border border-amethyst-800/60">
                <div ref={mapContainerRef} className="w-full h-full z-10" />
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ROUTE RISK ANALYZER TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Route Configuration & Analysis Card */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="glass-card rounded-2xl p-5 border border-amethyst-700/60 bg-amethyst-950/80 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-amethyst-800/60">
                <Navigation className="w-5 h-5 text-rosegold-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100 uppercase">Route Risk Evaluation</h3>
                  <p className="text-[11px] text-slate-400">Identify highest-risk segments along your journey</p>
                </div>
              </div>

              {/* Preset Route Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Select Preset Corridor:</label>
                <select
                  value={selectedPresetRoute}
                  onChange={(e) => handleSelectPresetRoute(e.target.value)}
                  className="w-full bg-amethyst-950 border border-amethyst-700/80 rounded-xl text-xs text-slate-200 p-2.5 focus:outline-none focus:border-rosegold-400 font-semibold"
                >
                  {PRESET_ROUTES.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Route Summary Metrics Card */}
              {loadingRoute ? (
                <div className="p-4 rounded-xl bg-amethyst-900/40 border border-amethyst-800/40 animate-pulse text-xs text-slate-400">
                  Calculating route risk segments...
                </div>
              ) : routeRiskData && (
                <div className="space-y-4 pt-1">
                  
                  {/* Overall Route Risk Badge */}
                  <div className="p-4 rounded-xl bg-amethyst-900/60 border border-amethyst-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block">Overall Route Risk</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-extrabold ${routeRiskData.overall_route_level === 'LOW' ? 'text-emerald-400' : routeRiskData.overall_route_level === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'}`}>
                          {routeRiskData.overall_route_score} / 100
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          ({routeRiskData.overall_route_label})
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs text-slate-300 font-semibold">
                      <div>{routeRiskData.total_distance_km} km</div>
                      <div className="text-[11px] text-slate-400">~{routeRiskData.estimated_duration_mins} mins</div>
                    </div>
                  </div>

                  {/* Highest Risk Segment Highlight */}
                  {routeRiskData.highest_risk_segment && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 space-y-2">
                      <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>⚠️ Highest-Risk Segment Identified:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-semibold">
                        {routeRiskData.highest_risk_segment.description}
                      </p>
                      <div className="text-[11px] text-slate-300">
                        Score: <span className="font-bold text-rose-300">{routeRiskData.highest_risk_segment.score}/100</span> • Primary factors: {routeRiskData.highest_risk_segment.contributing_factors?.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Safer Alternative Route Recommendation */}
                  {routeRiskData.alternative_route && (
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Recommended Safer Alternative:
                        </span>
                        <span className="text-emerald-400">{routeRiskData.alternative_route.risk_score}/100 Risk</span>
                      </div>
                      <p className="text-xs text-slate-200 font-bold">
                        {routeRiskData.alternative_route.name}
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {routeRiskData.alternative_route.key_advantages?.map((adv, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-slate-400 italic pt-1">
                        + {routeRiskData.alternative_route.additional_distance_km} km (~{routeRiskData.alternative_route.additional_time_mins} min extra). Recommendation only.
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

          {/* Right Column: Route Polyline Map */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-card rounded-2xl p-4 border border-amethyst-700/60 bg-amethyst-950/80 flex flex-col h-[520px]">
              <div className="flex items-center justify-between pb-3 border-b border-amethyst-800/60">
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-rosegold-400" />
                  Route Risk Segment Overlay
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Segments color-coded by contextual score
                </span>
              </div>

              {/* Map Canvas */}
              <div className="flex-1 w-full rounded-xl overflow-hidden mt-3 relative border border-amethyst-800/60">
                <div ref={mapContainerRef} className="w-full h-full z-10" />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Details Modal */}
      <RiskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        riskData={riskData}
        onExploreRoute={() => {
          setIsDetailsOpen(false)
          setActiveTabSub('route')
        }}
      />

    </div>
  )
}
