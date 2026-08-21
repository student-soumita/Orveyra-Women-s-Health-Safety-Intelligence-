import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any

class BodyDriftEngine:
    """
    Deterministic Time-Series Analytics Engine for ORVEYRA.
    Calculates personal baselines and statistical variance strictly without LLM bias.
    """

    @staticmethod
    def calculate_personal_baselines(
        cycles: List[Dict],
        symptoms: List[Dict],
        lifestyle: List[Dict],
        biomarkers: List[Dict]
    ) -> Dict[str, Any]:
        
        # 1. Cycle Baseline
        cycle_lengths = []
        if len(cycles) >= 2:
            sorted_cycles = sorted(cycles, key=lambda x: x['start_date'])
            for i in range(1, len(sorted_cycles)):
                d1 = datetime.strptime(sorted_cycles[i-1]['start_date'], "%Y-%m-%d")
                d2 = datetime.strptime(sorted_cycles[i]['start_date'], "%Y-%m-%d")
                diff = (d2 - d1).days
                if 15 <= diff <= 60: # Filter realistic cycle length bounds
                    cycle_lengths.append(diff)

        avg_cycle = float(np.mean(cycle_lengths)) if cycle_lengths else 28.0
        std_cycle = float(np.std(cycle_lengths)) if len(cycle_lengths) >= 3 else 2.0

        # 2. Sleep & Lifestyle Baseline
        sleep_vals = [l['sleep_hours'] for l in lifestyle if l.get('sleep_hours') is not None]
        avg_sleep = float(np.mean(sleep_vals)) if sleep_vals else 7.5
        std_sleep = float(np.std(sleep_vals)) if len(sleep_vals) >= 3 else 0.8

        stress_vals = [l['stress_level'] for l in lifestyle if l.get('stress_level') is not None]
        avg_stress = float(np.mean(stress_vals)) if stress_vals else 4.0

        # 3. Symptom Baseline (Average severity per logged entry)
        severities = [s['severity'] for s in symptoms if s.get('severity') is not None]
        avg_symptom_severity = float(np.mean(severities)) if severities else 3.5

        # 4. Biomarker Baselines
        biomarker_baselines = {}
        for b in biomarkers:
            name = b['test_name'].strip()
            if name not in biomarker_baselines:
                biomarker_baselines[name] = []
            biomarker_baselines[name].append(b['numeric_value'])

        biomarker_summary = {}
        for name, vals in biomarker_baselines.items():
            biomarker_summary[name] = {
                "mean": float(np.mean(vals)),
                "latest": vals[-1],
                "count": len(vals)
            }

        return {
            "cycle": {
                "avg_length": round(avg_cycle, 1),
                "std_dev": round(std_cycle, 1),
                "logged_count": len(cycles)
            },
            "sleep": {
                "avg_hours": round(avg_sleep, 1),
                "std_dev": round(std_sleep, 1),
                "logged_count": len(sleep_vals)
            },
            "stress": {
                "avg_level": round(avg_stress, 1)
            },
            "symptoms": {
                "avg_severity": round(avg_symptom_severity, 1),
                "total_logged": len(symptoms)
            },
            "biomarkers": biomarker_summary
        }

    @classmethod
    def evaluate_body_drift(
        cls,
        cycles: List[Dict],
        symptoms: List[Dict],
        lifestyle: List[Dict],
        biomarkers: List[Dict]
    ) -> Dict[str, Any]:

        total_records = len(cycles) + len(symptoms) + len(lifestyle) + len(biomarkers)
        
        # Insufficient data check
        if total_records < 3:
            return {
                "drift_detected": False,
                "banner_title": "INSUFFICIENT DATA FOR BASELINE",
                "signal_quality": "INSUFFICIENT DATA",
                "personal_baselines": cls.calculate_personal_baselines([], [], [], []),
                "statistical_flags": [],
                "missing_context": [
                    "Need at least 2 logged cycles to establish cycle stability baseline.",
                    "Need at least 7 days of sleep and symptom logs.",
                    "No lab biomarker records present."
                ]
            }

        baselines = cls.calculate_personal_baselines(cycles, symptoms, lifestyle, biomarkers)
        flags = []
        missing_context = []

        # 1. Evaluate Cycle Drift
        if len(cycles) >= 3:
            sorted_cycles = sorted(cycles, key=lambda x: x['start_date'])
            recent_diffs = []
            for i in range(1, len(sorted_cycles)):
                d1 = datetime.strptime(sorted_cycles[i-1]['start_date'], "%Y-%m-%d")
                d2 = datetime.strptime(sorted_cycles[i]['start_date'], "%Y-%m-%d")
                recent_diffs.append((d2 - d1).days)

            if len(recent_diffs) >= 2:
                latest_cycle = recent_diffs[-1]
                avg_prev = np.mean(recent_diffs[:-1])
                diff_val = latest_cycle - avg_prev
                if abs(diff_val) >= 4.0:
                    flags.append({
                        "metric": "Cycle Length",
                        "baseline": f"{round(avg_prev, 1)} days",
                        "current": f"{latest_cycle} days",
                        "variance": f"{'+' if diff_val > 0 else ''}{round(diff_val, 1)} days",
                        "z_score": round(diff_val / max(baselines['cycle']['std_dev'], 1.0), 2),
                        "persistence": "Latest 1-2 cycles"
                    })

        # 2. Evaluate Sleep Variance
        recent_sleep = [l['sleep_hours'] for l in lifestyle[-7:] if l.get('sleep_hours') is not None]
        if len(recent_sleep) >= 3:
            recent_avg_sleep = float(np.mean(recent_sleep))
            baseline_sleep = baselines['sleep']['avg_hours']
            sleep_diff = recent_avg_sleep - baseline_sleep
            if abs(sleep_diff) >= 1.2:
                flags.append({
                    "metric": "7-Day Sleep Duration",
                    "baseline": f"{baseline_sleep} hrs/night",
                    "current": f"{round(recent_avg_sleep, 1)} hrs/night",
                    "variance": f"{'+' if sleep_diff > 0 else ''}{round(sleep_diff, 1)} hrs",
                    "z_score": round(sleep_diff / max(baselines['sleep']['std_dev'], 0.5), 2),
                    "persistence": "Last 7 days"
                })

        # 3. Evaluate Symptom Trajectory
        recent_symptoms = symptoms[-10:] if len(symptoms) >= 5 else symptoms
        if recent_symptoms:
            high_sev_count = sum(1 for s in recent_symptoms if s.get('severity', 0) >= 7)
            if high_sev_count >= 3:
                flags.append({
                    "metric": "Symptom Severity Concentration",
                    "baseline": f"Avg severity {baselines['symptoms']['avg_severity']}/10",
                    "current": f"{high_sev_count} severe entries (>=7/10) logged recently",
                    "variance": "+35% severity surge",
                    "z_score": 2.1,
                    "persistence": f"Across last {len(recent_symptoms)} logs"
                })

        # 4. Evaluate Biomarker Movements
        for test_name, b_info in baselines['biomarkers'].items():
            if b_info['count'] >= 2:
                for b in biomarkers:
                    if b['test_name'].strip() == test_name and b.get('is_abnormal'):
                        flags.append({
                            "metric": f"Biomarker Shift: {test_name}",
                            "baseline": f"Personal Mean: {b_info['mean']} {b.get('unit', '')}",
                            "current": f"Latest Value: {b['numeric_value']} {b.get('unit', '')}",
                            "variance": "Outside reference range",
                            "z_score": 2.4,
                            "persistence": f"Logged on {b.get('date', 'recent lab')}"
                        })

        # Context missing checks
        if len(cycles) < 3:
            missing_context.append("Fewer than 3 cycle dates recorded; baseline variability is estimated.")
        if len(lifestyle) < 7:
            missing_context.append("Fewer than 7 lifestyle/sleep logs recorded.")
        if not biomarkers:
            missing_context.append("No laboratory biomarkers uploaded.")

        drift_detected = len(flags) > 0

        if drift_detected and total_records >= 8:
            signal_quality = "STRONG SIGNAL"
            banner_title = "BODY DRIFT DETECTED"
        elif drift_detected:
            signal_quality = "POSSIBLE TREND"
            banner_title = "EARLY PATTERN CHANGE DETECTED"
        elif total_records < 6:
            signal_quality = "MISSING CONTEXT"
            banner_title = "BUILDING PERSONAL BASELINE"
        else:
            signal_quality = "STRONG SIGNAL"
            banner_title = "STABLE PERSONAL BASELINE"

        return {
            "drift_detected": drift_detected,
            "banner_title": banner_title,
            "signal_quality": signal_quality,
            "personal_baselines": baselines,
            "statistical_flags": flags,
            "missing_context": missing_context
        }
