export interface Dish {
 id: string;
 nameAr: string;
 nameFr: string;
 descriptionAr: string;
 descriptionFr: string;
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
 promoTextAr?: string;
 promoTextFr?: string;
}

export interface Category {
 id: string;
 nameAr: string;
 nameFr: string;
 icon: string; // Lucide icon name
}

export interface RestaurantConfig {
 nameAr: string;
 nameFr: string;
 sloganAr: string;
 sloganFr: string;
 logoUrl: string;
 coverUrl?: string;
 workingHoursAr: string;
 workingHoursFr: string;
 whatsappNumber: string;
 whatsappMessageAr: string;
 whatsappMessageFr: string;
 primaryColor: string; // hex color
 backgroundColor: 'cream' | 'dark' | 'white';
 currencyAr: string;
 currencyFr: string;
}

export interface CartItem {
 dish: Dish;
 quantity: number;
}

export interface Restaurant {
 id: string;
 nameAr: string;
 nameFr: string;
 slug: string;
 sloganAr: string;
 sloganFr: string;
 logoUrl: string;
 coverUrl?: string;
 workingHoursAr: string;
 workingHoursFr: string;
 whatsappNumber: string;
 whatsappMessageAr: string;
 whatsappMessageFr: string;
 primaryColor: string;
 backgroundColor: 'cream' | 'dark' | 'white';
 currencyAr: string;
 currencyFr: string;
}

export interface AuthUser {
 id: string;
 email: string;
 restaurantId: string;
}
