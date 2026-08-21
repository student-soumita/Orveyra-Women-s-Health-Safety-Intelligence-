import os
import json
import datetime
import shutil
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, Response, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models.schema import (
    User, UserProfile, CycleLog, SymptomLog, LifestyleLog,
    BiomarkerLog, MedicationLog, DocumentVault, AIObservation,
    AuditLog, DoctorShareToken
)
from app.services.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, log_audit
)
from app.services.body_drift import BodyDriftEngine
from app.services.ai_engine import AIEngine, ConversationMemory
from app.services.lab_parser import LabDocumentParser
from app.services.vault import PresignedVaultService
from app.services.doctor_mode import DoctorModeService
from app.middleware.privacy import PIISanitizer

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ORVEYRA Health Intelligence Platform API",
    version="1.0.0",
    description="Multi-tenant longitudinal women's-health tracking and body drift intelligence platform."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploaded_vault")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[str] = None
    typical_cycle_length: Optional[int] = 28
    typical_period_length: Optional[int] = 5
    baseline_notes: Optional[str] = None
    ai_processing_enabled: Optional[bool] = True

class CycleCreateRequest(BaseModel):
    start_date: str
    end_date: Optional[str] = None
    flow_intensity: Optional[str] = "Medium"
    notes: Optional[str] = None

class SymptomCreateRequest(BaseModel):
    date: str
    category: str
    symptom_name: str
    severity: int
    notes: Optional[str] = None

class LifestyleCreateRequest(BaseModel):
    date: str
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[str] = None
    stress_level: Optional[int] = None
    activity_minutes: Optional[int] = None
    weight_kg: Optional[float] = None

class BiomarkerCreateRequest(BaseModel):
    date: str
    lab_name: Optional[str] = None
    test_name: str
    numeric_value: float
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: Optional[bool] = False

class MedicationCreateRequest(BaseModel):
    medication_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    is_active: Optional[bool] = True
    notes: Optional[str] = None

class AskTimelineRequest(BaseModel):
    query: str

class LabVerificationRequest(BaseModel):
    verification_status: str # VERIFIED or REJECTED
    approved_fields: List[Dict[str, Any]]

# ---------------------------------------------------------
# AUTH ENDPOINTS
# ---------------------------------------------------------

@app.post("/api/auth/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this email already exists.")

    user = User(
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize empty profile
    profile = UserProfile(
        user_id=user.id,
        full_name=req.full_name,
        typical_cycle_length=28,
        typical_period_length=5
    )
    db.add(profile)
    db.commit()

    log_audit(db, user.id, "USER_SIGNUP")
    token = create_access_token({"sub": str(user.id), "email": user.email})
    
    response = JSONResponse(content={
        "message": "Account created successfully",
        "user": {"id": user.id, "email": user.email, "full_name": profile.full_name},
        "token": token
    })
    response.set_cookie(key="orveyra_session", value=token, httponly=True, max_age=86400*30, samesite="lax")
    return response

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    log_audit(db, user.id, "USER_LOGIN")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

    response = JSONResponse(content={
        "message": "Logged in successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": profile.full_name if profile else None,
            "passkey_registered": user.passkey_registered
        },
        "token": token
    })
    response.set_cookie(key="orveyra_session", value=token, httponly=True, max_age=86400*30, samesite="lax")
    return response

@app.post("/api/auth/logout")
def logout(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit(db, user.id, "USER_LOGOUT")
    response.delete_cookie(key="orveyra_session")
    return {"message": "Logged out successfully"}

@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    return {
        "id": user.id,
        "email": user.email,
        "passkey_registered": user.passkey_registered,
        "profile": {
            "full_name": profile.full_name if profile else None,
            "dob": profile.dob if profile else None,
            "typical_cycle_length": profile.typical_cycle_length if profile else 28,
            "typical_period_length": profile.typical_period_length if profile else 5,
            "baseline_notes": profile.baseline_notes if profile else None,
            "ai_processing_enabled": profile.ai_processing_enabled if profile else True
        }
    }

@app.post("/api/auth/passkey/register")
def register_passkey(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.passkey_registered = True
    db.commit()
    log_audit(db, user.id, "PASSKEY_REGISTERED")
    return {"message": "WebAuthn / Passkey architectural interface registered successfully."}

@app.delete("/api/auth/account")
def delete_account(response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit(db, user.id, "ACCOUNT_PERMANENT_DELETION")
    db.delete(user)
    db.commit()
    response.delete_cookie(key="orveyra_session")
    return {"message": "Account and all associated multi-tenant data permanently deleted."}

# ---------------------------------------------------------
# PROFILE & ONBOARDING ENDPOINTS
# ---------------------------------------------------------

@app.put("/api/profile")
def update_profile(req: ProfileUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    if req.full_name is not None: profile.full_name = req.full_name
    if req.dob is not None: profile.dob = req.dob
    if req.typical_cycle_length is not None: profile.typical_cycle_length = req.typical_cycle_length
    if req.typical_period_length is not None: profile.typical_period_length = req.typical_period_length
    if req.baseline_notes is not None: profile.baseline_notes = req.baseline_notes
    if req.ai_processing_enabled is not None: profile.ai_processing_enabled = req.ai_processing_enabled

    db.commit()
    log_audit(db, user.id, "PROFILE_UPDATE")
    return {"message": "Profile updated successfully"}

# ---------------------------------------------------------
# LOGGING ENDPOINTS (CYCLES, SYMPTOMS, LIFESTYLE, BIOMARKERS, MEDS)
# ---------------------------------------------------------

@app.post("/api/logs/cycle")
def add_cycle_log(req: CycleCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = CycleLog(
        user_id=user.id,
        start_date=req.start_date,
        end_date=req.end_date,
        flow_intensity=req.flow_intensity,
        notes=req.notes
    )
    db.add(log)
    db.commit()
    log_audit(db, user.id, "ADD_CYCLE_LOG")
    return {"message": "Cycle log recorded successfully", "id": log.id}

@app.get("/api/logs/cycle")
def get_cycle_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cycles = db.query(CycleLog).filter(CycleLog.user_id == user.id).order_by(CycleLog.start_date.desc()).all()
    return [{"id": c.id, "start_date": c.start_date, "end_date": c.end_date, "flow_intensity": c.flow_intensity, "notes": c.notes} for c in cycles]

@app.delete("/api/logs/cycle/{log_id}")
def delete_cycle_log(log_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = db.query(CycleLog).filter(CycleLog.id == log_id, CycleLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Cycle record not found")
    db.delete(log)
    db.commit()
    return {"message": "Cycle log deleted"}

@app.post("/api/logs/symptom")
def add_symptom_log(req: SymptomCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = SymptomLog(
        user_id=user.id,
        date=req.date,
        category=req.category,
        symptom_name=req.symptom_name,
        severity=req.severity,
        notes=req.notes
    )
    db.add(log)
    db.commit()
    log_audit(db, user.id, "ADD_SYMPTOM_LOG")
    return {"message": "Symptom log recorded successfully", "id": log.id}

@app.get("/api/logs/symptom")
def get_symptom_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    symptoms = db.query(SymptomLog).filter(SymptomLog.user_id == user.id).order_by(SymptomLog.date.desc()).all()
    return [{"id": s.id, "date": s.date, "category": s.category, "symptom_name": s.symptom_name, "severity": s.severity, "notes": s.notes} for s in symptoms]

@app.delete("/api/logs/symptom/{log_id}")
def delete_symptom_log(log_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = db.query(SymptomLog).filter(SymptomLog.id == log_id, SymptomLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Symptom record not found")
    db.delete(log)
    db.commit()
    return {"message": "Symptom record deleted"}

@app.post("/api/logs/lifestyle")
def add_lifestyle_log(req: LifestyleCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = LifestyleLog(
        user_id=user.id,
        date=req.date,
        sleep_hours=req.sleep_hours,
        sleep_quality=req.sleep_quality,
        stress_level=req.stress_level,
        activity_minutes=req.activity_minutes,
        weight_kg=req.weight_kg
    )
    db.add(log)
    db.commit()
    log_audit(db, user.id, "ADD_LIFESTYLE_LOG")
    return {"message": "Lifestyle log recorded successfully", "id": log.id}

@app.get("/api/logs/lifestyle")
def get_lifestyle_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).order_by(LifestyleLog.date.desc()).all()
    return [{"id": l.id, "date": l.date, "sleep_hours": l.sleep_hours, "sleep_quality": l.sleep_quality, "stress_level": l.stress_level, "activity_minutes": l.activity_minutes, "weight_kg": l.weight_kg} for l in logs]

@app.post("/api/logs/biomarker")
def add_biomarker_log(req: BiomarkerCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = BiomarkerLog(
        user_id=user.id,
        date=req.date,
        lab_name=req.lab_name,
        test_name=req.test_name,
        numeric_value=req.numeric_value,
        unit=req.unit,
        reference_range=req.reference_range,
        is_abnormal=req.is_abnormal
    )
    db.add(log)
    db.commit()
    log_audit(db, user.id, "ADD_BIOMARKER_LOG")
    return {"message": "Biomarker recorded successfully", "id": log.id}

@app.get("/api/logs/biomarker")
def get_biomarker_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).order_by(BiomarkerLog.date.desc()).all()
    return [{"id": b.id, "date": b.date, "lab_name": b.lab_name, "test_name": b.test_name, "numeric_value": b.numeric_value, "unit": b.unit, "reference_range": b.reference_range, "is_abnormal": b.is_abnormal} for b in logs]

@app.post("/api/logs/medication")
def add_medication_log(req: MedicationCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = MedicationLog(
        user_id=user.id,
        medication_name=req.medication_name,
        dosage=req.dosage,
        frequency=req.frequency,
        start_date=req.start_date,
        end_date=req.end_date,
        is_active=req.is_active,
        notes=req.notes
    )
    db.add(log)
    db.commit()
    log_audit(db, user.id, "ADD_MEDICATION_LOG")
    return {"message": "Medication recorded successfully", "id": log.id}

@app.get("/api/logs/medication")
def get_medication_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meds = db.query(MedicationLog).filter(MedicationLog.user_id == user.id).order_by(MedicationLog.start_date.desc()).all()
    return [{"id": m.id, "medication_name": m.medication_name, "dosage": m.dosage, "frequency": m.frequency, "start_date": m.start_date, "end_date": m.end_date, "is_active": m.is_active, "notes": m.notes} for m in meds]

@app.delete("/api/logs/clear-all")
def clear_all_health_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Clears all health logs (cycles, symptoms, lifestyle, biomarkers, medications, document vault, AI observations) for the authenticated user.
    Resets the health telemetry to an empty baseline state.
    """
    db.query(CycleLog).filter(CycleLog.user_id == user.id).delete(synchronize_session=False)
    db.query(SymptomLog).filter(SymptomLog.user_id == user.id).delete(synchronize_session=False)
    db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).delete(synchronize_session=False)
    db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).delete(synchronize_session=False)
    db.query(MedicationLog).filter(MedicationLog.user_id == user.id).delete(synchronize_session=False)
    db.query(DocumentVault).filter(DocumentVault.user_id == user.id).delete(synchronize_session=False)
    db.query(AIObservation).filter(AIObservation.user_id == user.id).delete(synchronize_session=False)
    db.commit()
    log_audit(db, user.id, "CLEAR_ALL_TELEMETRY_LOGS")
    return {"message": "All health telemetry logs successfully cleared. Reset to empty baseline."}

@app.post("/api/logs/seed-sample")
def seed_sample_telemetry(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Populates 90 days of realistic sample health telemetry for testing all features instantly.
    """
    db.query(CycleLog).filter(CycleLog.user_id == user.id).delete(synchronize_session=False)
    db.query(SymptomLog).filter(SymptomLog.user_id == user.id).delete(synchronize_session=False)
    db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).delete(synchronize_session=False)
    db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).delete(synchronize_session=False)
    db.query(MedicationLog).filter(MedicationLog.user_id == user.id).delete(synchronize_session=False)

    today = datetime.date.today()

    c1 = CycleLog(user_id=user.id, start_date=str(today - datetime.timedelta(days=84)), end_date=str(today - datetime.timedelta(days=79)), flow_intensity="Medium", notes="Normal cycle start")
    c2 = CycleLog(user_id=user.id, start_date=str(today - datetime.timedelta(days=56)), end_date=str(today - datetime.timedelta(days=51)), flow_intensity="Heavy", notes="Slight spotting beforehand")
    c3 = CycleLog(user_id=user.id, start_date=str(today - datetime.timedelta(days=27)), end_date=str(today - datetime.timedelta(days=22)), flow_intensity="Medium", notes="On time")
    db.add_all([c1, c2, c3])

    for i in range(30):
        d_str = str(today - datetime.timedelta(days=i))
        sleep_h = 7.5 + (0.5 if i % 3 == 0 else -0.3 if i % 5 == 0 else 0)
        stress_l = 3 + (2 if 10 <= i <= 15 else 0)
        l_log = LifestyleLog(user_id=user.id, date=d_str, sleep_hours=sleep_h, sleep_quality="Good" if sleep_h >= 7 else "Fair", stress_level=stress_l, activity_minutes=30)
        db.add(l_log)

    s1 = SymptomLog(user_id=user.id, date=str(today - datetime.timedelta(days=5)), category="Pelvic", symptom_name="Cramping", severity=4, notes="Luteal phase onset")
    s2 = SymptomLog(user_id=user.id, date=str(today - datetime.timedelta(days=12)), category="Energy", symptom_name="Fatigue", severity=5, notes="Mid-day drop")
    s3 = SymptomLog(user_id=user.id, date=str(today - datetime.timedelta(days=20)), category="Mood", symptom_name="Anxiety", severity=3, notes="Work deadline")
    db.add_all([s1, s2, s3])

    b1 = BiomarkerLog(user_id=user.id, date=str(today - datetime.timedelta(days=15)), lab_name="Quest Diagnostics", test_name="Ferritin", numeric_value=22.0, unit="ng/mL", reference_range="15-150 ng/mL", is_abnormal=False)
    b2 = BiomarkerLog(user_id=user.id, date=str(today - datetime.timedelta(days=15)), lab_name="Quest Diagnostics", test_name="TSH", numeric_value=2.1, unit="mIU/L", reference_range="0.4-4.0 mIU/L", is_abnormal=False)
    db.add_all([b1, b2])

    db.commit()
    log_audit(db, user.id, "SEED_SAMPLE_HEALTH_TELEMETRY")
    return {"message": "Sample health telemetry seeded successfully"}

# ---------------------------------------------------------
# DOCUMENT VAULT & IDP VERIFICATION GATEKEEPER
# ---------------------------------------------------------

@app.post("/api/vault/upload")
async def upload_lab_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    file_id = f"{user.id}_{int(datetime.datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_id)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Run Layout-Aware IDP Parser
    idp_result = LabDocumentParser.parse_document(file.filename, contents, file.content_type)

    doc = DocumentVault(
        user_id=user.id,
        filename=file.filename,
        mime_type=file.content_type,
        file_path=file_path,
        raw_layout_json=json.dumps(idp_result),
        verification_status="UNVERIFIED",
        confidence_score=idp_result["average_confidence"]
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Generate presigned access token
    doc.presigned_token = PresignedVaultService.generate_presigned_url(doc.id, user.id)
    db.commit()

    log_audit(db, user.id, "DOCUMENT_UPLOAD", endpoint="/api/vault/upload")

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "verification_status": doc.verification_status,
        "presigned_url": doc.presigned_token,
        "idp_extraction": idp_result
    }

@app.get("/api/vault/documents")
def get_documents(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(DocumentVault).filter(DocumentVault.user_id == user.id).order_by(DocumentVault.uploaded_at.desc()).all()
    results = []
    for d in docs:
        presigned = PresignedVaultService.generate_presigned_url(d.id, user.id)
        layout = json.loads(d.raw_layout_json) if d.raw_layout_json else {}
        results.append({
            "id": d.id,
            "filename": d.filename,
            "mime_type": d.mime_type,
            "verification_status": d.verification_status,
            "confidence_score": d.confidence_score,
            "uploaded_at": d.uploaded_at.isoformat(),
            "presigned_url": presigned,
            "idp_extraction": layout
        })
    return results

@app.post("/api/vault/verify/{document_id}")
def verify_lab_document(
    document_id: int,
    req: LabVerificationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(DocumentVault).filter(DocumentVault.id == document_id, DocumentVault.user_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.verification_status = req.verification_status.upper()
    db.commit()

    if req.verification_status.upper() == "VERIFIED":
        # Insert approved extracted fields into BiomarkerLog with lineage linkage
        today_str = datetime.date.today().isoformat()
        for field in req.approved_fields:
            bio = BiomarkerLog(
                user_id=user.id,
                date=today_str,
                lab_name=doc.filename,
                test_name=field["test_name"],
                numeric_value=field["numeric_value"],
                unit=field.get("unit"),
                reference_range=field.get("reference_range"),
                is_abnormal=field.get("is_abnormal", False),
                source_document_id=doc.id
            )
            db.add(bio)
        db.commit()

    log_audit(db, user.id, f"DOCUMENT_VERIFICATION_{req.verification_status.upper()}")
    return {"message": f"Document status updated to {req.verification_status.upper()}"}

@app.get("/api/vault/file/{document_id}")
def download_vault_file(
    document_id: int,
    expires: int,
    signature: str,
    db: Session = Depends(get_db)
):
    doc = db.query(DocumentVault).filter(DocumentVault.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")

    if not PresignedVaultService.verify_presigned_url(document_id, doc.user_id, expires, signature):
        raise HTTPException(status_code=403, detail="Presigned URL link invalid or expired")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Physical file missing on server")

    return FileResponse(doc.file_path, media_type=doc.mime_type, filename=doc.filename)

# ---------------------------------------------------------
# DETERMINISTIC BODY DRIFT & AI ENGINE ENDPOINTS
# ---------------------------------------------------------

@app.get("/api/ai/body-drift")
def get_body_drift_analysis(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if profile and not profile.ai_processing_enabled:
        return {
            "ai_disabled": True,
            "banner_title": "AI PROCESSING PAUSED",
            "explanation_text": "AI body drift analysis has been paused in your Privacy Center preferences.",
            "disclaimer": AIEngine.MANDATORY_DISCLAIMER
        }

    cycles = [c.__dict__ for c in db.query(CycleLog).filter(CycleLog.user_id == user.id).all()]
    symptoms = [s.__dict__ for s in db.query(SymptomLog).filter(SymptomLog.user_id == user.id).all()]
    lifestyle = [l.__dict__ for l in db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).all()]
    biomarkers = [b.__dict__ for b in db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).all()]

    drift_math = BodyDriftEngine.evaluate_body_drift(cycles, symptoms, lifestyle, biomarkers)
    explanation = AIEngine.generate_explanation_from_drift(drift_math, profile.__dict__ if profile else None)

    return {
        "math_engine_output": drift_math,
        "ai_explanation": explanation
    }

@app.post("/api/ai/ask-timeline")
def ask_timeline(req: AskTimelineRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if profile and not profile.ai_processing_enabled:
        raise HTTPException(status_code=400, detail="AI processing is currently disabled in your Privacy Center preferences.")

    # Aggregate timeline context
    timeline_context = []
    cycles = db.query(CycleLog).filter(CycleLog.user_id == user.id).all()
    for c in cycles:
        timeline_context.append({"type": "cycle", "start_date": c.start_date, "end_date": c.end_date, "flow": c.flow_intensity, "notes": c.notes})

    symptoms = db.query(SymptomLog).filter(SymptomLog.user_id == user.id).all()
    for s in symptoms:
        timeline_context.append({"type": "symptom", "date": s.date, "category": s.category, "symptom": s.symptom_name, "severity": s.severity, "notes": s.notes})

    lifestyle = db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).all()
    for l in lifestyle:
        timeline_context.append({"type": "lifestyle", "date": l.date, "sleep_hours": l.sleep_hours, "stress": l.stress_level})

    biomarkers = db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).all()
    for b in biomarkers:
        timeline_context.append({"type": "biomarker", "date": b.date, "test_name": b.test_name, "numeric_value": b.numeric_value, "unit": b.unit, "is_abnormal": b.is_abnormal})

    meds = db.query(MedicationLog).filter(MedicationLog.user_id == user.id).all()
    for m in meds:
        timeline_context.append({"type": "medication", "name": m.medication_name, "dosage": m.dosage, "frequency": m.frequency})

    # Include Body Drift calculation
    drift_math = BodyDriftEngine.evaluate_body_drift(
        [c.__dict__ for c in cycles],
        [s.__dict__ for s in symptoms],
        [l.__dict__ for l in lifestyle],
        [b.__dict__ for b in biomarkers]
    )
    if drift_math.get("statistical_flags"):
        for f in drift_math["statistical_flags"]:
            timeline_context.append({"type": "body_drift_flag", "metric": f.get("metric"), "variance": f.get("variance"), "baseline": f.get("baseline"), "current": f.get("current")})

    result = AIEngine.ask_timeline_grounded(req.query, timeline_context, profile.__dict__ if profile else None, user_id=user.id)
    log_audit(db, user.id, "ASK_TIMELINE_QUERY")
    return result

class SetKeyRequest(BaseModel):
    api_key: str

@app.get("/api/ai/status")
def get_ai_status(user: User = Depends(get_current_user)):
    load_dotenv()
    key = os.getenv("GEMINI_API_KEY", "").strip()
    is_active = bool(key and key != "your_gemini_api_key_here")
    return {
        "ai_connected": is_active,
        "status": "active" if is_active else "standby"
    }

@app.post("/api/ai/set-key")
def set_gemini_api_key(req: SetKeyRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Set Gemini API key at runtime (stored in process env and saved to .env)."""
    new_key = req.api_key.strip()
    os.environ["GEMINI_API_KEY"] = new_key
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    try:
        with open(env_path, "w") as f:
            f.write(f"GEMINI_API_KEY={new_key}\n")
    except Exception as e:
        print(f"[Main] Error writing to .env: {e}")

    # Force re-initialization of the model instance
    AIEngine._configured_key = None
    AIEngine._model_instance = None
    
    model = AIEngine._get_model()
    log_audit(db, user.id, "SET_GEMINI_API_KEY")
    if model:
        return {"message": f"Google Gemini API connected successfully to model {AIEngine._model_name}!", "connected": True, "model": AIEngine._model_name}
    else:
        return {"message": "API key saved, but Gemini connection failed. Please check key validity.", "connected": False}

@app.post("/api/ai/clear-chat")
def clear_chat_memory(user: User = Depends(get_current_user)):
    """Clear conversation history for this user."""
    ConversationMemory.clear(user.id)
    return {"message": "Chat conversation history cleared."}

@app.post("/api/ai/privacy-inspect")
def inspect_privacy_sanitization(req: AskTimelineRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    sanitized = PIISanitizer.sanitize_text(
        req.query,
        user_name=profile.full_name if profile else None,
        user_email=user.email
    )
    return {
        "raw_input": req.query,
        "sanitized_output": sanitized,
        "redactions_applied": sanitized != req.query
    }

# ---------------------------------------------------------
# DOCTOR MODE ENDPOINTS
# ---------------------------------------------------------

@app.get("/api/doctor/summary")
def get_doctor_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    cycles = [c.__dict__ for c in db.query(CycleLog).filter(CycleLog.user_id == user.id).all()]
    symptoms = [s.__dict__ for s in db.query(SymptomLog).filter(SymptomLog.user_id == user.id).all()]
    lifestyle = [l.__dict__ for l in db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).all()]
    biomarkers = [b.__dict__ for b in db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).all()]
    meds = [m.__dict__ for m in db.query(MedicationLog).filter(MedicationLog.user_id == user.id).all()]

    drift_math = BodyDriftEngine.evaluate_body_drift(cycles, symptoms, lifestyle, biomarkers)
    explanation = AIEngine.generate_explanation_from_drift(drift_math, profile.__dict__ if profile else None)

    summary = DoctorModeService.generate_clinician_summary(
        profile.__dict__ if profile else {},
        cycles, symptoms, lifestyle, biomarkers, meds,
        explanation
    )
    log_audit(db, user.id, "GENERATE_DOCTOR_SUMMARY")
    return summary

@app.post("/api/doctor/share-token")
def create_doctor_share_token(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token_info = DoctorModeService.create_share_token(hours_valid=48)
    expires_dt = datetime.datetime.fromisoformat(token_info["expires_at"])
    
    st = DoctorShareToken(
        user_id=user.id,
        token=token_info["token"],
        expires_at=expires_dt,
        access_count=0
    )
    db.add(st)
    db.commit()
    log_audit(db, user.id, "CREATE_DOCTOR_SHARE_TOKEN")
    return token_info

@app.get("/api/doctor/public/{token}")
def get_public_doctor_summary(token: str, db: Session = Depends(get_db)):
    st = db.query(DoctorShareToken).filter(DoctorShareToken.token == token).first()
    if not st or datetime.datetime.utcnow() > st.expires_at:
        raise HTTPException(status_code=404, detail="Doctor share link invalid or expired.")

    st.access_count += 1
    db.commit()

    user = db.query(User).filter(User.id == st.user_id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    cycles = [c.__dict__ for c in db.query(CycleLog).filter(CycleLog.user_id == user.id).all()]
    symptoms = [s.__dict__ for s in db.query(SymptomLog).filter(SymptomLog.user_id == user.id).all()]
    lifestyle = [l.__dict__ for l in db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).all()]
    biomarkers = [b.__dict__ for b in db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).all()]
    meds = [m.__dict__ for m in db.query(MedicationLog).filter(MedicationLog.user_id == user.id).all()]

    drift_math = BodyDriftEngine.evaluate_body_drift(cycles, symptoms, lifestyle, biomarkers)
    explanation = AIEngine.generate_explanation_from_drift(drift_math, profile.__dict__ if profile else None)

    summary = DoctorModeService.generate_clinician_summary(
        profile.__dict__ if profile else {},
        cycles, symptoms, lifestyle, biomarkers, meds,
        explanation
    )
    return summary

# ---------------------------------------------------------
# SAMPLE TELEMETRY SEED & DEMO ENDPOINTS
# ---------------------------------------------------------

@app.post("/api/logs/seed-sample")
def seed_sample_telemetry(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Populates realistic 90-day sample telemetry for user testing without overwriting existing data.
    """
    # 1. Sample Cycles
    db.add(CycleLog(user_id=user.id, start_date="2026-06-01", end_date="2026-06-06", flow_intensity="Medium", notes="Baseline cycle"))
    db.add(CycleLog(user_id=user.id, start_date="2026-07-01", end_date="2026-07-06", flow_intensity="Heavy", notes="30-day interval"))
    db.add(CycleLog(user_id=user.id, start_date="2026-08-08", end_date="2026-08-14", flow_intensity="Heavy", notes="38-day interval, delayed cycle"))

    # 2. Sample Symptoms
    db.add(SymptomLog(user_id=user.id, date="2026-08-05", category="Pelvic", symptom_name="Pelvic Cramping", severity=8, notes="Severe cramping prior to menses"))
    db.add(SymptomLog(user_id=user.id, date="2026-08-06", category="Mood", symptom_name="Mood Fluctuations & Irritability", severity=7, notes="Pre-menstrual luteal phase shift"))
    db.add(SymptomLog(user_id=user.id, date="2026-08-07", category="Energy", symptom_name="Fatigue & Brain Fog", severity=8, notes="Exertion fatigue"))
    db.add(SymptomLog(user_id=user.id, date="2026-08-10", category="Skin", symptom_name="Hormonal Acne Surge", severity=6, notes="Jawline breakouts"))

    # 3. Sample Lifestyle & Sleep
    db.add(LifestyleLog(user_id=user.id, date="2026-08-04", sleep_hours=5.5, sleep_quality="Poor", stress_level=8, activity_minutes=20, weight_kg=62.0))
    db.add(LifestyleLog(user_id=user.id, date="2026-08-05", sleep_hours=5.0, sleep_quality="Poor", stress_level=9, activity_minutes=15, weight_kg=62.2))
    db.add(LifestyleLog(user_id=user.id, date="2026-08-06", sleep_hours=6.0, sleep_quality="Fair", stress_level=7, activity_minutes=30, weight_kg=62.1))
    db.add(LifestyleLog(user_id=user.id, date="2026-08-07", sleep_hours=5.8, sleep_quality="Poor", stress_level=8, activity_minutes=10, weight_kg=62.3))

    # 4. Sample Biomarkers
    db.add(BiomarkerLog(user_id=user.id, date="2026-08-02", lab_name="Quest Diagnostics", test_name="Ferritin", numeric_value=14.2, unit="ng/mL", reference_range="15.0 - 150.0", is_abnormal=True))
    db.add(BiomarkerLog(user_id=user.id, date="2026-08-02", lab_name="Quest Diagnostics", test_name="Vitamin D (25-OH)", numeric_value=22.0, unit="ng/mL", reference_range="30.0 - 100.0", is_abnormal=True))
    db.add(BiomarkerLog(user_id=user.id, date="2026-08-02", lab_name="Quest Diagnostics", test_name="TSH", numeric_value=3.85, unit="uIU/mL", reference_range="0.40 - 4.50", is_abnormal=False))
    db.add(BiomarkerLog(user_id=user.id, date="2026-08-02", lab_name="Quest Diagnostics", test_name="FSH / LH Ratio", numeric_value=2.1, unit="ratio", reference_range="1.0 - 1.5", is_abnormal=True))

    # 5. Sample Medication
    db.add(MedicationLog(user_id=user.id, medication_name="Magnesium Glycinate", dosage="400mg", frequency="Daily at bedtime", start_date="2026-07-01", is_active=True, notes="For sleep and muscle relaxation"))

    db.commit()
    log_audit(db, user.id, "SEED_SAMPLE_TELEMETRY")
    return {"message": "Sample health telemetry seeded successfully. Explore your populated dashboard!"}

@app.delete("/api/logs/clear-all")
def clear_all_telemetry(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CycleLog).filter(CycleLog.user_id == user.id).delete()
    db.query(SymptomLog).filter(SymptomLog.user_id == user.id).delete()
    db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).delete()
    db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).delete()
    db.query(MedicationLog).filter(MedicationLog.user_id == user.id).delete()
    db.query(DocumentVault).filter(DocumentVault.user_id == user.id).delete()
    db.commit()
    log_audit(db, user.id, "CLEAR_ALL_TELEMETRY")
    return {"message": "All telemetry records cleared. Dashboard reset to clean baseline state."}

@app.post("/api/privacy/toggle-ai")
def toggle_ai_processing(enabled: bool, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if profile:
        profile.ai_processing_enabled = enabled
        db.commit()
    log_audit(db, user.id, f"TOGGLE_AI_PROCESSING_{enabled}")
    return {"message": f"AI Processing set to {enabled}"}

@app.get("/api/privacy/export-archive")
def export_user_archive(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    cycles = [c.__dict__ for c in db.query(CycleLog).filter(CycleLog.user_id == user.id).all()]
    symptoms = [s.__dict__ for s in db.query(SymptomLog).filter(SymptomLog.user_id == user.id).all()]
    lifestyle = [l.__dict__ for l in db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).all()]
    biomarkers = [b.__dict__ for b in db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).all()]
    meds = [m.__dict__ for m in db.query(MedicationLog).filter(MedicationLog.user_id == user.id).all()]

    for item_list in [cycles, symptoms, lifestyle, biomarkers, meds]:
        for item in item_list:
            if "_sa_instance_state" in item:
                del item["_sa_instance_state"]

    log_audit(db, user.id, "EXPORT_DATA_ARCHIVE")
    return {
        "export_date": datetime.datetime.utcnow().isoformat(),
        "user_email": user.email,
        "profile": {
            "full_name": profile.full_name if profile else None,
            "dob": profile.dob if profile else None
        },
        "data_streams": {
            "cycle_logs": cycles,
            "symptom_logs": symptoms,
            "lifestyle_logs": lifestyle,
            "biomarker_logs": biomarkers,
            "medication_logs": meds
        }
    }

@app.delete("/api/privacy/delete-stream/{stream_name}")
def delete_data_stream(stream_name: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sn = stream_name.lower().strip()
    if sn == "cycles":
        db.query(CycleLog).filter(CycleLog.user_id == user.id).delete()
    elif sn == "symptoms":
        db.query(SymptomLog).filter(SymptomLog.user_id == user.id).delete()
    elif sn == "lifestyle":
        db.query(LifestyleLog).filter(LifestyleLog.user_id == user.id).delete()
    elif sn == "biomarkers":
        db.query(BiomarkerLog).filter(BiomarkerLog.user_id == user.id).delete()
    elif sn == "medications":
        db.query(MedicationLog).filter(MedicationLog.user_id == user.id).delete()
    else:
        raise HTTPException(status_code=400, detail="Invalid data stream name")

    db.commit()
    log_audit(db, user.id, f"DELETE_STREAM_{sn.upper()}")
    return {"message": f"Data stream '{stream_name}' cleared successfully."}
