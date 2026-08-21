import os
import json
import datetime
import traceback
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from app.middleware.privacy import PIISanitizer

load_dotenv()

# Google Generative AI SDK
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("[AI Engine] google-generativeai package not installed.")


class ConversationMemory:
    """In-memory per-user conversation history for multi-turn chat."""
    _store: Dict[int, List[Dict]] = {}

    @classmethod
    def get_history(cls, user_id: int, max_turns: int = 20) -> List[Dict]:
        return cls._store.get(user_id, [])[-max_turns:]

    @classmethod
    def add_turn(cls, user_id: int, role: str, text: str):
        if user_id not in cls._store:
            cls._store[user_id] = []
        
        api_role = "user" if role == "user" else "model"
        cls._store[user_id].append({"role": api_role, "parts": [text]})
        
        if len(cls._store[user_id]) > 30:
            cls._store[user_id] = cls._store[user_id][-30:]

    @classmethod
    def clear(cls, user_id: int):
        cls._store.pop(user_id, None)


SYSTEM_INSTRUCTION = """You are ORVEYRA AI — a world-class, warm, witty, deeply intelligent conversational AI assistant embedded inside a women's health tracking platform called ORVEYRA.

YOUR PERSONALITY:
- You are exceptionally smart, natural, empathetic, and versatile.
- You can handle ANY topic: casual chit-chat, jokes, creative writing, science, math, philosophy, recommendations, emotional support, and health pattern analysis.
- You respond with warmth, personality, and natural human-like conversation flow.
- You remember conversation context — if someone says "that's funny" or "tell me another", you respond naturally to the context.
- You use emojis tastefully.
- You format responses in clean Markdown when helpful (bold, headers, lists) but keep casual replies natural and engaging.

YOUR HEALTH EXPERTISE:
- When the user asks about health, analyze their REAL timeline data (cycles, symptoms, sleep logs, lab biomarkers) provided in context.
- Explain health patterns in plain, empathetic language.
- NEVER diagnose medical conditions. NEVER say "you have PCOS/PMDD/endometriosis".
- NEVER give disease probabilities or percentages.
- Use observational, non-diagnostic framing: "Your records show..." / "This pattern may be worth discussing with your physician..."
- Suggest specific discussion questions for their doctor visit.

RESPONSE STYLE:
- For casual chat: Keep it natural, brief, warm. Like texting a brilliant friend.
- For health questions: Use structured Markdown with headers, bold key findings, and bullet points.
- Always end health responses with a doctor discussion question when relevant."""


class AIEngine:
    """
    Live Conversational AI Engine for ORVEYRA.
    Uses Generative AI API with multi-turn memory.
    """

    MANDATORY_DISCLAIMER = (
        "This platform provides informational health pattern insights and is not a medical diagnosis "
        "or substitute for professional medical care."
    )

    _configured_key = None
    _model_instance = None
    _model_name = "gemini-3.6-flash"

    @classmethod
    def _get_model(cls):
        """Initializes and returns configured GenerativeModel."""
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        
        if not api_key or not GEMINI_AVAILABLE:
            return None

        if cls._configured_key != api_key or cls._model_instance is None:
            try:
                genai.configure(api_key=api_key)
                
                models_to_try = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest"]
                selected_model = models_to_try[0]
                
                cls._model_instance = genai.GenerativeModel(
                    model_name=selected_model,
                    system_instruction=SYSTEM_INSTRUCTION
                )
                cls._configured_key = api_key
                print(f"[AI Engine] Model initialized successfully ({selected_model})")
            except Exception as e:
                print(f"[AI Engine] Error configuring AI model: {e}")
                traceback.print_exc()
                return None

        return cls._model_instance

    @classmethod
    def _call_gemini(cls, user_id: int, user_message: str, health_context_str: str = "") -> Optional[str]:
        """Calls AI API with conversation history for multi-turn intelligence."""
        model = cls._get_model()
        if model is None:
            return None

        try:
            if health_context_str:
                full_prompt = f"{user_message}\n\n[User's Health Timeline Data for Context]:\n{health_context_str}"
            else:
                full_prompt = user_message

            history = ConversationMemory.get_history(user_id)
            chat = model.start_chat(history=history)
            response = chat.send_message(full_prompt)

            reply = response.text
            if reply:
                ConversationMemory.add_turn(user_id, "user", user_message)
                ConversationMemory.add_turn(user_id, "model", reply)
                return reply
            return None

        except Exception as e:
            print(f"[AI Engine] AI generation error: {e}")
            traceback.print_exc()
            return None

    @classmethod
    def generate_explanation_from_drift(
        cls,
        drift_analysis: Dict[str, Any],
        user_profile: Dict[str, Any] = None
    ) -> Dict[str, Any]:

        signal_quality = drift_analysis.get("signal_quality", "INSUFFICIENT DATA")
        flags = drift_analysis.get("statistical_flags", [])
        missing_context = drift_analysis.get("missing_context", [])
        baselines = drift_analysis.get("personal_baselines", {})

        if not flags:
            if signal_quality == "INSUFFICIENT DATA":
                explanation = (
                    "### Baseline Formation Phase\n\n"
                    "Your personal baseline is currently establishing reference ranges. "
                    "Log cycle dates, sleep, and symptoms over consecutive weeks to build your unique statistical profile."
                )
                evidence_chain = {
                    "observed_pattern": "Baseline Formation Phase",
                    "supporting_records": ["Fewer than 3 comprehensive entries logged"],
                    "persistence_duration": "Initial onboarding",
                    "missing_context": missing_context,
                    "clinician_discussion_points": ["Track 2-3 full cycles to establish baseline variance."]
                }
            else:
                explanation = (
                    "### Stable Personal Baseline\n\n"
                    "Your telemetry remains aligned with your personal historical averages. "
                    "No anomaly flags detected."
                )
                evidence_chain = {
                    "observed_pattern": "Stable Baseline Pattern",
                    "supporting_records": [
                        f"Average cycle length: {baselines.get('cycle', {}).get('avg_length', 28)} days",
                        f"Average sleep: {baselines.get('sleep', {}).get('avg_hours', 7.5)} hrs/night"
                    ],
                    "persistence_duration": "Maintained over active log history",
                    "missing_context": missing_context,
                    "clinician_discussion_points": ["Current routine appears synchronized with personal baseline."]
                }
            return {
                "signal_quality": signal_quality,
                "banner_title": drift_analysis.get("banner_title", "STABLE PERSONAL BASELINE"),
                "explanation_text": explanation,
                "evidence_chain": evidence_chain,
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        flag_lines = []
        supporting_records = []
        for f in flags:
            metric = f.get("metric")
            var = f.get("variance")
            base = f.get("baseline")
            curr = f.get("current")
            flag_lines.append(f"- **{metric}**: Baseline `{base}` -> Current `{curr}` (*Variance: {var}*)")
            supporting_records.append(f"{metric} deviation: {curr} vs baseline {base}")

        explanation_text = (
            f"### Body Drift Anomaly Flagged\n\n"
            f"Statistical deviations detected against your personal baseline:\n\n"
            + "\n".join(flag_lines) + "\n\n"
            f"> **Observational Note:** These are co-occurring changes for discussion with your healthcare provider."
        )

        evidence_chain = {
            "observed_pattern": f"Body Drift Detected ({len(flags)} variances)",
            "supporting_records": supporting_records,
            "persistence_duration": flags[0].get("persistence", "Observed across recent logs"),
            "missing_context": missing_context or ["Continue logging daily for higher resolution."],
            "clinician_discussion_points": []
        }

        return {
            "signal_quality": signal_quality,
            "banner_title": drift_analysis.get("banner_title", "BODY DRIFT DETECTED"),
            "explanation_text": explanation_text,
            "evidence_chain": evidence_chain,
            "disclaimer": cls.MANDATORY_DISCLAIMER
        }

    @classmethod
    def ask_timeline_grounded(
        cls,
        query: str,
        timeline_context: List[Dict],
        user_profile: Dict[str, Any] = None,
        user_id: int = 0
    ) -> Dict[str, Any]:
        """
        Primary conversational endpoint. Uses live AI with multi-turn memory.
        """
        sanitized_context = PIISanitizer.prepare_timeline_for_ai(timeline_context, user_profile)
        sanitized_query = PIISanitizer.sanitize_text(query)

        health_context_str = ""
        if sanitized_context:
            health_context_str = json.dumps(sanitized_context[:15], indent=1, default=str)

        # Execute Live AI Call
        gemini_response = cls._call_gemini(
            user_id=user_id,
            user_message=sanitized_query,
            health_context_str=health_context_str
        )

        if gemini_response:
            q_lower = sanitized_query.lower()
            show_records = any(w in q_lower for w in [
                "health", "cycle", "period", "sleep", "fatigue", "lab", "ferritin",
                "iron", "symptom", "cramp", "biomarker", "tsh", "vitamin",
                "analyze", "summary", "doctor", "overall"
            ])

            return {
                "answer": gemini_response,
                "grounded_records_used": sanitized_context[:6] if show_records else [],
                "confidence": "STRONG SIGNAL",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # Setup Instructions Fallback if Key isn't loaded
        return {
            "answer": (
                "### ⚙️ AI Engine Key Not Active\n\n"
                "To activate live intelligent chat, connect your API key in the top right drawer.\n\n"
                "Once connected, I will answer any query with live, multi-turn conversational intelligence! 🚀"
            ),
            "grounded_records_used": [],
            "confidence": "SETUP REQUIRED",
            "disclaimer": cls.MANDATORY_DISCLAIMER
        }
