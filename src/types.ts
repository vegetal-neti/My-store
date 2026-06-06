export interface Product {
  id: string;
  name?: string;
  title?: string;
  price: number;
  description?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  badge?: string;
  bgColor?: 'gray' | 'beige';
  size?: string;
  color?: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
}
