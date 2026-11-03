"""
NEU PRODUCT BOT — Asynchronous MongoDB Atlas Layer (Motor)
Manages the 5 canonical collections: settings, users, folders, products, orders.
Includes Force Subscription (FSub) channel management, Owner/Admin hierarchy,
Built-in User Wallet, and Dynamic Active/Deactive Toggles.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import secrets
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import config


class Database:
    def __init__(self, uri: str, db_name: str):
        self.client: AsyncIOMotorClient = AsyncIOMotorClient(uri)
        self.db: AsyncIOMotorDatabase = self.client[db_name]
        self.settings = self.db["settings"]
        self.users = self.db["users"]
        self.folders = self.db["folders"]
        self.products = self.db["products"]
        self.orders = self.db["orders"]

    async def initialize(self) -> Dict[str, Any]:
        """Bootstrap global_config document and indexes on startup."""
        await self.users.create_index("username")
        await self.products.create_index([("folder_id", 1), ("is_active", 1)])
        await self.orders.create_index([("user_id", 1), ("status", 1)])

        default_settings = {
            "_id": "global_config",
            "admins": [config.OWNER_ID],
            "fsub_channels": [],
            "maintenance_mode": False,
            "maintenance_reason": "Scheduled system upgrade in progress. Back shortly!",
            "currencies": {
                "INR": True,
                "USD": True,
                "USDT": True,
            },
            "gateways": {
                "FAMPAY": True,
                "OXAPAY": True,
            },
            "usd_to_inr": config.DEFAULT_USD_TO_INR,
        }
        await self.settings.update_one(
            {"_id": "global_config"},
            {"$setOnInsert": default_settings},
            upsert=True,
        )
        return await self.get_settings()

    # -------------------------------------------------------------------------
    # 1. GLOBAL SETTINGS, FSUB CHANNELS & DYNAMIC TOGGLES
    # -------------------------------------------------------------------------
    async def get_settings(self) -> Dict[str, Any]:
        doc = await self.settings.find_one({"_id": "global_config"})
        return doc or {}

    async def is_owner(self, user_id: int) -> bool:
        return int(user_id) == int(config.OWNER_ID)

    async def is_admin(self, user_id: int) -> bool:
        if await self.is_owner(user_id):
            return True
        cfg = await self.get_settings()
        return int(user_id) in [int(x) for x in cfg.get("admins", [])]

    async def add_admin(self, user_id: int) -> bool:
        res = await self.settings.update_one(
            {"_id": "global_config"},
            {"$addToSet": {"admins": int(user_id)}},
        )
        return res.modified_count > 0

    async def remove_admin(self, user_id: int) -> bool:
        if int(user_id) == int(config.OWNER_ID):
            return False
        res = await self.settings.update_one(
            {"_id": "global_config"},
            {"$pull": {"admins": int(user_id)}},
        )
        return res.modified_count > 0

    async def get_admin_list(self) -> List[int]:
        cfg = await self.get_settings()
        admins = set(cfg.get("admins", []))
        admins.add(config.OWNER_ID)
        return sorted(list(admins))

    # Force Subscription (FSub) Channel Management
    async def get_fsub_channels(self) -> List[Dict[str, Any]]:
        cfg = await self.get_settings()
        return cfg.get("fsub_channels", [])

    async def add_fsub_channel(self, channel_id: int, invite_link: str) -> bool:
        channels = await self.get_fsub_channels()
        filtered = [c for c in channels if int(c.get("channel_id", 0)) != int(channel_id)]
        filtered.append(
            {
                "channel_id": int(channel_id),
                "invite_link": invite_link.strip(),
            }
        )
        await self.settings.update_one(
            {"_id": "global_config"},
            {"$set": {"fsub_channels": filtered}},
        )
        return True

    async def remove_fsub_channel(self, channel_id: int) -> bool:
        channels = await self.get_fsub_channels()
        filtered = [c for c in channels if int(c.get("channel_id", 0)) != int(channel_id)]
        if len(filtered) == len(channels):
            return False
        await self.settings.update_one(
            {"_id": "global_config"},
            {"$set": {"fsub_channels": filtered}},
        )
        return True

    async def toggle_currency(self, code: str) -> bool:
        cfg = await self.get_settings()
        current = cfg.get("currencies", {}).get(code, True)
        new_state = not current
        update_doc: Dict[str, Any] = {f"currencies.{code}": new_state}
        if code == "INR":
            update_doc["gateways.FAMPAY"] = new_state
        elif code == "USDT":
            update_doc["gateways.OXAPAY"] = new_state
        await self.settings.update_one(
            {"_id": "global_config"},
            {"$set": update_doc},
        )
        return new_state

    async def toggle_gateway(self, gateway: str) -> bool:
        cfg = await self.get_settings()
        current = cfg.get("gateways", {}).get(gateway, True)
        new_state = not current
        await self.settings.update_one(
            {"_id": "global_config"},
            {"$set": {f"gateways.{gateway}": new_state}},
        )
        return new_state

    async def toggle_maintenance(self) -> bool:
        cfg = await self.get_settings()
        new_state = not cfg.get("maintenance_mode", False)
        await self.settings.update_one(
            {"_id": "global_config"},
            {"$set": {"maintenance_mode": new_state}},
        )
        return new_state

    async def set_exchange_rate(self, rate: float) -> None:
        await self.settings.update_one(
            {"_id": "global_config"},
            {"$set": {"usd_to_inr": round(float(rate), 2)}},
        )

    # -------------------------------------------------------------------------
    # 2. USERS & BUILT-IN WALLET SYSTEM
    # -------------------------------------------------------------------------
    async def upsert_user(self, user_id: int, username: Optional[str]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        await self.users.update_one(
            {"_id": int(user_id)},
            {
                "$set": {"username": username or f"user_{user_id}"},
                "$setOnInsert": {
                    "balance_usd": 0.0,
                    "language": "en",
                    "currency": "USD",
                    "is_banned": False,
                    "joined_at": now,
                },
            },
            upsert=True,
        )
        return await self.get_user(user_id)

    async def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        return await self.users.find_one({"_id": int(user_id)})

    async def set_user_language(self, user_id: int, lang: str) -> None:
        await self.users.update_one(
            {"_id": int(user_id)},
            {"$set": {"language": lang}},
        )

    async def set_user_currency(self, user_id: int, currency: str) -> None:
        await self.users.update_one(
            {"_id": int(user_id)},
            {"$set": {"currency": currency}},
        )

    async def add_wallet_balance(self, user_id: int, amount_usd: float) -> float:
        user = await self.upsert_user(user_id, None)
        new_balance = round(float(user.get("balance_usd", 0.0)) + float(amount_usd), 2)
        await self.users.update_one(
            {"_id": int(user_id)},
            {"$set": {"balance_usd": new_balance}},
        )
        return new_balance

    async def deduct_wallet_balance(
        self, user_id: int, amount_usd: float, floor_at_zero: bool = True
    ) -> Optional[float]:
        user = await self.upsert_user(user_id, None)
        current = float(user.get("balance_usd", 0.0))
        if not floor_at_zero and current < amount_usd:
            return None
        new_balance = round(max(0.0, current - float(amount_usd)), 2)
        await self.users.update_one(
            {"_id": int(user_id)},
            {"$set": {"balance_usd": new_balance}},
        )
        return new_balance

    async def format_currency(self, amount_usd: float, currency: str) -> str:
        cfg = await self.get_settings()
        rate = float(cfg.get("usd_to_inr", cfg.get("usd_to_inr_rate", config.DEFAULT_USD_TO_INR)))
        if currency == "INR":
            return f"₹{round(amount_usd * rate, 2):,.2f}"
        if currency == "USDT":
            return f"{round(amount_usd, 2):,.2f} USDT"
        return f"${round(amount_usd, 2):,.2f}"

    # -------------------------------------------------------------------------
    # 3. FOLDERS & DIGITAL PRODUCTS CATALOG
    # -------------------------------------------------------------------------
    async def create_folder(self, name: str, emoji_id: str = "5397782960512444700") -> ObjectId:
        doc = {
            "name": name,
            "emoji_id": emoji_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
        }
        res = await self.folders.insert_one(doc)
        return res.inserted_id

    async def get_folders(self, active_only: bool = True) -> List[Dict[str, Any]]:
        query = {"is_active": True} if active_only else {}
        cursor = self.folders.find(query).sort("created_at", 1)
        return await cursor.to_list(length=100)

    async def get_folder(self, folder_id: str) -> Optional[Dict[str, Any]]:
        return await self.folders.find_one({"_id": ObjectId(folder_id)})

    async def toggle_folder(self, folder_id: str) -> bool:
        folder = await self.get_folder(folder_id)
        if not folder:
            return False
        new_state = not folder.get("is_active", True)
        await self.folders.update_one(
            {"_id": ObjectId(folder_id)},
            {"$set": {"is_active": new_state}},
        )
        return new_state

    async def create_product(
        self,
        folder_id: Optional[str],
        title: str,
        description: str,
        price_usd: float,
        product_type: str,
        banner_file_id: str,
        channel_message_id: int,
    ) -> ObjectId:
        doc = {
            "folder_id": ObjectId(folder_id) if folder_id else None,
            "title": title,
            "description": description,
            "price_usd": round(float(price_usd), 2),
            "product_type": product_type,
            "banner_file_id": banner_file_id,
            "channel_message_id": int(channel_message_id),
            "is_active": True,
        }
        res = await self.products.insert_one(doc)
        return res.inserted_id

    async def get_products(
        self, folder_id: Optional[str] = None, active_only: bool = True
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if folder_id is not None:
            query["folder_id"] = ObjectId(folder_id) if folder_id != "root" else None
        if active_only:
            query["is_active"] = True
        cursor = self.products.find(query)
        return await cursor.to_list(length=200)

    async def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        return await self.products.find_one({"_id": ObjectId(product_id)})

    async def toggle_product(self, product_id: str) -> bool:
        prod = await self.get_product(product_id)
        if not prod:
            return False
        new_state = not prod.get("is_active", True)
        await self.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"is_active": new_state}},
        )
        return new_state

    # -------------------------------------------------------------------------
    # 4. ORDERS & TRANSACTION LIFECYCLE
    # -------------------------------------------------------------------------
    async def create_order(
        self,
        user_id: int,
        product_id: Optional[str],
        amount_usd: float,
        currency: str,
        gateway: str,
        status: str = "PENDING",
    ) -> Dict[str, Any]:
        order_id = f"ORD_{secrets.token_hex(3).upper()}"
        doc = {
            "_id": order_id,
            "user_id": int(user_id),
            "product_id": ObjectId(product_id) if product_id else None,
            "amount_usd": round(float(amount_usd), 2),
            "currency": currency,
            "gateway": gateway,
            "status": status,
            "created_at": datetime.now(timezone.utc),
        }
        await self.orders.insert_one(doc)
        return doc

    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        return await self.orders.find_one({"_id": order_id})

    async def update_order_status(self, order_id: str, status: str) -> Optional[Dict[str, Any]]:
        await self.orders.update_one(
            {"_id": order_id},
            {"$set": {"status": status}},
        )
        return await self.get_order(order_id)

    async def count_user_orders(self, user_id: int, paid_only: bool = True) -> int:
        query: Dict[str, Any] = {"user_id": int(user_id)}
        if paid_only:
            query["status"] = "PAID"
        return await self.orders.count_documents(query)


db = Database(config.MONGO_URI, config.DB_NAME)
