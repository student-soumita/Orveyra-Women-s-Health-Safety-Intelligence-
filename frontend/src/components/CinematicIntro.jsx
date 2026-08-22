import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Play, FastForward, Volume2, VolumeX, Shield, Activity, Lock, ArrowRight } from 'lucide-react'

export default function CinematicIntro({ onComplete }) {
  const [phase, setPhase] = useState(0) // 0: Start/Black, 1: Beams/Ta-Dum, 2: Logo Reveal, 3: Expansion, 4: Outro
  const [hasStartedSound, setHasStartedSound] = useState(false)
  const [countdown, setCountdown] = useState(6)
  
  const canvasRef = useRef(null)
  const audioCtxRef = useRef(null)
  const animationFrameRef = useRef(null)

  // 🎵 Play Iconic Cinematic "TA-DUM" / Sub-Bass Boom & Harmonic Swell
  const playCinematicTaDum = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime

      // 1. Heavy Cinematic Sub-Bass Impact (The "TA" Boom - 40Hz -> 28Hz)
      const subOsc = ctx.createOscillator()
      const subGain = ctx.createGain()
      subOsc.type = 'sine'
      subOsc.frequency.setValueAtTime(80, now)
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.8)
      subGain.gain.setValueAtTime(0.0001, now)
      subGain.gain.linearRampToValueAtTime(0.75, now + 0.04)
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5)
      subOsc.connect(subGain)
      subGain.connect(ctx.destination)
      subOsc.start(now)
      subOsc.stop(now + 2.6)

      // 2. The Resonant Chord Swell (The "DUMMM" - Amethyst Harmonics)
      const chordNotes = [136.1, 272.2, 432.0, 528.0]
      chordNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = idx === 0 ? 'triangle' : 'sine'
        osc.frequency.setValueAtTime(freq, now + 0.15)
        
        gain.gain.setValueAtTime(0.0001, now + 0.15)
        gain.gain.linearRampToValueAtTime(0.30, now + 0.35)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + 0.15)
        osc.stop(now + 3.9)
      })

      // 3. High Shimmering Light Flare (Crystalline Glass Chime)
      const chimeOsc = ctx.createOscillator()
      const chimeGain = ctx.createGain()
      chimeOsc.type = 'sine'
      chimeOsc.frequency.setValueAtTime(1200, now + 0.25)
      chimeOsc.frequency.exponentialRampToValueAtTime(2400, now + 1.2)
      chimeGain.gain.setValueAtTime(0.0001, now + 0.25)
      chimeGain.gain.linearRampToValueAtTime(0.20, now + 0.35)
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0)
      chimeOsc.connect(chimeGain)
      chimeGain.connect(ctx.destination)
      chimeOsc.start(now + 0.25)
      chimeOsc.stop(now + 3.1)

      setHasStartedSound(true)
    } catch (e) {
      console.warn("AudioContext autostart prevented:", e)
    }
  }

  // Cinematic Timeline Sequence
  useEffect(() => {
    // Phase 1: Beams start + Sound triggers immediately on mount
    const t1 = setTimeout(() => {
      setPhase(1)
      playCinematicTaDum()
    }, 200)

    // Phase 2: Bold Letter Reveal
    const t2 = setTimeout(() => {
      setPhase(2)
    }, 1200)

    // Phase 3: Light Rays Explode / Sub-Title Reveal
    const t3 = setTimeout(() => {
      setPhase(3)
    }, 2800)

    // Phase 4: Dissolve to App
    const t4 = setTimeout(() => {
      setPhase(4)
    }, 5600)

    // Complete Intro & Go to Login
    const t5 = setTimeout(() => {
      onComplete()
    }, 6400)

    // Countdown timer for Skip button
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1))
    }, 1000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearInterval(countdownInterval)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch (e) {}
      }
    }
  }, [])

  // Canvas Netflix-Style Vertical Light Ribbons Animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Create multicolored Netflix-style light rays
    const ribbons = []
    const ribbonColors = [
      'rgba(147, 51, 234, ',   // Amethyst purple
      'rgba(224, 169, 109, ',  // Rosegold amber
      'rgba(192, 132, 252, ',  // Electric violet
      'rgba(244, 63, 94, ',    // Crimson rose
      'rgba(45, 212, 191, ',   // Turquoise glow
      'rgba(168, 85, 247, '    // Deep violet
    ]

    for (let i = 0; i < 45; i++) {
      ribbons.push({
        x: (width / 2) + (Math.random() - 0.5) * (width * 0.7),
        width: Math.random() * 8 + 3,
        speed: Math.random() * 12 + 6,
        length: Math.random() * (height * 0.9) + 200,
        colorPrefix: ribbonColors[i % ribbonColors.length],
        alpha: Math.random() * 0.7 + 0.3,
        yOffset: -Math.random() * height
      })
    }

    let startTime = Date.now()

    const render = () => {
      const elapsed = (Date.now() - startTime) / 1000
      ctx.fillStyle = 'rgba(5, 2, 10, 0.25)' // Cinematic deep black persistence
      ctx.fillRect(0, 0, width, height)

      // Only draw light ribbons during phase 1, 2, 3
      if (phase >= 1 && phase <= 3) {
        ribbons.forEach((r) => {
          r.yOffset += r.speed
          if (r.yOffset > height + r.length) {
            r.yOffset = -r.length
            r.x = (width / 2) + (Math.random() - 0.5) * (width * 0.7)
          }

          const grad = ctx.createLinearGradient(r.x, r.yOffset, r.x, r.yOffset + r.length)
          grad.addColorStop(0, r.colorPrefix + '0)')
          grad.addColorStop(0.5, r.colorPrefix + r.alpha + ')')
          grad.addColorStop(1, r.colorPrefix + '0)')

          ctx.fillStyle = grad
          ctx.fillRect(r.x - r.width / 2, r.yOffset, r.width, r.length)
        })

        // Central converging lens flare
        const flareGrad = ctx.createRadialGradient(width / 2, height / 2, 5, width / 2, height / 2, Math.min(width, height) * 0.6)
        flareGrad.addColorStop(0, 'rgba(168, 85, 247, 0.4)')
        flareGrad.addColorStop(0.3, 'rgba(224, 169, 109, 0.2)')
        flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = flareGrad
        ctx.fillRect(0, 0, width, height)
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [phase])

  return (
    <div 
      onClick={!hasStartedSound ? playCinematicTaDum : undefined}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05020a] text-white overflow-hidden select-none transition-opacity duration-1000 ${
        phase === 4 ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
    >
      
      {/* Background Interactive WebGL/Canvas Light Ribbons */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Cinematic Vignette & Lens Flare Overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />

      {/* Subtle Horizontal Anamorphic Lens Flare Line */}
      <div className={`absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rosegold-400 to-transparent z-15 transform -translate-y-1/2 transition-all duration-1000 ${
        phase >= 2 ? 'opacity-90 scale-x-100 shadow-[0_0_20px_#e0a96d]' : 'opacity-0 scale-x-0'
      }`} />

      {/* TOP BRAND TAG: "A CLINICAL INTELLIGENCE ORIGINAL" */}
      <div className={`absolute top-12 z-20 transition-all duration-700 ${
        phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amethyst-500/40 backdrop-blur-md shadow-2xl">
          <Sparkles className="w-3.5 h-3.5 text-rosegold-400 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-[0.3em] text-slate-300">
            WOMEN’S HEALTH & SAFETY INTELLIGENCE
          </span>
        </div>
      </div>

      {/* CENTER THEATRICAL LOGO TITLE (Netflix-Style Letterform Reveal) */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4">
        
        {/* Glowing Monogram Symbol */}
        <div className={`transition-all duration-1000 mb-6 ${
          phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amethyst-600 via-rosegold-500 to-amber-500 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.7)] glow-purple animate-pulse-ring">
            <span className="text-4xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-2xl">
              O
            </span>
          </div>
        </div>

        {/* Big Bold Netflix-Scale Typography */}
        <div className="overflow-hidden py-4">
          <h1 className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.18em] sm:tracking-[0.25em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-rosegold-300 to-amethyst-200 drop-shadow-[0_10px_35px_rgba(224,169,109,0.5)] transition-all duration-1000 transform ${
            phase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90'
          }`}>
            ORVEYRA
          </h1>
        </div>

        {/* Cinematic Subtitle & Feature Pillars */}
        <div className={`transition-all duration-1000 delay-200 mt-2 space-y-3 ${
          phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <p className="text-xs sm:text-sm md:text-base font-medium tracking-[0.2em] text-slate-300 uppercase max-w-xl mx-auto drop-shadow-md">
            Understand your health. Own your safety
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-2">
            <span className="text-[10px] sm:text-xs font-mono uppercase px-3 py-1 rounded-full bg-amethyst-900/60 border border-amethyst-700/60 text-rosegold-300">
              ⚡ Body Drift™ Engine
            </span>
            <span className="text-[10px] sm:text-xs font-mono uppercase px-3 py-1 rounded-full bg-amethyst-900/60 border border-amethyst-700/60 text-cyan-300">
              🔒 Zero-Knowledge Vault
            </span>
            <span className="text-[10px] sm:text-xs font-mono uppercase px-3 py-1 rounded-full bg-amethyst-900/60 border border-amethyst-700/60 text-teal-300">
              🩺 Doctor Mode
            </span>
          </div>
        </div>

      </div>

      {/* ⏩ NETFLIX-STYLE "SKIP INTRO" BUTTON (Bottom-Right Floating Bumper) */}
      <div className="absolute bottom-10 right-6 sm:right-12 z-30">
        <button
          onClick={onComplete}
          className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-black/70 hover:bg-rosegold-500 hover:text-amethyst-950 border border-slate-700 hover:border-rosegold-400 text-slate-200 text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 cursor-pointer backdrop-blur-md"
        >
          <span>SKIP INTRO</span>
          <FastForward className="w-4 h-4 text-rosegold-400 group-hover:text-amethyst-950 group-hover:translate-x-1 transition-transform fill-current" />
        </button>
      </div>

      {/* Sound Hint in Bottom-Left */}
      <div className="absolute bottom-10 left-6 sm:left-12 z-30">
        <button
          onClick={playCinematicTaDum}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-amethyst-800/60 text-slate-400 hover:text-rosegold-300 text-xs font-mono transition-all cursor-pointer backdrop-blur-md"
        >
          <Volume2 className="w-4 h-4 text-rosegold-400" />
          <span>{hasStartedSound ? 'Ta-Dum Sound Active 🔊' : 'Click For Theatrical Sound 🔊'}</span>
        </button>
      </div>

    </div>
  )
}
