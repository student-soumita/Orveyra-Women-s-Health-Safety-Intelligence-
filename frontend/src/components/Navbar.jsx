import React from 'react'
import { Activity, Clock, Network, FileText, MessageSquare, Stethoscope, Shield, Headphones, PlusCircle, LogIn, User, LogOut, KeyRound, UserCheck, Compass, ShieldAlert } from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, user, profile, onOpenAuth, onLogout, onOpenQuickLog, onOpenProfile }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'timeline', label: 'Timeline & Rewind', icon: Clock },
    { id: 'signal-graph', label: 'Signal Graph', icon: Network },
    { id: 'lab-vault', label: 'Lab Vault', icon: FileText },
    { id: 'mood-space', label: 'Mood Space', icon: Headphones },
    { id: 'ask-timeline', label: 'Ask Timeline', icon: MessageSquare },
    { id: 'doctor-mode', label: 'Doctor Mode', icon: Stethoscope },
    { id: 'care-finder', label: 'Care Finder', icon: Compass },
    { id: 'immediate-help', label: '🚨 Immediate Help', icon: ShieldAlert },
    { id: 'privacy-center', label: 'Privacy Center', icon: Shield },
  ]

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatar_url

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-amethyst-800/40 bg-amethyst-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amethyst-500 via-amethyst-700 to-rosegold-500 flex items-center justify-center shadow-lg glow-purple">
              <span className="font-extrabold text-white text-xl tracking-wider">O</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight gradient-text">ORVEYRA</span>
                <span className="text-[10px] uppercase font-semibold tracking-widest px-2 py-0.5 rounded-full bg-amethyst-800/60 text-rosegold-400 border border-amethyst-700/50">
                  WOMEN’S HEALTH & SAFETY INTELLIGENCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                “Understand your health. Own your safety”
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amethyst-800/80 text-white border border-amethyst-600/50 glow-purple'
                      : 'text-slate-300 hover:text-white hover:bg-amethyst-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rosegold-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Action Buttons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <button
                  onClick={onOpenQuickLog}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs sm:text-sm font-semibold shadow-md transition-all glow-rose cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Quick Log</span>
                  <span className="sm:hidden">Log</span>
                </button>
                
                {/* User Profile Avatar & Button */}
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl bg-amethyst-900/70 hover:bg-amethyst-800 border border-amethyst-700/60 text-xs text-slate-200 transition-all cursor-pointer shadow-sm hover:border-rosegold-400/50"
                  title="Open My Profile & Photo"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-rosegold-400/80 bg-amethyst-950 flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] font-bold text-rosegold-300">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="max-w-[90px] sm:max-w-[120px] truncate font-semibold text-slate-200">
                    {displayName}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-amethyst-900/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-amethyst-600 to-rosegold-600 text-white glow-purple'
                      : 'bg-amethyst-900/80 hover:bg-amethyst-800 text-rosegold-300 border border-amethyst-700/60'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-rosegold-400" />
                  <span>Animated Login Portal</span>
                </button>

                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-xs font-bold shadow-md transition-all glow-rose"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
