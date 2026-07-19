export interface Dish {
  id: string;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isVegetarian?: boolean;
  isHalal?: boolean;
  isGlutenFree?: boolean;
}

export interface Category {
  id: string;
  nameAr: string;
  nameFr: string;
  icon: string;
}

export interface RestaurantConfig {
  nameAr: string;
  nameFr: string;
  sloganAr: string;
  sloganFr: string;
  logoUrl: string;
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

export interface CartItem {
  dish: Dish;
  quantity: number;
}