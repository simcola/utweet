export interface Region {
  id: number;
  name: string;
  code: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  display_order: number;
  column_span?: number;
  subcategories?: Category[];
}

export interface Item {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  category_id: number;
  region_id: number | null;
  country_id: number | null;
  is_global: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  region?: Region;
  country?: Country;
  average_rating?: number;
  rating_count?: number;
  like_count?: number;
  is_liked?: boolean;
}

export interface Rating {
  id: number;
  item_id: number;
  user_ip: string;
  rating: number;
  created_at: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
  region_id: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
}

export interface Photo {
  id: number;
  image_url: string;
  username: string;
  email: string;
  location: string | null;
  species: string | null;
  airesponse: string | null;
  likes: number;
  approved: boolean;
  created_at: string;
  is_liked?: boolean;
}

