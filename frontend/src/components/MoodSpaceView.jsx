import React, { useState, useEffect, useRef } from 'react'
import { Headphones, Play, Pause, Volume2, Clock, Sparkles, Music, Radio } from 'lucide-react'

// 6 Completely Unique, Distinct Musical Worlds for Each Mood
const MOOD_TRACKS = [
  {
    id: 'calm',
    label: 'Calm',
    emoji: '🌿',
    title: 'Zen Meditation Bell Chimes & Ethereal Flute',
    tagline: 'High-frequency 432Hz celestial bells and Japanese pentatonic meditation chimes',
    color: 'from-teal-500/30 via-amethyst-900 to-amethyst-950',
    border: 'border-teal-500/40',
    badge: 'bg-teal-500/20 text-teal-300',
    instrument: 'Celestial Bell Chimes',
    genre: 'Zen Asian Pentatonic Ambient',
    tempo: 'Slow (3.2s)',
    scaleNotes: [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50], // C Pentatonic Major
    chords: [
      [523.25, 659.25, 783.99, 1046.50], // C Major Bell
      [587.33, 783.99, 880.00, 1174.66], // D Sus
      [659.25, 880.00, 1046.50, 1318.51], // E Minor Bell
      [783.99, 1046.50, 1174.66, 1567.98]  // G Major Bell
    ],
    melody: [1046.50, 880.00, 783.99, 659.25, 783.99, 880.00, 1046.50, 1174.66],
    droneFreq: 432.0,
    droneType: 'sine',
    filterCutoff: 2200,
    pattern: 'chime'
  },
  {
    id: 'anxious',
    label: 'Anxious',
    emoji: '🌊',
    title: 'Acoustic Nylon Guitar & Ocean Relief',
    tagline: 'Fingerpicked acoustic Spanish guitar chords with 174Hz vagus nerve calming tones',
    color: 'from-cyan-500/30 via-amethyst-900 to-amethyst-950',
    border: 'border-cyan-500/40',
    badge: 'bg-cyan-500/20 text-cyan-300',
    instrument: 'Fingerpicked Nylon Guitar',
    genre: 'Acoustic Guitar Ballad',
    tempo: 'Gentle (2.8s)',
    chords: [
      [220.00, 261.63, 329.63, 440.00], // Am (A2, C3, E3, A3)
      [196.00, 246.94, 293.66, 392.00], // G  (G2, B2, D3, G3)
      [174.61, 220.00, 261.63, 349.23], // F  (F2, A2, C3, F3)
      [164.81, 207.65, 246.94, 329.63]  // E7 (E2, G#2, B2, E3)
    ],
    melody: [440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 246.94, 220.00],
    droneFreq: 174.0,
    droneType: 'triangle',
    filterCutoff: 1200,
    pattern: 'arpeggio'
  },
  {
    id: 'low',
    label: 'Low',
    emoji: '🌧️',
    title: 'Melodic Grand Piano Ballad',
    tagline: 'Tender romantic grand piano melody for emotional comfort, healing & gentle uplift',
    color: 'from-rosegold-500/30 via-amethyst-900 to-amethyst-950',
    border: 'border-rosegold-500/40',
    badge: 'bg-rosegold-500/20 text-rosegold-300',
    instrument: 'Solo Concert Grand Piano',
    genre: 'Chopin / Yiruma Style Ballad',
    tempo: 'Flowing (3.4s)',
    chords: [
      [261.63, 329.63, 392.00, 523.25], // C Major
      [164.81, 246.94, 329.63, 392.00], // Em
      [220.00, 261.63, 329.63, 440.00], // Am
      [174.61, 261.63, 329.63, 440.00]  // Fmaj7
    ],
    melody: [523.25, 493.88, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63],
    droneFreq: 528.0,
    droneType: 'sine',
    filterCutoff: 800,
    pattern: 'piano'
  },
  {
    id: 'stressed',
    label: 'Stressed',
    emoji: '🍃',
    title: 'Deep Orchestral Cello & Strings Ensemble',
    tagline: 'Rich bowed cello string harmonies with 136.1Hz Om tone to dissolve muscle tension',
    color: 'from-emerald-500/30 via-amethyst-900 to-amethyst-950',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300',
    instrument: 'Bowed Orchestral Cello',
    genre: 'Cinematic Orchestral Strings',
    tempo: 'Deep & Slow (4.2s)',
    chords: [
      [146.83, 174.61, 220.00, 293.66], // Dm (D2, F2, A2, D3)
      [116.54, 146.83, 174.61, 233.08], // Bb (Bb1, D2, F2, Bb2)
      [174.61, 220.00, 261.63, 349.23], // F  (F2, A2, C3, F3)
      [130.81, 164.81, 196.00, 261.63]  // C  (C2, E2, G2, C3)
    ],
    melody: [293.66, 261.63, 233.08, 220.00, 196.00, 174.61, 164.81, 146.83],
    droneFreq: 136.1,
    droneType: 'sawtooth',
    filterCutoff: 500,
    pattern: 'bowed'
  },
  {
    id: 'focused',
    label: 'Focused',
    emoji: '🕯️',
    title: 'Lo-Fi Chill Rhodes & Study Beat',
    tagline: 'Upbeat jazzy electric Rhodes chords and 40Hz gamma focus pulse for productivity',
    color: 'from-amber-500/30 via-amethyst-900 to-amethyst-950',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300',
    instrument: 'Lo-Fi Electric Rhodes',
    genre: 'Lo-Fi Jazz Hop Beats',
    tempo: 'Brisk (1.8s - 85 BPM)',
    chords: [
      [146.83, 220.00, 261.63, 329.63], // Dm9
      [196.00, 246.94, 329.63, 370.00], // G13
      [130.81, 196.00, 246.94, 329.63], // Cmaj9
      [220.00, 277.18, 329.63, 370.00]  // A7
    ],
    melody: [329.63, 370.00, 440.00, 493.88, 440.00, 370.00, 329.63, 261.63],
    droneFreq: 160.0,
    droneType: 'triangle',
    filterCutoff: 1600,
    pattern: 'lofi'
  },
  {
    id: 'sleep',
    label: 'Sleep',
    emoji: '🌙',
    title: 'Nocturnal Music Box & Concert Harp Lullaby',
    tagline: 'Ultra-slow night music box and gentle harp lullaby with 3Hz Delta sleep frequencies',
    color: 'from-indigo-500/30 via-amethyst-900 to-amethyst-950',
    border: 'border-indigo-500/40',
    badge: 'bg-indigo-500/20 text-indigo-300',
    instrument: 'Celesta Music Box & Harp',
    genre: 'Bedtime Dream Lullaby',
    tempo: 'Ultra-Slow (5.0s - 45 BPM)',
    chords: [
      [103.83, 155.56, 207.65, 261.63], // Ab Major
      [138.59, 174.61, 207.65, 277.18], // Dbmaj7
      [155.56, 196.00, 233.08, 311.13], // Eb6
      [174.61, 207.65, 261.63, 349.23]  // Fm7
    ],
    melody: [622.25, 523.25, 415.30, 349.23, 415.30, 523.25, 622.25, 830.61], // High twinkling music box
    droneFreq: 80.0,
    droneType: 'sine',
    filterCutoff: 400,
    pattern: 'lullaby'
  }
]

export default function MoodSpaceView() {
  const [selectedMood, setSelectedMood] = useState('calm')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.85)

  // Sleep Timer State
  const [timerDuration, setTimerDuration] = useState(0)
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState(0)

  // Guided Breathing Visualizer State
  const [breathPhase, setBreathPhase] = useState('Inhale')
  const [breathSeconds, setBreathSeconds] = useState(4)

  // Audio Context Ref
  const audioCtxRef = useRef(null)
  const masterGainRef = useRef(null)
  const sequenceIntervalRef = useRef(null)

  const currentTrack = MOOD_TRACKS.find(m => m.id === selectedMood) || MOOD_TRACKS[0]

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMusicEngine()
    }
  }, [])

  // Update volume in real-time
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime)
    }
  }, [volume])

  // Direct Click Handler - Guaranteed Synchronous Browser Audio Activation
  const handlePlayMood = (moodId) => {
    if (selectedMood === moodId && isPlaying) {
      stopMusicEngine()
      setIsPlaying(false)
      return
    }

    setSelectedMood(moodId)
    setIsPlaying(true)
    startMusicEngine(moodId)
  }

  const startMusicEngine = (moodId) => {
    stopMusicEngine()
    const track = MOOD_TRACKS.find(m => m.id === moodId) || MOOD_TRACKS[0]

    // 1. Create AudioContext directly inside user click handler
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContext()
    audioCtxRef.current = ctx

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // 2. Master Gain Node
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(volume, ctx.currentTime)
    masterGain.connect(ctx.destination)
    masterGainRef.current = masterGain

    // 3. Ambient Foundation Drone / Frequency Bed (Unique per mood)
    const droneGain = ctx.createGain()
    droneGain.gain.setValueAtTime(0.20, ctx.currentTime)
    droneGain.connect(masterGain)

    const droneFilter = ctx.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.setValueAtTime(track.filterCutoff, ctx.currentTime)
    droneFilter.connect(droneGain)

    // Base drone oscillator
    const droneOsc = ctx.createOscillator()
    droneOsc.type = track.droneType
    droneOsc.frequency.setValueAtTime(track.droneFreq, ctx.currentTime)
    droneOsc.connect(droneFilter)
    droneOsc.start(ctx.currentTime)

    // Sub harmonic warmth
    const subOsc = ctx.createOscillator()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(track.droneFreq * 0.5, ctx.currentTime)
    const subGain = ctx.createGain()
    subGain.gain.setValueAtTime(0.12, ctx.currentTime)
    subOsc.connect(subGain)
    subGain.connect(droneFilter)
    subOsc.start(ctx.currentTime)

    // 4. Start the Mood's Dedicated Musical Composition
    playTrackComposition(ctx, masterGain, track)
  }

  // Plays the distinct musical composition and instrument pattern
  const playTrackComposition = (ctx, targetGain, track) => {
    let step = 0

    // Master filter for the instrument notes
    const instrumentFilter = ctx.createBiquadFilter()
    instrumentFilter.type = 'lowpass'
    instrumentFilter.frequency.setValueAtTime(track.filterCutoff * 1.5, ctx.currentTime)
    instrumentFilter.connect(targetGain)

    const playMusicalBar = () => {
      if (!audioCtxRef.current) return
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }

      const chord = track.chords[step % track.chords.length]
      const melNote = track.melody[step % track.melody.length]
      step++

      // A. Play Harmony Chord Notes according to mood pattern
      chord.forEach((freq, idx) => {
        const staggerDelay = track.pattern === 'chime' ? idx * 160 :
                             track.pattern === 'arpeggio' ? idx * 120 :
                             track.pattern === 'lofi' ? idx * 90 :
                             track.pattern === 'lullaby' ? idx * 280 :
                             idx * 180

        setTimeout(() => {
          if (!audioCtxRef.current) return
          const now = ctx.currentTime

          // Primary Note Oscillator
          const osc1 = ctx.createOscillator()
          // Overtone Oscillator for authentic acoustic timbre
          const osc2 = ctx.createOscillator()

          if (track.pattern === 'chime') {
            // Shimmering High Bell
            osc1.type = 'sine'
            osc2.type = 'sine'
            osc1.frequency.setValueAtTime(freq, now)
            osc2.frequency.setValueAtTime(freq * 2.76, now) // Inharmonic bell chime
          } else if (track.pattern === 'arpeggio') {
            // Nylon Guitar Pluck
            osc1.type = 'triangle'
            osc2.type = 'sine'
            osc1.frequency.setValueAtTime(freq, now)
            osc2.frequency.setValueAtTime(freq * 2, now)
          } else if (track.pattern === 'bowed') {
            // Low Bowed Cello
            osc1.type = 'sawtooth'
            osc2.type = 'triangle'
            osc1.frequency.setValueAtTime(freq, now)
            osc2.frequency.setValueAtTime(freq * 1.003, now) // String ensemble chorus
          } else if (track.pattern === 'lofi') {
            // Jazzy Electric Rhodes
            osc1.type = 'triangle'
            osc2.type = 'sine'
            osc1.frequency.setValueAtTime(freq, now)
            osc2.frequency.setValueAtTime(freq * 3, now)
          } else if (track.pattern === 'lullaby') {
            // Twinkling Music Box / Harp
            osc1.type = 'sine'
            osc2.type = 'sine'
            osc1.frequency.setValueAtTime(freq, now)
            osc2.frequency.setValueAtTime(freq * 2.01, now)
          } else {
            // Solo Grand Piano
            osc1.type = 'sine'
            osc2.type = 'triangle'
            osc1.frequency.setValueAtTime(freq, now)
            osc2.frequency.setValueAtTime(freq * 2, now)
          }

          const noteGain = ctx.createGain()
          const attack = track.pattern === 'bowed' ? 0.35 : track.pattern === 'chime' ? 0.02 : 0.04
          const decay = track.pattern === 'bowed' ? 4.5 : track.pattern === 'lullaby' ? 5.0 : 3.0

          noteGain.gain.setValueAtTime(0.0001, now)
          noteGain.gain.linearRampToValueAtTime(0.35, now + attack)
          noteGain.gain.linearRampToValueAtTime(0.0001, now + decay)

          const overtoneGain = ctx.createGain()
          overtoneGain.gain.setValueAtTime(track.pattern === 'chime' ? 0.25 : 0.15, now)

          osc1.connect(noteGain)
          osc2.connect(overtoneGain)
          overtoneGain.connect(noteGain)
          noteGain.connect(instrumentFilter)

          osc1.start(now)
          osc2.start(now)
          osc1.stop(now + decay + 0.1)
          osc2.stop(now + decay + 0.1)
        }, staggerDelay)
      })

      // B. Play Lead Melodic Solo Note
      setTimeout(() => {
        if (!audioCtxRef.current) return
        const now = ctx.currentTime
        const melOsc = ctx.createOscillator()
        melOsc.type = track.pattern === 'bowed' ? 'sawtooth' : track.pattern === 'lofi' ? 'triangle' : 'sine'
        melOsc.frequency.setValueAtTime(melNote, now)

        const melGain = ctx.createGain()
        const attack = track.pattern === 'bowed' ? 0.25 : 0.03
        const decay = 2.8

        melGain.gain.setValueAtTime(0.0001, now)
        melGain.gain.linearRampToValueAtTime(0.42, now + attack)
        melGain.gain.linearRampToValueAtTime(0.0001, now + decay)

        melOsc.connect(melGain)
        melGain.connect(instrumentFilter)

        melOsc.start(now)
        melOsc.stop(now + decay + 0.1)
      }, 400)

      // C. Lo-Fi Rhythmic Percussion Pulse (Only on Focused mode)
      if (track.pattern === 'lofi') {
        setTimeout(() => {
          if (!audioCtxRef.current) return
          const now = ctx.currentTime
          const beatOsc = ctx.createOscillator()
          beatOsc.type = 'triangle'
          beatOsc.frequency.setValueAtTime(65, now) // Deep kick/tap
          const beatGain = ctx.createGain()
          beatGain.gain.setValueAtTime(0.30, now)
          beatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
          beatOsc.connect(beatGain)
          beatGain.connect(targetGain)
          beatOsc.start(now)
          beatOsc.stop(now + 0.13)
        }, 900)
      }
    }

    // Play first bar immediately
    playMusicalBar()

    const tempoInterval = track.pattern === 'lofi' ? 1800 :
                          track.pattern === 'chime' ? 3200 :
                          track.pattern === 'arpeggio' ? 2800 :
                          track.pattern === 'piano' ? 3400 :
                          track.pattern === 'bowed' ? 4200 : 5000

    sequenceIntervalRef.current = setInterval(playMusicalBar, tempoInterval)
  }

  const stopMusicEngine = () => {
    if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current)
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close()
      } catch (e) {}
      audioCtxRef.current = null
    }
  }

  const toggleMainPlay = () => {
    handlePlayMood(selectedMood)
  }

  // Sleep Timer Countdown
  useEffect(() => {
    if (timerDuration > 0 && isPlaying) {
      setTimerSecondsRemaining(timerDuration * 60)
    }
  }, [timerDuration, isPlaying])

  useEffect(() => {
    let interval = null
    if (isPlaying && timerSecondsRemaining > 0) {
      interval = setInterval(() => {
        setTimerSecondsRemaining(prev => {
          if (prev <= 1) {
            stopMusicEngine()
            setIsPlaying(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, timerSecondsRemaining])

  // Paced Breathing Cycle (4s Inhale - 7s Hold - 8s Exhale)
  useEffect(() => {
    const cycleBreathing = () => {
      setBreathPhase('Inhale')
      setBreathSeconds(4)
      
      setTimeout(() => {
        setBreathPhase('Hold')
        setBreathSeconds(7)
        
        setTimeout(() => {
          setBreathPhase('Exhale')
          setBreathSeconds(8)
        }, 7000)
      }, 4000)
    }

    cycleBreathing()
    const breathInterval = setInterval(cycleBreathing, 19000)
    return () => clearInterval(breathInterval)
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Headphones className="w-6 h-6 text-rosegold-400" />
              <span>Mood Space</span>
            </h1>
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-amethyst-800 text-rosegold-300 border border-amethyst-600/60">
              6 Dedicated Music Tracks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            6 completely different music tracks: Zen Bells, Spanish Guitar, Chopin Piano, Orchestral Cello, Lo-Fi Beat & Night Harp.
          </p>
        </div>

        {/* Master Play & Volume Control */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amethyst-950/80 border border-amethyst-800 shadow-sm">
            <Volume2 className="w-4 h-4 text-rosegold-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-rosegold-400 cursor-pointer"
              title="Volume"
            />
            <span className="text-[11px] font-mono text-slate-300 w-8">{Math.round(volume * 100)}%</span>
          </div>

          <button
            onClick={toggleMainPlay}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-xl transition-all cursor-pointer ${
              isPlaying
                ? 'bg-rose-500 text-white glow-rose animate-pulse'
                : 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white glow-purple'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? `Pause ${currentTrack.label}` : `Play ${currentTrack.label} Music Track`}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE MOOD MUSIC PLAYER BANNER */}
      <div className={`glass-card rounded-3xl p-6 sm:p-8 border ${currentTrack.border} bg-gradient-to-b ${currentTrack.color} space-y-6 shadow-2xl relative overflow-hidden`}>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${currentTrack.badge}`}>
                {currentTrack.label.toUpperCase()} MOOD
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amethyst-900 text-slate-300 border border-amethyst-700">
                {currentTrack.genre}
              </span>
              {isPlaying && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  <span>PLAYING TRACK • {currentTrack.tempo.toUpperCase()}</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-2">
              {currentTrack.emoji} {currentTrack.title}
            </h2>
            <p className="text-xs text-slate-300 max-w-lg">
              {currentTrack.tagline}
            </p>
          </div>

          {/* Big Play / Pause Circle */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => handlePlayMood(currentTrack.id)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-105 cursor-pointer ${
                isPlaying && selectedMood === currentTrack.id
                  ? 'bg-rose-500 glow-rose animate-pulse'
                  : 'bg-gradient-to-br from-amethyst-500 via-rosegold-500 to-amber-500 glow-purple'
              }`}
            >
              {isPlaying && selectedMood === currentTrack.id ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>
            <span className="text-[11px] font-mono text-slate-300 font-semibold">
              {isPlaying && selectedMood === currentTrack.id ? 'NOW PLAYING MUSIC TRACK' : 'CLICK TO PLAY MUSIC TRACK'}
            </span>
          </div>

          {/* Sleep / Session Timer */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-amethyst-950/90 border border-amethyst-800/80">
            <Clock className="w-4 h-4 text-rosegold-400 ml-2 shrink-0" />
            <span className="text-[11px] text-slate-400 font-semibold pr-1">Timer:</span>
            {[0, 15, 30, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setTimerDuration(mins)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  timerDuration === mins
                    ? 'bg-rosegold-500 text-amethyst-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mins === 0 ? '∞' : `${mins}m`}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 6 MOOD MUSIC TRACK CARDS GRID */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Music className="w-4 h-4 text-rosegold-400" />
          <span>Click Any Mood to Hear Its Completely Unique Music Track:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOOD_TRACKS.map((track) => {
            const isThisPlaying = isPlaying && selectedMood === track.id
            const isSelected = selectedMood === track.id

            return (
              <div
                key={track.id}
                onClick={() => handlePlayMood(track.id)}
                className={`p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? `bg-gradient-to-br ${track.color} ${track.border} shadow-xl glow-purple`
                    : 'bg-amethyst-950/70 hover:bg-amethyst-900/60 border-amethyst-800/70 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{track.emoji}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlayMood(track.id); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                      isThisPlaying
                        ? 'bg-rose-500 text-white glow-rose'
                        : 'bg-amethyst-800 group-hover:bg-rosegold-500 text-white group-hover:text-amethyst-950'
                    }`}
                  >
                    {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isThisPlaying ? 'Pause' : 'Play Track'}</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-slate-100">{track.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${track.badge}`}>
                      {track.genre}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                    {track.tagline}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4-7-8 SOMATIC BREATHING SANCTUARY */}
      <div className="p-6 sm:p-8 rounded-3xl bg-amethyst-950/80 border border-amethyst-800/80 text-center space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-rosegold-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rosegold-400" />
          <span>4-7-8 Somatic Breathing Companion</span>
        </span>

        <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full border-2 border-rosegold-400/40 transition-all duration-1000 ${
            breathPhase === 'Inhale' ? 'scale-110 opacity-100 glow-rose' : breathPhase === 'Hold' ? 'scale-105 opacity-80' : 'scale-90 opacity-40'
          }`} />
          
          <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-amethyst-600 via-rosegold-500 to-amber-500 flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-1000 ${
            breathPhase === 'Inhale' ? 'scale-110 shadow-rosegold-500/50' : breathPhase === 'Hold' ? 'scale-105' : 'scale-85'
          }`}>
            <span className="text-base sm:text-lg font-extrabold">{breathPhase}</span>
            <span className="text-xs text-slate-200 mt-0.5">{breathSeconds}s cycle</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Synchronize your breathing with the circle while listening to your selected mood music track to relieve nervous system tension.
        </p>
      </div>

    </div>
  )
}
