import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import FooterDisclaimer from './components/FooterDisclaimer'
import AuthModal from './components/AuthModal'
import LoginPage from './components/LoginPage'
import CinematicIntro from './components/CinematicIntro'
import OnboardingFlow from './components/OnboardingFlow'
import QuickLogModal from './components/QuickLogModal'
import EvidenceDrawer from './components/EvidenceDrawer'
import UserProfileModal from './components/UserProfileModal'
import Dashboard from './components/Dashboard'
import TimelineView from './components/TimelineView'
import SignalGraphView from './components/SignalGraphView'
import LabVaultView from './components/LabVaultView'
import MoodSpaceView from './components/MoodSpaceView'
import AskTimelineView from './components/AskTimelineView'
import DoctorModeView from './components/DoctorModeView'
import CareFinderView from './components/CareFinderView'
import ImmediateHelpView from './components/ImmediateHelpView'
import PrivacyCenterView from './components/PrivacyCenterView'
import SafetyIntelligenceView from './components/SafetyIntelligenceView'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [careFinderSpecialty, setCareFinderSpecialty] = useState('all')
  const [showIntro, setShowIntro] = useState(true) // Cinematic intro before login

  // Modals & Drawers
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false)
  const [quickLogTab, setQuickLogTab] = useState('cycle')
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Telemetry state
  const [cycles, setCycles] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [lifestyle, setLifestyle] = useState([])
  const [biomarkers, setBiomarkers] = useState([])
  const [medications, setMedications] = useState([])
  const [documents, setDocuments] = useState([])
  const [bodyDriftData, setBodyDriftData] = useState(null)
  const [incidents, setIncidents] = useState([])

  useEffect(() => {
    checkCurrentSession()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAllData()
    }
  }, [user])

  const checkCurrentSession = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser({ id: data.id, email: data.email, passkey_registered: data.passkey_registered })
        setProfile(data.profile)
      } else {
        setUser(null)
        setActiveTab('login')
      }
    } catch (err) {
      setUser(null)
      setActiveTab('login')
    }
  }

  const fetchAllData = async () => {
    try {
      const [cRes, sRes, lRes, bRes, mRes, dRes, driftRes, incRes] = await Promise.all([
        fetch('/api/logs/cycle'),
        fetch('/api/logs/symptom'),
        fetch('/api/logs/lifestyle'),
        fetch('/api/logs/biomarker'),
        fetch('/api/logs/medication'),
        fetch('/api/vault/documents'),
        fetch('/api/ai/body-drift'),
        fetch('/api/immediate-help/incidents')
      ])

      if (cRes.ok) setCycles(await cRes.json())
      if (sRes.ok) setSymptoms(await sRes.json())
      if (lRes.ok) setLifestyle(await lRes.json())
      if (bRes.ok) setBiomarkers(await bRes.json())
      if (mRes.ok) setMedications(await mRes.json())
      if (dRes.ok) setDocuments(await dRes.json())
      if (driftRes.ok) setBodyDriftData(await driftRes.json())
      if (incRes.ok) setIncidents(await incRes.json())
    } catch (err) {
      console.error("Data refresh error:", err)
    }
  }

  const handleOpenQuickLog = (tab = 'cycle') => {
    setQuickLogTab(typeof tab === 'string' ? tab : 'cycle')
    setIsQuickLogOpen(true)
  }

  const handleLoginSuccess = (userData, token) => {
    setUser(userData)
    setIsAuthOpen(false)
    setActiveTab('dashboard')
    checkCurrentSession()
    fetchAllData()
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setProfile(null)
    setCycles([])
    setSymptoms([])
    setLifestyle([])
    setBiomarkers([])
    setMedications([])
    setDocuments([])
    setBodyDriftData(null)
    setIncidents([])
    setActiveTab('login')
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account and all health data? This action cannot be undone.")) return
    await fetch('/api/auth/account', { method: 'DELETE' })
    handleLogout()
  }

  const handleDeleteLog = async (stream, logId) => {
    try {
      await fetch(`/api/logs/${stream}/${logId}`, { method: 'DELETE' })
      fetchAllData()
    } catch (err) {
      console.error("Delete log error:", err)
    }
  }

  const handleDeleteDocument = async (docId) => {
    try {
      await fetch(`/api/vault/documents/${docId}`, { method: 'DELETE' })
      fetchAllData()
    } catch (err) {
      console.error("Delete document error:", err)
    }
  }

  const showLoginPage = !user || activeTab === 'login'

  return (
    <div className="flex flex-col min-h-screen bg-amethyst-950 text-slate-100 font-sans selection:bg-amethyst-500 selection:text-white">
      {/* Top Navigation Bar - Hidden on Standalone Login Page */}
      {!showLoginPage && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          profile={profile}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onOpenQuickLog={() => handleOpenQuickLog('cycle')}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      )}

      {/* Main Workspace Body */}
      {showLoginPage ? (
        showIntro ? (
          <CinematicIntro
            onComplete={() => setShowIntro(false)}
          />
        ) : (
          <div className="flex-1 w-full flex items-center justify-center">
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onShowIntro={() => setShowIntro(true)}
            />
          </div>
        )
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {isOnboarding ? (
            <OnboardingFlow
              onComplete={() => {
                setIsOnboarding(false)
                checkCurrentSession()
                fetchAllData()
              }}
              onSkip={() => setIsOnboarding(false)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  user={user}
                  profile={profile}
                  bodyDriftData={bodyDriftData}
                  cycles={cycles}
                  symptoms={symptoms}
                  lifestyle={lifestyle}
                  biomarkers={biomarkers}
                  documents={documents}
                  onOpenQuickLog={handleOpenQuickLog}
                  onOpenEvidence={() => setIsEvidenceOpen(true)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onRefreshData={fetchAllData}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineView
                  cycles={cycles}
                  symptoms={symptoms}
                  lifestyle={lifestyle}
                  biomarkers={biomarkers}
                  medications={medications}
                  incidents={incidents}
                  onDeleteLog={handleDeleteLog}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'signal-graph' && (
                <SignalGraphView
                  cycles={cycles}
                  symptoms={symptoms}
                  lifestyle={lifestyle}
                  biomarkers={biomarkers}
                  medications={medications}
                />
              )}

              {activeTab === 'lab-vault' && (
                <LabVaultView
                  documents={documents}
                  biomarkers={biomarkers}
                  onRefresh={fetchAllData}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}

              {activeTab === 'mood-space' && (
                <MoodSpaceView />
              )}

              {activeTab === 'ask-timeline' && (
                <AskTimelineView />
              )}

              {activeTab === 'doctor-mode' && (
                <DoctorModeView
                  onNavigateCareFinder={(specialty) => {
                    setCareFinderSpecialty(specialty || 'all')
                    setActiveTab('care-finder')
                  }}
                  incidents={incidents}
                />
              )}

              {activeTab === 'immediate-help' && (
                <ImmediateHelpView
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'care-finder' && (
                <CareFinderView
                  defaultSpecialty={careFinderSpecialty}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'safety-intel' && (
                <SafetyIntelligenceView
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'privacy-center' && (
                <PrivacyCenterView
                  user={user}
                  profile={profile}
                  onDeleteAccount={handleDeleteAccount}
                  onRefresh={fetchAllData}
                />
              )}
            </>
          )}
        </main>
      )}

      {/* Persistent Clinical Safety Disclaimer Footer */}
      {!showLoginPage && <FooterDisclaimer />}

      {/* Global Modals & Drawers */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onRefreshData={fetchAllData}
        initialTab={quickLogTab}
      />

      <EvidenceDrawer
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        evidenceData={bodyDriftData?.ai_explanation?.evidence_chain}
        signalQuality={bodyDriftData?.ai_explanation?.signal_quality}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        profile={profile}
        onUpdateProfile={(updated) => {
          setProfile(updated)
          fetchAllData()
        }}
      />

    </div>
  )
}
