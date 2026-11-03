"""
NEU PRODUCT BOT — User Storefront, FSub Gatekeeper, Dynamic Checkout & Instant Delivery
Implements:
- Force Subscription (FSub) Check Middleware on /start and [ 🔄 Check Membership ] callback
- Maintenance mode middleware (blocks regular users, permits Owner & Admins)
- /start Onboarding (Language: Hindi/English/Russian -> Active Currencies Only)
- Folder & Product browsing with Telegram Premium Custom Emojis
- 3-Way Checkout:
  1. [ 👛 Pay via Wallet Balance ] (Instant balance deduction + immediate DM delivery)
  2. [ ⚡️ Pay via UPI (FamPay) ] (Dynamic QR if INR & FamPay active)
  3. [ 💎 Pay via Crypto (OxaPay) ] (Crypto invoice if USDT & OxaPay active)
- Instant Automated Delivery from DATABASE_CHANNEL_ID + [ ⭐️ Leave Feedback ] to FEEDBACK_CHANNEL_ID
"""
from typing import Dict
from pyrogram import Client, filters
from pyrogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from config import config
from database import db
from locales import t
from services.oxapay import OxaPayService
from services.fampay import FamPayService
from handlers.fsub import enforce_fsub_gate

PENDING_FEEDBACK: Dict[int, str] = {}


async def check_maintenance_guard(user_id: int) -> bool:
    """Returns True if user is blocked by Maintenance Mode."""
    cfg = await db.get_settings()
    if not cfg.get("maintenance_mode", False):
        return False
    if await db.is_admin(user_id):
        return False
    return True


async def deliver_order_payload(client: Client, order_id: str) -> bool:
    """
    Copies the product payload from DATABASE_CHANNEL_ID directly to the buyer's DM
    and attaches the [ ⭐️ Leave Feedback ] button linked to FEEDBACK_CHANNEL_ID.
    """
    order = await db.get_order(order_id)
    if not order:
        return False

    user_id = int(order["user_id"])
    user = await db.get_user(user_id)
    lang = user.get("language", "en") if user else "en"
    curr = user.get("currency", "USD") if user else "USD"
    order_amt = float(order.get("amount_usd", order.get("amount", 0.0)))

    # Case 1: Wallet Top-Up Order (product_id is None)
    if not order.get("product_id"):
        new_bal = await db.add_wallet_balance(user_id, order_amt)
        formatted_added = await db.format_currency(order_amt, curr)
        formatted_total = await db.format_currency(new_bal, curr)
        await client.send_message(
            user_id,
            t(
                lang,
                "wallet_credited_notify",
                added=formatted_added,
                new_balance=formatted_total,
            ),
        )
        return True

    # Case 2: Digital Product Order -> Copy from DATABASE_CHANNEL_ID
    product = await db.get_product(str(order["product_id"]))
    if not product:
        return False

    await client.copy_message(
        chat_id=user_id,
        from_chat_id=config.DATABASE_CHANNEL_ID,
        message_id=int(product["channel_message_id"]),
    )

    paid_str = await db.format_currency(order_amt, curr)
    await client.send_message(
        chat_id=user_id,
        text=t(
            lang,
            "delivery_success",
            order_id=order["_id"],
            title=product["title"],
            paid=paid_str,
            gateway=order["gateway"],
        ),
        reply_markup=InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton(
                        t(lang, "btn_feedback"),
                        callback_data=f"fb_leave_{order['_id']}",
                    )
                ],
                [
                    InlineKeyboardButton(
                        t(lang, "btn_back"), callback_data="nav_main"
                    )
                ],
            ]
        ),
    )
    return True


async def render_main_menu(user_id: int, username: str) -> tuple[str, InlineKeyboardMarkup]:
    user = await db.upsert_user(user_id, username)
    lang = user.get("language", "en")
    curr = user.get("currency", "USD")
    bal_str = await db.format_currency(float(user.get("balance_usd", 0.0)), curr)

    text = t(
        lang,
        "main_menu",
        user_id=user_id,
        balance=bal_str,
        currency=curr,
    )
    kb = InlineKeyboardMarkup(
        [
            [InlineKeyboardButton(t(lang, "btn_browse"), callback_data="cat_folders")],
            [InlineKeyboardButton(t(lang, "btn_wallet"), callback_data="wallet_open")],
            [
                InlineKeyboardButton(t(lang, "btn_currency"), callback_data="onb_curr_menu"),
                InlineKeyboardButton(t(lang, "btn_language"), callback_data="onb_lang_menu"),
            ],
        ]
    )
    return text, kb


def register_user_handlers(app: Client) -> None:
    @app.on_message(filters.command("start") & filters.private)
    async def cmd_start(client: Client, message: Message):
        user = await db.upsert_user(message.from_user.id, message.from_user.username)
        lang = user.get("language", "en")

        if await check_maintenance_guard(message.from_user.id):
            cfg = await db.get_settings()
            return await message.reply_text(
                t(
                    lang,
                    "maintenance_active",
                    reason=cfg.get("maintenance_reason", "Maintenance in progress."),
                )
            )

        # Force Subscription (FSub) Check Middleware
        is_allowed, fsub_kb = await enforce_fsub_gate(client, message.from_user.id, lang)
        if not is_allowed:
            return await message.reply_text(
                t(lang, "fsub_required"),
                reply_markup=fsub_kb,
            )

        kb = InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton("🇮🇳 हिन्दी", callback_data="setlang_hi"),
                    InlineKeyboardButton("🇬🇧 English", callback_data="setlang_en"),
                    InlineKeyboardButton("🇷🇺 Русский", callback_data="setlang_ru"),
                ]
            ]
        )
        await message.reply_text(
            t(lang, "welcome_lang"),
            reply_markup=kb,
        )

    @app.on_callback_query(filters.regex(r"^fsub_verify$"))
    async def cb_verify_fsub_membership(client: Client, query: CallbackQuery):
        user = await db.upsert_user(query.from_user.id, query.from_user.username)
        lang = user.get("language", "en")

        is_allowed, fsub_kb = await enforce_fsub_gate(client, query.from_user.id, lang)
        if not is_allowed:
            return await query.answer(
                t(lang, "fsub_still_missing"),
                show_alert=True,
            )

        await query.answer(t(lang, "fsub_verified"))
        kb = InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton("🇮🇳 हिन्दी", callback_data="setlang_hi"),
                    InlineKeyboardButton("🇬🇧 English", callback_data="setlang_en"),
                    InlineKeyboardButton("🇷🇺 Русский", callback_data="setlang_ru"),
                ]
            ]
        )
        await query.message.edit_text(
            t(lang, "welcome_lang"),
            reply_markup=kb,
        )

    @app.on_callback_query(filters.regex(r"^onb_lang_menu$"))
    async def cb_lang_menu(client: Client, query: CallbackQuery):
        user = await db.get_user(query.from_user.id)
        lang = user.get("language", "en") if user else "en"
        kb = InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton("🇮🇳 हिन्दी", callback_data="setlang_hi"),
                    InlineKeyboardButton("🇬🇧 English", callback_data="setlang_en"),
                    InlineKeyboardButton("🇷🇺 Русский", callback_data="setlang_ru"),
                ],
                [InlineKeyboardButton(t(lang, "btn_back"), callback_data="nav_main")],
            ]
        )
        await query.message.edit_text(t(lang, "welcome_lang"), reply_markup=kb)

    @app.on_callback_query(filters.regex(r"^setlang_(hi|en|ru)$"))
    async def cb_set_language(client: Client, query: CallbackQuery):
        lang = query.data.split("_")[1]
        await db.set_user_language(query.from_user.id, lang)
        await show_dynamic_currency_selector(query, lang)

    @app.on_callback_query(filters.regex(r"^onb_curr_menu$"))
    async def cb_curr_menu(client: Client, query: CallbackQuery):
        user = await db.get_user(query.from_user.id)
        lang = user.get("language", "en") if user else "en"
        await show_dynamic_currency_selector(query, lang)

    async def show_dynamic_currency_selector(query: CallbackQuery, lang: str):
        cfg = await db.get_settings()
        active_map = cfg.get("currencies", {"INR": True, "USD": True, "USDT": True})
        row = []
        if active_map.get("INR", True):
            row.append(InlineKeyboardButton("🇮🇳 INR (₹)", callback_data="setcurr_INR"))
        if active_map.get("USD", True):
            row.append(InlineKeyboardButton("🇺🇸 USD ($)", callback_data="setcurr_USD"))
        if active_map.get("USDT", True):
            row.append(InlineKeyboardButton("💎 USDT (Crypto)", callback_data="setcurr_USDT"))

        if not row:
            row.append(InlineKeyboardButton("🇺🇸 USD ($)", callback_data="setcurr_USD"))

        await query.message.edit_text(
            t(lang, "welcome_curr"),
            reply_markup=InlineKeyboardMarkup([row]),
        )

    @app.on_callback_query(filters.regex(r"^setcurr_(INR|USD|USDT)$"))
    async def cb_set_currency(client: Client, query: CallbackQuery):
        curr = query.data.split("_")[1]
        await db.set_user_currency(query.from_user.id, curr)
        text, kb = await render_main_menu(query.from_user.id, query.from_user.username)
        await query.message.edit_text(text, reply_markup=kb)

    @app.on_callback_query(filters.regex(r"^nav_main$"))
    async def cb_nav_main(client: Client, query: CallbackQuery):
        if await check_maintenance_guard(query.from_user.id):
            cfg = await db.get_settings()
            return await query.answer(cfg.get("maintenance_reason"), show_alert=True)
        text, kb = await render_main_menu(query.from_user.id, query.from_user.username)
        await query.message.edit_text(text, reply_markup=kb)

    # =========================================================================
    # FOLDER & PRODUCT BROWSING (Only Active Folders & Active Products)
    # =========================================================================
    @app.on_callback_query(filters.regex(r"^cat_folders$"))
    async def cb_browse_folders(client: Client, query: CallbackQuery):
        if await check_maintenance_guard(query.from_user.id):
            return await query.answer("Bot is under maintenance.", show_alert=True)

        user = await db.get_user(query.from_user.id)
        lang = user.get("language", "en") if user else "en"

        is_allowed, fsub_kb = await enforce_fsub_gate(client, query.from_user.id, lang)
        if not is_allowed:
            return await query.message.edit_text(
                t(lang, "fsub_required"),
                reply_markup=fsub_kb,
            )

        folders = await db.get_folders(active_only=True)
        buttons = [
            [
                InlineKeyboardButton(
                    f"📁 {f['name']}",
                    callback_data=f"cat_open_{f['_id']}",
                )
            ]
            for f in folders
        ]
        buttons.append([InlineKeyboardButton(t(lang, "btn_back"), callback_data="nav_main")])

        await query.message.edit_text(
            f"{config.EMOJI_FOLDER} **SELECT A CATEGORY FOLDER**\n\n"
            "Choose a category below to explore instant-delivery digital products:",
            reply_markup=InlineKeyboardMarkup(buttons),
        )

    @app.on_callback_query(filters.regex(r"^cat_open_([a-f0-9]+)$"))
    async def cb_open_folder_products(client: Client, query: CallbackQuery):
        folder_id = query.data.split("_")[-1]
        user = await db.get_user(query.from_user.id)
        lang = user.get("language", "en") if user else "en"
        curr = user.get("currency", "USD") if user else "USD"

        folder = await db.get_folder(folder_id)
        if not folder or not folder.get("is_active", True):
            return await query.answer("This folder is currently unavailable.", show_alert=True)

        products = await db.get_products(folder_id=folder_id, active_only=True)
        buttons = []
        for p in products:
            price_str = await db.format_currency(float(p["price_usd"]), curr)
            buttons.append(
                [
                    InlineKeyboardButton(
                        f"📦 {p['title']} — {price_str}",
                        callback_data=f"prod_view_{p['_id']}",
                    )
                ]
            )
        buttons.append([InlineKeyboardButton(t(lang, "btn_back"), callback_data="cat_folders")])

        await query.message.edit_text(
            f'<emoji id="{folder.get("emoji_id", "5397782960512444700")}">📁</emoji> **{folder["name"].upper()}**\n\n'
            "Select a product below to view specifications and instant purchase options:",
            reply_markup=InlineKeyboardMarkup(buttons),
        )

    @app.on_callback_query(filters.regex(r"^prod_view_([a-f0-9]+)$"))
    async def cb_view_product(client: Client, query: CallbackQuery):
        prod_id = query.data.split("_")[-1]
        product = await db.get_product(prod_id)
        if not product or not product.get("is_active", True):
            return await query.answer("Product is currently Out of Stock.", show_alert=True)

        user = await db.get_user(query.from_user.id)
        lang = user.get("language", "en") if user else "en"
        curr = user.get("currency", "USD") if user else "USD"
        price_str = await db.format_currency(float(product["price_usd"]), curr)

        caption = t(
            lang,
            "product_caption",
            title=product["title"],
            description=product["description"],
            product_type=product["product_type"],
            price=price_str,
        )
        kb = InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton(
                        f"{t(lang, 'btn_buy_now')} ({price_str})",
                        callback_data=f"buy_menu_{prod_id}",
                    )
                ],
                [
                    InlineKeyboardButton(
                        t(lang, "btn_back"),
                        callback_data=f"cat_open_{product['folder_id']}"
                        if product.get("folder_id")
                        else "cat_folders",
                    )
                ],
            ]
        )
        await query.message.edit_text(caption, reply_markup=kb)

    # =========================================================================
    # 3-WAY CHECKOUT (Wallet Balance | FamPay UPI | OxaPay Crypto)
    # =========================================================================
    @app.on_callback_query(filters.regex(r"^buy_menu_([a-f0-9]+)$"))
    async def cb_buy_menu(client: Client, query: CallbackQuery):
        prod_id = query.data.split("_")[-1]
        product = await db.get_product(prod_id)
        if not product or not product.get("is_active", True):
            return await query.answer("Out of Stock!", show_alert=True)

        user = await db.get_user(query.from_user.id)
        cfg = await db.get_settings()
        lang = user.get("language", "en") if user else "en"
        curr = user.get("currency", "USD") if user else "USD"

        price_str = await db.format_currency(float(product["price_usd"]), curr)
        wallet_str = await db.format_currency(float(user.get("balance_usd", 0.0)), curr)

        buttons = [
            [
                InlineKeyboardButton(
                    f"{t(lang, 'btn_pay_wallet')} ({wallet_str})",
                    callback_data=f"pay_wallet_{prod_id}",
                )
            ]
        ]

        if cfg.get("currencies", {}).get("INR", True) and cfg.get("gateways", {}).get("FAMPAY", True):
            buttons.append(
                [
                    InlineKeyboardButton(
                        t(lang, "btn_pay_fampay"),
                        callback_data=f"pay_fampay_{prod_id}",
                    )
                ]
            )

        if cfg.get("currencies", {}).get("USDT", True) and cfg.get("gateways", {}).get("OXAPAY", True):
            buttons.append(
                [
                    InlineKeyboardButton(
                        t(lang, "btn_pay_oxapay"),
                        callback_data=f"pay_oxapay_{prod_id}",
                    )
                ]
            )

        buttons.append(
            [InlineKeyboardButton(t(lang, "btn_back"), callback_data=f"prod_view_{prod_id}")]
        )

        await query.message.edit_text(
            t(
                lang,
                "checkout_title",
                title=product["title"],
                price=price_str,
                wallet_balance=wallet_str,
            ),
            reply_markup=InlineKeyboardMarkup(buttons),
        )

    @app.on_callback_query(filters.regex(r"^pay_wallet_([a-f0-9]+)$"))
    async def cb_pay_via_wallet(client: Client, query: CallbackQuery):
        prod_id = query.data.split("_")[-1]
        product = await db.get_product(prod_id)
        if not product or not product.get("is_active", True):
            return await query.answer("Product unavailable.", show_alert=True)

        user = await db.get_user(query.from_user.id)
        lang = user.get("language", "en") if user else "en"
        curr = user.get("currency", "USD") if user else "USD"
        price_usd = float(product["price_usd"])
        bal_usd = float(user.get("balance_usd", 0.0))

        if bal_usd < price_usd:
            req_str = await db.format_currency(price_usd, curr)
            avail_str = await db.format_currency(bal_usd, curr)
            return await query.message.edit_text(
                t(lang, "insufficient_wallet", required=req_str, available=avail_str),
                reply_markup=InlineKeyboardMarkup(
                    [
                        [InlineKeyboardButton(t(lang, "btn_wallet"), callback_data="wallet_open")],
                        [
                            InlineKeyboardButton(
                                t(lang, "btn_back"), callback_data=f"buy_menu_{prod_id}"
                            )
                        ],
                    ]
                ),
            )

        await db.deduct_wallet_balance(query.from_user.id, price_usd, floor_at_zero=False)
        order = await db.create_order(
            user_id=query.from_user.id,
            product_id=prod_id,
            amount_usd=price_usd,
            currency=curr,
            gateway="WALLET",
            status="PAID",
        )
        await query.message.delete()
        await deliver_order_payload(client, order["_id"])

    @app.on_callback_query(filters.regex(r"^pay_fampay_([a-f0-9]+)$"))
    async def cb_pay_via_fampay(client: Client, query: CallbackQuery):
        prod_id = query.data.split("_")[-1]
        product = await db.get_product(prod_id)
        if not product:
            return
        cfg = await db.get_settings()
        rate = float(cfg.get("usd_to_inr", config.DEFAULT_USD_TO_INR))
        price_usd = float(product["price_usd"])
        amount_inr = round(price_usd * rate, 2)

        order = await db.create_order(
            user_id=query.from_user.id,
            product_id=prod_id,
            amount_usd=price_usd,
            currency="INR",
            gateway="FAMPAY",
            status="PENDING",
        )
        qr_bio, _ = FamPayService.generate_upi_qr(order["_id"], amount_inr)
        await query.message.reply_photo(
            photo=qr_bio,
            caption=(
                f"{config.EMOJI_BOLT} **FAMPAY UPI INSTANT CHECKOUT**\n\n"
                f"📦 **Product:** {product['title']}\n"
                f"🧾 **Order ID:** `{order['_id']}`\n"
                f"💵 **Amount Payable:** `₹{amount_inr:,.2f}`\n\n"
                "_Scan this dynamic QR with FamPay or any UPI app. Product will be delivered automatically to this chat the moment payment succeeds!_"
            ),
        )

    @app.on_callback_query(filters.regex(r"^pay_oxapay_([a-f0-9]+)$"))
    async def cb_pay_via_oxapay(client: Client, query: CallbackQuery):
        prod_id = query.data.split("_")[-1]
        product = await db.get_product(prod_id)
        if not product:
            return
        price_usd = float(product["price_usd"])
        order = await db.create_order(
            user_id=query.from_user.id,
            product_id=prod_id,
            amount_usd=price_usd,
            currency="USDT",
            gateway="OXAPAY",
            status="PENDING",
        )
        inv = await OxaPayService.create_invoice(
            order_id=order["_id"],
            amount_usd=price_usd,
            description=product["title"],
        )
        pay_url = inv.get("pay_url") or f"https://pay.oxapay.com/invoice/{order['_id']}"
        await query.message.edit_text(
            f"{config.EMOJI_DIAMOND} **OXAPAY CRYPTO CHECKOUT**\n\n"
            f"📦 **Product:** {product['title']}\n"
            f"🧾 **Order ID:** `{order['_id']}`\n"
            f"💵 **Amount:** `{price_usd:.2f} USDT`\n\n"
            "Complete your payment via the OxaPay link below for instant automated delivery:",
            reply_markup=InlineKeyboardMarkup(
                [
                    [InlineKeyboardButton("💎 Pay with Crypto (OxaPay)", url=pay_url)],
                    [InlineKeyboardButton("⬅️ Back", callback_data=f"buy_menu_{prod_id}")],
                ]
            ),
        )

    @app.on_callback_query(filters.regex(r"^fb_leave_(ORD_[A-Z0-9]+)$"))
    async def cb_leave_feedback(client: Client, query: CallbackQuery):
        order_id = query.data.replace("fb_leave_", "")
        PENDING_FEEDBACK[query.from_user.id] = order_id
        await query.message.reply_text(
            "⭐️ **Share Your Verified Buyer Review**\n\n"
            f"Type your feedback for Order `{order_id}` below and it will be published to our official feedback channel:"
        )

    @app.on_message(filters.private & filters.text, group=2)
    async def handle_feedback_submission(client: Client, message: Message):
        uid = message.from_user.id
        if uid not in PENDING_FEEDBACK:
            return
        order_id = PENDING_FEEDBACK.pop(uid)
        await client.send_message(
            config.FEEDBACK_CHANNEL_ID,
            f"⭐️ **VERIFIED BUYER FEEDBACK**\n\n"
            f"👤 **Buyer:** `{uid}` (@{message.from_user.username or 'hidden'})\n"
            f"🧾 **Order ID:** `{order_id}`\n"
            f"💬 **Review:** {message.text}",
        )
        await message.reply_text(
            f"{config.EMOJI_CHECK} **Thank you!** Your verified feedback has been posted to our channel."
        )
