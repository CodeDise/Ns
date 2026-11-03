"""
NEU PRODUCT BOT — OxaPay Crypto Payment Gateway Service
Creates USDT/Crypto invoices and validates HMAC-SHA512 webhook callbacks.
"""
import hashlib
import hmac
from typing import Any, Dict
import aiohttp
from config import config


class OxaPayService:
    @staticmethod
    async def create_invoice(
        order_id: str,
        amount_usd: float,
        description: str,
    ) -> Dict[str, Any]:
        payload = {
            "merchant": config.OXAPAY_MERCHANT_API_KEY,
            "amount": round(float(amount_usd), 2),
            "currency": "USD",
            "lifeTime": 30,
            "feePaidByPayer": 0,
            "underPaidCover": 2.5,
            "callbackUrl": f"{config.WEBHOOK_BASE_URL}/webhook/oxapay",
            "description": description,
            "orderId": order_id,
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(config.OXAPAY_API_URL, json=payload, timeout=15) as resp:
                data = await resp.json()
                if data.get("result") == 100:
                    return {
                        "ok": True,
                        "pay_url": data.get("payLink"),
                        "track_id": data.get("trackId"),
                    }
                return {"ok": False, "error": data.get("message", "OxaPay API Error")}

    @staticmethod
    def verify_webhook_signature(raw_body: bytes, hmac_header: str) -> bool:
        calculated = hmac.new(
            config.OXAPAY_MERCHANT_API_KEY.encode("utf-8"),
            raw_body,
            hashlib.sha512,
        ).hexdigest()
        return hmac.compare_digest(calculated.lower(), (hmac_header or "").lower())
