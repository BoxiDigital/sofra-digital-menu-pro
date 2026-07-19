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

export interface CartItem {
  dish: Dish;
  quantity: number;
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

export const config: RestaurantConfig = {
  nameAr: 'رياض النكهات',
  nameFr: 'Riad des Saveurs',
  sloganAr: 'مطعم تقليدي مغربي أصيل',
  sloganFr: 'Restaurant marocain traditionnel authentique',
  logoUrl: '/images/logo.png',
  workingHoursAr: 'يومياً من 11:00 صباحاً حتى 11:00 مساءً',
  workingHoursFr: 'Tous les jours de 11h00 à 23h00',
  whatsappNumber: '+212600000000',
  whatsappMessageAr: 'أرغب في طلب من قائمة رياض النكهات',
  whatsappMessageFr: 'Je souhaite commander du menu Riad des Saveurs',
  primaryColor: '#047857',
  backgroundColor: 'cream',
  currencyAr: 'درهم',
  currencyFr: 'MAD',
};

export const CATEGORIES: Category[] = [
  {
    id: 'appetizers',
    nameAr: 'مقدمات مغربية',
    nameFr: 'Entrées Marocaines',
    icon: '🥣',
  },
  {
    id: 'tagines',
    nameAr: 'طواجين',
    nameFr: 'Tagines',
    icon: '🍲',
  },
  {
    id: 'couscous',
    nameAr: 'كسكس',
    nameFr: 'Couscous',
    icon: '🌾',
  },
  {
    id: 'pastillas',
    nameAr: 'بسطيلات',
    nameFr: 'Pastillas',
    icon: '🥟',
  },
  {
    id: 'soups',
    nameAr: 'شوربة',
    nameFr: 'Soupe',
    icon: '🍲',
  },
  {
    id: 'drinks',
    nameAr: 'مشروبات',
    nameFr: 'Boissons',
    icon: '🍵',
  },
];

export const DISHES: Dish[] = [
  {
    id: 'harira',
    nameAr: 'حريصة',
    nameFr: 'Harira',
    descriptionAr: 'شوربة تقليدية مغربية بتمر وشباكية، دافئة ومغذية',
    descriptionFr: 'Soupe traditionnelle marocaine avec dattes et Chebakia, chaude et nutritive',
    price: 25,
    category: 'soups',
    image: '/images/harira.jpg',
    isAvailable: true,
    isHalal: true,
  },
  {
    id: 'tajine-lamb-prunes',
    nameAr: 'طاجين لحم بالبرقوق',
    nameFr: 'Tajine d\'Agneau aux Pruneaux',
    descriptionAr: 'طاجين لحم مغربي مع برقوق ولوز محمص، طعم أصيل ودافئ',
    descriptionFr: 'Agneau tagine with prunes and toasted almonds, flavor authentique et chaleureux',
    price: 85,
    category: 'tagines',
    image: '/images/tajine-lamb-prunes.jpg',
    isAvailable: true,
    isHalal: true,
  },
  {
    id: 'couscous-royal',
    nameAr: 'كسكس ملكي',
    nameFr: 'Couscous Royal',
    descriptionAr: 'كسكس بالماء الفوار، خضار طازجة، لحم دجاج، سمن مغربي',
    descriptionFr: 'Couscous à la vapeur, légumes frais, poulet, beurre marocain',
    price: 70,
    category: 'couscous',
    image: '/images/couscous-royal.jpg',
    isAvailable: true,
    isVegetarian: false,
  },
  {
    id: 'pastilla-chicken',
    nameAr: 'بسطيلة بالدجاج',
    nameFr: 'Pastilla au Poulet',
    descriptionAr: 'بسطيلة مغربية بطبقة عجين مقرمشة، دجاج، لوز، قرفة وسكر صقيل',
    descriptionFr: 'Pastilla au poulet avec amandes, cannelle et sucre glace',
    price: 95,
    category: 'pastillas',
    image: '/images/pastilla-chicken.jpg',
    isAvailable: true,
    isHalal: true,
  },
  {
    id: 'mint-tea',
    nameAr: 'شاي مغربي بالنعناع',
    nameFr: 'Thé à la Menthe',
    descriptionAr: 'شاي مغربي مع النعناع، يقدم في براد تقليدي مع سكر',
    descriptionFr: 'Thé marocain à la menthe, servi dans une théière traditionnelle',
    price: 15,
    category: 'drinks',
    image: '/images/mint-tea.jpg',
    isAvailable: true,
    isHalal: true,
  },
  {
    id: 'chebakia',
    nameAr: 'شباكية',
    nameFr: 'Chebakia',
    descriptionAr: 'حلوى مغربية تقليدية مقلية ومغلفة بالسمسم، تُقدم في المناسبات',
    descriptionFr: 'Chebakia traditionnelle, frit et enrobée de sésame, servie lors des fêtes',
    price: 20,
    category: 'drinks',
    image: '/images/chebakia.jpg',
    isAvailable: true,
    isVegetarian: true,
    isBestSeller: true,
  },
];

export const CART_ITEMS: CartItem[] = [];