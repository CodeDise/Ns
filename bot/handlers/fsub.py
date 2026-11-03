"""
NEU PRODUCT BOT — Force Subscription (FSub) Management & Middleware
Implements:
- Admin FSub Commands (Owner & Admins):
  - /addfsub <channel_id> <invite_link>
  - /removefsub <channel_id>
  - /fsublist
- FSub Gatekeeper Middleware:
  - Verifies user membership across all active fsub_channels in MongoDB.
  - Blocks non-members on /start and presents channel join buttons + [ 🔄 Check Membership ].
"""
from typing import List, Dict, Any, Tuple
from pyrogram import Client, filters
from pyrogram.errors import UserNotParticipant, ChatAdminRequired, PeerIdInvalid
from pyrogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from config import config
from database import db
from locales import t


async def get_missing_fsub_channels(
    client: Client, user_id: int
) -> List[Dict[str, Any]]:
    """
    Checks if user_id is a member of all active FSub channels stored in MongoDB.
    Owner and Admins bypass the FSub requirement automatically.
    """
    if await db.is_admin(user_id):
        return []

    channels = await db.get_fsub_channels()
    if not channels:
        return []

    missing: List[Dict[str, Any]] = []
    for ch in channels:
        ch_id = int(ch["channel_id"])
        try:
            member = await client.get_chat_member(ch_id, user_id)
            if member.status.value in ("left", "kicked", "banned"):
                missing.append(ch)
        except UserNotParticipant:
            missing.append(ch)
        except (ChatAdminRequired, PeerIdInvalid, Exception):
            # If the bot is temporarily unable to query a misconfigured channel, skip blocking
            continue

    return missing


def build_fsub_gate_keyboard(
    missing_channels: List[Dict[str, Any]], lang: str = "en"
) -> InlineKeyboardMarkup:
    rows = []
    for idx, ch in enumerate(missing_channels, start=1):
        rows.append(
            [
                InlineKeyboardButton(
                    f"📢 Join Required Channel #{idx}",
                    url=ch["invite_link"],
                )
            ]
        )
    rows.append(
        [
            InlineKeyboardButton(
                t(lang, "btn_check_membership"),
                callback_data="fsub_verify",
            )
        ]
    )
    return InlineKeyboardMarkup(rows)


async def enforce_fsub_gate(
    client: Client, user_id: int, lang: str = "en"
) -> Tuple[bool, InlineKeyboardMarkup]:
    """
    Returns (is_allowed, fsub_markup).
    If is_allowed is False, caller should block and display fsub_markup.
    """
    missing = await get_missing_fsub_channels(client, user_id)
    if not missing:
        return True, InlineKeyboardMarkup([])
    return False, build_fsub_gate_keyboard(missing, lang)


def register_fsub_handlers(app: Client) -> None:
    @app.on_message(filters.command("addfsub") & filters.private)
    async def cmd_add_fsub(client: Client, message: Message):
        if not await db.is_admin(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Admin privileges required."
            )
        if len(message.command) < 3:
            return await message.reply_text(
                "**Usage:** `/addfsub <channel_id> <invite_link>`\n"
                "**Example:** `/addfsub -1002194851111 https://t.me/+AbCdEfGhIjKlMnOp`"
            )

        raw_id = message.command[1].strip()
        invite_link = message.command[2].strip()
        try:
            channel_id = int(raw_id)
        except ValueError:
            return await message.reply_text("⚠️ `channel_id` must be a valid integer (e.g. `-100...`).")

        await db.add_fsub_channel(channel_id, invite_link)
        await message.reply_text(
            f"{config.EMOJI_CHECK} **Force Subscription Channel Added!**\n\n"
            f"🆔 **Channel ID:** `{channel_id}`\n"
            f"🔗 **Invite Link:** {invite_link}\n\n"
            "All users must now join this channel before accessing `/start`."
        )

    @app.on_message(filters.command("removefsub") & filters.private)
    async def cmd_remove_fsub(client: Client, message: Message):
        if not await db.is_admin(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Admin privileges required."
            )
        if len(message.command) < 2:
            return await message.reply_text(
                "**Usage:** `/removefsub <channel_id>`\n"
                "**Example:** `/removefsub -1002194851111`"
            )

        try:
            channel_id = int(message.command[1].strip())
        except ValueError:
            return await message.reply_text("⚠️ Provide a valid numeric `channel_id`.")

        removed = await db.remove_fsub_channel(channel_id)
        if removed:
            await message.reply_text(
                f"{config.EMOJI_CHECK} **FSub Channel Removed:** `{channel_id}`"
            )
        else:
            await message.reply_text(
                f"ℹ️ Channel `{channel_id}` was not found in the active FSub list."
            )

    @app.on_message(filters.command("fsublist") & filters.private)
    async def cmd_fsub_list(client: Client, message: Message):
        if not await db.is_admin(message.from_user.id):
            return await message.reply_text(
                f"{config.EMOJI_ALERT} **Access Denied:** Admin privileges required."
            )
        channels = await db.get_fsub_channels()
        if not channels:
            return await message.reply_text(
                "📢 **Active Force Subscription Channels:** None configured.\n"
                "Use `/addfsub <channel_id> <invite_link>` to add one."
            )

        lines = [f"{config.EMOJI_SPARKLE} **ACTIVE FORCE SUBSCRIPTION CHANNELS ({len(channels)})**\n"]
        for idx, ch in enumerate(channels, start=1):
            lines.append(
                f"{idx}. `{ch['channel_id']}` — [Invite Link]({ch['invite_link']})"
            )
        await message.reply_text("\n".join(lines), disable_web_page_preview=True)
