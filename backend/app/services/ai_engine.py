import os
import json
import datetime
import traceback
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from app.middleware.privacy import PIISanitizer

load_dotenv()

# Google GenAI Official SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("[AI Engine] google-genai package not installed.")


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
        cls._store[user_id].append({"role": api_role, "text": text})
        
        if len(cls._store[user_id]) > 40:
            cls._store[user_id] = cls._store[user_id][-40:]

    @classmethod
    def clear(cls, user_id: int):
        cls._store.pop(user_id, None)


SYSTEM_INSTRUCTION = """You are ORVEYRA AI — a world-class, warm, witty, deeply intelligent conversational AI assistant embedded inside a women's health intelligence platform called ORVEYRA.

YOUR PERSONALITY & CAPABILITIES:
- You are as intelligent, natural, and versatile as ChatGPT or Gemini.
- You can converse on ANY topic: casual chit-chat, random facts, jokes, riddles, creative writing, science, math, coding, philosophy, daily advice, and emotional support.
- You respond with warmth, humor, wit, and natural human-like conversational flow.
- You have full multi-turn memory: if the user follows up with "tell me another joke", "why?", or "that's cool", you respond naturally in context.
- You format responses in clean Markdown (bold, lists, headers) when helpful, but keep casual chat brief and lively.

YOUR HEALTH EXPERTISE:
- When the user asks about their health, analyze their real timeline data (cycle dates, symptoms, sleep logs, and lab biomarkers) provided in the context.
- Explain co-occurring patterns with empathy and clarity.
- NEVER diagnose medical conditions. NEVER say "you have PCOS/PMDD/endometriosis".
- NEVER provide numerical disease probabilities.
- Use observational language: "Your records show..." / "This pattern may be worth discussing with your doctor..."
- End health analyses with concise questions the user can bring to their healthcare provider.

RESPONSE STYLE:
- Casual chit-chat / banter: Warm, engaging, concise.
- Health queries: Structured Markdown with clear headers and bullet points.
- Creative queries: Highly creative, imaginative, and engaging."""


class AIEngine:
    """
    Live Multi-Turn Conversational AI Engine powered by Google GenAI.
    """

    MANDATORY_DISCLAIMER = (
        "This platform provides informational health pattern insights and is not a medical diagnosis "
        "or substitute for professional medical care."
    )

    _client = None
    _configured_key = None
    _active_model = "gemini-3.5-flash"

    # Priority order for fastest and highest-quota models
    CANDIDATE_MODELS = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemma-4-26b-a4b-it"
    ]

    @classmethod
    def _get_client(cls):
        """Initializes and returns configured GenAI client."""
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY", "").strip()

        if not api_key or api_key == "your_gemini_api_key_here" or not GENAI_AVAILABLE:
            return None

        if cls._configured_key != api_key or cls._client is None:
            try:
                cls._client = genai.Client(api_key=api_key)
                cls._configured_key = api_key
                print("[AI Engine] Google GenAI client configured successfully.")
            except Exception as e:
                print(f"[AI Engine] Error configuring GenAI client: {e}")
                return None

        return cls._client

    @classmethod
    def _call_gemini(cls, user_id: int, user_message: str, health_context_str: str = "") -> Optional[str]:
        """Calls Google GenAI with model fallback and conversation history."""
        client = cls._get_client()
        if client is None:
            return None

        # Build prompt with health context if present
        if health_context_str:
            prompt_content = f"{user_message}\n\n[User's Health Records for Context]:\n{health_context_str}"
        else:
            prompt_content = user_message

        # Fetch history
        history = ConversationMemory.get_history(user_id)

        for model_name in cls.CANDIDATE_MODELS:
            try:
                # Build contents with system instruction and history
                config = types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                )

                # Format multi-turn contents
                contents = []
                for turn in history:
                    contents.append(types.Content(
                        role=turn["role"],
                        parts=[types.Part.from_text(text=turn["text"])]
                    ))
                contents.append(types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt_content)]
                ))

                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config
                )

                reply = response.text
                if reply:
                    cls._active_model = model_name
                    ConversationMemory.add_turn(user_id, "user", user_message)
                    ConversationMemory.add_turn(user_id, "model", reply)
                    return reply

            except Exception as e:
                err_msg = str(e)
                print(f"[AI Engine] Model {model_name} failed: {err_msg[:120]}")
                # If rate limited or not found, try next candidate model
                continue

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
    def _generate_local_pattern_response(
        cls,
        query: str,
        timeline_context: List[Dict],
        user_profile: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Grounded Medical & Conversational Pattern Fallback.
        """
        q_lower = query.lower()

        cycles = [x for x in timeline_context if x.get("type") == "cycle"]
        symptoms = [x for x in timeline_context if x.get("type") == "symptom"]
        lifestyle = [x for x in timeline_context if x.get("type") == "lifestyle"]
        biomarkers = [x for x in timeline_context if x.get("type") == "biomarker"]

        avg_sleep = None
        if lifestyle:
            sleep_vals = [l.get("sleep_hours") for l in lifestyle if l.get("sleep_hours") is not None]
            if sleep_vals:
                avg_sleep = round(sum(sleep_vals) / len(sleep_vals), 1)

        # 1. GREETINGS
        if any(w in q_lower for w in ["who are you", "hello", "hi", "hey", "what can you do"]):
            ans = (
                "### 👋 Hello! I'm ORVEYRA AI\n\n"
                "I am your intelligent health assistant and conversational companion. "
                "I can analyze your **cycle patterns**, **sleep telemetry**, **physical symptoms**, and **lab biomarkers**, "
                "or chat about science, jokes, creative writing, and daily wellness!\n\n"
                "What would you like to explore today?"
            )
            return {
                "answer": ans,
                "grounded_records_used": timeline_context[:3],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # 2. JOKES / CHIT CHAT
        if "joke" in q_lower or "funny" in q_lower:
            ans = (
                "### 😄 Here's one for you!\n\n"
                "**Why can't you trust atoms?**\n\n"
                "*Because they make up everything!* ⚛️✨\n\n"
                "Ask me anything else — science facts, health telemetry, or more jokes!"
            )
            return {
                "answer": ans,
                "grounded_records_used": [],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # 3. FATIGUE / HEALTH PATTERNS
        if any(w in q_lower for w in ["tired", "fatigue", "sleep", "energy", "exhausted"]):
            findings = []
            if avg_sleep is not None:
                findings.append(f"- **Sleep Telemetry**: Average `{avg_sleep} hrs/night` logged.")
            if symptoms:
                findings.append(f"- **Symptoms**: `{len(symptoms)} entries` logged across recent weeks.")

            ans = (
                "### ⚡ Fatigue & Energy Pattern Analysis\n\n"
                + ("\n".join(findings) if findings else "- Continue daily logging to correlate sleep architecture with energy levels.") + "\n\n"
                "#### 🩺 Clinician Discussion Points:\n"
                "- Discuss running an Iron/Ferritin panel and Thyroid profile (TSH) with your healthcare provider."
            )
            return {
                "answer": ans,
                "grounded_records_used": timeline_context[:4],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # Default intelligent response
        return {
            "answer": (
                f"### 💡 ORVEYRA Response for '{query}'\n\n"
                "I'm here to assist with health pattern analysis, casual conversation, science questions, or doctor visit preparation.\n\n"
                "Try asking: *'Tell me a joke'*, *'Why am I tired?'*, *'Explain my lab biomarkers'*, or *'What questions should I ask my doctor?'*."
            ),
            "grounded_records_used": timeline_context[:2],
            "confidence": "ORVEYRA PATTERN ENGINE",
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
        Primary conversational endpoint with live AI and multi-turn memory.
        """
        sanitized_context = PIISanitizer.prepare_timeline_for_ai(timeline_context, user_profile)
        sanitized_query = PIISanitizer.sanitize_text(query)

        health_context_str = ""
        if sanitized_context:
            health_context_str = json.dumps(sanitized_context[:15], indent=1, default=str)

        # Execute Live GenAI Call
        ai_response = cls._call_gemini(
            user_id=user_id,
            user_message=sanitized_query,
            health_context_str=health_context_str
        )

        if ai_response:
            q_lower = sanitized_query.lower()
            show_records = any(w in q_lower for w in [
                "health", "cycle", "period", "sleep", "fatigue", "lab", "ferritin",
                "iron", "symptom", "cramp", "biomarker", "tsh", "vitamin",
                "analyze", "summary", "doctor", "overall"
            ])

            return {
                "answer": ai_response,
                "grounded_records_used": sanitized_context[:6] if show_records else [],
                "confidence": "ORVEYRA INTELLIGENCE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # Fallback to Pattern Engine
        return cls._generate_local_pattern_response(
            query=sanitized_query,
            timeline_context=sanitized_context,
            user_profile=user_profile
        )
