import uuid
import datetime
from typing import Dict, Any, List

class DoctorModeService:
    """
    Clinician Summary & Auto-Expiring Share Link Manager for ORVEYRA.
    """

    MANDATORY_DISCLAIMER = (
        "This health summary is generated from self-reported user records and uploaded lab reports "
        "for informational discussion with healthcare providers. It is not a medical diagnosis or treatment plan."
    )

    @classmethod
    def generate_clinician_summary(
        cls,
        profile: Dict[str, Any],
        cycles: List[Dict],
        symptoms: List[Dict],
        lifestyle: List[Dict],
        biomarkers: List[Dict],
        medications: List[Dict],
        ai_observations: Dict[str, Any]
    ) -> Dict[str, Any]:
        
        patient_name = profile.get("full_name") or "Anonymous User"
        dob = profile.get("dob") or "Unspecified"
        
        # Cycle Variability
        cycle_lengths = []
        if len(cycles) >= 2:
            sorted_c = sorted(cycles, key=lambda x: x['start_date'])
            for i in range(1, len(sorted_c)):
                d1 = datetime.datetime.strptime(sorted_c[i-1]['start_date'], "%Y-%m-%d")
                d2 = datetime.datetime.strptime(sorted_c[i]['start_date'], "%Y-%m-%d")
                cycle_lengths.append((d2 - d1).days)

        avg_cycle = round(sum(cycle_lengths)/len(cycle_lengths), 1) if cycle_lengths else profile.get("typical_cycle_length", 28)
        min_c = min(cycle_lengths) if cycle_lengths else avg_cycle
        max_c = max(cycle_lengths) if cycle_lengths else avg_cycle

        # Top Reported Symptoms
        symptom_counts = {}
        for s in symptoms:
            name = s.get("symptom_name", "General")
            symptom_counts[name] = symptom_counts.get(name, 0) + 1

        top_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        # Active Medications
        active_meds = [m for m in medications if m.get("is_active", True)]

        # Abnormal Biomarkers
        abnormal_labs = [b for b in biomarkers if b.get("is_abnormal")]

        discussion_questions = [
            "Are the recorded cycle variations within expected physiological parameters for my age?",
            "How do the observed lab values correlate with my reported fatigue/symptoms?",
            "Would follow-up lab screening (e.g. Ferritin, Thyroid panel, Hormonal baseline) be recommended?",
            "What lifestyle or dietary adjustments align with my current longitudinal trends?"
        ]

        return {
            "title": "ORVEYRA Clinician Health Summary",
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "patient_info": {
                "name": patient_name,
                "date_of_birth": dob,
                "typical_cycle_baseline": f"{profile.get('typical_cycle_length', 28)} days"
            },
            "longitudinal_metrics": {
                "logged_cycles": len(cycles),
                "recorded_cycle_range": f"{min_c} to {max_c} days (mean: {avg_cycle} days)",
                "total_symptoms_logged": len(symptoms),
                "top_symptoms": [{"name": k, "frequency": v} for k, v in top_symptoms],
                "active_medications": active_meds,
                "abnormal_biomarkers": abnormal_labs
            },
            "ai_body_drift_summary": {
                "signal_quality": ai_observations.get("signal_quality", "INSUFFICIENT DATA"),
                "banner_title": ai_observations.get("banner_title", "STABLE BASELINE"),
                "explanation_text": ai_observations.get("explanation_text", "No significant drift detected.")
            },
            "evidence_chain": ai_observations.get("evidence_chain", {}),
            "missing_information": ai_observations.get("missing_context", []),
            "clinician_discussion_questions": discussion_questions,
            "disclaimer": cls.MANDATORY_DISCLAIMER
        }

    @classmethod
    def create_share_token(cls, hours_valid: int = 48) -> Dict[str, Any]:
        token = str(uuid.uuid4())[:18]
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=hours_valid)
        return {
            "token": token,
            "expires_at": expires_at.isoformat(),
            "share_url": f"/doctor-view/{token}"
        }
