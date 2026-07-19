import React, { useState, useMemo } from "react";
import { Dish, Category, RestaurantConfig, CartItem } from "../types";
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Globe, 
  Clock, 
  Phone, 
  Check, 
  X, 
  Sparkles, 
  Utensils, 
  Beef, 
  Cake, 
  Coffee,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  Sparkles: Sparkles,
  Utensils: Utensils,
  Beef: Beef,
  Cake: Cake,
  Coffee: Coffee,
};

interface ClientViewProps {
  categories: Category[];
  dishes: Dish[];
  config: RestaurantConfig;
}

export default function ClientView({ categories, dishes, config }: ClientViewProps) {
  const [lang, setLang] = useState<"ar" | "fr">("ar");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const isRtl = lang === "ar";

  // Filter dishes based on search and category
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;
      const name = lang === "ar" ? dish.nameAr : dish.nameFr;
      const desc = lang === "ar" ? dish.descriptionAr : dish.descriptionFr;
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, selectedCategory, searchQuery, lang]);

  // Cart operations
  const addToCart = (dish: Dish) => {
    if (!dish.isAvailable) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) => 
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
    toast({
      title: lang === "ar" ? "تم الإضافة للسلة" : "Ajouté au panier",
      description: lang === "ar" ? `${dish.nameAr} تمت إضافته بنجاح` : `${dish.nameFr} a été ajouté`,
      duration: 1500,
    });
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.dish.id === dishId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.dish.id !== dishId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Send order to WhatsApp
  const sendOrder = () => {
    if (cart.length === 0) return;

    const itemsText = cart
      .map((item) => {
        const name = lang === "ar" ? item.dish.nameAr : item.dish.nameFr;
        return `- ${item.quantity}x ${name} (${item.dish.price * item.quantity} ${lang === "ar" ? config.currencyAr : config.currencyFr})`;
      })
      .join("\n");

    const template = lang === "ar" ? config.whatsappMessageAr : config.whatsappMessageFr;
    const totalText = `${cartTotal}`;
    
    let message = template
      .replace("{items}", itemsText)
      .replace("{total}", totalText);

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${config.whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  // Translations helper
  const t = {
    workingHours: lang === "ar" ? "ساعات العمل" : "Heures d'ouverture",
    searchPlaceholder: lang === "ar" ? "ابحث عن طبقك المفضل..." : "Rechercher un plat...",
    all: lang === "ar" ? "الكل" : "Tout",
    addToCart: lang === "ar" ? "إضافة للسلة" : "Ajouter au panier",
    outOfStock: lang === "ar" ? "نفدت الكمية" : "Épuisé",
    cartTitle: lang === "ar" ? "سلة الطلبات" : "Votre Panier",
    emptyCart: lang === "ar" ? "السلة فارغة حالياً" : "Votre panier est vide",
    total: lang === "ar" ? "المجموع الإجمالي" : "Total",
    sendOrder: lang === "ar" ? "إرسال الطلب عبر واتساب" : "Envoyer la commande via WhatsApp",
    currency: lang === "ar" ? config.currencyAr : config.currencyFr,
    badges: {
      new: lang === "ar" ? "جديد" : "Nouveau",
      bestSeller: lang === "ar" ? "الأكثر طلباً" : "Populaire",
      vegetarian: lang === "ar" ? "نباتی" : "Végétarien",
      halal: lang === "ar" ? "حلال" : "Halal",
      glutenFree: lang === "ar" ? "خالي من الغلوتين" : "Sans Gluten",
    },
    whatsappContact: lang === "ar" ? "تواصل معنا مباشر" : "Contact direct",
  };

  // Background style based on config
  const bgClass = 
    config.backgroundColor === "cream" 
      ? "bg-[#FAF6F0] text-[#2C1B11]" 
      : config.backgroundColor === "dark" 
      ? "bg-[#121212] text-[#F5F5F5]" 
      : "bg-white text-gray-900";

  const cardBgClass = 
    config.backgroundColor === "cream" 
      ? "bg-white border-[#EADBC8]" 
      : config.backgroundColor === "dark" 
      ? "bg-[#1E1E1E] border-[#2D2D2D]" 
      : "bg-white border-gray-100";

  const textMutedClass = 
    config.backgroundColor === "dark" 
      ? "text-gray-400" 
      : "text-gray-600";

  return (
    <div className={`min-h-screen pb-24 font-sans ${bgClass}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Language Switcher Floating */}
      <div className="absolute top-4 right-4 left-auto z-50 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white border-gray-200 shadow-sm flex items-center gap-1"
          onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
        >
          <Globe className="h-4 w-4" />
          <span>{lang === "ar" ? "Français" : "العربية"}</span>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80" 
          alt="Restaurant Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 text-white">
          {/* Logo */}
          <div className="w-20 h-20 rounded-full border-2 border-white bg-white/90 p-1 mb-3 shadow-lg overflow-hidden flex items-center justify-center">
            <img 
              src={config.logoUrl} 
              alt="Logo" 
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&h=150&q=80";
              }}
            />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-wide drop-shadow-md">
            {lang === "ar" ? config.nameAr : config.nameFr}
          </h1>
          <p className="text-sm md:text-base text-amber-200 mt-1 max-w-md font-medium drop-shadow-sm">
            {lang === "ar" ? config.sloganAr : config.sloganFr}
          </p>
        </div>
      </div>

      {/* Restaurant Info Card */}
      <div className="max-w-md mx-auto -mt-8 relative z-30 px-4">
        <div className={`rounded-2xl p-4 shadow-xl border ${cardBgClass} backdrop-blur-md bg-opacity-95`}>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-5 w-5 flex-shrink-0" style={{ color: config.primaryColor }} />
            <div>
              <span className="font-semibold block text-xs uppercase tracking-wider opacity-75">{t.workingHours}</span>
              <span className="font-medium">{lang === "ar" ? config.workingHoursAr : config.workingHoursFr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Categories Container */}
      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 left-auto" />
          <Input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pr-10 pl-4 py-6 rounded-xl border shadow-sm focus:ring-2 focus:ring-offset-2 ${
              config.backgroundColor === "dark" 
                ? "bg-[#1E1E1E] border-[#2D2D2D] text-white focus:ring-amber-500" 
                : "bg-white border-gray-200 text-gray-900 focus:ring-amber-500"
            }`}
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 right-auto"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="rounded-full px-5 py-5 flex-shrink-0 font-medium transition-all"
            style={{
              backgroundColor: selectedCategory === "all" ? config.primaryColor : "transparent",
              color: selectedCategory === "all" ? "#fff" : "inherit",
              borderColor: selectedCategory === "all" ? config.primaryColor : "currentColor",
            }}
            onClick={() => setSelectedCategory("all")}
          >
            {t.all}
          </Button>
          {categories.map((cat) => {
            const IconComponent = iconMap[cat.icon] || Utensils;
            const isSelected = selectedCategory === cat.id;
            return (
              <Button
                key={cat.id}
                variant={isSelected ? "default" : "outline"}
                className="rounded-full px-5 py-5 flex-shrink-0 font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: isSelected ? config.primaryColor : "transparent",
                  color: isSelected ? "#fff" : "inherit",
                  borderColor: isSelected ? config.primaryColor : "currentColor",
                }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <IconComponent className="h-4 w-4" />
                <span>{lang === "ar" ? cat.nameAr : cat.nameFr}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Dishes List */}
      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {filteredDishes.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-3" />
            <p className="text-lg font-semibold">
              {lang === "ar" ? "لا توجد أطباق تطابق بحثك" : "Aucun plat ne correspond à votre recherche"}
            </p>
          </div>
        ) : (
          filteredDishes.map((dish) => {
            const cartItem = cart.find((item) => item.dish.id === dish.id);
            return (
              <div 
                key={dish.id} 
                className={`rounded-2xl overflow-hidden border shadow-md transition-all duration-300 hover:shadow-lg ${cardBgClass} flex flex-col`}
              >
                {/* Dish Image */}
                <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                  <img 
                    src={dish.image} 
                    alt={lang === "ar" ? dish.nameAr : dish.nameFr} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  {/* Badges Overlay */}
                  <div className="absolute top-3 right-3 left-auto z-10 flex flex-wrap gap-1 max-w-[80%] justify-end">
                    {dish.isNew && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {t.badges.new}
                      </Badge>
                    )}
                    {dish.isBestSeller && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {t.badges.bestSeller}
                      </Badge>
                    )}
                    {dish.isVegetarian && (
                      <Badge className="bg-green-600 hover:bg-green-700 text-white border-none text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {t.badges.vegetarian}
                      </Badge>
                    )}
                    {dish.isHalal && (
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {t.badges.halal}
                      </Badge>
                    )}
                    {dish.isGlutenFree && (
                      <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-none text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {t.badges.glutenFree}
                      </Badge>
                    )}
                  </div>

                  {/* Out of Stock Overlay */}
                  {!dish.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
                      <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg tracking-wide">
                        {t.outOfStock}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dish Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-bold tracking-tight">
                        {lang === "ar" ? dish.nameAr : dish.nameFr}
                      </h3>
                      <span className="text-lg font-extrabold whitespace-nowrap" style={{ color: config.primaryColor }}>
                        {dish.price} {t.currency}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${textMutedClass}`}>
                      {lang === "ar" ? dish.descriptionAr : dish.descriptionFr}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200/50">
                    {dish.isAvailable ? (
                      cartItem ? (
                        <div className="flex items-center justify-between w-full bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg hover:bg-white dark:hover:bg-zinc-700"
                            onClick={() => updateQuantity(dish.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-sm">{cartItem.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg hover:bg-white dark:hover:bg-zinc-700"
                            onClick={() => updateQuantity(dish.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full rounded-xl font-semibold py-5 shadow-sm transition-all hover:opacity-90"
                          style={{ backgroundColor: config.primaryColor, color: "#fff" }}
                          onClick={() => addToCart(dish)}
                        >
                          <Plus className="h-4 w-4 mr-2 ml-2" />
                          <span>{t.addToCart}</span>
                        </Button>
                      )
                    ) : (
                      <Button
                        disabled
                        className="w-full rounded-xl font-semibold py-5 bg-gray-300 text-gray-500 dark:bg-zinc-800 dark:text-zinc-600"
                      >
                        {t.outOfStock}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating WhatsApp Contact Button */}
      <div className="fixed bottom-24 left-4 right-auto z-40">
        <a 
          href={`https://wa.me/${config.whatsappNumber}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 font-medium text-sm"
        >
          <Phone className="h-4 w-4" />
          <span>{t.whatsappContact}</span>
        </a>
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <button 
                className="w-full text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: config.primaryColor }}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl relative">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                      {cartCount}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs opacity-80 block">{t.cartTitle}</span>
                    <span className="font-bold text-sm">
                      {cartTotal} {t.currency}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-sm flex items-center gap-1">
                  {lang === "ar" ? "عرض السلة ←" : "Voir le panier →"}
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className={`w-full max-w-md p-0 flex flex-col ${bgClass}`}>
              <SheetHeader className="p-4 border-b border-gray-200/50 flex flex-row items-center justify-between">
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" style={{ color: config.primaryColor }} />
                  <span>{t.cartTitle}</span>
                </SheetTitle>
              </SheetHeader>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t.emptyCart}</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div 
                      key={item.dish.id} 
                      className={`flex gap-3 p-3 rounded-xl border ${cardBgClass} shadow-xs`}
                    >
                      <img 
                        src={item.dish.image} 
                        alt={lang === "ar" ? item.dish.nameAr : item.dish.nameFr} 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm">
                            {lang === "ar" ? item.dish.nameAr : item.dish.nameFr}
                          </h4>
                          <span className="text-xs font-semibold" style={{ color: config.primaryColor }}>
                            {item.dish.price} {t.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
                            <button 
                              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded"
                              onClick={() => updateQuantity(item.dish.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold px-1">{item.quantity}</span>
                            <button 
                              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded"
                              onClick={() => updateQuantity(item.dish.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button 
                            className="text-red-500 hover:text-red-600 p-1"
                            onClick={() => removeFromCart(item.dish.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-gray-200/50 space-y-4 bg-white/50 backdrop-blur-md">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>{t.total}</span>
                    <span style={{ color: config.primaryColor }}>
                      {cartTotal} {t.currency}
                    </span>
                  </div>
                  <Button 
                    className="w-full py-6 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg transition-all"
                    onClick={sendOrder}
                  >
                    <Phone className="h-5 w-5" />
                    <span>{t.sendOrder}</span>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
