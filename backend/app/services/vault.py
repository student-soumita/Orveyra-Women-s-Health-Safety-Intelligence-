import os
import hmac
import hashlib
import time

VAULT_SECRET = os.getenv("STORAGE_VAULT_SECRET", "presigned_vault_hmac_secret_key_8702bc53")

class PresignedVaultService:
    """
    Private Document Storage Vault Architecture for ORVEYRA.
    Generates short-lived presigned access URLs (15-minute expiration window)
    preventing unauthorized direct asset links.
    """

    @classmethod
    def generate_presigned_url(cls, document_id: int, user_id: int, expiration_seconds: int = 900) -> str:
        expires_at = int(time.time()) + expiration_seconds
        msg = f"{user_id}:{document_id}:{expires_at}"
        signature = hmac.new(VAULT_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
        return f"/api/vault/file/{document_id}?expires={expires_at}&signature={signature}"

    @classmethod
    def verify_presigned_url(cls, document_id: int, user_id: int, expires_at: int, signature: str) -> bool:
        if int(time.time()) > expires_at:
            return False # Token expired

        msg = f"{user_id}:{document_id}:{expires_at}"
        expected_sig = hmac.new(VAULT_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_sig, signature)
