import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Send,
  Search,
  QrCode,
} from 'lucide-react';
import {
  CurrencyCode,
  LanguageCode,
  GlobalSettingsDoc,
  UserDoc,
  FolderDoc,
  ProductDoc,
  OrderDoc,
  ChatMessage,
  ChannelVaultItem,
  FeedbackChannelItem,
  InlineButton,
  FSubChannel,
} from './types/bot';
import { PYTHON_CODEBASE, PythonFileSpec } from './data/pythonFiles';

const OWNER_ID = 6019482104;
const DATABASE_CHANNEL_ID = -1002194857120;
const FEEDBACK_CHANNEL_ID = -1002194859999;

const INITIAL_SETTINGS: GlobalSettingsDoc = {
  _id: 'global_config',
  admins: [OWNER_ID, 7739104210],
  fsub_channels: [
    {
      channel_id: -1002194851111,
      invite_link: 'https://t.me/+NEU_Official_Updates',
    },
    {
      channel_id: -1002194852222,
      invite_link: 'https://t.me/+NEU_Drops_Backup',
    },
  ],
  maintenance_mode: false,
  maintenance_reason: 'Scheduled system upgrade in progress. Back shortly!',
  currencies: {
    INR: true,
    USD: true,
    USDT: true,
  },
  gateways: {
    FAMPAY: true,
    OXAPAY: true,
  },
  usd_to_inr: 86.5,
};

const INITIAL_USERS: UserDoc[] = [
  {
    _id: OWNER_ID,
    username: 'neu_owner',
    balance_usd: 250.0,
    language: 'en',
    currency: 'USD',
    is_banned: false,
    joined_at: '2026-10-01T09:00:00Z',
  },
  {
    _id: 7739104210,
    username: 'neu_ops_admin',
    balance_usd: 85.0,
    language: 'en',
    currency: 'INR',
    is_banned: false,
    joined_at: '2026-10-12T14:20:00Z',
  },
  {
    _id: 8940129384,
    username: 'arjun_dev',
    balance_usd: 32.5,
    language: 'en',
    currency: 'INR',
    is_banned: false,
    joined_at: '2026-11-01T18:10:00Z',
  },
];

const INITIAL_FOLDERS: FolderDoc[] = [
  {
    _id: '6727a101f9d102a8b1000001',
    name: 'Source Code & SaaS Kits',
    emoji_id: '5397782960512444700',
    is_active: true,
    created_at: '2026-10-15T10:00:00Z',
  },
  {
    _id: '6727a101f9d102a8b1000002',
    name: 'Cloud & Automation Scripts',
    emoji_id: '5330237710655306682',
    is_active: true,
    created_at: '2026-10-16T11:30:00Z',
  },
  {
    _id: '6727a101f9d102a8b1000003',
    name: 'Masterclass Video Vault',
    emoji_id: '5463071033256848994',
    is_active: true,
    created_at: '2026-10-20T16:45:00Z',
  },
];

const INITIAL_VAULT: ChannelVaultItem[] = [
  {
    channel_message_id: 4012,
    file_type: 'ZIP',
    file_name: 'NEU_NextJS_SaaS_Boilerplate_v4.zip',
    size_label: '48.2 MB',
    secret_content: 'SHA256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08 | License: NEU-ENT-9941',
    uploaded_by: OWNER_ID,
    created_at: '2026-10-15T10:05:00Z',
  },
  {
    channel_message_id: 4018,
    file_type: 'ZIP',
    file_name: 'Telegram_MTProto_Cluster_Kit.zip',
    size_label: '14.6 MB',
    secret_content: 'Includes Docker + Pyrogram Worker Pool + Redis Queue + Auto-Failover Scripts',
    uploaded_by: OWNER_ID,
    created_at: '2026-10-16T12:00:00Z',
  },
  {
    channel_message_id: 4025,
    file_type: 'PDF',
    file_name: 'High_Concurrency_Async_Python_Playbook.pdf',
    size_label: '19.4 MB',
    secret_content: '340-Page Engineering Guide + Private GitHub Repo Invite Token: GH-NEU-88210',
    uploaded_by: 7739104210,
    created_at: '2026-10-18T15:20:00Z',
  },
  {
    channel_message_id: 4031,
    file_type: 'MP4',
    file_name: 'Zero_Downtime_Cloud_Architecture_4K.mp4',
    size_label: '612.0 MB',
    secret_content: '4K 60fps Masterclass Stream + Terraform Blueprints Archive',
    uploaded_by: OWNER_ID,
    created_at: '2026-10-20T17:00:00Z',
  },
];

const INITIAL_PRODUCTS: ProductDoc[] = [
  {
    _id: '6727b201f9d102a8b2000101',
    folder_id: '6727a101f9d102a8b1000001',
    title: 'Next.js 15 Full-Stack SaaS Kit',
    description: 'Production multi-tenant SaaS starter with Stripe, RBAC, and Drizzle ORM.',
    price_usd: 19.0,
    product_type: 'ZIP',
    banner_file_id: 'AgACAgUAAxkBAAIB_banner_saas_101',
    channel_message_id: 4012,
    payload_preview: 'NEU_NextJS_SaaS_Boilerplate_v4.zip (48.2 MB)',
    is_active: true,
  },
  {
    _id: '6727b201f9d102a8b2000102',
    folder_id: '6727a101f9d102a8b1000002',
    title: 'Pyrogram MTProto Automation Suite',
    description: 'High-throughput async worker pool with Motor MongoDB & webhook router.',
    price_usd: 14.5,
    product_type: 'ZIP',
    banner_file_id: 'AgACAgUAAxkBAAIB_banner_mtproto_102',
    channel_message_id: 4018,
    payload_preview: 'Telegram_MTProto_Cluster_Kit.zip (14.6 MB)',
    is_active: true,
  },
  {
    _id: '6727b201f9d102a8b2000103',
    folder_id: '6727a101f9d102a8b1000002',
    title: 'Async Python Systems Handbook',
    description: 'Complete architecture reference for Motor, aiohttp, and zero-lock queues.',
    price_usd: 9.0,
    product_type: 'PDF',
    banner_file_id: 'AgACAgUAAxkBAAIB_banner_pdf_103',
    channel_message_id: 4025,
    payload_preview: 'High_Concurrency_Async_Python_Playbook.pdf (19.4 MB)',
    is_active: true,
  },
  {
    _id: '6727b201f9d102a8b2000104',
    folder_id: '6727a101f9d102a8b1000003',
    title: 'Cloud Infrastructure Masterclass 4K',
    description: 'End-to-end distributed systems deployment course + Terraform templates.',
    price_usd: 29.0,
    product_type: 'MP4',
    banner_file_id: 'AgACAgUAAxkBAAIB_banner_mp4_104',
    channel_message_id: 4031,
    payload_preview: 'Zero_Downtime_Cloud_Architecture_4K.mp4 (612.0 MB)',
    is_active: true,
  },
];

const INITIAL_ORDERS: OrderDoc[] = [
  {
    _id: 'ORD_9A4F12',
    user_id: 8940129384,
    product_id: '6727b201f9d102a8b2000103',
    amount_usd: 9.0,
    currency: 'INR',
    gateway: 'WALLET',
    status: 'PAID',
    created_at: '2026-11-02T14:22:10Z',
  },
  {
    _id: 'ORD_7C8E04',
    user_id: 8940129384,
    product_id: '6727b201f9d102a8b2000101',
    amount_usd: 19.0,
    currency: 'INR',
    gateway: 'FAMPAY',
    status: 'PENDING',
    created_at: '2026-11-03T08:15:00Z',
  },
];

const INITIAL_FEEDBACK: FeedbackChannelItem[] = [
  {
    id: 'fb_1',
    order_id: 'ORD_9A4F12',
    user_id: 8940129384,
    username: 'arjun_dev',
    product_title: 'Async Python Systems Handbook',
    rating_text: 'Instant delivery via wallet balance in less than 1 second! Code samples are rock solid.',
    created_at: '2026-11-02T14:25:00Z',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'codebase' | 'mongodb' | 'webhooks'>('simulator');

  // MongoDB Atlas State Replica
  const [settings, setSettings] = useState<GlobalSettingsDoc>(INITIAL_SETTINGS);
  const [users, setUsers] = useState<UserDoc[]>(INITIAL_USERS);
  const [folders, setFolders] = useState<FolderDoc[]>(INITIAL_FOLDERS);
  const [products, setProducts] = useState<ProductDoc[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<OrderDoc[]>(INITIAL_ORDERS);
  const [channelVault, setChannelVault] = useState<ChannelVaultItem[]>(INITIAL_VAULT);
  const [feedbackFeed, setFeedbackFeed] = useState<FeedbackChannelItem[]>(INITIAL_FEEDBACK);

  // Force Subscription (FSub) Simulated User Memberships: userId -> array of joined channel_ids
  const [userJoinedFSubChannels, setUserJoinedFSubChannels] = useState<Record<number, number[]>>({
    [OWNER_ID]: [-1002194851111, -1002194852222],
    7739104210: [-1002194851111, -1002194852222],
    8940129384: [-1002194851111], // Customer starts missing channel #2 (-1002194852222) so you can immediately test FSub Gatekeeper!
  });

  // Active Telegram Simulator Persona
  const [activeUserId, setActiveUserId] = useState<number>(8940129384);
  const [chatInput, setChatInput] = useState<string>('');
  const [pendingFeedbackOrder, setPendingFeedbackOrder] = useState<Record<number, string>>({});
  const [messagesByPersona, setMessagesByPersona] = useState<Record<number, ChatMessage[]>>({});

  // Codebase Explorer State
  const [selectedFile, setSelectedFile] = useState<PythonFileSpec>(PYTHON_CODEBASE[0]);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [fileSearch, setFileSearch] = useState<string>('');

  // MongoDB Collection Inspector State
  const [selectedCollection, setSelectedCollection] = useState<'settings' | 'users' | 'folders' | 'products' | 'orders'>('settings');
  const [newProductForm, setNewProductForm] = useState({
    folder_id: INITIAL_FOLDERS[0]._id,
    title: '',
    description: '',
    price_usd: '15.00',
    product_type: 'ZIP' as ProductDoc['product_type'],
    file_name: 'Custom_Payload_Bundle.zip',
  });

  // Webhook Tester State
  const [selectedWebhookOrder, setSelectedWebhookOrder] = useState<string>('ORD_7C8E04');
  const [webhookLogs, setWebhookLogs] = useState<
    Array<{ id: string; time: string; route: string; status: number; summary: string }>
  >([
    {
      id: 'wl_1',
      time: '08:20:00 UTC',
      route: 'GET /health',
      status: 200,
      summary: 'UptimeRobot Keep-Alive Ping -> 200 OK (Render Service Awake)',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const currentUser = users.find((u) => u._id === activeUserId) || users[0];

  const isOwner = (uid: number) => uid === OWNER_ID;
  const isAdmin = (uid: number) => uid === OWNER_ID || settings.admins.includes(uid);

  const formatAmount = (amountUsd: number, currency: CurrencyCode): string => {
    if (currency === 'INR') {
      const inr = amountUsd * settings.usd_to_inr;
      return `₹${inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === 'USDT') {
      return `${amountUsd.toFixed(2)} USDT`;
    }
    return `$${amountUsd.toFixed(2)}`;
  };

  // FSub Gatekeeper Helper
  const getMissingFSubForUser = (
    uid: number,
    currentSettings = settings,
    currentJoinedMap = userJoinedFSubChannels
  ): FSubChannel[] => {
    if (uid === OWNER_ID || currentSettings.admins.includes(uid)) {
      return [];
    }
    const joinedList = currentJoinedMap[uid] || [];
    return currentSettings.fsub_channels.filter((ch) => !joinedList.includes(ch.channel_id));
  };

  const buildFSubGateKeyboard = (missing: FSubChannel[], lang: LanguageCode): InlineButton[][] => {
    const rows: InlineButton[][] = missing.map((ch, idx) => [
      {
        text: `📢 Join Required Channel #${idx + 1} (${ch.channel_id})`,
        callback_data: `sim_join_fsub_${ch.channel_id}`,
      },
    ]);
    rows.push([
      {
        text: getLocaleText(lang, 'btn_check_membership'),
        callback_data: 'fsub_verify',
      },
    ]);
    return rows;
  };

  const getLocaleText = (lang: LanguageCode, key: string): string => {
    const dict: Record<LanguageCode, Record<string, string>> = {
      en: {
        fsub_required:
          '⚠️ Mandatory Channel Subscription Required\n\nTo access NEU PRODUCT BOT and purchase instant-delivery digital products, you must join all active Force Subscription (FSub) channels below.\n\nClick a channel button below to join, then tap [ 🔄 Check Membership ]:',
        fsub_still_missing:
          '⚠️ Membership Check Failed: You have not joined all required FSub channels yet!',
        fsub_verified: '✅ FSub Membership Verified! Unlocking NEU PRODUCT BOT...',
        btn_check_membership: '🔄 Check Membership',
        welcome_lang: '✨ Welcome to NEU PRODUCT BOT\n\nPlease select your preferred interface language:',
        welcome_curr: '✨ Select Your Store Currency\n\nAll product prices and your built-in wallet balance automatically convert to your chosen currency:',
        btn_browse: '🛍 Browse Catalog',
        btn_wallet: '👛 My Wallet / Balance',
        btn_currency: '💱 Change Currency',
        btn_language: '🌐 Language',
        btn_back: '⬅️ Back to Menu',
        btn_buy: '💳 Buy Now',
        btn_pay_wallet: '👛 Pay via Wallet Balance',
        btn_pay_fampay: '⚡️ Pay via UPI (FamPay)',
        btn_pay_oxapay: '💎 Pay via Crypto (OxaPay)',
        btn_feedback: '⭐️ Leave Feedback',
      },
      hi: {
        fsub_required:
          '⚠️ अनिवार्य चैनल सदस्यता (FSub) आवश्यक है\n\nNEU PRODUCT BOT का उपयोग करने के लिए कृपया नीचे दिए गए हमारे सभी आधिकारिक चैनल से जुड़ें और फिर [ 🔄 Check Membership ] दबाएं:',
        fsub_still_missing: '⚠️ आपने अभी तक सभी आवश्यक FSub चैनल जॉइन नहीं किए हैं!',
        fsub_verified: '✅ सदस्यता सत्यापित! NEU PRODUCT BOT में आपका स्वागत है।',
        btn_check_membership: '🔄 Check Membership (सदस्यता जांचें)',
        welcome_lang: '✨ NEU PRODUCT BOT में आपका स्वागत है\n\nकृपया अपनी पसंदीदा भाषा चुनें:',
        welcome_curr: '✨ अपनी मुद्रा (Currency) चुनें\n\nसभी उत्पादों की कीमतें और आपका वॉलेट बैलेंस अपने आप चुनी गई मुद्रा में दिखेगा:',
        btn_browse: '🛍 प्रोडक्ट्स देखें',
        btn_wallet: '👛 मेरा वॉलेट / बैलेंस',
        btn_currency: '💱 मुद्रा बदलें',
        btn_language: '🌐 भाषा (Language)',
        btn_back: '⬅️ मुख्य मेनू',
        btn_buy: '💳 अभी खरीदें',
        btn_pay_wallet: '👛 वॉलेट बैलेंस से पेमेंट करें',
        btn_pay_fampay: '⚡️ UPI से पेमेंट करें (FamPay)',
        btn_pay_oxapay: '💎 Crypto से पेमेंट करें (OxaPay)',
        btn_feedback: '⭐️ फ़ीडबैक दें',
      },
      ru: {
        fsub_required:
          '⚠️ Требуется обязательная подписка (FSub)\n\nДля доступа к NEU PRODUCT BOT подпишитесь на обязательные каналы ниже и нажмите [ 🔄 Check Membership ]:',
        fsub_still_missing: '⚠️ Вы еще не подписались на все обязательные каналы!',
        fsub_verified: '✅ Подписка подтверждена! Добро пожаловать в NEU PRODUCT BOT.',
        btn_check_membership: '🔄 Check Membership (Проверить)',
        welcome_lang: '✨ Добро пожаловать в NEU PRODUCT BOT\n\nПожалуйста, выберите язык интерфейса:',
        welcome_curr: '✨ Выберите валюту магазина\n\nВсе цены и баланс вашего кошелька будут автоматически отображаться в выбранной валюте:',
        btn_browse: '🛍 Каталог товаров',
        btn_wallet: '👛 Мой кошелек / Баланс',
        btn_currency: '💱 Сменить валюту',
        btn_language: '🌐 Язык (Language)',
        btn_back: '⬅️ Главное меню',
        btn_buy: '💳 Купить сейчас',
        btn_pay_wallet: '👛 Оплатить с баланса кошелька',
        btn_pay_fampay: '⚡️ Оплатить через UPI (FamPay)',
        btn_pay_oxapay: '💎 Оплатить криптой (OxaPay)',
        btn_feedback: '⭐️ Оставить отзыв',
      },
    };
    return dict[lang]?.[key] || dict.en[key] || key;
  };

  const appendMessage = (uid: number, msg: Omit<ChatMessage, 'id' | 'timestamp' | 'userId'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: uid,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setMessagesByPersona((prev) => ({
      ...prev,
      [uid]: [...(prev[uid] || []), newMsg],
    }));
  };

  const buildMainMenuMessage = (user: UserDoc) => {
    const balFormatted = formatAmount(user.balance_usd, user.currency);
    const roleTag = isOwner(user._id)
      ? '👑 Primary Owner'
      : isAdmin(user._id)
      ? '🛡 Delegated Admin'
      : '👤 Verified Customer';

    return {
      text:
        `👑 NEU DIGITAL STORE — MAIN MENU\n\n` +
        `👤 User ID: ${user._id} (@${user.username})\n` +
        `🔑 Role: ${roleTag}\n` +
        `👛 Wallet Balance: ${balFormatted} ($${user.balance_usd.toFixed(2)} USD)\n` +
        `🌐 Active Currency: ${user.currency} · Language: ${user.language.toUpperCase()}\n\n` +
        `Select an action below or test /start, /admin, /addfsub, /fsublist, /addmoney:`,
      inline_keyboard: [
        [{ text: getLocaleText(user.language, 'btn_browse'), callback_data: 'cat_folders' }],
        [{ text: `${getLocaleText(user.language, 'btn_wallet')} (${balFormatted})`, callback_data: 'wallet_open' }],
        [
          { text: getLocaleText(user.language, 'btn_currency'), callback_data: 'onb_curr_menu' },
          { text: getLocaleText(user.language, 'btn_language'), callback_data: 'onb_lang_menu' },
        ],
        ...(isAdmin(user._id)
          ? [[{ text: '⚙️ Open /admin Control Panel', callback_data: 'adm_home' }]]
          : []),
      ],
    };
  };

  // Initialize default welcome messages for each persona once
  useEffect(() => {
    const initialMap: Record<number, ChatMessage[]> = {};
    INITIAL_USERS.forEach((u) => {
      const menu = buildMainMenuMessage(u);
      initialMap[u._id] = [
        {
          id: `init_${u._id}`,
          sender: 'bot',
          userId: u._id,
          timestamp: '08:25:00',
          text: menu.text,
          inline_keyboard: menu.inline_keyboard,
        },
      ];
    });
    setMessagesByPersona(initialMap);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByPersona, activeUserId]);

  // Deliver an order's payload from DATABASE_CHANNEL_ID to buyer's DM
  const deliverOrderToUser = (order: OrderDoc, currentUsers = users, currentProducts = products) => {
    const targetUser = currentUsers.find((u) => u._id === order.user_id) || currentUsers[0];

    if (!order.product_id) {
      // Wallet Top-Up Order
      const updatedBalance = Number((targetUser.balance_usd + order.amount_usd).toFixed(2));
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, balance_usd: updatedBalance } : u))
      );
      const addedStr = formatAmount(order.amount_usd, targetUser.currency);
      const totalStr = formatAmount(updatedBalance, targetUser.currency);
      appendMessage(targetUser._id, {
        sender: 'bot',
        text:
          `✨ Wallet Top-Up Confirmed (${order.gateway})!\n\n` +
          `🧾 Order ID: ${order._id}\n` +
          `➕ Credited: ${addedStr} ($${order.amount_usd.toFixed(2)} USD)\n` +
          `👛 New Wallet Balance: ${totalStr}`,
        inline_keyboard: [[{ text: getLocaleText(targetUser.language, 'btn_back'), callback_data: 'nav_main' }]],
      });
      return;
    }

    const product = currentProducts.find((p) => p._id === order.product_id);
    if (!product) return;

    const vaultAsset = channelVault.find((v) => v.channel_message_id === product.channel_message_id);
    const paidStr = formatAmount(order.amount_usd, targetUser.currency);

    appendMessage(targetUser._id, {
      sender: 'bot',
      text:
        `✅ Payment Confirmed — Instant Automated Delivery!\n\n` +
        `🧾 Order ID: ${order._id}\n` +
        `📦 Product: ${product.title}\n` +
        `💰 Paid: ${paidStr} via ${order.gateway}\n` +
        `🗄 Source: DATABASE_CHANNEL_ID (${DATABASE_CHANNEL_ID}) · Msg #${product.channel_message_id}`,
      payload_attachment: {
        channel_message_id: product.channel_message_id,
        file_type: product.product_type,
        file_name: vaultAsset?.file_name || `${product.title}.${product.product_type.toLowerCase()}`,
        secret_content: vaultAsset?.secret_content || product.payload_preview,
      },
      inline_keyboard: [
        [{ text: getLocaleText(targetUser.language, 'btn_feedback'), callback_data: `fb_leave_${order._id}` }],
        [{ text: getLocaleText(targetUser.language, 'btn_back'), callback_data: 'nav_main' }],
      ],
    });
  };

  // Handle Telegram Slash Commands & Text Input
  const handleSendCommand = (rawText?: string) => {
    const text = (rawText ?? chatInput).trim();
    if (!text) return;
    if (!rawText) setChatInput('');

    const uid = activeUserId;
    const user = users.find((u) => u._id === uid) || users[0];

    appendMessage(uid, {
      sender: 'user',
      text,
    });

    // Check if user is submitting verified buyer feedback
    if (pendingFeedbackOrder[uid] && !text.startsWith('/')) {
      const ordId = pendingFeedbackOrder[uid];
      const ord = orders.find((o) => o._id === ordId);
      const prod = products.find((p) => p._id === ord?.product_id);

      const newFb: FeedbackChannelItem = {
        id: `fb_${Date.now()}`,
        order_id: ordId,
        user_id: uid,
        username: user.username,
        product_title: prod?.title || 'Digital Product',
        rating_text: text,
        created_at: new Date().toISOString(),
      };
      setFeedbackFeed((prev) => [newFb, ...prev]);
      setPendingFeedbackOrder((prev) => {
        const copy = { ...prev };
        delete copy[uid];
        return copy;
      });

      appendMessage(uid, {
        sender: 'bot',
        text:
          `✅ Thank you! Your verified review for Order ${ordId} has been published to FEEDBACK_CHANNEL_ID (${FEEDBACK_CHANNEL_ID}).`,
        inline_keyboard: [[{ text: getLocaleText(user.language, 'btn_back'), callback_data: 'nav_main' }]],
      });
      return;
    }

    // Maintenance Mode Guard (Blocks regular users, allows Owner & Admins)
    if (settings.maintenance_mode && !isAdmin(uid)) {
      appendMessage(uid, {
        sender: 'bot',
        text: `⚠️ System Under Maintenance\n\n${settings.maintenance_reason}\n\n(Normal users are blocked while Owner & Admins retain full access.)`,
      });
      return;
    }

    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    // 1. /start (Runs FSub Check Middleware first!)
    if (cmd === '/start') {
      const missingFSub = getMissingFSubForUser(uid);
      if (missingFSub.length > 0) {
        appendMessage(uid, {
          sender: 'bot',
          text: getLocaleText(user.language, 'fsub_required'),
          inline_keyboard: buildFSubGateKeyboard(missingFSub, user.language),
        });
        return;
      }

      appendMessage(uid, {
        sender: 'bot',
        text: getLocaleText(user.language, 'welcome_lang'),
        inline_keyboard: [
          [
            { text: '🇮🇳 हिन्दी', callback_data: 'setlang_hi' },
            { text: '🇬🇧 English', callback_data: 'setlang_en' },
            { text: '🇷🇺 Русский', callback_data: 'setlang_ru' },
          ],
        ],
      });
      return;
    }

    // 2. Force Subscription (FSub) Admin Commands: /addfsub, /removefsub, /fsublist
    if (cmd === '/addfsub') {
      if (!isAdmin(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Admin privileges required for /addfsub.`,
        });
        return;
      }
      const chId = Number(parts[1]);
      const inviteLink = parts[2];
      if (!chId || isNaN(chId) || !inviteLink) {
        appendMessage(uid, {
          sender: 'bot',
          text: `Usage: /addfsub <channel_id> <invite_link>\nExample: /addfsub -1002194853333 https://t.me/+NEU_VIP_Channel`,
        });
        return;
      }
      setSettings((prev) => {
        const filtered = prev.fsub_channels.filter((c) => c.channel_id !== chId);
        return {
          ...prev,
          fsub_channels: [...filtered, { channel_id: chId, invite_link: inviteLink }],
        };
      });
      appendMessage(uid, {
        sender: 'bot',
        text:
          `✅ Force Subscription (FSub) Channel Added!\n\n` +
          `🆔 Channel ID: ${chId}\n` +
          `🔗 Invite Link: ${inviteLink}\n\n` +
          `Saved to settings.fsub_channels in MongoDB. Users must now join this channel to pass /start.`,
      });
      return;
    }

    if (cmd === '/removefsub') {
      if (!isAdmin(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Admin privileges required for /removefsub.`,
        });
        return;
      }
      const chId = Number(parts[1]);
      if (!chId || isNaN(chId)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `Usage: /removefsub <channel_id>\nExample: /removefsub -1002194852222`,
        });
        return;
      }
      const exists = settings.fsub_channels.some((c) => c.channel_id === chId);
      setSettings((prev) => ({
        ...prev,
        fsub_channels: prev.fsub_channels.filter((c) => c.channel_id !== chId),
      }));
      appendMessage(uid, {
        sender: 'bot',
        text: exists
          ? `✅ FSub Channel Removed: ${chId}`
          : `ℹ️ Channel ${chId} was not in the active FSub list.`,
      });
      return;
    }

    if (cmd === '/fsublist') {
      if (!isAdmin(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Admin privileges required for /fsublist.`,
        });
        return;
      }
      if (settings.fsub_channels.length === 0) {
        appendMessage(uid, {
          sender: 'bot',
          text: `📢 Active Force Subscription Channels: None configured.\nUse /addfsub <channel_id> <invite_link> to add one.`,
        });
        return;
      }
      const lines = settings.fsub_channels.map(
        (ch, idx) => `${idx + 1}. ${ch.channel_id} — ${ch.invite_link}`
      );
      appendMessage(uid, {
        sender: 'bot',
        text: `📢 ACTIVE FORCE SUBSCRIPTION CHANNELS (${settings.fsub_channels.length})\n\n${lines.join('\n')}`,
      });
      return;
    }

    // 3. Owner-Only Commands: /addadmin, /removeadmin, /adminlist
    if (cmd === '/addadmin') {
      if (!isOwner(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Only the Primary Owner (${OWNER_ID}) can execute /addadmin.`,
        });
        return;
      }
      const targetId = Number(parts[1]);
      if (!targetId || isNaN(targetId)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `Usage: /addadmin <user_id>\nExample: /addadmin 8940129384`,
        });
        return;
      }
      if (settings.admins.includes(targetId)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `ℹ️ User ${targetId} is already an active Admin.`,
        });
        return;
      }
      setSettings((prev) => ({ ...prev, admins: [...prev.admins, targetId] }));
      if (!users.some((u) => u._id === targetId)) {
        setUsers((prev) => [
          ...prev,
          {
            _id: targetId,
            username: `admin_${targetId.toString().slice(-4)}`,
            balance_usd: 0,
            language: 'en',
            currency: 'USD',
            is_banned: false,
            joined_at: new Date().toISOString(),
          },
        ]);
      }
      appendMessage(uid, {
        sender: 'bot',
        text: `👑 Admin Promoted!\nUser ${targetId} has been added to settings.admins in MongoDB and granted access to /admin, FSub commands, and wallet balance commands.`,
      });
      return;
    }

    if (cmd === '/removeadmin') {
      if (!isOwner(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Only the Primary Owner (${OWNER_ID}) can execute /removeadmin.`,
        });
        return;
      }
      const targetId = Number(parts[1]);
      if (!targetId || isNaN(targetId)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `Usage: /removeadmin <user_id>`,
        });
        return;
      }
      if (targetId === OWNER_ID) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Cannot revoke Primary Owner (${OWNER_ID}).`,
        });
        return;
      }
      setSettings((prev) => ({
        ...prev,
        admins: prev.admins.filter((id) => id !== targetId),
      }));
      appendMessage(uid, {
        sender: 'bot',
        text: `✅ Admin Privileges Revoked for User ${targetId}.`,
      });
      return;
    }

    if (cmd === '/adminlist') {
      if (!isOwner(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Only the Primary Owner (${OWNER_ID}) can view /adminlist.`,
        });
        return;
      }
      const lines = settings.admins.map((aid) => {
        const uDoc = users.find((u) => u._id === aid);
        const role = aid === OWNER_ID ? '👑 PRIMARY OWNER' : '🛡 ADMIN';
        return `• ${aid} (@${uDoc?.username || 'user'}) — ${role}`;
      });
      appendMessage(uid, {
        sender: 'bot',
        text: `👑 ACTIVE ADMIN HIERARCHY (${settings.admins.length})\n\n${lines.join('\n')}`,
      });
      return;
    }

    // 4. Admin Wallet Commands: /addmoney, /removemoney, /balance, /userinfo
    if (cmd === '/addmoney') {
      if (!isAdmin(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Admin privileges required for /addmoney.`,
        });
        return;
      }
      const targetId = Number(parts[1]);
      const amountUsd = Number(parts[2]);
      if (!targetId || isNaN(targetId) || !amountUsd || isNaN(amountUsd) || amountUsd <= 0) {
        appendMessage(uid, {
          sender: 'bot',
          text: `Usage: /addmoney <user_id> <amount_usd>\nExample: /addmoney 8940129384 25`,
        });
        return;
      }

      let updatedBalance = amountUsd;
      const existing = users.find((u) => u._id === targetId);
      const targetCurr: CurrencyCode = existing?.currency || 'USD';

      if (existing) {
        updatedBalance = Number((existing.balance_usd + amountUsd).toFixed(2));
        setUsers((prev) =>
          prev.map((u) => (u._id === targetId ? { ...u, balance_usd: updatedBalance } : u))
        );
      } else {
        setUsers((prev) => [
          ...prev,
          {
            _id: targetId,
            username: `user_${targetId.toString().slice(-4)}`,
            balance_usd: updatedBalance,
            language: 'en',
            currency: 'USD',
            is_banned: false,
            joined_at: new Date().toISOString(),
          },
        ]);
      }

      const addedDisplay = formatAmount(amountUsd, targetCurr);
      const newTotalDisplay = formatAmount(updatedBalance, targetCurr);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `✅ Wallet Credited Successfully!\n\n` +
          `👤 Target User: ${targetId}\n` +
          `➕ Added: $${amountUsd.toFixed(2)} USD (${addedDisplay})\n` +
          `👛 New Balance: $${updatedBalance.toFixed(2)} USD (${newTotalDisplay})`,
      });

      if (targetId !== uid) {
        appendMessage(targetId, {
          sender: 'bot',
          text:
            `✨ Wallet Credited!\n\n` +
            `👛 An administrator has added ${addedDisplay} ($${amountUsd.toFixed(2)} USD) to your wallet.\n` +
            `💰 Updated Balance: ${newTotalDisplay}`,
        });
      }
      return;
    }

    if (cmd === '/removemoney') {
      if (!isAdmin(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Admin privileges required for /removemoney.`,
        });
        return;
      }
      const targetId = Number(parts[1]);
      const amountUsd = Number(parts[2]);
      if (!targetId || isNaN(targetId) || !amountUsd || isNaN(amountUsd) || amountUsd <= 0) {
        appendMessage(uid, {
          sender: 'bot',
          text: `Usage: /removemoney <user_id> <amount_usd>\nExample: /removemoney 8940129384 10`,
        });
        return;
      }

      const existing = users.find((u) => u._id === targetId);
      if (!existing) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ User ${targetId} not found in MongoDB.`,
        });
        return;
      }

      const updatedBalance = Number(Math.max(0, existing.balance_usd - amountUsd).toFixed(2));
      setUsers((prev) =>
        prev.map((u) => (u._id === targetId ? { ...u, balance_usd: updatedBalance } : u))
      );

      const deductedDisplay = formatAmount(amountUsd, existing.currency);
      const newTotalDisplay = formatAmount(updatedBalance, existing.currency);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `✅ Wallet Debited (Floored at $0.00)\n\n` +
          `👤 Target User: ${targetId}\n` +
          `➖ Deducted: $${amountUsd.toFixed(2)} USD (${deductedDisplay})\n` +
          `👛 New Balance: $${updatedBalance.toFixed(2)} USD (${newTotalDisplay})`,
      });

      if (targetId !== uid) {
        appendMessage(targetId, {
          sender: 'bot',
          text:
            `⚠️ Wallet Balance Adjusted\n\n` +
            `👛 An administrator has deducted ${deductedDisplay} from your wallet.\n` +
            `💰 Updated Balance: ${newTotalDisplay}`,
        });
      }
      return;
    }

    if (cmd === '/balance' || cmd === '/userinfo') {
      if (!isAdmin(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Admin privileges required for ${cmd}.`,
        });
        return;
      }
      const targetId = Number(parts[1]) || uid;
      const targetUser = users.find((u) => u._id === targetId);
      if (!targetUser) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ User ${targetId} not found in MongoDB.\nUsage: /balance <user_id>`,
        });
        return;
      }
      const paidOrdersCount = orders.filter((o) => o.user_id === targetId && o.status === 'PAID').length;
      const displayBal = formatAmount(targetUser.balance_usd, targetUser.currency);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `👛 USER WALLET & PROFILE INSPECTOR\n\n` +
          `🆔 User ID: ${targetUser._id} (@${targetUser.username})\n` +
          `💰 Base Balance: $${targetUser.balance_usd.toFixed(2)} USD\n` +
          `💱 Selected Currency (${targetUser.currency}): ${displayBal}\n` +
          `🌐 Language: ${targetUser.language.toUpperCase()}\n` +
          `📦 Total Paid Orders: ${paidOrdersCount}\n` +
          `🚫 Banned: ${targetUser.is_banned ? 'Yes' : 'No'}`,
      });
      return;
    }

    // 5. /admin Panel
    if (cmd === '/admin') {
      if (!isAdmin(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Unauthorized: Admin privileges required to access /admin.`,
        });
        return;
      }
      sendAdminPanelMessage(uid);
      return;
    }

    // Default fallback -> Show Main Menu
    const menu = buildMainMenuMessage(user);
    appendMessage(uid, {
      sender: 'bot',
      text: menu.text,
      inline_keyboard: menu.inline_keyboard,
    });
  };

  const badge = (active: boolean) => (active ? '🟢 Active' : '🔴 Deactivated');

  const sendAdminPanelMessage = (uid: number) => {
    appendMessage(uid, {
      sender: 'bot',
      text:
        `👑 NEU PRODUCT BOT — ADMIN CONTROL PANEL\n\n` +
        `🔑 Access Level: ${isOwner(uid) ? 'Primary Owner (Full Hierarchy)' : 'Delegated Admin'}\n` +
        `📢 Active FSub Channels: ${settings.fsub_channels.length}\n` +
        `🗄 Payload Vault: DATABASE_CHANNEL_ID (${DATABASE_CHANNEL_ID})\n\n` +
        `Choose a dynamic control module below:`,
      inline_keyboard: [
        [{ text: '⚙️ System & Currency Controls', callback_data: 'adm_sys_controls' }],
        [{ text: `📢 Force Sub (FSub) Channels (${settings.fsub_channels.length})`, callback_data: 'adm_fsub' }],
        [
          { text: '📁 Manage Folders', callback_data: 'adm_folders' },
          { text: '📦 Manage Products', callback_data: 'adm_products' },
        ],
        [{ text: '⬅️ Back to Store Menu', callback_data: 'nav_main' }],
      ],
    });
  };

  const buildSystemControlsKeyboard = (cfg: GlobalSettingsDoc): InlineButton[][] => [
    [
      {
        text: `🇮🇳 INR & FamPay: ${badge(cfg.currencies.INR)}`,
        callback_data: 'adm_toggle_curr_INR',
      },
    ],
    [
      {
        text: `🇺🇸 USD Display: ${badge(cfg.currencies.USD)}`,
        callback_data: 'adm_toggle_curr_USD',
      },
    ],
    [
      {
        text: `💎 Crypto/USDT & OxaPay: ${badge(cfg.currencies.USDT)}`,
        callback_data: 'adm_toggle_curr_USDT',
      },
    ],
    [
      {
        text: `⚡️ FamPay Gateway: ${badge(cfg.gateways.FAMPAY)}`,
        callback_data: 'adm_toggle_gw_FAMPAY',
      },
      {
        text: `💎 OxaPay Gateway: ${badge(cfg.gateways.OXAPAY)}`,
        callback_data: 'adm_toggle_gw_OXAPAY',
      },
    ],
    [
      {
        text: `🛠 Maintenance Mode: ${badge(cfg.maintenance_mode)}`,
        callback_data: 'adm_toggle_maint',
      },
    ],
    [{ text: '⬅️ Back to Admin Panel', callback_data: 'adm_home' }],
  ];

  // Handle Inline Keyboard Button Callbacks in the Simulator
  const handleCallbackQuery = (cbData: string) => {
    const uid = activeUserId;
    const user = users.find((u) => u._id === uid) || users[0];

    if (settings.maintenance_mode && !isAdmin(uid)) {
      appendMessage(uid, {
        sender: 'bot',
        text: `⚠️ System Under Maintenance: ${settings.maintenance_reason}`,
      });
      return;
    }

    // SIMULATE USER CLICKING AN FSUB JOIN CHANNEL BUTTON
    if (cbData.startsWith('sim_join_fsub_')) {
      const chId = Number(cbData.replace('sim_join_fsub_', ''));
      const nextJoinedMap = {
        ...userJoinedFSubChannels,
        [uid]: Array.from(new Set([...(userJoinedFSubChannels[uid] || []), chId])),
      };
      setUserJoinedFSubChannels(nextJoinedMap);
      const stillMissing = getMissingFSubForUser(uid, settings, nextJoinedMap);
      appendMessage(uid, {
        sender: 'bot',
        text:
          stillMissing.length === 0
            ? `📢 Joined Channel ${chId}! You have now joined all required FSub channels. Click [ 🔄 Check Membership ] below:`
            : `📢 Joined Channel ${chId}! Please join the remaining ${stillMissing.length} channel(s) and click [ 🔄 Check Membership ]:`,
        inline_keyboard: buildFSubGateKeyboard(stillMissing, user.language),
      });
      return;
    }

    // FSUB VERIFY MEMBERSHIP CALLBACK ([ 🔄 Check Membership ])
    if (cbData === 'fsub_verify') {
      const missingFSub = getMissingFSubForUser(uid);
      if (missingFSub.length > 0) {
        appendMessage(uid, {
          sender: 'bot',
          text: getLocaleText(user.language, 'fsub_still_missing'),
          inline_keyboard: buildFSubGateKeyboard(missingFSub, user.language),
        });
        return;
      }

      appendMessage(uid, {
        sender: 'bot',
        text:
          `${getLocaleText(user.language, 'fsub_verified')}\n\n` +
          getLocaleText(user.language, 'welcome_lang'),
        inline_keyboard: [
          [
            { text: '🇮🇳 हिन्दी', callback_data: 'setlang_hi' },
            { text: '🇬🇧 English', callback_data: 'setlang_en' },
            { text: '🇷🇺 Русский', callback_data: 'setlang_ru' },
          ],
        ],
      });
      return;
    }

    if (cbData === 'nav_main') {
      const missingFSub = getMissingFSubForUser(uid);
      if (missingFSub.length > 0) {
        appendMessage(uid, {
          sender: 'bot',
          text: getLocaleText(user.language, 'fsub_required'),
          inline_keyboard: buildFSubGateKeyboard(missingFSub, user.language),
        });
        return;
      }
      const menu = buildMainMenuMessage(user);
      appendMessage(uid, {
        sender: 'bot',
        text: menu.text,
        inline_keyboard: menu.inline_keyboard,
      });
      return;
    }

    if (cbData === 'onb_lang_menu') {
      appendMessage(uid, {
        sender: 'bot',
        text: getLocaleText(user.language, 'welcome_lang'),
        inline_keyboard: [
          [
            { text: '🇮🇳 हिन्दी', callback_data: 'setlang_hi' },
            { text: '🇬🇧 English', callback_data: 'setlang_en' },
            { text: '🇷🇺 Русский', callback_data: 'setlang_ru' },
          ],
          [{ text: getLocaleText(user.language, 'btn_back'), callback_data: 'nav_main' }],
        ],
      });
      return;
    }

    if (cbData.startsWith('setlang_')) {
      const newLang = cbData.replace('setlang_', '') as LanguageCode;
      setUsers((prev) => prev.map((u) => (u._id === uid ? { ...u, language: newLang } : u)));
      const activeCurrButtons: InlineButton[] = [];
      if (settings.currencies.INR) activeCurrButtons.push({ text: '🇮🇳 INR (₹)', callback_data: 'setcurr_INR' });
      if (settings.currencies.USD) activeCurrButtons.push({ text: '🇺🇸 USD ($)', callback_data: 'setcurr_USD' });
      if (settings.currencies.USDT) activeCurrButtons.push({ text: '💎 USDT (Crypto)', callback_data: 'setcurr_USDT' });
      if (activeCurrButtons.length === 0) {
        activeCurrButtons.push({ text: '🇺🇸 USD ($)', callback_data: 'setcurr_USD' });
      }

      appendMessage(uid, {
        sender: 'bot',
        text: getLocaleText(newLang, 'welcome_curr'),
        inline_keyboard: [activeCurrButtons],
      });
      return;
    }

    if (cbData === 'onb_curr_menu') {
      const activeCurrButtons: InlineButton[] = [];
      if (settings.currencies.INR) activeCurrButtons.push({ text: '🇮🇳 INR (₹)', callback_data: 'setcurr_INR' });
      if (settings.currencies.USD) activeCurrButtons.push({ text: '🇺🇸 USD ($)', callback_data: 'setcurr_USD' });
      if (settings.currencies.USDT) activeCurrButtons.push({ text: '💎 USDT (Crypto)', callback_data: 'setcurr_USDT' });
      if (activeCurrButtons.length === 0) {
        activeCurrButtons.push({ text: '🇺🇸 USD ($)', callback_data: 'setcurr_USD' });
      }

      appendMessage(uid, {
        sender: 'bot',
        text:
          getLocaleText(user.language, 'welcome_curr') +
          `\n\n(Note: Only currencies set to 🟢 Active in MongoDB settings are shown here)`,
        inline_keyboard: [
          activeCurrButtons,
          [{ text: getLocaleText(user.language, 'btn_back'), callback_data: 'nav_main' }],
        ],
      });
      return;
    }

    if (cbData.startsWith('setcurr_')) {
      const newCurr = cbData.replace('setcurr_', '') as CurrencyCode;
      const updatedUser: UserDoc = { ...user, currency: newCurr };
      setUsers((prev) => prev.map((u) => (u._id === uid ? updatedUser : u)));
      const menu = buildMainMenuMessage(updatedUser);
      appendMessage(uid, {
        sender: 'bot',
        text: menu.text,
        inline_keyboard: menu.inline_keyboard,
      });
      return;
    }

    // WALLET PANEL & TOP-UPS
    if (cbData === 'wallet_open') {
      const balStr = formatAmount(user.balance_usd, user.currency);
      const paidCount = orders.filter((o) => o.user_id === uid && o.status === 'PAID').length;
      const rows: InlineButton[][] = [];

      if (settings.currencies.INR && settings.gateways.FAMPAY) {
        rows.push([{ text: '⚡️ Top-Up $10 via UPI (FamPay)', callback_data: 'wtop_FAMPAY_10' }]);
      }
      if (settings.currencies.USDT && settings.gateways.OXAPAY) {
        rows.push([{ text: '💎 Top-Up $25 via Crypto (OxaPay)', callback_data: 'wtop_OXAPAY_25' }]);
      }
      rows.push([{ text: getLocaleText(user.language, 'btn_back'), callback_data: 'nav_main' }]);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `👛 YOUR BUILT-IN BOT WALLET\n\n` +
          `🆔 User ID: ${user._id}\n` +
          `💰 Available Balance: ${balStr} ($${user.balance_usd.toFixed(2)} USD)\n` +
          `📊 Completed Orders: ${paidCount}\n\n` +
          `Your wallet lets you purchase any digital product with 1 click and instant automated delivery:`,
        inline_keyboard: rows,
      });
      return;
    }

    if (cbData.startsWith('wtop_')) {
      const [, gw, amtRaw] = cbData.split('_');
      const amtUsd = Number(amtRaw);
      const newOrdId = `ORD_${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
      const newOrder: OrderDoc = {
        _id: newOrdId,
        user_id: uid,
        product_id: null,
        amount_usd: amtUsd,
        currency: gw === 'FAMPAY' ? 'INR' : 'USDT',
        gateway: gw as 'FAMPAY' | 'OXAPAY',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      setSelectedWebhookOrder(newOrdId);

      if (gw === 'FAMPAY') {
        const amtInr = Number((amtUsd * settings.usd_to_inr).toFixed(2));
        appendMessage(uid, {
          sender: 'bot',
          text:
            `⚡️ FAMPAY UPI WALLET TOP-UP GENERATED\n\n` +
            `🧾 Top-Up Order ID: ${newOrdId}\n` +
            `💵 Amount Payable: ₹${amtInr.toFixed(2)} ($${amtUsd.toFixed(2)} USD)\n` +
            `🔗 Merchant VPA: neuproducts@fam\n\n` +
            `Scan the QR code below or click "Simulate Instant Webhook Callback" to credit your wallet immediately:`,
          qr_code_data: {
            order_id: newOrdId,
            amount_inr: amtInr,
            upi_uri: `upi://pay?pa=neuproducts@fam&pn=NEU%20DIGITAL%20STORE&am=${amtInr.toFixed(2)}&cu=INR&tn=${newOrdId}`,
          },
          inline_keyboard: [
            [{ text: '⚡️ Simulate FamPay Webhook (Instant Credit)', callback_data: `sim_webhook_${newOrdId}` }],
            [{ text: '⬅️ Back to Wallet', callback_data: 'wallet_open' }],
          ],
        });
      } else {
        appendMessage(uid, {
          sender: 'bot',
          text:
            `💎 OXAPAY CRYPTO WALLET TOP-UP\n\n` +
            `🧾 Top-Up Order ID: ${newOrdId}\n` +
            `💵 Deposit Amount: ${amtUsd.toFixed(2)} USDT\n` +
            `🔗 Invoice Link: https://pay.oxapay.com/invoice/${newOrdId}\n\n` +
            `Complete payment or trigger the OxaPay Webhook below:`,
          inline_keyboard: [
            [{ text: '💎 Simulate OxaPay Webhook (Instant Credit)', callback_data: `sim_webhook_${newOrdId}` }],
            [{ text: '⬅️ Back to Wallet', callback_data: 'wallet_open' }],
          ],
        });
      }
      return;
    }

    // CATALOG FOLDERS & PRODUCTS (Respects FSub Gatekeeper & Active Toggles)
    if (cbData === 'cat_folders') {
      const missingFSub = getMissingFSubForUser(uid);
      if (missingFSub.length > 0) {
        appendMessage(uid, {
          sender: 'bot',
          text: getLocaleText(user.language, 'fsub_required'),
          inline_keyboard: buildFSubGateKeyboard(missingFSub, user.language),
        });
        return;
      }

      const activeFolders = folders.filter((f) => f.is_active);
      const rows: InlineButton[][] = activeFolders.map((f) => {
        const count = products.filter((p) => p.folder_id === f._id && p.is_active).length;
        return [{ text: `📁 ${f.name} (${count})`, callback_data: `cat_open_${f._id}` }];
      });
      rows.push([{ text: getLocaleText(user.language, 'btn_back'), callback_data: 'nav_main' }]);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `📁 DIGITAL CATALOG FOLDERS\n\n` +
          `Showing ${activeFolders.length} active category folders (deactivated folders are automatically hidden):`,
        inline_keyboard: rows,
      });
      return;
    }

    if (cbData.startsWith('cat_open_')) {
      const folderId = cbData.replace('cat_open_', '');
      const folder = folders.find((f) => f._id === folderId);
      if (!folder || !folder.is_active) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ This folder has been deactivated by an Administrator.`,
        });
        return;
      }
      const activeProds = products.filter((p) => p.folder_id === folderId && p.is_active);
      const rows: InlineButton[][] = activeProds.map((p) => [
        {
          text: `📦 ${p.title} — ${formatAmount(p.price_usd, user.currency)}`,
          callback_data: `prod_view_${p._id}`,
        },
      ]);
      rows.push([{ text: '⬅️ Back to Folders', callback_data: 'cat_folders' }]);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `📁 ${folder.name.toUpperCase()}\n\n` +
          `Select an active digital product below for instant automated delivery:`,
        inline_keyboard: rows,
      });
      return;
    }

    if (cbData.startsWith('prod_view_')) {
      const prodId = cbData.replace('prod_view_', '');
      const prod = products.find((p) => p._id === prodId);
      if (!prod || !prod.is_active) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ This product is currently deactivated / Out of Stock.`,
        });
        return;
      }
      const priceStr = formatAmount(prod.price_usd, user.currency);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `📦 ${prod.title}\n\n` +
          `${prod.description}\n\n` +
          `📂 Payload Format: ${prod.product_type}\n` +
          `🗄 Channel Vault ID: #${prod.channel_message_id} (in ${DATABASE_CHANNEL_ID})\n` +
          `💳 Price: ${priceStr} ($${prod.price_usd.toFixed(2)} USD)\n` +
          `⚡️ Delivery: Instant Automated DM`,
        inline_keyboard: [
          [{ text: `${getLocaleText(user.language, 'btn_buy')} (${priceStr})`, callback_data: `buy_menu_${prod._id}` }],
          [
            {
              text: '⬅️ Back to Folder',
              callback_data: prod.folder_id ? `cat_open_${prod.folder_id}` : 'cat_folders',
            },
          ],
        ],
      });
      return;
    }

    // 3-WAY CHECKOUT MENU
    if (cbData.startsWith('buy_menu_')) {
      const prodId = cbData.replace('buy_menu_', '');
      const prod = products.find((p) => p._id === prodId);
      if (!prod || !prod.is_active) return;

      const priceStr = formatAmount(prod.price_usd, user.currency);
      const walletStr = formatAmount(user.balance_usd, user.currency);

      const rows: InlineButton[][] = [
        [
          {
            text: `${getLocaleText(user.language, 'btn_pay_wallet')} (${walletStr})`,
            callback_data: `pay_wallet_${prod._id}`,
          },
        ],
      ];

      if (settings.currencies.INR && settings.gateways.FAMPAY) {
        rows.push([
          {
            text: `${getLocaleText(user.language, 'btn_pay_fampay')} (₹${(prod.price_usd * settings.usd_to_inr).toFixed(2)})`,
            callback_data: `pay_fampay_${prod._id}`,
          },
        ]);
      }

      if (settings.currencies.USDT && settings.gateways.OXAPAY) {
        rows.push([
          {
            text: `${getLocaleText(user.language, 'btn_pay_oxapay')} (${prod.price_usd.toFixed(2)} USDT)`,
            callback_data: `pay_oxapay_${prod._id}`,
          },
        ]);
      }

      rows.push([{ text: '⬅️ Back to Product', callback_data: `prod_view_${prod._id}` }]);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `✨ SELECT PAYMENT METHOD\n\n` +
          `📦 Product: ${prod.title}\n` +
          `💵 Payable Amount: ${priceStr}\n` +
          `👛 Your Wallet Balance: ${walletStr}\n\n` +
          `Choose how you would like to complete your purchase:`,
        inline_keyboard: rows,
      });
      return;
    }

    // OPTION 1: PAY VIA WALLET BALANCE
    if (cbData.startsWith('pay_wallet_')) {
      const prodId = cbData.replace('pay_wallet_', '');
      const prod = products.find((p) => p._id === prodId);
      if (!prod || !prod.is_active) return;

      if (user.balance_usd < prod.price_usd) {
        appendMessage(uid, {
          sender: 'bot',
          text:
            `⚠️ Insufficient Wallet Balance!\n\n` +
            `Required: ${formatAmount(prod.price_usd, user.currency)} ($${prod.price_usd.toFixed(2)} USD)\n` +
            `Available: ${formatAmount(user.balance_usd, user.currency)} ($${user.balance_usd.toFixed(2)} USD)\n\n` +
            `Please top up your wallet or use FamPay UPI / OxaPay Crypto below:`,
          inline_keyboard: [
            [{ text: '👛 Top-Up My Wallet', callback_data: 'wallet_open' }],
            [{ text: '⬅️ Back to Checkout Options', callback_data: `buy_menu_${prod._id}` }],
          ],
        });
        return;
      }

      const newBalance = Number((user.balance_usd - prod.price_usd).toFixed(2));
      const updatedUsers = users.map((u) => (u._id === uid ? { ...u, balance_usd: newBalance } : u));
      setUsers(updatedUsers);

      const newOrder: OrderDoc = {
        _id: `ORD_${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        user_id: uid,
        product_id: prod._id,
        amount_usd: prod.price_usd,
        currency: user.currency,
        gateway: 'WALLET',
        status: 'PAID',
        created_at: new Date().toISOString(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      deliverOrderToUser(newOrder, updatedUsers, products);
      return;
    }

    // OPTION 2: PAY VIA FAMPAY UPI
    if (cbData.startsWith('pay_fampay_')) {
      const prodId = cbData.replace('pay_fampay_', '');
      const prod = products.find((p) => p._id === prodId);
      if (!prod) return;

      const amtInr = Number((prod.price_usd * settings.usd_to_inr).toFixed(2));
      const newOrdId = `ORD_${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
      const newOrder: OrderDoc = {
        _id: newOrdId,
        user_id: uid,
        product_id: prod._id,
        amount_usd: prod.price_usd,
        currency: 'INR',
        gateway: 'FAMPAY',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      setSelectedWebhookOrder(newOrdId);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `⚡️ FAMPAY DYNAMIC UPI QR CHECKOUT\n\n` +
          `📦 Product: ${prod.title}\n` +
          `🧾 Order ID: ${newOrdId}\n` +
          `💵 Payable Amount: ₹${amtInr.toFixed(2)}\n\n` +
          `Scan the dynamic UPI QR below. Once FamPay sends the webhook callback to POST /webhook/fampay, the bot immediately delivers your product:`,
        qr_code_data: {
          order_id: newOrdId,
          amount_inr: amtInr,
          upi_uri: `upi://pay?pa=neuproducts@fam&pn=NEU%20DIGITAL%20STORE&am=${amtInr.toFixed(2)}&cu=INR&tn=${newOrdId}`,
        },
        inline_keyboard: [
          [{ text: '⚡️ Simulate POST /webhook/fampay (Deliver Now)', callback_data: `sim_webhook_${newOrdId}` }],
          [{ text: '⬅️ Cancel', callback_data: `buy_menu_${prod._id}` }],
        ],
      });
      return;
    }

    // OPTION 3: PAY VIA OXAPAY CRYPTO
    if (cbData.startsWith('pay_oxapay_')) {
      const prodId = cbData.replace('pay_oxapay_', '');
      const prod = products.find((p) => p._id === prodId);
      if (!prod) return;

      const newOrdId = `ORD_${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
      const newOrder: OrderDoc = {
        _id: newOrdId,
        user_id: uid,
        product_id: prod._id,
        amount_usd: prod.price_usd,
        currency: 'USDT',
        gateway: 'OXAPAY',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      setSelectedWebhookOrder(newOrdId);

      appendMessage(uid, {
        sender: 'bot',
        text:
          `💎 OXAPAY CRYPTO INVOICE CREATED\n\n` +
          `📦 Product: ${prod.title}\n` +
          `🧾 Order ID: ${newOrdId}\n` +
          `💵 Amount: ${prod.price_usd.toFixed(2)} USDT\n` +
          `🔗 Pay URL: https://pay.oxapay.com/invoice/${newOrdId}\n\n` +
          `When OxaPay posts to POST /webhook/oxapay, your file from DATABASE_CHANNEL_ID is delivered automatically:`,
        inline_keyboard: [
          [{ text: '💎 Simulate POST /webhook/oxapay (Deliver Now)', callback_data: `sim_webhook_${newOrdId}` }],
          [{ text: '⬅️ Cancel', callback_data: `buy_menu_${prod._id}` }],
        ],
      });
      return;
    }

    // SIMULATE WEBHOOK CALLBACK DIRECTLY FROM CHAT
    if (cbData.startsWith('sim_webhook_')) {
      const ordId = cbData.replace('sim_webhook_', '');
      triggerWebhookCallback(ordId);
      return;
    }

    // LEAVE FEEDBACK FLOW
    if (cbData.startsWith('fb_leave_')) {
      const ordId = cbData.replace('fb_leave_', '');
      setPendingFeedbackOrder((prev) => ({ ...prev, [uid]: ordId }));
      appendMessage(uid, {
        sender: 'bot',
        text:
          `⭐️ Leave Verified Buyer Feedback (${ordId})\n\n` +
          `Type your review in the message box below and press Send. The bot will publish it directly to FEEDBACK_CHANNEL_ID (${FEEDBACK_CHANNEL_ID}):`,
      });
      return;
    }

    // ADMIN PANEL CALLBACKS
    if (cbData.startsWith('adm_')) {
      if (!isAdmin(uid)) {
        appendMessage(uid, {
          sender: 'bot',
          text: `⚠️ Access Denied: Admin privileges required.`,
        });
        return;
      }

      if (cbData === 'adm_home') {
        sendAdminPanelMessage(uid);
        return;
      }

      if (cbData === 'adm_sys_controls') {
        appendMessage(uid, {
          sender: 'bot',
          text:
            `⚙️ SYSTEM & CURRENCY DYNAMIC CONTROLS\n\n` +
            `Click any button below to toggle its state (🟢 Active / 🔴 Deactivated) in MongoDB settings.global_config:`,
          inline_keyboard: buildSystemControlsKeyboard(settings),
        });
        return;
      }

      if (cbData === 'adm_fsub') {
        const rows: InlineButton[][] = settings.fsub_channels.map((ch) => [
          {
            text: `🗑 Remove ${ch.channel_id} (${ch.invite_link})`,
            callback_data: `adm_rmfsub_${ch.channel_id}`,
          },
        ]);
        rows.push([{ text: '⬅️ Back to Admin Panel', callback_data: 'adm_home' }]);
        appendMessage(uid, {
          sender: 'bot',
          text:
            `📢 FORCE SUBSCRIPTION (FSUB) CHANNELS (${settings.fsub_channels.length} Active)\n\n` +
            `• Add via command: /addfsub <channel_id> <invite_link>\n` +
            `• Remove via command: /removefsub <channel_id> or click below:`,
          inline_keyboard: rows,
        });
        return;
      }

      if (cbData.startsWith('adm_rmfsub_')) {
        const cid = Number(cbData.replace('adm_rmfsub_', ''));
        const nextFsub = settings.fsub_channels.filter((c) => c.channel_id !== cid);
        setSettings((prev) => ({ ...prev, fsub_channels: nextFsub }));
        const rows: InlineButton[][] = nextFsub.map((ch) => [
          {
            text: `🗑 Remove ${ch.channel_id} (${ch.invite_link})`,
            callback_data: `adm_rmfsub_${ch.channel_id}`,
          },
        ]);
        rows.push([{ text: '⬅️ Back to Admin Panel', callback_data: 'adm_home' }]);
        appendMessage(uid, {
          sender: 'bot',
          text: `✅ Removed FSub channel ${cid} from MongoDB settings.`,
          inline_keyboard: rows,
        });
        return;
      }

      if (cbData.startsWith('adm_toggle_curr_')) {
        const code = cbData.replace('adm_toggle_curr_', '') as CurrencyCode;
        const nextVal = !settings.currencies[code];
        const nextSettings: GlobalSettingsDoc = {
          ...settings,
          currencies: { ...settings.currencies, [code]: nextVal },
          gateways: {
            ...settings.gateways,
            ...(code === 'INR' ? { FAMPAY: nextVal } : {}),
            ...(code === 'USDT' ? { OXAPAY: nextVal } : {}),
          },
        };
        setSettings(nextSettings);
        appendMessage(uid, {
          sender: 'bot',
          text: `⚙️ Updated MongoDB settings: Currency ${code} is now ${badge(nextVal)}.`,
          inline_keyboard: buildSystemControlsKeyboard(nextSettings),
        });
        return;
      }

      if (cbData.startsWith('adm_toggle_gw_')) {
        const gw = cbData.replace('adm_toggle_gw_', '') as 'FAMPAY' | 'OXAPAY';
        const nextVal = !settings.gateways[gw];
        const nextSettings: GlobalSettingsDoc = {
          ...settings,
          gateways: { ...settings.gateways, [gw]: nextVal },
        };
        setSettings(nextSettings);
        appendMessage(uid, {
          sender: 'bot',
          text: `⚙️ Updated MongoDB settings: Gateway ${gw} is now ${badge(nextVal)}.`,
          inline_keyboard: buildSystemControlsKeyboard(nextSettings),
        });
        return;
      }

      if (cbData === 'adm_toggle_maint') {
        const nextVal = !settings.maintenance_mode;
        const nextSettings: GlobalSettingsDoc = {
          ...settings,
          maintenance_mode: nextVal,
        };
        setSettings(nextSettings);
        appendMessage(uid, {
          sender: 'bot',
          text: `🛠 Global Maintenance Mode is now ${badge(nextVal)}.`,
          inline_keyboard: buildSystemControlsKeyboard(nextSettings),
        });
        return;
      }

      if (cbData === 'adm_folders') {
        const rows: InlineButton[][] = folders.map((f) => [
          {
            text: `📁 ${f.name} — ${badge(f.is_active)}`,
            callback_data: `adm_tfolder_${f._id}`,
          },
        ]);
        rows.push([{ text: '⬅️ Back to Admin Panel', callback_data: 'adm_home' }]);
        appendMessage(uid, {
          sender: 'bot',
          text: `📁 FOLDER VISIBILITY TOGGLES\n\nClick any folder to soft-hide or show it (and its nested products) in the storefront:`,
          inline_keyboard: rows,
        });
        return;
      }

      if (cbData.startsWith('adm_tfolder_')) {
        const fid = cbData.replace('adm_tfolder_', '');
        const nextFolders = folders.map((f) =>
          f._id === fid ? { ...f, is_active: !f.is_active } : f
        );
        setFolders(nextFolders);
        const rows: InlineButton[][] = nextFolders.map((f) => [
          {
            text: `📁 ${f.name} — ${badge(f.is_active)}`,
            callback_data: `adm_tfolder_${f._id}`,
          },
        ]);
        rows.push([{ text: '⬅️ Back to Admin Panel', callback_data: 'adm_home' }]);
        appendMessage(uid, {
          sender: 'bot',
          text: `📁 Folder visibility updated in MongoDB:`,
          inline_keyboard: rows,
        });
        return;
      }

      if (cbData === 'adm_products') {
        const rows: InlineButton[][] = products.map((p) => [
          {
            text: `📦 ${p.title} ($${p.price_usd}) — ${badge(p.is_active)}`,
            callback_data: `adm_tprod_${p._id}`,
          },
        ]);
        rows.push([{ text: '⬅️ Back to Admin Panel', callback_data: 'adm_home' }]);
        appendMessage(uid, {
          sender: 'bot',
          text: `📦 PRODUCT VISIBILITY TOGGLES\n\nClick any product to toggle between Active and Out of Stock:`,
          inline_keyboard: rows,
        });
        return;
      }

      if (cbData.startsWith('adm_tprod_')) {
        const pid = cbData.replace('adm_tprod_', '');
        const nextProducts = products.map((p) =>
          p._id === pid ? { ...p, is_active: !p.is_active } : p
        );
        setProducts(nextProducts);
        const rows: InlineButton[][] = nextProducts.map((p) => [
          {
            text: `📦 ${p.title} ($${p.price_usd}) — ${badge(p.is_active)}`,
            callback_data: `adm_tprod_${p._id}`,
          },
        ]);
        rows.push([{ text: '⬅️ Back to Admin Panel', callback_data: 'adm_home' }]);
        appendMessage(uid, {
          sender: 'bot',
          text: `📦 Product visibility updated in MongoDB:`,
          inline_keyboard: rows,
        });
        return;
      }
    }
  };

  // Trigger Webhook Verification (OxaPay or FamPay)
  const triggerWebhookCallback = (orderId: string) => {
    const targetOrder = orders.find((o) => o._id === orderId);
    if (!targetOrder) return;

    const route =
      targetOrder.gateway === 'OXAPAY' ? 'POST /webhook/oxapay' : 'POST /webhook/fampay';

    if (targetOrder.status === 'PAID') {
      setWebhookLogs((prev) => [
        {
          id: `wl_${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          route,
          status: 200,
          summary: `Idempotent check: Order ${orderId} already marked PAID.`,
        },
        ...prev,
      ]);
      return;
    }

    const updatedOrders = orders.map((o) =>
      o._id === orderId ? { ...o, status: 'PAID' as const } : o
    );
    setOrders(updatedOrders);

    setWebhookLogs((prev) => [
      {
        id: `wl_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        route,
        status: 200,
        summary: `HMAC Verified -> Order ${orderId} marked PAID -> Copied payload from ${DATABASE_CHANNEL_ID} to User ${targetOrder.user_id}`,
      },
      ...prev,
    ]);

    deliverOrderToUser({ ...targetOrder, status: 'PAID' }, users, products);
  };

  // Copy single file or download bundle
  const handleCopyCode = (file: PythonFileSpec) => {
    navigator.clipboard.writeText(file.code);
    setCopiedFile(file.path);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadFile = (file: PythonFileSpec) => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullBundle = () => {
    const bundleContent = PYTHON_CODEBASE.map(
      (f) =>
        `# =============================================================================\n` +
        `# FILE: ${f.path}\n` +
        `# DESCRIPTION: ${f.description}\n` +
        `# =============================================================================\n\n` +
        `${f.code}\n\n`
    ).join('\n');

    const blob = new Blob([bundleContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NEU_PRODUCT_BOT_Complete_Codebase.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateProductInVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.title.trim()) return;

    const nextMsgId =
      channelVault.reduce((max, item) => Math.max(max, item.channel_message_id), 4000) + 7;
    const priceNum = Math.max(0.5, Number(newProductForm.price_usd) || 10);

    const newVaultItem: ChannelVaultItem = {
      channel_message_id: nextMsgId,
      file_type: newProductForm.product_type,
      file_name:
        newProductForm.file_name ||
        `${newProductForm.title.replace(/\s+/g, '_')}.${newProductForm.product_type.toLowerCase()}`,
      size_label: '24.8 MB',
      secret_content: `Vaulted Asset #${nextMsgId} in DATABASE_CHANNEL_ID (${DATABASE_CHANNEL_ID})`,
      uploaded_by: activeUserId,
      created_at: new Date().toISOString(),
    };

    const newProd: ProductDoc = {
      _id: `6727b201f9d102a8b2000${products.length + 105}`,
      folder_id: newProductForm.folder_id,
      title: newProductForm.title.trim(),
      description: newProductForm.description.trim() || 'Instant automated delivery digital asset.',
      price_usd: priceNum,
      product_type: newProductForm.product_type,
      banner_file_id: `AgACAgUAAxkBAAIB_banner_${nextMsgId}`,
      channel_message_id: nextMsgId,
      payload_preview: `${newVaultItem.file_name} (${newVaultItem.size_label})`,
      is_active: true,
    };

    setChannelVault((prev) => [newVaultItem, ...prev]);
    setProducts((prev) => [...prev, newProd]);
    setNewProductForm({
      ...newProductForm,
      title: '',
      description: '',
    });
  };

  const toggleUserFSubChannelJoin = (uid: number, channelId: number) => {
    setUserJoinedFSubChannels((prev) => {
      const current = prev[uid] || [];
      const exists = current.includes(channelId);
      return {
        ...prev,
        [uid]: exists ? current.filter((id) => id !== channelId) : [...current, channelId],
      };
    });
  };

  const currentMessages = messagesByPersona[activeUserId] || [];
  const missingFSubCount = getMissingFSubForUser(activeUserId).length;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/90 bg-[#0F172A]/95 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('simulator');
          }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          NEU PRODUCT BOT
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'simulator'
                ? 'text-white border-sky-500'
                : 'border-transparent text-slate-400'
            }`}
          >
            Bot Simulator & FSub
          </button>
          <button
            onClick={() => setActiveTab('codebase')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'codebase'
                ? 'text-white border-sky-500'
                : 'border-transparent text-slate-400'
            }`}
          >
            Python Codebase ({PYTHON_CODEBASE.length} Files)
          </button>
          <button
            onClick={() => setActiveTab('mongodb')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'mongodb'
                ? 'text-white border-sky-500'
                : 'border-transparent text-slate-400'
            }`}
          >
            MongoDB Atlas & Vault
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'webhooks'
                ? 'text-white border-sky-500'
                : 'border-transparent text-slate-400'
            }`}
          >
            Render Webhook Server
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadFullBundle}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Python Suite
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center gap-2 px-4 py-2.5 bg-[#0F172A] border-b border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'simulator' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400'
          }`}
        >
          Simulator & FSub
        </button>
        <button
          onClick={() => setActiveTab('codebase')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'codebase' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400'
          }`}
        >
          Python Code ({PYTHON_CODEBASE.length})
        </button>
        <button
          onClick={() => setActiveTab('mongodb')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'mongodb' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400'
          }`}
        >
          MongoDB & Vault
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'webhooks' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400'
          }`}
        >
          Webhooks
        </button>
      </div>

      {/* Architecture Context Strip — Zero-Pill Unboxed Metadata with Typographic Separators */}
      <div className="bg-[#0F172A]/60 border-b border-slate-800/80 px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-200 font-medium">Pyrogram MTProto + Motor AsyncIOMotorClient + aiohttp</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">OWNER_ID: {OWNER_ID}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">DATABASE_CHANNEL_ID: {DATABASE_CHANNEL_ID}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">FSub Channels: {settings.fsub_channels.length}</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span>USD/INR: ₹{settings.usd_to_inr.toFixed(2)}</span>
            <span aria-hidden="true">·</span>
            <span>Active Admins: {settings.admins.length}</span>
            <span aria-hidden="true">·</span>
            <span className={settings.maintenance_mode ? 'text-amber-400' : 'text-emerald-400'}>
              {settings.maintenance_mode ? 'Maintenance: Enabled' : 'Storefront: Nominal'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6">
        {/* ===================================================================
            TAB 1: INTERACTIVE BOT SIMULATOR, FSUB GATEKEEPER & ADMIN CONSOLE
        =================================================================== */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (5 cols): Persona Switcher, FSub Simulator, Command Launcher & Dynamic Toggles */}
            <div className="lg:col-span-5 space-y-5">
              {/* 01. Persona Selector */}
              <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-sm font-semibold text-white">
                    01. Active Telegram User Persona
                  </h2>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    ID: {currentUser._id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
                  Switch roles to test Owner-only admin commands (<code className="text-sky-300">/addadmin</code>), Admin FSub & wallet commands (<code className="text-sky-300">/addfsub</code>, <code className="text-sky-300">/addmoney</code>), or Customer FSub gatekeeper & checkout.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {users.map((u) => {
                    const roleText = isOwner(u._id)
                      ? 'Primary Owner (OWNER_ID)'
                      : isAdmin(u._id)
                      ? 'Delegated Admin'
                      : 'Customer Account';
                    const isSelected = u._id === activeUserId;
                    return (
                      <button
                        key={u._id}
                        onClick={() => setActiveUserId(u._id)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500/60 text-white'
                            : 'bg-slate-900/60 border-slate-800/90 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">
                            @{u.username} · {roleText}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                            ID: {u._id} · Lang: {u.language.toUpperCase()} · Curr: {u.currency}
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono tabular-nums">
                          <div className="text-xs font-semibold text-emerald-400">
                            {formatAmount(u.balance_usd, u.currency)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            ${u.balance_usd.toFixed(2)} USD
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 02. Force Subscription (FSub) Gatekeeper State & Simulator */}
              <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-white">
                    02. Force Subscription (FSub) Gatekeeper
                  </h2>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {isAdmin(activeUserId)
                      ? 'Admin Bypass Active'
                      : missingFSubCount === 0
                      ? 'All Joined'
                      : `${missingFSubCount} Missing`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Toggle whether <span className="text-slate-200 font-medium">@{currentUser.username}</span> has joined each mandatory FSub channel, then trigger <code className="text-sky-300">/start</code> to test the FSub middleware block & <code className="text-sky-300">[ 🔄 Check Membership ]</code> button.
                </p>

                <div className="space-y-2 mb-3">
                  {settings.fsub_channels.map((ch) => {
                    const isJoined = (userJoinedFSubChannels[activeUserId] || []).includes(
                      ch.channel_id
                    );
                    return (
                      <div
                        key={ch.channel_id}
                        className="flex items-center justify-between px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-lg text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-mono text-slate-200 truncate">
                            {ch.channel_id}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate font-mono">
                            {ch.invite_link}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleUserFSubChannelJoin(activeUserId, ch.channel_id)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            isJoined
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isJoined ? '✅ Joined' : '❌ Not Joined'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleSendCommand('/fsublist')}
                    className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    /fsublist
                  </button>
                  <button
                    onClick={() =>
                      handleSendCommand('/addfsub -1002194853333 https://t.me/+NEU_VIP_Vault')
                    }
                    className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    /addfsub -1002194853333
                  </button>
                  <button
                    onClick={() => handleSendCommand('/removefsub -1002194853333')}
                    className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    /removefsub -1002194853333
                  </button>
                </div>
              </section>

              {/* 03. Quick Command Dispatcher */}
              <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white">
                    03. Owner, Admin & Wallet Command Triggers
                  </h2>
                  <span className="text-xs text-slate-400">Click to execute</span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <div className="text-xs text-slate-400 mb-1.5">
                      Owner-Only Hierarchy Commands (<code className="font-mono text-slate-300">OWNER_ID: {OWNER_ID}</code>)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleSendCommand('/adminlist')}
                        className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        /adminlist
                      </button>
                      <button
                        onClick={() => handleSendCommand('/addadmin 8940129384')}
                        className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        /addadmin 8940129384
                      </button>
                      <button
                        onClick={() => handleSendCommand('/removeadmin 8940129384')}
                        className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        /removeadmin 8940129384
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <div className="text-xs text-slate-400 mb-1.5">
                      Admin Wallet & Storefront Commands
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleSendCommand('/addmoney 8940129384 25.00')}
                        className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        /addmoney 8940129384 25.00
                      </button>
                      <button
                        onClick={() => handleSendCommand('/removemoney 8940129384 10.00')}
                        className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        /removemoney 8940129384 10.00
                      </button>
                      <button
                        onClick={() => handleSendCommand('/balance 8940129384')}
                        className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        /balance 8940129384
                      </button>
                      <button
                        onClick={() => handleSendCommand('/admin')}
                        className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        /admin
                      </button>
                      <button
                        onClick={() => handleSendCommand('/start')}
                        className="px-2.5 py-1.5 text-xs font-mono bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        /start (Test FSub)
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* 04. Dynamic Active / Deactive Toggle System Mirror */}
              <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-sm font-semibold text-white">
                    04. Dynamic Active / Deactive Toggle System
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">
                    settings.global_config
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {(
                    [
                      {
                        label: 'INR Currency & FamPay UPI Visibility',
                        active: settings.currencies.INR,
                        onToggle: () =>
                          setSettings((s) => ({
                            ...s,
                            currencies: { ...s.currencies, INR: !s.currencies.INR },
                            gateways: { ...s.gateways, FAMPAY: !s.currencies.INR },
                          })),
                      },
                      {
                        label: 'USD Storefront Currency Visibility',
                        active: settings.currencies.USD,
                        onToggle: () =>
                          setSettings((s) => ({
                            ...s,
                            currencies: { ...s.currencies, USD: !s.currencies.USD },
                          })),
                      },
                      {
                        label: 'USDT Crypto & OxaPay Gateway Visibility',
                        active: settings.currencies.USDT,
                        onToggle: () =>
                          setSettings((s) => ({
                            ...s,
                            currencies: { ...s.currencies, USDT: !s.currencies.USDT },
                            gateways: { ...s.gateways, OXAPAY: !s.currencies.USDT },
                          })),
                      },
                      {
                        label: 'Global Bot Maintenance Mode (Blocks Regular Users)',
                        active: settings.maintenance_mode,
                        onToggle: () =>
                          setSettings((s) => ({
                            ...s,
                            maintenance_mode: !s.maintenance_mode,
                          })),
                      },
                    ] as const
                  ).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 bg-slate-900/70 border border-slate-800/80 rounded-lg"
                    >
                      <span className="text-slate-200 font-medium">{item.label}</span>
                      <button
                        onClick={item.onToggle}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          item.active
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {item.active ? '🟢 Active' : '🔴 Deactivated'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column (7 cols): Live Interactive Telegram Bot Simulator */}
            <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-xl flex flex-col h-[840px] overflow-hidden">
              {/* Telegram Simulator Header */}
              <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-sm shrink-0">
                    NB
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      NEU PRODUCT BOT (@neu_product_bot)
                    </div>
                    <div className="text-xs text-slate-400 truncate font-mono tabular-nums">
                      Session: @{currentUser.username} ({currentUser._id}) · Balance: {formatAmount(currentUser.balance_usd, currentUser.currency)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSendCommand('/start')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    /start
                  </button>
                  <button
                    onClick={() => handleCallbackQuery('wallet_open')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    👛 Wallet ({formatAmount(currentUser.balance_usd, currentUser.currency)})
                  </button>
                  <button
                    onClick={() => handleCallbackQuery('nav_main')}
                    className="px-3 py-1.5 text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Main Menu
                  </button>
                </div>
              </div>

              {/* Chat Transcript Viewport */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0B1120]/60">
                {currentMessages.map((msg) => {
                  const isUserMsg = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUserMsg ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                          isUserMsg
                            ? 'bg-sky-500 text-slate-950 font-medium'
                            : 'bg-[#131C31] border border-slate-800 text-slate-100'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words font-sans">{msg.text}</div>

                        {/* Dynamic FamPay UPI QR Code Preview */}
                        {msg.qr_code_data && (
                          <div className="mt-3 p-3.5 bg-white text-slate-900 rounded-lg flex items-center gap-4">
                            <div className="w-20 h-20 bg-slate-900 rounded flex flex-col items-center justify-center text-white shrink-0 p-1">
                              <QrCode className="w-12 h-12 text-sky-400" />
                              <span className="text-[9px] font-mono mt-0.5">UPI QR</span>
                            </div>
                            <div className="min-w-0 text-[11px]">
                              <div className="font-bold text-slate-900">
                                NEU DIGITAL STORE — FamPay UPI
                              </div>
                              <div className="font-mono tabular-nums text-slate-700 mt-0.5">
                                Order: {msg.qr_code_data.order_id} · ₹{msg.qr_code_data.amount_inr.toFixed(2)}
                              </div>
                              <div className="font-mono text-[10px] text-slate-500 truncate mt-1">
                                {msg.qr_code_data.upi_uri}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Vaulted Channel Payload Attachment Preview */}
                        {msg.payload_attachment && (
                          <div className="mt-3 p-3 bg-slate-950/90 border border-emerald-500/40 rounded-lg">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-400 font-mono mb-1">
                              <span>
                                📦 COPIED FROM DATABASE_CHANNEL_ID ({DATABASE_CHANNEL_ID})
                              </span>
                              <span>MSG #{msg.payload_attachment.channel_message_id}</span>
                            </div>
                            <div className="text-xs font-semibold text-white">
                              {msg.payload_attachment.file_name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-1">
                              {msg.payload_attachment.secret_content}
                            </div>
                          </div>
                        )}

                        {/* Telegram Inline Keyboard Buttons */}
                        {msg.inline_keyboard && msg.inline_keyboard.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {msg.inline_keyboard.map((row, rIdx) => (
                              <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {row.map((btn, bIdx) => (
                                  <button
                                    key={bIdx}
                                    onClick={() =>
                                      btn.callback_data && handleCallbackQuery(btn.callback_data)
                                    }
                                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-sky-500/20 hover:border-sky-500/50 text-slate-100 border border-slate-700/80 transition-colors text-center truncate cursor-pointer ${
                                      row.length === 1 ? 'sm:col-span-2' : ''
                                    }`}
                                  >
                                    {btn.text}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono tabular-nums mt-1 px-1">
                        {msg.sender === 'user' ? `@${currentUser.username}` : 'NEU PRODUCT BOT'} · {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Command & Message Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCommand();
                }}
                className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    pendingFeedbackOrder[activeUserId]
                      ? `Write your verified review for Order ${pendingFeedbackOrder[activeUserId]}...`
                      : 'Type /start, /admin, /addfsub, /fsublist, /addadmin, /addmoney...'
                  }
                  className="flex-1 bg-[#0B1120] border border-slate-800 focus:border-sky-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: COMPLETE MODULAR PYTHON CODEBASE EXPLORER
        =================================================================== */}
        {activeTab === 'codebase' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sidebar File List */}
            <div className="lg:col-span-4 bg-[#0F172A] border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Deliverable Python Modules</h2>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {PYTHON_CODEBASE.length} files
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Filter files (e.g. fsub.py, database.py)..."
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                {PYTHON_CODEBASE.filter(
                  (f) =>
                    f.path.toLowerCase().includes(fileSearch.toLowerCase()) ||
                    f.description.toLowerCase().includes(fileSearch.toLowerCase())
                ).map((file) => {
                  const active = selectedFile.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-sky-500/15 border-sky-500/60 text-white'
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold text-sky-300">
                          {file.path}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {file.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {file.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code Viewer */}
            <div className="lg:col-span-8 bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-mono font-semibold text-white">
                    /bot/{selectedFile.path}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedFile.description}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyCode(selectedFile)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedFile === selectedFile.path ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Code
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadFile(selectedFile)}
                    className="px-3 py-1.5 text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download {selectedFile.filename}
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-x-auto bg-[#080D1A] max-h-[680px] overflow-y-auto">
                <pre className="text-xs font-mono text-slate-200 leading-relaxed">
                  <code>{selectedFile.code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: MONGODB ATLAS COLLECTIONS & TELEGRAM CHANNEL VAULT INSPECTOR
        =================================================================== */}
        {activeTab === 'mongodb' && (
          <div className="space-y-6">
            {/* Collection Selector Bar */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  MongoDB Atlas Async State & Private Telegram Channel Storage
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect live documents across all 5 Motor collections (<code className="text-sky-300">settings</code> with <code className="text-sky-300">fsub_channels</code>, <code className="text-sky-300">users</code>, <code className="text-sky-300">folders</code>, <code className="text-sky-300">products</code>, <code className="text-sky-300">orders</code>).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(
                  [
                    { id: 'settings', label: 'settings (1)' },
                    { id: 'users', label: `users (${users.length})` },
                    { id: 'folders', label: `folders (${folders.length})` },
                    { id: 'products', label: `products (${products.length})` },
                    { id: 'orders', label: `orders (${orders.length})` },
                  ] as const
                ).map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedCollection(col.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCollection === col.id
                        ? 'bg-sky-400 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 Cols: Live MongoDB Document Table / JSON Inspector */}
              <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white font-mono">
                    db.{selectedCollection}.find()
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Motor AsyncIOMotorClient
                  </span>
                </div>

                {selectedCollection === 'settings' && (
                  <pre className="p-4 bg-[#080D1A] border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto">
                    {JSON.stringify(settings, null, 2)}
                  </pre>
                )}

                {selectedCollection === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 font-medium">_id (user_id)</th>
                          <th className="py-2.5 px-3 font-medium">username</th>
                          <th className="py-2.5 px-3 font-medium">Role</th>
                          <th className="py-2.5 px-3 font-medium text-right">balance_usd</th>
                          <th className="py-2.5 px-3 font-medium">lang / curr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3 text-sky-300">{u._id}</td>
                            <td className="py-2.5 px-3 text-slate-200">@{u.username}</td>
                            <td className="py-2.5 px-3 text-slate-300 font-sans">
                              {isOwner(u._id) ? 'Owner' : isAdmin(u._id) ? 'Admin' : 'User'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-400">
                              ${u.balance_usd.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {u.language} · {u.currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedCollection === 'folders' && (
                  <div className="space-y-2">
                    {folders.map((f) => (
                      <div
                        key={f._id}
                        className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{f.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            ObjectId("{f._id}") · emoji_id: "{f.emoji_id}"
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setFolders((prev) =>
                              prev.map((item) =>
                                item._id === f._id ? { ...item, is_active: !item.is_active } : item
                              )
                            )
                          }
                          className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                            f.is_active
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {f.is_active ? '🟢 Active' : '🔴 Deactivated'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCollection === 'products' && (
                  <div className="space-y-2.5">
                    {products.map((p) => (
                      <div
                        key={p._id}
                        className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{p.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                            price_usd: ${p.price_usd.toFixed(2)} · type: {p.product_type} · channel_message_id: #{p.channel_message_id}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setProducts((prev) =>
                              prev.map((item) =>
                                item._id === p._id ? { ...item, is_active: !item.is_active } : item
                              )
                            )
                          }
                          className={`px-3 py-1 rounded font-semibold shrink-0 cursor-pointer ${
                            p.is_active
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {p.is_active ? '🟢 Active' : '🔴 Out of Stock'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCollection === 'orders' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3 font-medium">_id</th>
                          <th className="py-2.5 px-3 font-medium">user_id</th>
                          <th className="py-2.5 px-3 font-medium">gateway</th>
                          <th className="py-2.5 px-3 font-medium text-right">amount_usd</th>
                          <th className="py-2.5 px-3 font-medium">status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                        {orders.map((o) => (
                          <tr key={o._id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3 text-sky-300">{o._id}</td>
                            <td className="py-2.5 px-3 text-slate-300">{o.user_id}</td>
                            <td className="py-2.5 px-3 text-slate-300">{o.gateway}</td>
                            <td className="py-2.5 px-3 text-right text-slate-100">
                              ${o.amount_usd.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={
                                  o.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                                }
                              >
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right 5 Cols: Private Telegram Channel Asset Vault & Upload Wizard */}
              <div className="lg:col-span-5 space-y-6">
                <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    Upload Product to Private Channel Vault
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Uploads heavy payload to <code className="text-sky-300">DATABASE_CHANNEL_ID ({DATABASE_CHANNEL_ID})</code> and stores only <code className="text-sky-300">channel_message_id</code> in MongoDB.
                  </p>

                  <form onSubmit={handleCreateProductInVault} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Target Folder</label>
                      <select
                        value={newProductForm.folder_id}
                        onChange={(e) =>
                          setNewProductForm({ ...newProductForm, folder_id: e.target.value })
                        }
                        className="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white"
                      >
                        {folders.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Product Title</label>
                        <input
                          type="text"
                          required
                          value={newProductForm.title}
                          onChange={(e) =>
                            setNewProductForm({ ...newProductForm, title: e.target.value })
                          }
                          placeholder="e.g. AI Agent Kit v2"
                          className="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Base Price (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newProductForm.price_usd}
                          onChange={(e) =>
                            setNewProductForm({ ...newProductForm, price_usd: e.target.value })
                          }
                          className="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Payload Format</label>
                        <select
                          value={newProductForm.product_type}
                          onChange={(e) =>
                            setNewProductForm({
                              ...newProductForm,
                              product_type: e.target.value as ProductDoc['product_type'],
                            })
                          }
                          className="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                        >
                          <option value="ZIP">ZIP Archive</option>
                          <option value="PDF">PDF E-Book</option>
                          <option value="MP4">MP4 Video</option>
                          <option value="LINK">Secret Link</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Payload File Name</label>
                        <input
                          type="text"
                          value={newProductForm.file_name}
                          onChange={(e) =>
                            setNewProductForm({ ...newProductForm, file_name: e.target.value })
                          }
                          className="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Vault Payload in Channel & Save to MongoDB
                    </button>
                  </form>
                </section>

                {/* Verified Buyer Feedback Channel Feed */}
                <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">
                      FEEDBACK_CHANNEL_ID ({FEEDBACK_CHANNEL_ID})
                    </h3>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      {feedbackFeed.length} posts
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {feedbackFeed.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>@{fb.username} ({fb.user_id})</span>
                          <span>Order {fb.order_id}</span>
                        </div>
                        <div className="text-sky-300 font-medium mt-1">{fb.product_title}</div>
                        <p className="text-slate-200 mt-1">{fb.rating_text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: RENDER 24/7 KEEP-ALIVE & WEBHOOK SERVER CONSOLE
        =================================================================== */}
        {activeTab === 'webhooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  aiohttp Keep-Alive & Webhook Simulator (PORT=8080)
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Simulate UptimeRobot pings (<code className="text-sky-300">GET /health</code>) and instant payment gateway callbacks (<code className="text-sky-300">POST /webhook/oxapay</code> & <code className="text-sky-300">POST /webhook/fampay</code>).
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    setWebhookLogs((prev) => [
                      {
                        id: `wl_${Date.now()}`,
                        time: new Date().toLocaleTimeString(),
                        route: 'GET /health',
                        status: 200,
                        summary: `200 OK — {"status":"ok","fsub_channels_count":${settings.fsub_channels.length},"maintenance_mode":${settings.maintenance_mode}}`,
                      },
                      ...prev,
                    ])
                  }
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-left flex items-center justify-between cursor-pointer"
                >
                  <span>GET /health (UptimeRobot Keep-Alive)</span>
                  <span className="text-emerald-400 font-semibold">Trigger 200 OK</span>
                </button>

                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-xs text-slate-400 mb-2">
                    Select Order to Trigger Payment Webhook Callback
                  </label>
                  <select
                    value={selectedWebhookOrder}
                    onChange={(e) => setSelectedWebhookOrder(e.target.value)}
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono mb-3"
                  >
                    {orders.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o._id} — {o.gateway} — ${o.amount_usd.toFixed(2)} ({o.status})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => triggerWebhookCallback(selectedWebhookOrder)}
                    className="w-full py-2.5 px-4 bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Dispatch Signed Webhook & Auto-Deliver Payload
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                  Live aiohttp Access & Webhook Verification Log
                </h3>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  0.0.0.0:8080
                </span>
              </div>
              <div className="space-y-2 font-mono text-xs max-h-[520px] overflow-y-auto">
                {webhookLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#080D1A] border border-slate-800/90 rounded-lg flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-400 font-semibold">{log.route}</span>
                      <span className="text-emerald-400">
                        HTTP {log.status} · {log.time}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px]">{log.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
