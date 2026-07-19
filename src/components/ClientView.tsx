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
  X,
  Sparkles,
  Utensils,
  Beef,
  Sandwich,
  Coffee,
  AlertTriangle,
  Menu,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ComponentType<any>> = {
  Sparkles,
  Utensils,
  Beef,
  Sandwich,
  Coffee,
};

interface ClientViewProps {
  categories: Category[];
  dishes: Dish[];
  config: RestaurantConfig;
}

export default function ClientView({ categories, dishes, config }: ClientViewProps) {
  const [lang, setLang] = useState<"ar" | "fr">("fr");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const isRtl = lang === "ar";

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

  const regularDishes = useMemo(() => filteredDishes.filter((d) => !d.isPromo), [filteredDishes]);
  const promoDishes = useMemo(() => filteredDishes.filter((d) => d.isPromo), [filteredDishes]);

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
      return prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
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

    let message = template.replace("{items}", itemsText).replace("{total}", totalText);

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${config.whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const t = {
    workingHours: lang === "ar" ? "ساعات العمل" : "Heures d'ouverture",
    searchPlaceholder: lang === "ar" ? "ابحث عن طبقك المفضل..." : "Rechercher un plat...",
    all: lang === "ar" ? "الكل" : "TOUS",
    addToCart: lang === "ar" ? "إضافة" : "Ajouter",
    outOfStock: lang === "ar" ? "نفدت الكمية" : "Épuisé",
    cartTitle: lang === "ar" ? "سلة الطلبات" : "Votre Panier",
    emptyCart: lang === "ar" ? "السلة فارغة حالياً" : "Votre panier est vide",
    total: lang === "ar" ? "المجموع" : "Total",
    sendOrder: lang === "ar" ? "إرسال الطلب عبر واتساب" : "Commander via WhatsApp",
    currency: lang === "ar" ? config.currencyAr : config.currencyFr,
    menuTitle: lang === "ar" ? "قائمة الطعام" : "Notre Menu",
    restaurantName: lang === "ar" ? config.nameAr : config.nameFr,
    subtitle: lang === "ar" ? config.sloganAr : config.sloganFr,
    badges: {
      new: lang === "ar" ? "جديد" : "Nouveau",
      bestSeller: lang === "ar" ? "الأكثر طلباً" : "Populaire",
      vegetarian: lang === "ar" ? "نباتي" : "Végétarien",
      halal: lang === "ar" ? "حلال" : "Halal",
      glutenFree: lang === "ar" ? "خالي من الغلوتين" : "Sans Gluten",
    },
    whatsappContact: lang === "ar" ? "واتساب" : "WhatsApp",
    promoLabel: lang === "ar" ? "عرض خاص" : "Offre Spéciale",
  };

  return (
    <div
      className="min-h-screen font-sans bg-[#0D0D0D] text-white"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left: Logo + Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#C8A24D] flex-shrink-0">
              <img
                src={config.logoUrl}
                alt="Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&h=150&q=80";
                }}
              />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-wide">
                {t.restaurantName}
              </h1>
              <p className="text-[#C8A24D] text-xs font-medium">{t.subtitle}</p>
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Globe className="h-4 w-4 text-[#C8A24D]" />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Menu className="h-4 w-4 text-white/70" />
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-[#C8A24D] flex items-center justify-center hover:bg-[#B8933F] transition-colors relative">
                  <ShoppingBag className="h-4 w-4 text-black" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent
                side={isRtl ? "right" : "left"}
                className="w-full max-w-md p-0 flex flex-col bg-[#121212] border-white/10 text-white"
              >
                <SheetHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                  <SheetTitle className="text-xl font-bold flex items-center gap-2 text-white">
                    <ShoppingBag className="h-5 w-5 text-[#C8A24D]" />
                    <span>{t.cartTitle}</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <ShoppingBag className="h-14 w-14 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">{t.emptyCart}</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.dish.id}
                        className="flex gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.03]"
                      >
                        <img
                          src={item.dish.image}
                          alt={lang === "ar" ? item.dish.nameAr : item.dish.nameFr}
                          className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <h4 className="font-bold text-sm truncate text-white">
                            {lang === "ar" ? item.dish.nameAr : item.dish.nameFr}
                          </h4>
                          <span className="text-xs font-semibold text-[#C8A24D]">
                            {item.dish.price} {t.currency}
                          </span>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2 bg-white/[0.06] rounded-lg p-0.5">
                              <button
                                className="p-1 hover:bg-white/10 rounded transition-colors text-white/70"
                                onClick={() => updateQuantity(item.dish.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-bold px-1 text-white">{item.quantity}</span>
                              <button
                                className="p-1 hover:bg-white/10 rounded transition-colors text-white/70"
                                onClick={() => updateQuantity(item.dish.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <button
                              className="text-red-400 hover:text-red-300 p-1 transition-colors"
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

                {cart.length > 0 && (
                  <div className="p-4 border-t border-white/10 space-y-4 bg-[#121212]">
                    <div className="flex justify-between items-center font-bold text-lg text-white">
                      <span>{t.total}</span>
                      <span className="text-[#C8A24D]">
                        {cartTotal} {t.currency}
                      </span>
                    </div>
                    <Button
                      className="w-full py-6 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg transition-all text-base"
                      onClick={sendOrder}
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>{t.sendOrder}</span>
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ─── Working Hours Bar ─── */}
      <div className="max-w-lg mx-auto px-4 pt-1 pb-3">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Clock className="h-3.5 w-3.5" />
          <span>{lang === "ar" ? config.workingHoursAr : config.workingHoursFr}</span>
        </div>
      </div>

      {/* ─── Menu Section Title ─── */}
      <div className="max-w-lg mx-auto px-4 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h2 className="text-[#C8A24D] text-sm font-semibold tracking-widest uppercase whitespace-nowrap">
            {t.menuTitle}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      {/* ─── Category Tabs ─── */}
      <div className="max-w-lg mx-auto px-4 pb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              selectedCategory === "all"
                ? "bg-[#C8A24D] text-black shadow-lg shadow-[#C8A24D]/20"
                : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {t.all}
          </button>
          {categories.map((cat) => {
            const IconComponent = iconMap[cat.icon] || Utensils;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#C8A24D] text-black shadow-lg shadow-[#C8A24D]/20"
                    : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span>{lang === "ar" ? cat.nameAr : cat.nameFr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Regular Dishes ─── */}
      <div className="max-w-lg mx-auto px-4 space-y-3 pb-6">
        {filteredDishes.length === 0 && (
          <div className="text-center py-16">
            <AlertTriangle className="h-12 w-12 mx-auto text-[#C8A24D]/40 mb-4" />
            <p className="text-white/40 text-lg">
              {lang === "ar"
                ? "لا توجد أطباق تطابق بحثك"
                : "Aucun plat ne correspond"}
            </p>
          </div>
        )}

        {regularDishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            lang={lang}
            currency={t.currency}
            addToCart={addToCart}
            cart={cart}
            updateQuantity={updateQuantity}
          />
        ))}
      </div>

      {/* ─── Promo Dishes ─── */}
      {promoDishes.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pb-24 space-y-3">
          {promoDishes.map((dish) => (
            <PromoCard
              key={dish.id}
              dish={dish}
              lang={lang}
              currency={t.currency}
              addToCart={addToCart}
              cart={cart}
              updateQuantity={updateQuantity}
            />
          ))}
        </div>
      )}

      {/* ─── Floating WhatsApp Button ─── */}
      <a
        href={`https://wa.me/${config.whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/25 transition-all hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-6 w-6 text-white" fill="white" />
      </a>

      {/* ─── Floating Cart Bar ─── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-full text-black rounded-2xl p-4 shadow-2xl flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98] bg-[#C8A24D]">
                <div className="flex items-center gap-3">
                  <div className="bg-black/20 p-2.5 rounded-xl relative">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  </div>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <span className="text-xs opacity-70 block">{t.cartTitle}</span>
                    <span className="font-bold text-base">
                      {cartTotal} {t.currency}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-sm">
                  {lang === "ar" ? "عرض السلة ←" : "Voir panier →"}
                </span>
              </button>
            </SheetTrigger>
          </Sheet>
        </div>
      )}
    </div>
  );
}

/* ─── Dish Card (Horizontal, Circular Image) ─── */
function DishCard({
  dish,
  lang,
  currency,
  addToCart,
  cart,
  updateQuantity,
}: {
  dish: Dish;
  lang: "ar" | "fr";
  currency: string;
  addToCart: (d: Dish) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
}) {
  const cartItem = cart.find((item) => item.dish.id === dish.id);
  const isRtl = lang === "ar";

  return (
    <div className="group flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-200">
      {/* Circular Image */}
      <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10 group-hover:border-[#C8A24D]/40 transition-colors">
        <img
          src={dish.image}
          alt={lang === "ar" ? dish.nameAr : dish.nameFr}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-bold text-base truncate">
                {lang === "ar" ? dish.nameAr : dish.nameFr}
              </h3>
              {dish.isNew && (
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border-0">
                  {lang === "ar" ? "جديد" : "Nouveau"}
                </Badge>
              )}
              {dish.isBestSeller && (
                <Badge className="bg-[#C8A24D]/20 text-[#C8A24D] text-[10px] font-bold px-2 py-0.5 rounded-full border-0">
                  {lang === "ar" ? "الأكثر طلباً" : "Populaire"}
                </Badge>
              )}
            </div>
            <p className="text-white/35 text-xs mt-1 line-clamp-2 leading-relaxed">
              {lang === "ar" ? dish.descriptionAr : dish.descriptionFr}
            </p>
          </div>
          <span className="text-[#C8A24D] font-bold text-base flex-shrink-0">
            {dish.price} {currency}
          </span>
        </div>

        {/* Action */}
        <div className="mt-2">
          {!dish.isAvailable ? (
            <span className="text-xs text-red-400/60 font-medium">{lang === "ar" ? "نفدت الكمية" : "Épuisé"}</span>
          ) : cartItem ? (
            <div className="flex items-center gap-1 bg-white/[0.06] rounded-full p-0.5 w-fit">
              <button
                onClick={() => updateQuantity(dish.id, -1)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-bold text-white px-1 min-w-[20px] text-center">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => updateQuantity(dish.id, 1)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(dish)}
              className="text-xs font-semibold text-[#C8A24D] hover:text-[#D4B35D] transition-colors"
            >
              + {lang === "ar" ? "إضافة" : "Ajouter"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Promo Card (Full Width) ─── */
function PromoCard({
  dish,
  lang,
  currency,
  addToCart,
  cart,
  updateQuantity,
}: {
  dish: Dish;
  lang: "ar" | "fr";
  currency: string;
  addToCart: (d: Dish) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
}) {
  const cartItem = cart.find((item) => item.dish.id === dish.id);
  const promoLabel = lang === "ar" ? (dish.promoLabelAr || "عرض خاص") : (dish.promoLabelFr || "Offre Spéciale");
  const promoText = lang === "ar" ? (dish.promoTextAr || "") : (dish.promoTextFr || "");

  return (
    <div className="rounded-2xl overflow-hidden border border-[#C8A24D]/20 bg-[#1A1A1A]">
      {/* Full-width Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={dish.image}
          alt={lang === "ar" ? dish.nameAr : dish.nameFr}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/40 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-[#C8A24D] text-black border-0 text-xs font-bold px-3 py-1 rounded-full">
            {promoLabel}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-white font-bold text-lg">
              {lang === "ar" ? dish.nameAr : dish.nameFr}
            </h3>
            <p className="text-white/35 text-sm mt-1 leading-relaxed">
              {lang === "ar" ? dish.descriptionAr : dish.descriptionFr}
            </p>
          </div>
          <span className="text-[#C8A24D] font-bold text-lg flex-shrink-0">
            {dish.price} {currency}
          </span>
        </div>

        {/* Action */}
        {dish.isAvailable && !cartItem && (
          <button
            onClick={() => addToCart(dish)}
            className="w-full py-3 rounded-xl bg-[#C8A24D] text-black font-bold text-sm hover:bg-[#D4B35D] transition-colors"
          >
            + {lang === "ar" ? "إضافة للسلة" : "Ajouter au panier"}
          </button>
        )}
        {dish.isAvailable && cartItem && (
          <div className="flex items-center justify-center gap-3 bg-white/[0.04] rounded-xl p-2 w-full">
            <button
              onClick={() => updateQuantity(dish.id, -1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-bold text-white text-base">{cartItem.quantity}</span>
            <button
              onClick={() => updateQuantity(dish.id, 1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
        {!dish.isAvailable && (
          <span className="block text-center text-red-400/60 text-sm font-medium py-2">
            {lang === "ar" ? "نفدت الكمية" : "Épuisé"}
          </span>
        )}

        {/* Promo Text Box */}
        {promoText && (
          <div className="bg-[#C8A24D]/10 border border-[#C8A24D]/30 rounded-xl p-4 text-center">
            <p className="text-[#C8A24D] font-bold text-sm">{promoText}</p>
          </div>
        )}
      </div>
    </div>
  );
}