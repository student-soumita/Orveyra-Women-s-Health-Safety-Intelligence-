import uuid
import datetime
from typing import Dict, Any, List

class DoctorModeService:
    """
    Simplified, Clear Clinician Summary Engine for ORVEYRA.
    Transforms complex health telemetry into plain, human-understandable insights.
    """

    MANDATORY_DISCLAIMER = (
        "This summary is created from your self-reported logs and lab tests to help you have an informed discussion "
        "with your doctor. It is not a medical diagnosis."
    )

    @classmethod
    def evaluate_clinical_impressions(
        cls,
        cycles: List[Dict],
        symptoms: List[Dict],
        biomarkers: List[Dict],
        lifestyle: List[Dict],
        profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Translates multi-stream logs into simple, clear health insights.
        """
        # 1. Cycle intervals calculation
        cycle_lengths = []
        if len(cycles) >= 2:
            sorted_c = sorted(cycles, key=lambda x: x['start_date'])
            for i in range(1, len(sorted_c)):
                try:
                    d1 = datetime.datetime.strptime(sorted_c[i-1]['start_date'], "%Y-%m-%d")
                    d2 = datetime.datetime.strptime(sorted_c[i]['start_date'], "%Y-%m-%d")
                    diff = (d2 - d1).days
                    if 15 <= diff <= 90:
                        cycle_lengths.append(diff)
                except Exception:
                    pass

        avg_cycle = round(sum(cycle_lengths)/len(cycle_lengths), 1) if cycle_lengths else profile.get("typical_cycle_length", 28)
        cycle_variance = (max(cycle_lengths) - min(cycle_lengths)) if len(cycle_lengths) >= 2 else 0
        is_irregular_cycle = avg_cycle > 35 or (len(cycle_lengths) >= 2 and cycle_variance >= 8)

        # 2. Symptoms
        symptom_names = [s.get("symptom_name", "").lower() for s in symptoms]
        has_pcos_symptoms = any(w in " ".join(symptom_names) for w in ["acne", "hirsutism", "hair loss", "hair thinning", "weight gain", "facial hair"])
        has_fatigue = any("fatigue" in s or "tired" in s or "fog" in s for s in symptom_names)
        has_cramps = any("cramp" in s or "pelvic" in s for s in symptom_names)

        # 3. Lab Biomarkers
        lh_val = None
        fsh_val = None
        ferritin_val = None
        tsh_val = None

        for b in biomarkers:
            name = b.get("test_name", "").upper()
            val = b.get("numeric_value")
            if val is not None:
                try:
                    num = float(val)
                    if "LH" in name and "FSH" not in name:
                        lh_val = num
                    elif "FSH" in name:
                        fsh_val = num
                    elif "FERRITIN" in name:
                        ferritin_val = num
                    elif "TSH" in name or "THYROID" in name:
                        tsh_val = num
                except Exception:
                    pass

        # 4. Simple Health Status Determinations

        # A. Cycle Status
        if len(cycles) >= 2:
            if is_irregular_cycle:
                cycle_status = "Irregular / Longer Cycles"
                cycle_color = "amber"
                cycle_desc = f"Your cycles average {avg_cycle} days with ±{cycle_variance} days variance. Longer cycles (>35 days) are worth discussing."
            else:
                cycle_status = "Stable & Regular"
                cycle_color = "emerald"
                cycle_desc = f"Your cycle interval averages {avg_cycle} days, which is in the healthy typical range (24-35 days)."
        elif len(cycles) == 1:
            cycle_status = "1 Cycle Recorded"
            cycle_color = "slate"
            cycle_desc = "Log 1 more cycle date to compare interval consistency."
        else:
            cycle_status = "No Cycles Logged"
            cycle_color = "slate"
            cycle_desc = "Start logging your period dates to track cycle regularity."

        # B. Iron & Energy Status
        if ferritin_val is not None:
            if ferritin_val < 30:
                iron_status = "Low Iron (Ferritin)"
                iron_color = "rose"
                iron_desc = f"Your ferritin is {ferritin_val} ng/mL (optimal is >50 ng/mL). This often causes tiredness and low energy."
            elif ferritin_val < 50:
                iron_status = "Borderline Iron"
                iron_color = "amber"
                iron_desc = f"Ferritin is {ferritin_val} ng/mL. It's in standard range, but functional target is >50 ng/mL."
            else:
                iron_status = "Healthy Iron Levels"
                iron_color = "emerald"
                iron_desc = f"Ferritin is optimal at {ferritin_val} ng/mL."
        elif has_fatigue and any(c.get("flow_intensity") == "Heavy" for c in cycles):
            iron_status = "Possible Low Iron"
            iron_color = "amber"
            iron_desc = "Heavy period flow and frequent fatigue suggest checking your Ferritin levels."
        else:
            iron_status = "Awaiting Blood Work"
            iron_color = "slate"
            iron_desc = "Upload a lab report in Lab Vault to check iron reserves."

        # C. PCOS / Hormone Balance Status
        pcos_indicators = []
        if is_irregular_cycle:
            pcos_indicators.append("Irregular or longer menstrual cycles")
        if has_pcos_symptoms:
            pcos_indicators.append("Symptoms like acne, hair changes, or weight shifts")
        if lh_val and fsh_val and fsh_val > 0 and (lh_val / fsh_val) >= 2.0:
            pcos_indicators.append("Hormone ratio shift (LH higher than FSH)")

        if len(pcos_indicators) >= 2:
            pcos_status = "Possible PCOS / PCOD Pattern"
            pcos_color = "rose"
            pcos_desc = f"Your logs match common PCOS/PCOD indicators: {', '.join(pcos_indicators)}. Worth checking with a pelvic ultrasound & hormone panel."
        elif len(pcos_indicators) == 1:
            pcos_status = "Mild Indicator"
            pcos_color = "amber"
            pcos_desc = f"Noted: {pcos_indicators[0]}. Monitor over the next couple of months."
        else:
            pcos_status = "No PCOS Signs Flagged"
            pcos_color = "emerald"
            pcos_desc = "Your cycle and symptom logs do not show common PCOS patterns."

        # D. Sleep & Rest Status
        sleep_vals = [l.get("sleep_hours") for l in lifestyle if l.get("sleep_hours") is not None]
        if sleep_vals:
            avg_sleep = round(sum(sleep_vals) / len(sleep_vals), 1)
            if avg_sleep >= 7.0:
                sleep_status = "Good Sleep"
                sleep_color = "emerald"
                sleep_desc = f"Averaging {avg_sleep} hours/night, which supports recovery and hormone balance."
            else:
                sleep_status = "Below 7 Hours"
                sleep_color = "amber"
                sleep_desc = f"Averaging {avg_sleep} hrs/night. Aiming for 7.5–8.5 hours can help fatigue."
        else:
            sleep_status = "Awaiting Sleep Logs"
            sleep_color = "slate"
            sleep_desc = "Record your sleep hours in Quick Log to check rest patterns."

        # Main Simple Summary Sentence
        summary_points = []
        if pcos_status.startswith("Possible PCOS"):
            summary_points.append("Possible PCOS/PCOD pattern (irregular cycles & symptoms)")
        if iron_status.startswith("Low Iron"):
            summary_points.append("Low iron reserves (ferritin) causing fatigue")
        if not summary_points:
            if len(cycles) > 0 or len(symptoms) > 0:
                summary_points.append("Overall healthy baseline with normal cycle shifts")
            else:
                summary_points.append("Getting started: Add your cycle dates and lab results to build your personalized summary")

        headline = " & ".join(summary_points)

        # Simple Questions for the Doctor
        suggested_questions = []
        if "PCOS" in headline:
            suggested_questions.append("Given my cycle lengths and symptoms, should we do a pelvic ultrasound or Day 3 hormone test to check for PCOS/PCOD?")
        if "iron" in headline.lower() or iron_status.startswith("Low"):
            suggested_questions.append("Can we review my Ferritin and Iron levels to see if iron supplements or diet changes would boost my energy?")
        suggested_questions.extend([
            "Are my cycle lengths and variations normal for my age and lifestyle?",
            "What simple dietary or wellness steps do you recommend based on my health trends?"
        ])

        return {
            "headline": headline,
            "cycle_card": {"title": "Cycle Health", "status": cycle_status, "color": cycle_color, "description": cycle_desc},
            "pcos_card": {"title": "PCOS / Hormone Balance", "status": pcos_status, "color": pcos_color, "description": pcos_desc},
            "iron_card": {"title": "Iron & Energy Levels", "status": iron_status, "color": iron_color, "description": iron_desc},
            "sleep_card": {"title": "Sleep & Recovery", "status": sleep_status, "color": sleep_color, "description": sleep_desc},
            "suggested_questions": suggested_questions[:4]
        }

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
                try:
                    d1 = datetime.datetime.strptime(sorted_c[i-1]['start_date'], "%Y-%m-%d")
                    d2 = datetime.datetime.strptime(sorted_c[i]['start_date'], "%Y-%m-%d")
                    diff = (d2 - d1).days
                    if 15 <= diff <= 90:
                        cycle_lengths.append(diff)
                except Exception:
                    pass

        avg_cycle = round(sum(cycle_lengths)/len(cycle_lengths), 1) if cycle_lengths else profile.get("typical_cycle_length", 28)
        min_c = min(cycle_lengths) if cycle_lengths else avg_cycle
        max_c = max(cycle_lengths) if cycle_lengths else avg_cycle

        # Top Reported Symptoms
        symptom_counts = {}
        for s in symptoms:
            name = s.get("symptom_name", "General")
            symptom_counts[name] = symptom_counts.get(name, 0) + 1

        top_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:6]
        active_meds = [m for m in medications if m.get("is_active", True)]
        abnormal_labs = [b for b in biomarkers if b.get("is_abnormal")]

        # Simple Health Evaluation
        health_overview = cls.evaluate_clinical_impressions(
            cycles=cycles,
            symptoms=symptoms,
            biomarkers=biomarkers,
            lifestyle=lifestyle,
            profile=profile
        )

        return {
            "title": "ORVEYRA Doctor Visit Summary",
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "patient_info": {
                "name": patient_name,
                "date_of_birth": dob,
                "age": profile.get("age"),
                "blood_group": profile.get("blood_group"),
                "typical_cycle_baseline": f"{profile.get('typical_cycle_length', 28)} days"
            },
            "health_overview": health_overview,
            "longitudinal_metrics": {
                "logged_cycles": len(cycles),
                "recorded_cycle_range": f"{min_c} to {max_c} days (average: {avg_cycle} days)",
                "total_symptoms_logged": len(symptoms),
                "top_symptoms": [{"name": k, "frequency": v} for k, v in top_symptoms],
                "active_medications": active_meds,
                "abnormal_biomarkers": abnormal_labs
            },
            "clinician_discussion_questions": health_overview.get("suggested_questions", []),
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
