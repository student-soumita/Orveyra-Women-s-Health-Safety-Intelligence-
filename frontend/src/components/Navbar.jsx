import React from 'react'
import { Activity, Clock, Network, FileText, MessageSquare, Stethoscope, Shield, PlusCircle, LogIn, UserCheck, LogOut, KeyRound } from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout, onOpenQuickLog }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'timeline', label: 'Timeline & Rewind', icon: Clock },
    { id: 'signal-graph', label: 'Signal Graph', icon: Network },
    { id: 'lab-vault', label: 'Lab Vault', icon: FileText },
    { id: 'ask-timeline', label: 'Ask Timeline', icon: MessageSquare },
    { id: 'doctor-mode', label: 'Doctor Mode', icon: Stethoscope },
    { id: 'privacy-center', label: 'Privacy Center', icon: Shield },
  ]

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
                  HEALTH AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                “Your body leaves clues. ORVEYRA connects them.”
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
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={onOpenQuickLog}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amethyst-600 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white text-sm font-semibold shadow-md transition-all glow-rose"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Quick Log</span>
                </button>
                
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amethyst-900/60 border border-amethyst-800/50 text-xs text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-[100px] truncate">{user.email}</span>
                </div>

                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-amethyst-900/50 transition-colors"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amethyst-800 hover:bg-amethyst-700 text-slate-200 text-xs font-semibold border border-amethyst-600/40 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>Modal Login</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Nav Drawer Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto gap-2 px-4 py-2 border-t border-amethyst-800/40 bg-amethyst-950/90 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-amethyst-800 text-white border border-amethyst-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}

