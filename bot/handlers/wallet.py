"""
NEU PRODUCT BOT — Built-in User Wallet & Admin Balance Commands
Implements:
- Admin Wallet Commands (Owner & Admins):
  - /addmoney <user_id> <amount>
  - /removemoney <user_id> <amount>
  - /balance <user_id> & /userinfo <user_id>
- User Wallet View & Self Top-Up (FamPay UPI & OxaPay Crypto)
"""
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


def register_wallet_handlers(app: Client) -> None:
    # =========================================================================
    # A. ADMIN WALLET / BALANCE MANAGEMENT COMMANDS (Owner & Admins)
    # =========================================================================
    @app.on_message(filters.command("addmoney") & filters.private)
    async def cmd_add_money(client: Client, message: Message):
        if not await db.is_admin(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Admin privileges required."
            )
        if len(message.command) < 3:
            return await message.reply_text(
                "**Usage:** `/addmoney <user_id> <amount_usd>`\nExample: `/addmoney 8940129384 25.00`"
            )

        try:
            target_id = int(message.command[1])
            amount_usd = round(float(message.command[2]), 2)
            if amount_usd <= 0:
                raise ValueError()
        except ValueError:
            return await message.reply_text("⚠️ Provide a valid numeric `user_id` and positive `amount`.")

        new_balance_usd = await db.add_wallet_balance(target_id, amount_usd)
        target_user = await db.get_user(target_id)
        lang = target_user.get("language", "en") if target_user else "en"
        curr = target_user.get("currency", "USD") if target_user else "USD"

        formatted_added = await db.format_currency(amount_usd, curr)
        formatted_total = await db.format_currency(new_balance_usd, curr)

        await message.reply_text(
            f"{config.EMOJI_CHECK} **Wallet Credited Successfully!**\n\n"
            f"👤 **User ID:** `{target_id}`\n"
            f"➕ **Credited:** `${amount_usd:.2f} USD` ({formatted_added})\n"
            f"{config.EMOJI_WALLET} **Updated Balance:** `${new_balance_usd:.2f} USD` ({formatted_total})"
        )

        # Send instant notification to the user with custom premium emojis
        try:
            await client.send_message(
                target_id,
                t(
                    lang,
                    "wallet_credited_notify",
                    added=formatted_added,
                    new_balance=formatted_total,
                ),
            )
        except Exception:
            pass

    @app.on_message(filters.command("removemoney") & filters.private)
    async def cmd_remove_money(client: Client, message: Message):
        if not await db.is_admin(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Admin privileges required."
            )
        if len(message.command) < 3:
            return await message.reply_text(
                "**Usage:** `/removemoney <user_id> <amount_usd>`\nExample: `/removemoney 8940129384 10.00`"
            )

        try:
            target_id = int(message.command[1])
            amount_usd = round(float(message.command[2]), 2)
            if amount_usd <= 0:
                raise ValueError()
        except ValueError:
            return await message.reply_text("⚠️ Provide a valid numeric `user_id` and positive `amount`.")

        new_balance_usd = await db.deduct_wallet_balance(
            target_id, amount_usd, floor_at_zero=True
        )
        target_user = await db.get_user(target_id)
        lang = target_user.get("language", "en") if target_user else "en"
        curr = target_user.get("currency", "USD") if target_user else "USD"

        formatted_deducted = await db.format_currency(amount_usd, curr)
        formatted_total = await db.format_currency(new_balance_usd or 0.0, curr)

        await message.reply_text(
            f"{config.EMOJI_CHECK} **Wallet Debited (Floored at $0.00)**\n\n"
            f"👤 **User ID:** `{target_id}`\n"
            f"➖ **Deducted:** `${amount_usd:.2f} USD` ({formatted_deducted})\n"
            f"{config.EMOJI_WALLET} **Updated Balance:** `${new_balance_usd:.2f} USD` ({formatted_total})"
        )

        try:
            await client.send_message(
                target_id,
                t(
                    lang,
                    "wallet_debited_notify",
                    deducted=formatted_deducted,
                    new_balance=formatted_total,
                ),
            )
        except Exception:
            pass

    @app.on_message(filters.command(["balance", "userinfo"]) & filters.private)
    async def cmd_user_balance_info(client: Client, message: Message):
        if not await db.is_admin(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Admin privileges required."
            )
        if len(message.command) < 2 or not message.command[1].isdigit():
            return await message.reply_text(
                "**Usage:** `/balance <user_id>` or `/userinfo <user_id>`"
            )

        target_id = int(message.command[1])
        u = await db.get_user(target_id)
        if not u:
            return await message.reply_text(f"⚠️ User `{target_id}` not found in MongoDB.")

        curr = u.get("currency", "USD")
        bal_usd = float(u.get("balance_usd", 0.0))
        formatted_bal = await db.format_currency(bal_usd, curr)
        total_orders = await db.count_user_orders(target_id, paid_only=True)

        await message.reply_text(
            f"{config.EMOJI_WALLET} **USER WALLET & PROFILE INSPECTOR**\n\n"
            f"🆔 **User ID:** `{target_id}`\n"
            f"👤 **Username:** `@{u.get('username', 'N/A')}`\n"
            f"💰 **Base Balance (USD):** `${bal_usd:.2f}`\n"
            f"💱 **Display Balance ({curr}):** `{formatted_bal}`\n"
            f"🌐 **Language:** `{u.get('language', 'en').upper()}`\n"
            f"📦 **Completed Orders:** `{total_orders}`\n"
            f"🚫 **Banned:** `{u.get('is_banned', False)}`"
        )

    # =========================================================================
    # B. USER WALLET PANEL & DIRECT TOP-UP FLOW
    # =========================================================================
    @app.on_callback_query(filters.regex(r"^wallet_open$"))
    async def cb_open_wallet(client: Client, query: CallbackQuery):
        user = await db.upsert_user(query.from_user.id, query.from_user.username)
        cfg = await db.get_settings()
        lang = user.get("language", "en")
        curr = user.get("currency", "USD")
        bal_usd = float(user.get("balance_usd", 0.0))
        formatted_bal = await db.format_currency(bal_usd, curr)
        orders_count = await db.count_user_orders(user["_id"], paid_only=True)

        buttons = []
        if cfg.get("currencies", {}).get("INR", True) and cfg.get("gateways", {}).get("FAMPAY", True):
            buttons.append(
                [
                    InlineKeyboardButton(
                        t(lang, "btn_topup_fampay"), callback_data="wallet_topup_FAMPAY"
                    )
                ]
            )
        if cfg.get("currencies", {}).get("USDT", True) and cfg.get("gateways", {}).get("OXAPAY", True):
            buttons.append(
                [
                    InlineKeyboardButton(
                        t(lang, "btn_topup_oxapay"), callback_data="wallet_topup_OXAPAY"
                    )
                ]
            )
        buttons.append([InlineKeyboardButton(t(lang, "btn_back"), callback_data="nav_main")])

        await query.message.edit_text(
            t(
                lang,
                "wallet_panel",
                user_id=user["_id"],
                balance=formatted_bal,
                balance_usd=f"{bal_usd:.2f}",
                orders_count=orders_count,
            ),
            reply_markup=InlineKeyboardMarkup(buttons),
        )

    @app.on_callback_query(filters.regex(r"^wallet_topup_(FAMPAY|OXAPAY)$"))
    async def cb_wallet_topup_presets(client: Client, query: CallbackQuery):
        gw = query.data.split("_")[-1]
        buttons = [
            [
                InlineKeyboardButton("➕ $5.00", callback_data=f"wtop_exec_{gw}_5"),
                InlineKeyboardButton("➕ $10.00", callback_data=f"wtop_exec_{gw}_10"),
                InlineKeyboardButton("➕ $25.00", callback_data=f"wtop_exec_{gw}_25"),
            ],
            [
                InlineKeyboardButton("➕ $50.00", callback_data=f"wtop_exec_{gw}_50"),
                InlineKeyboardButton("➕ $100.00", callback_data=f"wtop_exec_{gw}_100"),
            ],
            [InlineKeyboardButton("⬅️ Back to Wallet", callback_data="wallet_open")],
        ]
        await query.message.edit_text(
            f"{config.EMOJI_WALLET} **TOP-UP WALLET VIA {gw}**\n\n"
            "Select the USD equivalent amount you wish to add to your bot wallet:",
            reply_markup=InlineKeyboardMarkup(buttons),
        )

    @app.on_callback_query(filters.regex(r"^wtop_exec_(FAMPAY|OXAPAY)_(\d+)$"))
    async def cb_execute_wallet_topup(client: Client, query: CallbackQuery):
        parts = query.data.split("_")
        gw = parts[2]
        amount_usd = float(parts[3])
        cfg = await db.get_settings()

        # Create a top-up order (product_id=None indicates wallet recharge)
        order = await db.create_order(
            user_id=query.from_user.id,
            product_id=None,
            amount=amount_usd,
            currency="INR" if gw == "FAMPAY" else "USDT",
            gateway=gw,
            status="PENDING",
        )

        if gw == "FAMPAY":
            rate = float(cfg.get("usd_to_inr_rate", config.DEFAULT_USD_TO_INR))
            amount_inr = round(amount_usd * rate, 2)
            qr_bio, upi_uri = FamPayService.generate_upi_qr(order["_id"], amount_inr)
            await query.message.reply_photo(
                photo=qr_bio,
                caption=(
                    f"{config.EMOJI_BOLT} **FAMPAY UPI WALLET TOP-UP**\n\n"
                    f"🧾 **Top-Up ID:** `{order['_id']}`\n"
                    f"💵 **Payable:** `₹{amount_inr:,.2f}` (`${amount_usd:.2f} USD`)\n"
                    f"🔗 **UPI VPA:** `{config.FAMPAY_MERCHANT_VPA}`\n\n"
                    "_Scan the QR above using FamPay, GPay, PhonePe, or Paytm. Your wallet will be credited automatically via webhook!_"
                ),
            )
        else:
            inv = await OxaPayService.create_invoice(
                order_id=order["_id"],
                amount_usd=amount_usd,
                description=f"NEU Wallet Top-Up (${amount_usd:.2f})",
            )
            pay_url = inv.get("pay_url") or f"https://pay.oxapay.com/invoice/{order['_id']}"
            await query.message.edit_text(
                f"{config.EMOJI_DIAMOND} **OXAPAY CRYPTO WALLET TOP-UP**\n\n"
                f"🧾 **Top-Up ID:** `{order['_id']}`\n"
                f"💵 **Amount:** `{amount_usd:.2f} USDT`\n\n"
                "Click below to complete your crypto deposit. Funds are credited immediately upon confirmation:",
                reply_markup=InlineKeyboardMarkup(
                    [
                        [InlineKeyboardButton("💎 Pay with OxaPay", url=pay_url)],
                        [InlineKeyboardButton("⬅️ Back to Wallet", callback_data="wallet_open")],
                    ]
                ),
            )
