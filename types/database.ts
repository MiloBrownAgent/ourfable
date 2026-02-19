export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string | null;
  character_name: string;
  character_age: number | null;
  character_photo_url: string | null;
  story_prompt: string;
  included_elements: string[];
  art_style: ArtStyle;
  status: BookStatus;
  pages: BookPage[] | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookPage {
  page_number: number;
  text: string;
  image_url: string;
}

export interface Order {
  id: string;
  user_id: string;
  book_id: string;
  format: 'digital' | 'hardcover';
  status: OrderStatus;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  shipping_address: ShippingAddress | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export type ArtStyle = 'watercolor' | 'whimsical' | 'soft_pastel' | 'bold_pop' | 'fantasy' | 'classic';
export type BookStatus = 'draft' | 'generating' | 'ready' | 'failed';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded';
