import re

class PIISanitizer:
    """
    Privacy-Preserving Middleware for ORVEYRA.
    Sanitizes personally identifiable information (PII) before timeline
    contexts are sent to generative AI processing endpoints.
    """

    EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', re.IGNORECASE)
    PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
    SSN_REGEX = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
    DOB_REGEX = re.compile(r'\b(?:19|20)\d{2}[-/.]\d{2}[-/.]\d{2}\b')

    @classmethod
    def sanitize_text(cls, text: str, user_name: str = None, user_email: str = None) -> str:
        if not text:
            return ""

        sanitized = text

        # Redact specific user email if provided
        if user_email:
            sanitized = sanitized.replace(user_email, "[REDACTED_USER_EMAIL]")

        # Redact specific user name if provided
        if user_name and len(user_name.strip()) > 1:
            for part in user_name.split():
                if len(part) > 2:
                    sanitized = re.sub(rf'\b{re.escape(part)}\b', '[REDACTED_NAME]', sanitized, flags=re.IGNORECASE)

        # Regex replacements for general PII
        sanitized = cls.EMAIL_REGEX.sub('[REDACTED_EMAIL]', sanitized)
        sanitized = cls.SSN_REGEX.sub('[REDACTED_SSN]', sanitized)
        sanitized = cls.PHONE_REGEX.sub('[REDACTED_PHONE]', sanitized)
        sanitized = cls.DOB_REGEX.sub('[REDACTED_DATE]', sanitized)

        return sanitized

    @classmethod
    def prepare_timeline_for_ai(cls, timeline_records: list, user_profile: dict = None) -> list:
        user_name = user_profile.get("full_name") if user_profile else None
        user_email = user_profile.get("email") if user_profile else None

        sanitized_records = []
        for record in timeline_records:
            clean_rec = record.copy()
            if "notes" in clean_rec and clean_rec["notes"]:
                clean_rec["notes"] = cls.sanitize_text(clean_rec["notes"], user_name=user_name, user_email=user_email)
            if "full_name" in clean_rec:
                del clean_rec["full_name"]
            if "email" in clean_rec:
                del clean_rec["email"]
            sanitized_records.append(clean_rec)

        return sanitized_records
