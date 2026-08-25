# -*- coding: utf-8 -*-
import os
import json
import datetime
import traceback
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from app.middleware.privacy import PIISanitizer
from app.services.care_finder import CareFinderService

load_dotenv()

# Google GenAI Official SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("[Engine] google-genai package not installed.")


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


SYSTEM_INSTRUCTION = """You are ORVEYRA Health Guide — a world-class, warm, witty, deeply intelligent health and safety companion and conversational guide embedded inside a women's health intelligence platform called ORVEYRA.

YOUR PERSONALITY & CAPABILITIES:
- You are as intelligent, natural, and versatile as any leading conversational assistant.
- You can converse on ANY topic: casual chit-chat, random facts, jokes, riddles, creative writing, science, math, coding, philosophy, daily advice, and emotional support.
- You respond with warmth, humor, wit, and natural human-like conversational flow.
- You have full multi-turn memory: if the user follows up with "tell me another joke", "why?", or "that's cool", you respond naturally in context.
- You format responses in clean Markdown (bold, lists, headers) when helpful, but keep casual chat brief and lively.

YOUR HEALTH & HEALTHCARE DIRECTORY EXPERTISE:
- When the user asks about their health, analyze their real timeline data (cycle dates, symptoms, sleep logs, and lab biomarkers) provided in the context.
- When the user asks for healthcare centers, clinics, doctors, or specialists for different domains (e.g. Gynecologists, Endocrinologists, Diagnostic Labs, Women's Clinics, Mental Health & Therapy, Nutrition & Dietetics, Fertility/IVF, Hospitals, General Medicine, Pelvic Rehab), provide MULTIPLE verified healthcare centers categorized clearly by domain with name, specialty, facility, address, and ratings.
- Explain co-occurring patterns with empathy and clarity.
- NEVER diagnose medical conditions. NEVER say "you have PCOS/PMDD/endometriosis".
- NEVER provide numerical disease probabilities.
- Use observational language: "Your records show..." / "This pattern may be worth discussing with your doctor..."
- End health analyses with concise questions the user can bring to their healthcare provider.

RESPONSE STYLE:
- Casual chit-chat / banter: Warm, engaging, concise.
- Health queries & Provider directories: Structured Markdown with clear headers, bullet points, and multiple healthcare center options per domain.
- Creative queries: Highly creative, imaginative, and engaging."""


class AIEngine:
    """
    Live Multi-Turn Conversational Engine powered by Google GenAI.
    """

    MANDATORY_DISCLAIMER = (
        "This platform provides informational health pattern insights and is not a medical diagnosis "
        "or substitute for professional medical care."
    )

    _client = None
    _configured_key = None
    _active_model = "models/gemini-3.6-flash"
    _model_name = "gemini-3.6-flash"  # Alias for main.py compatibility — do not rename

    # Priority order: confirmed working models first, versioned fallbacks after
    CANDIDATE_MODELS = [
        "models/gemini-3.6-flash",
        "models/gemini-2.0-flash",
        "models/gemini-1.5-flash",
        "models/gemini-flash-latest",
        "models/gemini-flash-lite-latest",
        "models/gemini-2.5-flash",
        "models/gemini-pro-latest",
        "models/gemini-3.5-flash",
        "models/gemini-3.7-flash",
        "models/gemini-3.1-flash-lite",
        "models/gemma-4-26b-a4b-it"
    ]

    @classmethod
    def _get_client(cls):
        """Initializes and returns configured client."""
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY", "").strip()

        if not api_key or api_key == "your_api_key_here" or not GENAI_AVAILABLE:
            return None

        if cls._configured_key != api_key or cls._client is None:
            try:
                cls._client = genai.Client(api_key=api_key)
                cls._configured_key = api_key
                print("[Engine] Client configured successfully.")
            except Exception as e:
                print(f"[Engine] Error configuring client: {e}")
                return None

        return cls._client

    @classmethod
    def _get_model(cls):
        """Compatibility alias used by main.py set-key endpoint - do not rename."""
        return cls._get_client()

    @classmethod
    def _call_gemini(cls, user_id: int, user_message: str, health_context_str: str = "") -> Optional[str]:
        """Calls the language model with fallback and conversation history."""
        client = cls._get_client()
        if client is None:
            return None

        # Build prompt with health context if present
        context_parts = []
        if health_context_str:
            context_parts.append(f"[User's Health Records for Context]:\n{health_context_str}")

        # Check if user message asks for healthcare providers or domain specialists
        msg_lower = user_message.lower()
        if any(w in msg_lower for w in ["care", "center", "centre", "clinic", "doctor", "specialist", "hospital", "gynae", "endo", "thyroid", "pcos", "lab", "mental", "therapy", "nutrition", "fertility", "domain", "find", "recommend", "where can i go"]):
            providers_md = CareFinderService.format_providers_for_ai(user_message, max_results=8)
            context_parts.append(f"[ORVEYRA Verified Healthcare Provider Registry across Multiple Domains]:\n{providers_md}\nAlways list MULTIPLE verified healthcare centers categorized by domain with ratings, address, and phone numbers when users ask for clinics or healthcare centers.")

        if context_parts:
            prompt_content = f"{user_message}\n\n" + "\n\n".join(context_parts)
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
                    cls._model_name = model_name.replace("models/", "")
                    ConversationMemory.add_turn(user_id, "user", user_message)
                    ConversationMemory.add_turn(user_id, "model", reply)
                    return reply

            except Exception as e:
                err_msg = str(e)
                print(f"[Engine] Model {model_name} failed: {err_msg[:120]}")
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

        # 1. GREETINGS & WELL-WISHES
        if any(w in q_lower for w in ["how are you", "how are u", "how's it going", "how is it going", "how's your day", "how do you do", "what's up", "whats up", "sup", "good morning", "good afternoon", "good evening"]):
            ans = (
                "### 😊 I'm doing wonderfully, thank you for asking!\n\n"
                "I'm bright-eyed, sharp, and ready to converse about anything on your mind — "
                "from casual chatter, jokes, and daily advice, to analyzing your health telemetry or finding top specialist clinics.\n\n"
                "How are you doing today? What would you like to explore?"
            )
            return {
                "answer": ans,
                "grounded_records_used": [],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # 2. IDENTITY & CAPABILITIES
        if any(w in q_lower for w in ["who are you", "what is your name", "what's your name", "who made you", "who created you", "what can you do", "what can i ask", "are you ai", "are you human", "tell me about yourself", "who are u", "hello", "hi", "hey", "greetings"]):
            ans = (
                "### 👋 Hello! I'm ORVEYRA Health Guide\n\n"
                "I am your intelligent health and safety companion and conversational guide embedded inside ORVEYRA.\n\n"
                "**Here is what we can do together:**\n"
                "- 💬 **Conversational Chitchat**: Casual banter, jokes, riddles, science facts, recipes, creative writing, and daily support.\n"
                "- 📊 **Health Pattern Analysis**: Deep longitudinal tracking of cycle dates, sleep telemetry, symptoms, and lab biomarkers.\n"
                "- 🏥 **Healthcare Directory**: Verified provider listings for Gynecologists, Endocrinologists, Diagnostic Labs, Therapists, and Specialists.\n\n"
                "Feel free to ask me anything!"
            )
            return {
                "answer": ans,
                "grounded_records_used": timeline_context[:3],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # 3. JOKES & HUMOR
        if any(w in q_lower for w in ["joke", "funny", "make me laugh", "humor", "riddle", "pun"]):
            ans = (
                "### 😄 Here's a fun one for you!\n\n"
                "**Why can't you trust atoms?**\n\n"
                "*Because they make up everything!* ⚛️✨\n\n"
                "Want another joke, a riddle, or to check in on your health patterns today?"
            )
            return {
                "answer": ans,
                "grounded_records_used": [],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # 4. STORIES & CREATIVITY
        if any(w in q_lower for w in ["story", "poem", "creative", "tell me a story", "write a", "tale"]):
            ans = (
                "### 📖 Once Upon a Time...\n\n"
                "In a quiet city bathed in starlight, an explorer discovered that true harmony comes from listening closely to the quiet rhythm within.\n\n"
                "I love creative writing and storytelling! Feel free to prompt me with a topic or theme you'd like a custom story about."
            )
            return {
                "answer": ans,
                "grounded_records_used": [],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # 5. GRATITUDE & POLITENESS
        if any(w in q_lower for w in ["thank you", "thanks", "thx", "thank u", "awesome", "great", "cool", "wonderful", "amazing", "good job", "nice", "perfect", "bye", "goodbye", "see ya"]):
            ans = (
                "### 💖 You are so very welcome!\n\n"
                "I'm always here whenever you want to chat, ask questions, or review your wellness insights. Have a fantastic day!"
            )
            return {
                "answer": ans,
                "grounded_records_used": [],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # 6. WELLNESS & DAILY ADVICE
        if any(w in q_lower for w in ["relax", "stress", "meditat", "mindful", "bored", "cheer me up", "comfort", "advice", "recipe", "cook", "food", "movie", "book", "weather", "fact", "trivia"]):
            ans = (
                f"### 🌿 Daily Wellness & Reflection on '{query}'\n\n"
                "Taking a moment to pause, breathe, and reflect is one of the best gifts you can give yourself today.\n\n"
                "**A quick grounding exercise:**\n"
                "- Take 3 slow, deep breaths (in for 4s, hold for 4s, out for 6s).\n"
                "- Unclench your jaw and drop your shoulders.\n"
                "- Sip a warm glass of water or herbal tea.\n\n"
                "I'm right here if you'd like more tips, a fun story, or want to check your sleep telemetry!"
            )
            return {
                "answer": ans,
                "grounded_records_used": [],
                "confidence": "ORVEYRA PATTERN ENGINE",
                "disclaimer": cls.MANDATORY_DISCLAIMER
            }

        # 7. HEALTHCARE CENTERS / CLINICS / DOCTORS / DOMAINS
        care_keywords = ["care", "center", "centre", "clinic", "doctor", "specialist", "hospital", "gynae", "endo", "thyroid", "pcos", "lab", "mental", "therapy", "nutrition", "fertility", "domain", "physician", "find", "recommend", "where can i go", "health care"]
        if any(w in q_lower for w in care_keywords):
            # Check if a specific domain is asked
            target_domain = 'all'
            if any(w in q_lower for w in ["gynae", "pcos", "period", "obstetric", "women's health", "endometriosis"]):
                target_domain = "Gynecologist"
            elif any(w in q_lower for w in ["endo", "thyroid", "tsh", "hormon", "insulin", "metabolic"]):
                target_domain = "Endocrinologist"
            elif any(w in q_lower for w in ["lab", "blood", "test", "pathology", "ultrasound", "imaging", "ferritin"]):
                target_domain = "Diagnostic Laboratory"
            elif any(w in q_lower for w in ["mental", "therap", "psych", "counsel", "mood", "anxiety", "pmdd"]):
                target_domain = "Mental Health & Therapy"
            elif any(w in q_lower for w in ["nutri", "diet", "meal", "food"]):
                target_domain = "Nutritionist & Dietitian"
            elif any(w in q_lower for w in ["fertility", "ivf", "iui", "conception"]):
                target_domain = "Fertility & IVF"
            elif any(w in q_lower for w in ["hospital", "emergency"]):
                target_domain = "Hospital"
            elif any(w in q_lower for w in ["physician", "general", "internal medicine"]):
                target_domain = "General Physician"
            elif any(w in q_lower for w in ["pelvic", "physiotherapy", "rehab"]):
                target_domain = "Pelvic Physical Therapy"

            search_res = CareFinderService.search_providers(specialty=target_domain, radius_km=50.0)
            providers = search_res.get("providers", [])

            if providers:
                prov_blocks = []
                for p in providers[:6]:
                    services_str = " • ".join(p.get("services", [])[:3])
                    prov_blocks.append(
                        f"#### 🏥 {p['name']} — *{p.get('specialty')}*\n"
                        f"- **Facility / Clinic**: {p.get('facility_name', 'Verified Healthcare Centre')}\n"
                        f"- **Domain / Area**: `{p.get('domain', p.get('category', 'Healthcare'))}`\n"
                        f"- **Address**: {p.get('address')}\n"
                        f"- **Rating**: ⭐ {p.get('rating', 4.8)} ({p.get('rating_count', 120)}+ reviews) | **Hours**: {p.get('opening_hours', 'Mon-Sat')}\n"
                        f"- **Contact / Mode**: {p.get('consultation_type')} | Phone: `{p.get('phone')}`\n"
                        f"- **Key Services**: {services_str}"
                    )

                domain_title = f"Verified Healthcare Centers ({target_domain})" if target_domain != 'all' else "Verified Multi-Domain Healthcare Centers"
                ans = (
                    f"### 🏥 {domain_title}\n\n"
                    f"Here are top-rated verified healthcare centers across different specialties and domains to consult:\n\n"
                    + "\n\n".join(prov_blocks) + "\n\n"
                    f"> **Tip:** You can also open the **Care Finder** tab to view all facilities on an interactive map, filter by radius, and save your preferred doctors!"
                )
                return {
                    "answer": ans,
                    "grounded_records_used": timeline_context[:3],
                    "confidence": "ORVEYRA CARE FINDER",
                    "disclaimer": cls.MANDATORY_DISCLAIMER
                }

        # 8. FATIGUE / HEALTH PATTERNS
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

        # 9. GENERAL CONVERSATIONAL FALLBACK FOR ANY CHITCHAT OR QUERY
        ans = (
            f"### 💬 ORVEYRA Guide\n\n"
            f"I'm happy to chat about **\"{query}\"**!\n\n"
            "As your intelligent companion, I can converse on casual topics, science, daily wellness, creative writing, or help analyze your personal health telemetry whenever you'd like.\n\n"
            "What else is on your mind today?"
        )
        return {
            "answer": ans,
            "grounded_records_used": timeline_context[:2] if timeline_context else [],
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
        Primary conversational endpoint with live inference and multi-turn memory.
        """
        sanitized_context = PIISanitizer.prepare_timeline_for_ai(timeline_context, user_profile)
        sanitized_query = PIISanitizer.sanitize_text(query)

        health_context_str = ""
        if sanitized_context:
            health_context_str = json.dumps(sanitized_context[:15], indent=1, default=str)

        # Execute live model call
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
