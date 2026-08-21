import React from 'react'
import { ShieldAlert } from 'lucide-react'

export default function FooterDisclaimer() {
  return (
    <footer className="w-full bg-amethyst-950/90 border-t border-amethyst-800/50 py-3 px-4 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <ShieldAlert className="w-4 h-4 text-rosegold-500 shrink-0" />
        <span>
          <strong className="text-slate-300">Mandatory Medical Safety Notice:</strong> This platform provides informational health pattern insights and is not a medical diagnosis, clinical opinion, or substitute for professional medical care.
        </span>
      </div>
    </footer>
  )
}
