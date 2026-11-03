"""
NEU PRODUCT BOT — Multi-Language Localization Engine (Hindi, English, Russian)
Includes Telegram Premium Custom Emoji markup tags and Force Subscription (FSub) prompts.
"""
from typing import Dict
from config import config

LOCALES: Dict[str, Dict[str, str]] = {
    "en": {
        "fsub_required": (
            f"{config.EMOJI_ALERT} **Mandatory Channel Subscription Required**\n\n"
            "To access **NEU PRODUCT BOT** and purchase instant-delivery digital products, "
            "you must join our official update channel(s) below.\n\n"
            "After joining all channels, click **[ 🔄 Check Membership ]**:"
        ),
        "fsub_still_missing": "⚠️ You haven't joined all required channels yet! Please join and try again.",
        "fsub_verified": "✅ Membership verified! Welcome to NEU PRODUCT BOT.",
        "btn_check_membership": "🔄 Check Membership",
        "welcome_lang": (
            f"{config.EMOJI_SPARKLE} **Welcome to NEU PRODUCT BOT**\n\n"
            "Please select your preferred interface language:"
        ),
        "welcome_curr": (
            f"{config.EMOJI_SPARKLE} **Select Your Store Currency**\n\n"
            "All product prices and your built-in wallet balance will automatically convert to your chosen currency:"
        ),
        "main_menu": (
            f"{config.EMOJI_CROWN} **NEU DIGITAL STORE — MAIN MENU**\n\n"
            "👤 **User ID:** `{user_id}`\n"
            f"{config.EMOJI_WALLET} **Wallet Balance:** `{balance}`\n"
            "🌐 **Currency:** `{currency}`\n\n"
            "Browse our instant-delivery digital catalog or manage your wallet below:"
        ),
        "btn_browse": "🛍 Browse Catalog",
        "btn_wallet": "👛 My Wallet / Balance",
        "btn_orders": "📦 My Orders",
        "btn_currency": "💱 Change Currency",
        "btn_language": "🌐 Language",
        "btn_back": "⬅️ Back",
        "maintenance_active": (
            f"{config.EMOJI_ALERT} **System Under Maintenance**\n\n"
            "{reason}\n\n"
            "_Please check back shortly._"
        ),
        "wallet_panel": (
            f"{config.EMOJI_WALLET} **YOUR NEU WALLET**\n\n"
            "🆔 **Account ID:** `{user_id}`\n"
            "💰 **Available Balance:** `{balance}` (`${balance_usd} USD`)\n"
            "📊 **Completed Purchases:** `{orders_count}`\n\n"
            "Use your wallet for 1-click zero-fee instant checkout on any product!"
        ),
        "btn_topup_fampay": "⚡️ Top-Up via UPI (FamPay)",
        "btn_topup_oxapay": "💎 Top-Up via Crypto (OxaPay)",
        "product_caption": (
            f"{config.EMOJI_PACKAGE} **{{title}}**\n\n"
            "{{description}}\n\n"
            "📂 **Format:** `{product_type}`\n"
            "💳 **Price:** `{price}`\n"
            "⚡️ **Delivery:** Instant Automated DM"
        ),
        "btn_buy_now": "💳 Buy Now",
        "checkout_title": (
            f"{config.EMOJI_SPARKLE} **SELECT PAYMENT METHOD**\n\n"
            "📦 **Product:** {title}\n"
            "💵 **Payable Amount:** `{price}`\n"
            f"{config.EMOJI_WALLET} **Your Wallet Balance:** `{wallet_balance}`\n\n"
            "Choose how you would like to complete this order:"
        ),
        "btn_pay_wallet": "👛 Pay via Wallet Balance",
        "btn_pay_fampay": "⚡️ Pay via UPI (FamPay)",
        "btn_pay_oxapay": "💎 Pay via Crypto (OxaPay)",
        "insufficient_wallet": (
            f"{config.EMOJI_ALERT} **Insufficient Wallet Balance!**\n\n"
            "Required: `{required}` | Available: `{available}`\n"
            "Please top up your wallet or select UPI / Crypto checkout."
        ),
        "delivery_success": (
            f"{config.EMOJI_CHECK} **Payment Confirmed — Instant Delivery!**\n\n"
            "🧾 **Order ID:** `{order_id}`\n"
            "📦 **Item:** {title}\n"
            "💰 **Paid:** `{paid}` via `{gateway}`\n\n"
            "Your digital payload has been delivered above. Thank you for shopping with **NEU PRODUCT BOT**!"
        ),
        "btn_feedback": "⭐️ Leave Feedback",
        "wallet_credited_notify": (
            f"{config.EMOJI_SPARKLE} **Wallet Credited!**\n\n"
            f"{config.EMOJI_WALLET} An administrator has added **`{{added}}`** to your wallet.\n"
            "💰 **New Balance:** `{new_balance}`"
        ),
        "wallet_debited_notify": (
            f"{config.EMOJI_ALERT} **Wallet Balance Adjusted**\n\n"
            f"{config.EMOJI_WALLET} An administrator has deducted **`{{deducted}}`** from your wallet.\n"
            "💰 **New Balance:** `{new_balance}`"
        ),
    },
    "hi": {
        "fsub_required": (
            f"{config.EMOJI_ALERT} **अनिवार्य चैनल सदस्यता आवश्यक है**\n\n"
            "**NEU PRODUCT BOT** का उपयोग करने के लिए कृपया नीचे दिए गए हमारे आधिकारिक चैनल से जुड़ें।\n\n"
            "जुड़ने के बाद **[ 🔄 Check Membership ]** बटन दबाएं:"
        ),
        "fsub_still_missing": "⚠️ आपने अभी तक सभी आवश्यक चैनल जॉइन नहीं किए हैं!",
        "fsub_verified": "✅ सदस्यता सत्यापित! NEU PRODUCT BOT में आपका स्वागत है।",
        "btn_check_membership": "🔄 Check Membership (सदस्यता जांचें)",
        "welcome_lang": (
            f"{config.EMOJI_SPARKLE} **NEU PRODUCT BOT में आपका स्वागत है**\n\n"
            "कृपया अपनी पसंदीदा भाषा चुनें:"
        ),
        "welcome_curr": (
            f"{config.EMOJI_SPARKLE} **अपनी मुद्रा (Currency) चुनें**\n\n"
            "सभी उत्पादों की कीमतें और आपका वॉलेट बैलेंस अपने आप चुनी गई मुद्रा में दिखेगा:"
        ),
        "main_menu": (
            f"{config.EMOJI_CROWN} **NEU DIGITAL STORE — मुख्य मेनू**\n\n"
            "👤 **यूज़र ID:** `{user_id}`\n"
            f"{config.EMOJI_WALLET} **वॉलेट बैलेंस:** `{balance}`\n"
            "🌐 **मुद्रा:** `{currency}`\n\n"
            "नीचे दिए गए बटन से डिजिटल प्रोडक्ट्स खरीदें या अपना वॉलेट मैनेज करें:"
        ),
        "btn_browse": "🛍 प्रोडक्ट्स देखें",
        "btn_wallet": "👛 मेरा वॉलेट / बैलेंस",
        "btn_orders": "📦 मेरे ऑर्डर",
        "btn_currency": "💱 मुद्रा बदलें",
        "btn_language": "🌐 भाषा (Language)",
        "btn_back": "⬅️ पीछे जाएं",
        "maintenance_active": (
            f"{config.EMOJI_ALERT} **सिस्टम मेंटेनेंस मोड में है**\n\n"
            "{reason}\n\n"
            "_कृपया कुछ देर बाद पुनः प्रयास करें।_"
        ),
        "wallet_panel": (
            f"{config.EMOJI_WALLET} **आपका NEU वॉलेट**\n\n"
            "🆔 **अकाउंट ID:** `{user_id}`\n"
            "💰 **उपलब्ध बैलेंस:** `{balance}` (`${balance_usd} USD`)\n"
            "📊 **कुल ऑर्डर:** `{orders_count}`\n\n"
            "किसी भी प्रोडक्ट को तुरंत खरीदने के लिए अपने वॉलेट का उपयोग करें!"
        ),
        "btn_topup_fampay": "⚡️ UPI द्वारा पैसे जोड़ें (FamPay)",
        "btn_topup_oxapay": "💎 Crypto द्वारा पैसे जोड़ें (OxaPay)",
        "product_caption": (
            f"{config.EMOJI_PACKAGE} **{{title}}**\n\n"
            "{{description}}\n\n"
            "📂 **फ़ॉर्मेट:** `{product_type}`\n"
            "💳 **कीमत:** `{price}`\n"
            "⚡️ **डिलीवरी:** तुरंत ऑटोमैटिक DM"
        ),
        "btn_buy_now": "💳 अभी खरीदें",
        "checkout_title": (
            f"{config.EMOJI_SPARKLE} **पेमेंट का तरीका चुनें**\n\n"
            "📦 **प्रोडक्ट:** {title}\n"
            "💵 **कुल राशि:** `{price}`\n"
            f"{config.EMOJI_WALLET} **आपका वॉलेट बैलेंस:** `{wallet_balance}`\n\n"
            "अपना ऑर्डर पूरा करने के लिए विकल्प चुनें:"
        ),
        "btn_pay_wallet": "👛 वॉलेट बैलेंस से पेमेंट करें",
        "btn_pay_fampay": "⚡️ UPI से पेमेंट करें (FamPay)",
        "btn_pay_oxapay": "💎 Crypto से पेमेंट करें (OxaPay)",
        "insufficient_wallet": (
            f"{config.EMOJI_ALERT} **वॉलेट में पर्याप्त बैलेंस नहीं है!**\n\n"
            "आवश्यक: `{required}` | उपलब्ध: `{available}`\n"
            "कृपया वॉलेट रिचार्ज करें या UPI / Crypto चुनें।"
        ),
        "delivery_success": (
            f"{config.EMOJI_CHECK} **पेमेंट सफल — तुरंत डिलीवरी!**\n\n"
            "🧾 **ऑर्डर ID:** `{order_id}`\n"
            "📦 **प्रोडक्ट:** {title}\n"
            "💰 **भुगतान:** `{paid}` (`{gateway}`)\n\n"
            "आपकी फ़ाइल ऊपर भेज दी गई है। **NEU PRODUCT BOT** से जुड़ने के लिए धन्यवाद!"
        ),
        "btn_feedback": "⭐️ फ़ीडबैक दें",
        "wallet_credited_notify": (
            f"{config.EMOJI_SPARKLE} **वॉलेट में पैसे जोड़े गए!**\n\n"
            f"{config.EMOJI_WALLET} एडमिन ने आपके वॉलेट में **`{{added}}`** जोड़े हैं।\n"
            "💰 **नया बैलेंस:** `{new_balance}`"
        ),
        "wallet_debited_notify": (
            f"{config.EMOJI_ALERT} **वॉलेट बैलेंस अपडेट**\n\n"
            f"{config.EMOJI_WALLET} एडमिन ने आपके वॉलेट से **`{{deducted}}`** घटाए हैं।\n"
            "💰 **नया बैलेंस:** `{new_balance}`"
        ),
    },
    "ru": {
        "fsub_required": (
            f"{config.EMOJI_ALERT} **Требуется обязательная подписка на канал**\n\n"
            "Для доступа к **NEU PRODUCT BOT** и покупки цифровых товаров подпишитесь на наши каналы ниже.\n\n"
            "После подписки нажмите **[ 🔄 Check Membership ]**:"
        ),
        "fsub_still_missing": "⚠️ Вы еще не подписались на все обязательные каналы!",
        "fsub_verified": "✅ Подписка подтверждена! Добро пожаловать в NEU PRODUCT BOT.",
        "btn_check_membership": "🔄 Check Membership (Проверить)",
        "welcome_lang": (
            f"{config.EMOJI_SPARKLE} **Добро пожаловать в NEU PRODUCT BOT**\n\n"
            "Пожалуйста, выберите язык интерфейса:"
        ),
        "welcome_curr": (
            f"{config.EMOJI_SPARKLE} **Выберите валюту магазина**\n\n"
            "Все цены и баланс вашего кошелька будут автоматически отображаться в выбранной валюте:"
        ),
        "main_menu": (
            f"{config.EMOJI_CROWN} **NEU DIGITAL STORE — ГЛАВНОЕ МЕНЮ**\n\n"
            "👤 **Ваш ID:** `{user_id}`\n"
            f"{config.EMOJI_WALLET} **Баланс кошелька:** `{balance}`\n"
            "🌐 **Валюта:** `{currency}`\n\n"
            "Выберите каталог цифровых товаров или управление кошельком ниже:"
        ),
        "btn_browse": "🛍 Каталог товаров",
        "btn_wallet": "👛 Мой кошелек / Баланс",
        "btn_orders": "📦 Мои заказы",
        "btn_currency": "💱 Сменить валюту",
        "btn_language": "🌐 Язык (Language)",
        "btn_back": "⬅️ Назад",
        "maintenance_active": (
            f"{config.EMOJI_ALERT} **Техническое обслуживание**\n\n"
            "{reason}\n\n"
            "_Пожалуйста, попробуйте чуть позже._"
        ),
        "wallet_panel": (
            f"{config.EMOJI_WALLET} **ВАШ КОШЕЛЕК NEU**\n\n"
            "🆔 **ID аккаунта:** `{user_id}`\n"
            "💰 **Доступный баланс:** `{balance}` (`${balance_usd} USD`)\n"
            "📊 **Оплаченных заказов:** `{orders_count}`\n\n"
            "Используйте баланс кошелька для мгновенной покупки любых товаров!"
        ),
        "btn_topup_fampay": "⚡️ Пополнить через UPI (FamPay)",
        "btn_topup_oxapay": "💎 Пополнить через Crypto (OxaPay)",
        "product_caption": (
            f"{config.EMOJI_PACKAGE} **{{title}}**\n\n"
            "{{description}}\n\n"
            "📂 **Формат:** `{product_type}`\n"
            "💳 **Цена:** `{price}`\n"
            "⚡️ **Доставка:** Мгновенно в ЛС"
        ),
        "btn_buy_now": "💳 Купить сейчас",
        "checkout_title": (
            f"{config.EMOJI_SPARKLE} **ВЫБЕРИТЕ СПОСОБ ОПЛАТЫ**\n\n"
            "📦 **Товар:** {title}\n"
            "💵 **К оплате:** `{price}`\n"
            f"{config.EMOJI_WALLET} **Ваш баланс:** `{wallet_balance}`\n\n"
            "Выберите удобный способ оплаты заказа:"
        ),
        "btn_pay_wallet": "👛 Оплатить с баланса кошелька",
        "btn_pay_fampay": "⚡️ Оплатить через UPI (FamPay)",
        "btn_pay_oxapay": "💎 Оплатить криптой (OxaPay)",
        "insufficient_wallet": (
            f"{config.EMOJI_ALERT} **Недостаточно средств на балансе!**\n\n"
            "Требуется: `{required}` | Доступно: `{available}`\n"
            "Пополните кошелек или выберите другой способ оплаты."
        ),
        "delivery_success": (
            f"{config.EMOJI_CHECK} **Оплата подтверждена — Товар доставлен!**\n\n"
            "🧾 **Заказ:** `{order_id}`\n"
            "📦 **Товар:** {title}\n"
            "💰 **Оплачено:** `{paid}` через `{gateway}`\n\n"
            "Ваш цифровой товар отправлен сообщением выше. Спасибо за покупку!"
        ),
        "btn_feedback": "⭐️ Оставить отзыв",
        "wallet_credited_notify": (
            f"{config.EMOJI_SPARKLE} **Баланс пополнен!**\n\n"
            f"{config.EMOJI_WALLET} Администратор начислил **`{{added}}`** на ваш кошелек.\n"
            "💰 **Новый баланс:** `{new_balance}`"
        ),
        "wallet_debited_notify": (
            f"{config.EMOJI_ALERT} **Изменение баланса кошелька**\n\n"
            f"{config.EMOJI_WALLET} Администратор списал **`{{deducted}}`** с вашего кошелька.\n"
            "💰 **Новый баланс:** `{new_balance}`"
        ),
    },
}


def t(lang: str, key: str, **kwargs) -> str:
    lang_pack = LOCALES.get(lang, LOCALES["en"])
    template = lang_pack.get(key, LOCALES["en"].get(key, key))
    return template.format(**kwargs) if kwargs else template
