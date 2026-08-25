export interface Dish {
 id: string;
 nameAr: string;
 nameFr: string;
 nameEn: string;
 nameEs: string;
 descriptionAr: string;
 descriptionFr: string;
 descriptionEn: string;
 descriptionEs: string;
 price: number;
 category: string; // category ID
 image: string;
 isAvailable: boolean;
 isNew?: boolean;
 isBestSeller?: boolean;
 isVegetarian?: boolean;
 isHalal?: boolean;
 isGlutenFree?: boolean;
 isPromo?: boolean;
 promoLabelAr?: string;
 promoLabelFr?: string;
 promoLabelEn?: string;
 promoLabelEs?: string;
 promoTextAr?: string;
 promoTextFr?: string;
 promoTextEn?: string;
 promoTextEs?: string;
 upsellIds?: string[]; // معرفات الأطباق المقترحة كمكملات (upsells)
}

export interface Category {
 id: string;
 nameAr: string;
 nameFr: string;
 nameEn: string;
 nameEs: string;
 icon: string; // Lucide icon name
}

export interface RestaurantConfig {
 nameAr: string;
 nameFr: string;
 nameEn: string;
 nameEs: string;
 sloganAr: string;
 sloganFr: string;
 sloganEn: string;
 sloganEs: string;
 logoUrl: string;
 coverUrl?: string;
 workingHoursAr: string;
 workingHoursFr: string;
 workingHoursEn: string;
 workingHoursEs: string;
 whatsappNumber: string;
 whatsappMessageAr: string;
 whatsappMessageFr: string;
 whatsappMessageEn: string;
 whatsappMessageEs: string;
 primaryColor: string; // hex color
   backgroundColor: 'cream' | 'dark' | 'white';
   currencyAr: string;
   currencyFr: string;
   currencyEn: string;
   currencyEs: string;
   googleMapsUrl?: string;
 }

export interface CartItem {
 dish: Dish;
 quantity: number;
}

export interface Restaurant {
 id: string;
 nameAr: string;
 nameFr: string;
 nameEn: string;
 nameEs: string;
 slug: string;
 sloganAr: string;
 sloganFr: string;
 sloganEn: string;
 sloganEs: string;
 logoUrl: string;
 coverUrl?: string;
 workingHoursAr: string;
 workingHoursFr: string;
 workingHoursEn: string;
 workingHoursEs: string;
 whatsappNumber: string;
 whatsappMessageAr: string;
 whatsappMessageFr: string;
 whatsappMessageEn: string;
 whatsappMessageEs: string;
 primaryColor: string;
   backgroundColor: 'cream' | 'dark' | 'white';
   currencyAr: string;
   currencyFr: string;
   currencyEn: string;
   currencyEs: string;
   googleMapsUrl?: string;
 }

export interface Review {
  id: string;
  restaurant_id: string;
  rating: number;
  feedback: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  restaurantId: string;
}