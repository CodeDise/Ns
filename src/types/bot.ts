export type CurrencyCode = 'INR' | 'USD' | 'USDT';
export type LanguageCode = 'hi' | 'en' | 'ru';
export type GatewayCode = 'WALLET' | 'FAMPAY' | 'OXAPAY';
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface FSubChannel {
  channel_id: number;
  invite_link: string;
}

export interface GlobalSettingsDoc {
  _id: 'global_config';
  admins: number[];
  fsub_channels: FSubChannel[];
  maintenance_mode: boolean;
  maintenance_reason: string;
  currencies: {
    INR: boolean;
    USD: boolean;
    USDT: boolean;
  };
  gateways: {
    FAMPAY: boolean;
    OXAPAY: boolean;
  };
  usd_to_inr: number;
}

export interface UserDoc {
  _id: number;
  username: string;
  balance_usd: number;
  language: LanguageCode;
  currency: CurrencyCode;
  is_banned: boolean;
  joined_at: string;
}

export interface FolderDoc {
  _id: string;
  name: string;
  emoji_id: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductDoc {
  _id: string;
  folder_id: string | null;
  title: string;
  description: string;
  price_usd: number;
  product_type: 'ZIP' | 'PDF' | 'MP4' | 'PNG' | 'LINK' | 'TEXT';
  banner_file_id: string;
  channel_message_id: number;
  payload_preview: string;
  is_active: boolean;
}

export interface OrderDoc {
  _id: string;
  user_id: number;
  product_id: string | null; // null means Wallet Top-Up
  amount_usd: number; // in USD base
  currency: CurrencyCode;
  gateway: GatewayCode;
  status: OrderStatus;
  created_at: string;
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  userId: number;
  text: string;
  timestamp: string;
  inline_keyboard?: InlineButton[][];
  qr_code_data?: {
    upi_uri: string;
    amount_inr: number;
    order_id: string;
  };
  payload_attachment?: {
    channel_message_id: number;
    file_type: string;
    file_name: string;
    secret_content: string;
  };
}

export interface ChannelVaultItem {
  channel_message_id: number;
  file_type: string;
  file_name: string;
  size_label: string;
  secret_content: string;
  uploaded_by: number;
  created_at: string;
}

export interface FeedbackChannelItem {
  id: string;
  order_id: string;
  user_id: number;
  username: string;
  product_title: string;
  rating_text: string;
  created_at: string;
}
