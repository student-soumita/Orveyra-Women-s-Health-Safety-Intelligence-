# ORVEYRA Production Setup & Security Deployment Checklist

## 1. Authentication & Session Security
- [x] Argon2 / Bcrypt password hashing enforced on user registration.
- [x] HTTP-only, SameSite=Lax session cookies for token storage.
- [x] WebAuthn / Passkey architectural interface stubbed and ready.
- [x] Password reset token generator and account deletion cascade.
- [x] Multi-tenant row-level tenant security (`user_id`) enforced across all database queries and REST API endpoints.

## 2. Privacy & PII Governance
- [x] Privacy-Preserving Middleware regex sanitization redacting names, emails, SSNs, and dates of birth before timeline contexts reach LLM endpoints.
- [x] Storage Vault using short-lived HMAC presigned URLs (15-minute expiration window).
- [x] Dedicated Privacy Center for user-controlled AI toggling, archive export (JSON), and stream deletion.

## 3. Clinical Guardrails & Safety
- [x] Mandatory Clinical Disclaimer permanently displayed across all dashboard views, exports, and doctor summaries.
- [x] Non-diagnostic observational framing enforced ("Pattern change observed", "Co-occurring change detected").
- [x] Zero diagnostic disease probability numbers or diagnostic claims.

## 4. Intelligent Document Processing (IDP)
- [x] Tabular lab extraction with field-level confidence scores.
- [x] Strict Verification Gatekeeper modal requiring explicit user confirmation before writing lab values to BiomarkerLog.

## 5. Deployment Instructions
1. Navigate to `backend/` and install requirements:
   ```bash
   pip install -r requirements.txt
   ```
2. Initialize database:
   ```bash
   python init_db.py
   ```
3. Run FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
4. Navigate to `frontend/` and start dev server:
   ```bash
   npm install
   npm run dev
   ```
