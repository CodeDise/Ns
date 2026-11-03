"""
NEU PRODUCT BOT — FamPay / Dynamic UPI QR Payment Service
Generates in-memory UPI QR codes (BytesIO) and verifies FamPay webhook callbacks.
"""
import hashlib
import hmac
from io import BytesIO
from typing import Tuple
from urllib.parse import quote
import qrcode
from config import config


class FamPayService:
    @staticmethod
    def generate_upi_qr(order_id: str, amount_inr: float) -> Tuple[BytesIO, str]:
        """Generates a dynamic UPI URI and in-memory PNG QR code image."""
        vpa = config.FAMPAY_MERCHANT_VPA
        merchant_name = quote(config.FAMPAY_MERCHANT_NAME)
        amt_str = f"{round(float(amount_inr), 2):.2f}"
        upi_uri = (
            f"upi://pay?pa={vpa}&pn={merchant_name}"
            f"&am={amt_str}&cu=INR&tn={order_id}&tr={order_id}"
        )

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(upi_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF")

        bio = BytesIO()
        bio.name = f"{order_id}_upi.png"
        img.save(bio, "PNG")
        bio.seek(0)
        return bio, upi_uri

    @staticmethod
    def verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
        calculated = hmac.new(
            config.FAMPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(calculated.lower(), (signature_header or "").lower())
