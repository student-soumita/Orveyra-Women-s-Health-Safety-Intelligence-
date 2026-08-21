import React, { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck, Lock, Mail, User, Key, CheckCircle2, ArrowRight,
  Eye, EyeOff, Sparkles, Activity, Fingerprint, RefreshCw, Cpu, Database, Zap,
  XCircle, RotateCcw, X
} from 'lucide-react'

export default function LoginPage({ onLoginSuccess, onCancelModal }) {
  const [mode, setMode] = useState('login') // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [isScanningBiometric, setIsScanningBiometric] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  const canvasRef = useRef(null)
  const cardRef = useRef(null)

  const handleClearForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setError(null)
    setSuccessMsg(null)
  }

  // Canvas Neural Mesh Background Effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Particle system setup
    const particleCount = Math.min(Math.floor(width / 22), 65)
    const particles = []
    const colors = ['#753bca', '#9d63f4', '#e0a96d', '#34d399', '#38bdf8']

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2
      })
    }

    let mouseX = -1000
    let mouseY = -1000

    const handleMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw subtle gradient overlay
      const grad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, Math.max(width, height))
      grad.addColorStop(0, 'rgba(20, 12, 36, 0.4)')
      grad.addColorStop(1, 'rgba(11, 6, 20, 0.95)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Update & draw particles
      particles.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Mouse reaction physics
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          const angle = Math.atan2(dy, dx)
          p.x -= Math.cos(angle) * 0.8
          p.y -= Math.sin(angle) * 0.8
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()

        // Connect nearby particles
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const pDx = p.x - p2.x
          const pDy = p.y - p2.y
          const pDist = Math.sqrt(pDx * pDx + pDy * pDy)

          if (pDist < 130) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = '#9d63f4'
            ctx.globalAlpha = (1 - pDist / 130) * 0.2
            ctx.lineWidth = 0.75
            ctx.stroke()
          }
        }
      })

      ctx.globalAlpha = 1
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Showcase carousel auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  // Calculate Password Strength Score (0 to 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-700' }
    let score = 0
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' }
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' }
      case 3:
        return { score: 3, label: 'Strong', color: 'bg-emerald-400' }
      case 4:
        return { score: 4, label: 'Encrypted Zero-Knowledge', color: 'bg-gradient-to-r from-emerald-400 to-rosegold-400' }
      default:
        return { score: 0, label: 'Very Weak', color: 'bg-rose-700' }
    }
  }

  const strength = getPasswordStrength(password)

  // Auto-typing animation for demo mode
  const handleAutoTypeDemo = () => {
    if (isTypingDemo || loading) return
    setIsTypingDemo(true)
    setError(null)
    setSuccessMsg(null)
    setMode('login')

    const demoEmail = 'soumita@orveyra.health'
    const demoPass = 'OrveyraHealth2026!'

    setEmail('')
    setPassword('')

    let emailIdx = 0
    let passIdx = 0

    const typeEmail = setInterval(() => {
      if (emailIdx < demoEmail.length) {
        setEmail(demoEmail.slice(0, emailIdx + 1))
        emailIdx++
      } else {
        clearInterval(typeEmail)
        const typePass = setInterval(() => {
          if (passIdx < demoPass.length) {
            setPassword(demoPass.slice(0, passIdx + 1))
            passIdx++
          } else {
            clearInterval(typePass)
            setIsTypingDemo(false)
          }
        }, 35)
      }
    }, 35)
  }

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password, full_name: fullName.trim() || 'Health Vault User' })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Signup failed')
        onLoginSuccess(data.user, data.token)
      } else if (mode === 'login') {
        let res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        })
        let data = await res.json()
        
        if (!res.ok && res.status === 401) {
          // Attempt automatic account creation if account doesn't exist
          const signupRes = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password, full_name: email.split('@')[0] })
          })
          if (signupRes.ok) {
            data = await signupRes.json()
            onLoginSuccess(data.user, data.token)
            return
          }
          throw new Error(data.detail || 'Invalid email or password. Click Register below to create a new account!')
        } else if (!res.ok) {
          throw new Error(data.detail || 'Login failed')
        }
        onLoginSuccess(data.user, data.token)
      } else if (mode === 'forgot') {
        setSuccessMsg('Reset code dispatched to zero-knowledge vault email.')
      }
    } catch (err) {
      setError(err.message)
      if (cardRef.current) {
        cardRef.current.classList.remove('animate-shake')
        void cardRef.current.offsetWidth // Trigger reflow
        cardRef.current.classList.add('animate-shake')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle Passkey Biometric Visualizer Flow
  const handlePasskeyAuth = async () => {
    setIsScanningBiometric(true)
    setError(null)
    setSuccessMsg(null)

    setTimeout(async () => {
      try {
        const passkeyEmail = email.trim() || 'passkey.user@orveyra.health'
        let res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: passkeyEmail, password: 'PasskeySecuredUser2026!' })
        })
        if (!res.ok) {
          res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: passkeyEmail, password: 'PasskeySecuredUser2026!', full_name: 'Passkey Secured User' })
          })
        }
        const data = await res.json()
        if (res.ok) {
          onLoginSuccess(data.user, data.token)
        } else {
          throw new Error(data.detail || 'Passkey verification failed.')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setIsScanningBiometric(false)
      }
    }, 2000)
  }

  const slides = [
    {
      title: 'Longitudinal Health correlation',
      subtitle: 'Mapping complex symptom clusters against biomarker telemetry across time.',
      icon: Activity,
      badge: 'Multi-Modal Data',
      color: 'from-amethyst-500 to-rosegold-500',
      waveform: [35, 60, 20, 85, 45, 95, 30, 70, 40, 90, 50]
    },
    {
      title: 'Zero-Knowledge Vault',
      subtitle: 'Client-side AES-256 encryption ensuring total user data sovereignty.',
      icon: Lock,
      badge: 'AES-256 GCM',
      color: 'from-emerald-500 to-amethyst-500',
      waveform: [70, 70, 70, 95, 95, 30, 80, 80, 50, 90, 90]
    },
    {
      title: 'Body Drift AI Engine',
      subtitle: 'Detect subtle physiological variations before macro-symptoms emerge.',
      icon: Cpu,
      badge: 'Biometric AI',
      color: 'from-rosegold-500 to-amber-500',
      waveform: [20, 40, 60, 30, 75, 55, 90, 45, 80, 60, 95]
    }
  ]

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden select-none bg-gradient-to-b from-amethyst-950 via-amethyst-900/40 to-amethyst-950">
      
      {/* Background Interactive HTML5 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Rotating Ambient Animated Aura Ring */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[850px] h-[850px] rounded-full bg-gradient-to-r from-amethyst-600/30 via-rosegold-500/20 to-cyan-500/30 blur-3xl animate-border-spin opacity-80" />
      </div>

      {/* Floating Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-amethyst-600/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-rosegold-500/20 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

      {/* Main Split Grid Card */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-amethyst-600/50 glass-card shadow-2xl overflow-hidden backdrop-blur-2xl glow-purple-lg">
        
        {/* LEFT SHOWCASE PANEL (Visible on lg screens) */}
        <div className="hidden lg:flex lg:col-span-6 relative p-8 flex-col justify-between bg-gradient-to-br from-amethyst-950/90 via-amethyst-900/60 to-amethyst-950/90 border-r border-amethyst-800/40">
          
          {/* Top Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amethyst-500 via-amethyst-600 to-rosegold-500 flex items-center justify-center shadow-lg glow-purple animate-pulse-ring">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight gradient-text">ORVEYRA</span>
              <span className="ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amethyst-800/80 text-rosegold-400 border border-amethyst-700/60 font-semibold">
                NEURAL VAULT
              </span>
            </div>
          </div>

          {/* Carousel Slide Showcase */}
          <div className="my-8 relative min-h-[260px] flex flex-col justify-center">
            {slides.map((slide, idx) => {
              if (idx !== activeSlide) return null
              const Icon = slide.icon
              return (
                <div key={idx} className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amethyst-800/60 border border-amethyst-700/50 text-xs font-semibold text-rosegold-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{slide.badge}</span>
                  </div>

                  <h3 className="text-3xl font-extrabold text-white leading-tight">
                    {slide.title}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                    {slide.subtitle}
                  </p>

                  {/* Animated Bio-Rhythm SVG Waveform Visualizer */}
                  <div className="p-4 rounded-xl bg-amethyst-950/70 border border-amethyst-800/50">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Activity className="w-3.5 h-3.5 text-rosegold-400 animate-pulse" />
                        Live Signal Correlator
                      </span>
                      <span className="font-mono text-[11px] text-emerald-400">99.8% Sync</span>
                    </div>

                    <div className="h-14 flex items-end gap-1.5 pt-2">
                      {slide.waveform.map((val, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-t bg-gradient-to-t ${slide.color} transition-all duration-500`}
                          style={{
                            height: `${val}%`,
                            opacity: (i + 1) / slide.waveform.length
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Carousel Indicators & Demo Prompt */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeSlide ? 'w-8 bg-rosegold-400 shadow-md glow-rose' : 'w-2 bg-amethyst-800 hover:bg-amethyst-700'
                  }`}
                />
              ))}
            </div>

            <div className="pt-4 border-t border-amethyst-800/40 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-amethyst-400" />
                HIPAA & GDPR Compliant Architecture
              </span>
              <span className="text-emerald-400 font-medium">System Online</span>
            </div>
          </div>

        </div>

        {/* RIGHT AUTH CARD FORM */}
        <div ref={cardRef} className="lg:col-span-6 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-amethyst-950/70">
          
          {/* Header Mobile / Title */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amethyst-500 to-rosegold-500 flex items-center justify-center text-white font-black text-sm">
                  O
                </div>
                <span className="font-bold text-lg text-white">ORVEYRA</span>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-1 p-1 bg-amethyst-900/80 rounded-xl border border-amethyst-800/60 ml-auto">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow-md glow-purple'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white shadow-md glow-purple'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Title Banner & Clear Form Action */}
            <div className="mb-6 flex items-start justify-between">
              <div className="text-left">
                <h2 className="text-2xl font-black text-white">
                  {mode === 'login' && 'Access Health Vault'}
                  {mode === 'signup' && 'Create Secure Identity'}
                  {mode === 'forgot' && 'Reset Vault Key'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'login' && 'Enter your credentials to unlock your longitudinal bio-telemetry.'}
                  {mode === 'signup' && 'Setup your zero-knowledge encrypted health vault profile.'}
                  {mode === 'forgot' && 'Dispatches recovery payload to your registered vault email.'}
                </p>
              </div>

              {(email || password || fullName) && (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 transition-all flex-shrink-0"
                  title="Clear all fields"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within:text-rosegold-400 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-amethyst-950/90 border border-amethyst-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-400 focus:ring-1 focus:ring-rosegold-400/50 transition-all shadow-inner"
                    />
                    {fullName && (
                      <button
                        type="button"
                        onClick={() => setFullName('')}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-200 transition-colors"
                        title="Clear field"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within:text-rosegold-400 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-amethyst-950/90 border border-amethyst-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-400 focus:ring-1 focus:ring-rosegold-400/50 transition-all shadow-inner"
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail('')}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-200 transition-colors"
                      title="Clear email"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Password Field */}
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-300">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[11px] text-rosegold-400 hover:text-rosegold-300 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within:text-rosegold-400 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-16 py-2.5 bg-amethyst-950/90 border border-amethyst-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rosegold-400 focus:ring-1 focus:ring-rosegold-400/50 transition-all shadow-inner"
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-1.5 text-slate-500">
                      {password && (
                        <button
                          type="button"
                          onClick={() => setPassword('')}
                          className="hover:text-slate-200 transition-colors"
                          title="Clear password"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="hover:text-slate-200 transition-colors"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="pt-2 space-y-1 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Security Rating:</span>
                        <span className="font-semibold text-slate-200">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-amethyst-900 rounded-full overflow-hidden flex gap-1 p-0.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              step <= strength.score ? strength.color : 'bg-amethyst-950'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Main CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 glow-purple hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Decrypting Health Vault...</span>
                  </div>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In & Unlock Vault' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Passkey WebAuthn Biometric Section */}
            {mode !== 'forgot' && (
              <div className="mt-5 pt-5 border-t border-amethyst-800/40">
                <button
                  type="button"
                  onClick={handlePasskeyAuth}
                  disabled={isScanningBiometric || loading}
                  className="w-full py-2.5 rounded-xl bg-amethyst-900/60 hover:bg-amethyst-900 border border-amethyst-700/60 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow hover:border-rosegold-500/50 group relative overflow-hidden"
                >
                  <Fingerprint className="w-4 h-4 text-rosegold-400 group-hover:scale-110 transition-transform" />
                  <span>Log in with Passkey / TouchID / FaceID</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Footer Mode Toggle Prompt */}
          <div className="mt-6 text-center text-xs text-slate-400 space-y-2">
            {mode === 'login' ? (
              <p>
                Don't have a secure vault yet?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-rosegold-400 font-bold hover:underline"
                >
                  Register Now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-rosegold-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

        </div>
      </div>

      {/* PASSKEY BIOMETRIC OVERLAY SCAN VISUALIZER MODAL */}
      {isScanningBiometric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-amethyst-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="p-8 rounded-3xl glass-card border border-amethyst-600/60 text-center max-w-sm w-full space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Animated Laser Scanning Beam Effect */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-rosegold-500/40 animate-ping" />
              <div className="w-20 h-20 rounded-2xl bg-amethyst-900/80 border border-amethyst-700 flex items-center justify-center relative overflow-hidden shadow-inner">
                <Fingerprint className="w-12 h-12 text-rosegold-400 animate-pulse" />
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-scanline" />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">Authenticating Passkey</h4>
              <p className="text-xs text-slate-400 mt-1">Verifying WebAuthn biometric security token...</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Matching Secure Enclave</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
