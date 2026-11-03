"""
NEU PRODUCT BOT — Owner & Admin Hierarchy + Dynamic Active/Deactive Toggle System
Implements:
- Owner-Only Commands: /addadmin <user_id>, /removeadmin <user_id>, /adminlist
- Admin Panel (/admin):
  - ⚙️ System & Currency Controls (INR, USD, USDT, FamPay, OxaPay, Maintenance Mode)
  - 📢 Force Sub (FSub) Channel Management
  - 📁 Folder Visibility Toggles & Creation
  - 📦 Product Visibility Toggles & Private Channel Payload Upload Wizard
"""
from typing import Dict, Any
from pyrogram import Client, filters
from pyrogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from config import config
from database import db

ADMIN_WIZARD_STATE: Dict[int, Dict[str, Any]] = {}


def status_badge(is_active: bool) -> str:
    return "🟢 Active" if is_active else "🔴 Deactivated"


def build_admin_home_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "⚙️ System & Currency Controls", callback_data="adm_sys_controls"
                )
            ],
            [
                InlineKeyboardButton(
                    "📢 Force Sub (FSub) Channels", callback_data="adm_fsub"
                )
            ],
            [
                InlineKeyboardButton("📁 Manage Folders", callback_data="adm_folders"),
                InlineKeyboardButton("📦 Manage Products", callback_data="adm_products"),
            ],
            [
                InlineKeyboardButton("➕ New Folder", callback_data="adm_new_folder"),
                InlineKeyboardButton("➕ New Product", callback_data="adm_new_product"),
            ],
        ]
    )


async def build_sys_controls_kb() -> InlineKeyboardMarkup:
    cfg = await db.get_settings()
    curr = cfg.get("currencies", {})
    gw = cfg.get("gateways", {})
    maint = cfg.get("maintenance_mode", False)

    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    f"🇮🇳 INR & FamPay: {status_badge(curr.get('INR', True))}",
                    callback_data="adm_toggle_curr_INR",
                )
            ],
            [
                InlineKeyboardButton(
                    f"🇺🇸 USD Display: {status_badge(curr.get('USD', True))}",
                    callback_data="adm_toggle_curr_USD",
                )
            ],
            [
                InlineKeyboardButton(
                    f"💎 Crypto/USDT & OxaPay: {status_badge(curr.get('USDT', True))}",
                    callback_data="adm_toggle_curr_USDT",
                )
            ],
            [
                InlineKeyboardButton(
                    f"⚡️ FamPay Gateway: {status_badge(gw.get('FAMPAY', True))}",
                    callback_data="adm_toggle_gw_FAMPAY",
                ),
                InlineKeyboardButton(
                    f"💎 OxaPay Gateway: {status_badge(gw.get('OXAPAY', True))}",
                    callback_data="adm_toggle_gw_OXAPAY",
                ),
            ],
            [
                InlineKeyboardButton(
                    f"🛠 Maintenance Mode: {status_badge(maint)}",
                    callback_data="adm_toggle_maint",
                )
            ],
            [InlineKeyboardButton("⬅️ Back to Admin Panel", callback_data="adm_home")],
        ]
    )


def register_admin_handlers(app: Client) -> None:
    # =========================================================================
    # A. OWNER-ONLY ADMIN HIERARCHY COMMANDS (Strictly OWNER_ID)
    # =========================================================================
    @app.on_message(filters.command("addadmin") & filters.private)
    async def cmd_add_admin(client: Client, message: Message):
        if not await db.is_owner(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Only the Primary Owner (`{config.OWNER_ID}`) can promote Admins."
            )
        if len(message.command) < 2 or not message.command[1].isdigit():
            return await message.reply_text(
                "**Usage:** `/addadmin <user_id>`\nExample: `/addadmin 7739104210`"
            )

        target_id = int(message.command[1])
        await db.upsert_user(target_id, None)
        added = await db.add_admin(target_id)
        if added:
            await message.reply_text(
                f"{config.EMOJI_CROWN} **Admin Promoted!**\n"
                f"User `{target_id}` now has access to `/admin`, FSub management, catalog management, and wallet balance commands."
            )
        else:
            await message.reply_text(f"ℹ️ User `{target_id}` is already an active Admin.")

    @app.on_message(filters.command("removeadmin") & filters.private)
    async def cmd_remove_admin(client: Client, message: Message):
        if not await db.is_owner(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Only the Primary Owner (`{config.OWNER_ID}`) can revoke Admins."
            )
        if len(message.command) < 2 or not message.command[1].isdigit():
            return await message.reply_text("**Usage:** `/removeadmin <user_id>`")

        target_id = int(message.command[1])
        if target_id == config.OWNER_ID:
            return await message.reply_text("⚠️ Primary Owner cannot be removed.")

        removed = await db.remove_admin(target_id)
        if removed:
            await message.reply_text(
                f"{config.EMOJI_CHECK} **Admin Revoked:** User `{target_id}` is no longer an Admin."
            )
        else:
            await message.reply_text(f"ℹ️ User `{target_id}` was not in the Admin list.")

    @app.on_message(filters.command("adminlist") & filters.private)
    async def cmd_admin_list(client: Client, message: Message):
        if not await db.is_owner(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Only the Primary Owner can view the full Admin hierarchy."
            )
        admin_ids = await db.get_admin_list()
        lines = [f"{config.EMOJI_CROWN} **ACTIVE ADMIN HIERARCHY**\n"]
        for aid in admin_ids:
            u_doc = await db.get_user(aid)
            uname = f"@{u_doc['username']}" if u_doc and u_doc.get("username") else "Unknown"
            role = "👑 PRIMARY OWNER" if aid == config.OWNER_ID else "🛡 ADMIN"
            lines.append(f"• `{aid}` ({uname}) — **{role}**")
        await message.reply_text("\n".join(lines))

    # =========================================================================
    # B. ADMIN DASHBOARD & DYNAMIC TOGGLE CONTROLS (/admin)
    # =========================================================================
    @app.on_message(filters.command("admin") & filters.private)
    async def cmd_admin_panel(client: Client, message: Message):
        if not await db.is_admin(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Unauthorized:** Admin privileges required."
            )
        role_label = (
            "Primary Owner"
            if await db.is_owner(message.from_user.id)
            else "Delegated Admin"
        )
        await message.reply_text(
            f"{config.EMOJI_CROWN} **NEU PRODUCT BOT — ADMIN CONTROL PANEL**\n\n"
            f"🔑 **Role:** `{role_label}`\n"
            f"🗄 **Asset Storage:** `{config.DATABASE_CHANNEL_ID}`\n\n"
            "Select a module below to configure dynamic toggles, FSub channels, folders, or products:",
            reply_markup=build_admin_home_kb(),
        )

    @app.on_callback_query(filters.regex(r"^adm_"))
    async def handle_admin_callbacks(client: Client, query: CallbackQuery):
        if not await db.is_admin(query.from_user.id):
            return await query.answer("Access Denied!", show_alert=True)

        data = query.data

        if data == "adm_home":
            ADMIN_WIZARD_STATE.pop(query.from_user.id, None)
            await query.message.edit_text(
                f"{config.EMOJI_CROWN} **NEU PRODUCT BOT — ADMIN CONTROL PANEL**\n\n"
                "Select a module below to configure dynamic toggles, FSub channels, folders, or products:",
                reply_markup=build_admin_home_kb(),
            )

        elif data == "adm_sys_controls":
            kb = await build_sys_controls_kb()
            await query.message.edit_text(
                "⚙️ **SYSTEM & CURRENCY DYNAMIC CONTROLS**\n\n"
                "Click any item below to toggle its real-time status (`🟢 Active` / `🔴 Deactivated`) in MongoDB:",
                reply_markup=kb,
            )

        elif data == "adm_fsub":
            channels = await db.get_fsub_channels()
            buttons = []
            for ch in channels:
                cid = ch["channel_id"]
                buttons.append(
                    [
                        InlineKeyboardButton(
                            f"🗑 Remove {cid}", callback_data=f"adm_rmfsub_{cid}"
                        )
                    ]
                )
            buttons.append([InlineKeyboardButton("⬅️ Back", callback_data="adm_home")])
            await query.message.edit_text(
                f"📢 **FORCE SUBSCRIPTION (FSUB) MANAGEMENT ({len(channels)} Active)**\n\n"
                "• Add Channel: `/addfsub <channel_id> <invite_link>`\n"
                "• Remove Channel: `/removefsub <channel_id>` or click below\n"
                "• List Channels: `/fsublist`",
                reply_markup=InlineKeyboardMarkup(buttons),
            )

        elif data.startswith("adm_rmfsub_"):
            cid = int(data.replace("adm_rmfsub_", ""))
            await db.remove_fsub_channel(cid)
            await query.answer(f"Removed FSub channel {cid}")
            channels = await db.get_fsub_channels()
            buttons = [
                [
                    InlineKeyboardButton(
                        f"🗑 Remove {c['channel_id']}",
                        callback_data=f"adm_rmfsub_{c['channel_id']}",
                    )
                ]
                for c in channels
            ]
            buttons.append([InlineKeyboardButton("⬅️ Back", callback_data="adm_home")])
            await query.message.edit_reply_markup(InlineKeyboardMarkup(buttons))

        elif data.startswith("adm_toggle_curr_"):
            code = data.replace("adm_toggle_curr_", "")
            new_state = await db.toggle_currency(code)
            await query.answer(f"{code} is now {'Active' if new_state else 'Deactivated'}")
            await query.message.edit_reply_markup(await build_sys_controls_kb())

        elif data.startswith("adm_toggle_gw_"):
            gw = data.replace("adm_toggle_gw_", "")
            new_state = await db.toggle_gateway(gw)
            await query.answer(f"{gw} is now {'Active' if new_state else 'Deactivated'}")
            await query.message.edit_reply_markup(await build_sys_controls_kb())

        elif data == "adm_toggle_maint":
            new_state = await db.toggle_maintenance()
            await query.answer(
                f"Maintenance Mode {'ENABLED' if new_state else 'DISABLED'}",
                show_alert=True,
            )
            await query.message.edit_reply_markup(await build_sys_controls_kb())

        elif data == "adm_folders":
            folders = await db.get_folders(active_only=False)
            buttons = [
                [
                    InlineKeyboardButton(
                        f"📁 {f['name']} — {status_badge(f.get('is_active', True))}",
                        callback_data=f"adm_tfolder_{f['_id']}",
                    )
                ]
                for f in folders
            ]
            buttons.append([InlineKeyboardButton("⬅️ Back", callback_data="adm_home")])
            await query.message.edit_text(
                "📁 **FOLDER VISIBILITY TOGGLES**\n\n"
                "Click a folder to soft-hide or show it (and its nested products) in the storefront:",
                reply_markup=InlineKeyboardMarkup(buttons),
            )

        elif data.startswith("adm_tfolder_"):
            fid = data.replace("adm_tfolder_", "")
            new_state = await db.toggle_folder(fid)
            await query.answer(f"Folder {'Activated' if new_state else 'Deactivated'}")
            folders = await db.get_folders(active_only=False)
            buttons = [
                [
                    InlineKeyboardButton(
                        f"📁 {f['name']} — {status_badge(f.get('is_active', True))}",
                        callback_data=f"adm_tfolder_{f['_id']}",
                    )
                ]
                for f in folders
            ]
            buttons.append([InlineKeyboardButton("⬅️ Back", callback_data="adm_home")])
            await query.message.edit_reply_markup(InlineKeyboardMarkup(buttons))

        elif data == "adm_products":
            products = await db.get_products(active_only=False)
            buttons = [
                [
                    InlineKeyboardButton(
                        f"📦 {p['title']} (${p['price_usd']}) — {status_badge(p.get('is_active', True))}",
                        callback_data=f"adm_tprod_{p['_id']}",
                    )
                ]
                for p in products
            ]
            buttons.append([InlineKeyboardButton("⬅️ Back", callback_data="adm_home")])
            await query.message.edit_text(
                "📦 **PRODUCT VISIBILITY TOGGLES**\n\n"
                "Click any product to toggle between `🟢 Active` and `🔴 Out of Stock`:",
                reply_markup=InlineKeyboardMarkup(buttons),
            )

        elif data.startswith("adm_tprod_"):
            pid = data.replace("adm_tprod_", "")
            new_state = await db.toggle_product(pid)
            await query.answer(f"Product {'Activated' if new_state else 'Out of Stock'}")
            products = await db.get_products(active_only=False)
            buttons = [
                [
                    InlineKeyboardButton(
                        f"📦 {p['title']} (${p['price_usd']}) — {status_badge(p.get('is_active', True))}",
                        callback_data=f"adm_tprod_{p['_id']}",
                    )
                ]
                for p in products
            ]
            buttons.append([InlineKeyboardButton("⬅️ Back", callback_data="adm_home")])
            await query.message.edit_reply_markup(InlineKeyboardMarkup(buttons))

        elif data == "adm_new_folder":
            ADMIN_WIZARD_STATE[query.from_user.id] = {"step": "folder_name"}
            await query.message.edit_text(
                "➕ **CREATE NEW FOLDER**\n\n"
                "Send the folder name (e.g. `Premium SaaS Kits` or `Automation Tools`):",
                reply_markup=InlineKeyboardMarkup(
                    [[InlineKeyboardButton("❌ Cancel", callback_data="adm_home")]]
                ),
            )

        elif data == "adm_new_product":
            folders = await db.get_folders(active_only=False)
            buttons = [
                [
                    InlineKeyboardButton(
                        f"📁 {f['name']}", callback_data=f"adm_sel_folder_{f['_id']}"
                    )
                ]
                for f in folders
            ]
            buttons.append(
                [InlineKeyboardButton("🌐 Root (No Folder)", callback_data="adm_sel_folder_root")]
            )
            buttons.append([InlineKeyboardButton("❌ Cancel", callback_data="adm_home")])
            await query.message.edit_text(
                "➕ **UPLOAD NEW DIGITAL PRODUCT**\n\n"
                "Step 1/4: Select the destination folder for this product:",
                reply_markup=InlineKeyboardMarkup(buttons),
            )

        elif data.startswith("adm_sel_folder_"):
            folder_id = data.replace("adm_sel_folder_", "")
            ADMIN_WIZARD_STATE[query.from_user.id] = {
                "step": "prod_meta",
                "folder_id": None if folder_id == "root" else folder_id,
            }
            await query.message.edit_text(
                "➕ **Step 2/4: Send Product Metadata**\n\n"
                "Send in this format (separated by `|`):\n"
                "`Title | Description | Price in USD | Type (ZIP/PDF/MP4/LINK)`",
            )

    @app.on_message(
        filters.private
        & ~filters.command(
            [
                "start",
                "admin",
                "addadmin",
                "removeadmin",
                "adminlist",
                "addfsub",
                "removefsub",
                "fsublist",
                "addmoney",
                "removemoney",
                "balance",
                "userinfo",
            ]
        ),
        group=1,
    )
    async def handle_admin_wizard_inputs(client: Client, message: Message):
        uid = message.from_user.id
        if uid not in ADMIN_WIZARD_STATE:
            return

        state = ADMIN_WIZARD_STATE[uid]
        step = state.get("step")

        if step == "folder_name" and message.text:
            fid = await db.create_folder(message.text.strip())
            ADMIN_WIZARD_STATE.pop(uid, None)
            await message.reply_text(
                f"{config.EMOJI_CHECK} **Folder Created:** `{message.text.strip()}` (`{fid}`)",
                reply_markup=build_admin_home_kb(),
            )

        elif step == "prod_meta" and message.text:
            parts = [p.strip() for p in message.text.split("|")]
            if len(parts) < 4:
                return await message.reply_text(
                    "⚠️ Invalid format. Please provide: `Title | Description | PriceUSD | Type`"
                )
            state["title"] = parts[0]
            state["description"] = parts[1]
            state["price_usd"] = float(parts[2])
            state["product_type"] = parts[3].upper()
            state["step"] = "prod_payload"
            await message.reply_text(
                "📤 **Step 3/4: Upload Product Payload Asset**\n\n"
                "Now send the actual file (ZIP, PDF, MP4, PNG) or secret delivery text/link to vault inside `DATABASE_CHANNEL_ID`:"
            )

        elif step == "prod_payload":
            vault_msg = await message.copy(config.DATABASE_CHANNEL_ID)
            banner_id = ""
            if message.photo:
                banner_id = message.photo.file_id
            elif message.document and message.document.thumbs:
                banner_id = message.document.thumbs[0].file_id

            prod_id = await db.create_product(
                folder_id=state.get("folder_id"),
                title=state["title"],
                description=state["description"],
                price_usd=state["price_usd"],
                product_type=state["product_type"],
                banner_file_id=banner_id,
                channel_message_id=vault_msg.id,
            )
            ADMIN_WIZARD_STATE.pop(uid, None)
            await message.reply_text(
                f"{config.EMOJI_CHECK} **Product Vaulted & Live!**\n\n"
                f"📦 **Product ID:** `{prod_id}`\n"
                f"🗄 **Channel Message ID:** `{vault_msg.id}` (in `{config.DATABASE_CHANNEL_ID}`)\n"
                f"💵 **Price:** `${state['price_usd']:.2f} USD`",
                reply_markup=build_admin_home_kb(),
            )
