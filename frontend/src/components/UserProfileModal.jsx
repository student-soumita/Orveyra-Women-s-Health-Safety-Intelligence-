import React, { useState, useRef } from 'react'
import { User, Camera, Mail, Calendar, Heart, Shield, CheckCircle2, Save, X, Activity, Scale, Ruler, Phone, AlertCircle } from 'lucide-react'

export default function UserProfileModal({ isOpen, onClose, user, profile, onUpdateProfile }) {
  if (!isOpen) return null

  const fileInputRef = useRef(null)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [dob, setDob] = useState(profile?.dob || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [age, setAge] = useState(profile?.age || '')
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group || 'O+')
  const [heightCm, setHeightCm] = useState(profile?.height_cm || '')
  const [weightKg, setWeightKg] = useState(profile?.weight_kg || '')
  const [medicalConditions, setMedicalConditions] = useState(profile?.medical_conditions || '')
  const [emergencyContact, setEmergencyContact] = useState(profile?.emergency_contact || '')
  const [typicalCycle, setTypicalCycle] = useState(profile?.typical_cycle_length || 28)
  const [typicalPeriod, setTypicalPeriod] = useState(profile?.typical_period_length || 5)
  const [notes, setNotes] = useState(profile?.baseline_notes || '')
  
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  // Calculate BMI if height and weight are provided
  const calculateBMI = () => {
    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null
    const heightM = heightCm / 100
    const bmi = (weightKg / (heightM * heightM)).toFixed(1)
    let category = "Normal"
    if (bmi < 18.5) category = "Underweight"
    else if (bmi >= 25 && bmi < 30) category = "Overweight"
    else if (bmi >= 30) category = "Obese"
    return { value: bmi, category }
  }

  const bmiInfo = calculateBMI()

  // Preset avatar choices
  const presetAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80"
  ]

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Image size should be under 2MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          dob: dob,
          avatar_url: avatarUrl,
          age: age ? parseInt(age) : null,
          blood_group: bloodGroup,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          medical_conditions: medicalConditions,
          emergency_contact: emergencyContact,
          typical_cycle_length: parseInt(typicalCycle) || 28,
          typical_period_length: parseInt(typicalPeriod) || 5,
          baseline_notes: notes
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed to save profile")

      setSuccessMsg("Profile updated successfully!")
      if (onUpdateProfile) {
        onUpdateProfile(data.profile)
      }
      setTimeout(() => {
        setSuccessMsg(null)
        onClose()
      }, 1200)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amethyst-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl p-6 sm:p-8 border border-amethyst-700/60 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amethyst-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amethyst-500 to-rosegold-500 flex items-center justify-center shadow-lg glow-rose">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold gradient-text">My Health Profile</h2>
              <p className="text-xs text-slate-400">Personal identity, biometric baselines & clinical preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-amethyst-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar Photo Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-amethyst-900/40 border border-amethyst-800/60">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-rosegold-400/80 shadow-xl bg-amethyst-950 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-rosegold-300" />
                <span>Upload</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">Profile Avatar / Photo</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-rosegold-300 hover:text-rosegold-200 font-semibold underline"
                >
                  Choose photo from device
                </button>
              </div>

              <p className="text-[11px] text-slate-400">Or pick one of the curated avatars below:</p>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      avatarUrl === url ? 'border-rosegold-400 scale-110 shadow-md' : 'border-amethyst-700/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-amethyst-950/80 border border-amethyst-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rosegold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-amethyst-950/40 border border-amethyst-800/50 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-amethyst-950/80 border border-amethyst-700/80 text-white text-xs focus:outline-none focus:border-rosegold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age (Years)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full px-3.5 py-2.5 rounded-xl bg-amethyst-950/80 border border-amethyst-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rosegold-400"
              />
            </div>
          </div>

          {/* Biometric & Health Matrix */}
          <div className="p-4 rounded-2xl bg-amethyst-950/60 border border-amethyst-800/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-rosegold-400" />
              <span>Biometrics & Body Composition</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-amethyst-900 border border-amethyst-700 text-white text-xs focus:outline-none focus:border-rosegold-400"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="e.g. 165"
                  className="w-full px-3 py-2 rounded-xl bg-amethyst-900 border border-amethyst-700 text-white text-xs focus:outline-none focus:border-rosegold-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 62.5"
                  className="w-full px-3 py-2 rounded-xl bg-amethyst-900 border border-amethyst-700 text-white text-xs focus:outline-none focus:border-rosegold-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Calculated BMI</label>
                <div className="px-3 py-2 rounded-xl bg-amethyst-950 border border-amethyst-800 text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>{bmiInfo ? `${bmiInfo.value}` : '--'}</span>
                  {bmiInfo && (
                    <span className="text-[10px] text-rosegold-300 font-normal">{bmiInfo.category}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menstrual Cycle Target Baselines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Typical Cycle Length (Days)</label>
              <input
                type="number"
                min="20"
                max="60"
                value={typicalCycle}
                onChange={(e) => setTypicalCycle(e.target.value)}
                placeholder="28"
                className="w-full px-3.5 py-2.5 rounded-xl bg-amethyst-950/80 border border-amethyst-700/80 text-white text-xs focus:outline-none focus:border-rosegold-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">Normal physiological interval: 24 to 35 days</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Typical Bleeding Duration (Days)</label>
              <input
                type="number"
                min="2"
                max="14"
                value={typicalPeriod}
                onChange={(e) => setTypicalPeriod(e.target.value)}
                placeholder="5"
                className="w-full px-3.5 py-2.5 rounded-xl bg-amethyst-950/80 border border-amethyst-700/80 text-white text-xs focus:outline-none focus:border-rosegold-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">Average period flow length: 4 to 7 days</p>
            </div>
          </div>

          {/* Medical Conditions & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Known Diagnoses & Conditions</label>
              <input
                type="text"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="e.g. PCOS, Hypothyroidism, Endometriosis"
                className="w-full px-3.5 py-2.5 rounded-xl bg-amethyst-950/80 border border-amethyst-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rosegold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact / Physician</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Dr. Miller (+1 555-0192)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-amethyst-950/80 border border-amethyst-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rosegold-400"
              />
            </div>
          </div>

          {/* Save Button Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amethyst-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-amethyst-900 hover:bg-amethyst-800 border border-amethyst-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amethyst-600 via-amethyst-500 to-rosegold-600 hover:from-amethyst-500 hover:to-rosegold-500 text-white font-bold text-xs shadow-lg transition-all glow-rose disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Health Profile'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
