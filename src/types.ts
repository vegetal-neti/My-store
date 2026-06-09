export interface ProductColor {
  id?: string;
  colorName: string;
  colorCode: string;
}

export interface Product {
  id: string;
  name?: string;
  title?: string;
  price: number;
  oldPrice?: number;
  description?: string;
  image?: string;
  images?: string[];
  detailImages?: string[];
  sizes?: string[];
  colors?: any[];
  stock?: number;
  category?: string;
  rating?: number;
  reviews?: number;
  badge?: string;
  bgColor?: 'gray' | 'beige';
  size?: string;
  color?: string;
  flashBundle?: {
    enabled: boolean;
    startDate?: string;
    endDate?: string;
    tiers: Array<{
      quantity: number;
      bundlePrice: number;
    }>;
  };
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
}

export interface HeroSettings {
  imageUrl?: string;
  badge?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface ShippingRate {
  wilayaId: number;
  wilayaName: string;
  wilayaNameEn: string;
  homePrice: number;
  deskPrice: number;
  enabled: boolean;
  updatedAt?: any;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  customerInfo?: {
    fullName: string;
    phone: string;
    state: string;
    city: string;
    address?: string;
  };
  items: Array<{
    id: string;
    name?: string;
    title?: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  totalPrice: number;
  deliveryType: 'home' | 'desk';
  deliveryFee: number;
  createdAt?: any;
  bundleEnabled?: boolean;
  bundleQuantity?: number;
  bundlePrice?: number;
  originalPrice?: number;
  savedAmount?: number;
  savedPercentage?: number;
  flashOfferId?: string;
}


