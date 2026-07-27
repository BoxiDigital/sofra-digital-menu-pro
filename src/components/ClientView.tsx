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
    Maximize2,
    Star,
  } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { submitReview } from "../utils/storage";

/** Lighten a hex color by mixing it with white */
function lightenColor(hex: string, amount: number): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = Math.min(255, Math.round(parseInt(hex.substring(0, 2), 16) + (255 - parseInt(hex.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(hex.substring(2, 4), 16) + (255 - parseInt(hex.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(hex.substring(4, 6), 16) + (255 - parseInt(hex.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

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
  restaurantId: string;
}

export default function ClientView({ categories, dishes, config, restaurantId }: ClientViewProps) {
  const [lang, setLang] = useState<"ar" | "fr">("fr");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [ratingFeedback, setRatingFeedback] = useState("");
    const { toast } = useToast();

  // Apply primaryColor as CSS variable so all child components reflect the theme
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", config.primaryColor);
    root.style.setProperty("--primary-hover", lightenColor(config.primaryColor, 0.15));
    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-hover");
    };
  }, [config.primaryColor]);

  const isRtl = lang === "ar";

  // Filter out unavailable dishes entirely for client view
  const availableDishes = useMemo(() => dishes.filter((d) => d.isAvailable), [dishes]);

  const filteredDishes = useMemo(() => {
    return availableDishes.filter((dish) => {
      const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;
      const name = lang === "ar" ? dish.nameAr : dish.nameFr;
      const desc = lang === "ar" ? dish.descriptionAr : dish.descriptionFr;
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [availableDishes, selectedCategory, searchQuery, lang]);

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
    
      const handleSubmitRating = async (rating: number) => {
          setSelectedRating(rating);
          setRatingSubmitted(true);
          if (rating >= 4) {
            await submitReview({ restaurant_id: restaurantId, rating, feedback: "" });
          }
        };
      
        const handleSubmitFeedback = async () => {
          await submitReview({ restaurant_id: restaurantId, rating: selectedRating, feedback: ratingFeedback });
        toast({
          title: lang === "ar" ? "تم إرسال ملاحظتك" : "Avis envoyé",
          description: lang === "ar" ? "شكراً لك، سنعمل على تحسين تجربتك" : "Merci, nous travaillerons à améliorer votre expérience",
          duration: 3000,
        });
        setRatingModalOpen(false);
        setSelectedRating(0);
        setHoveredRating(0);
        setRatingSubmitted(false);
        setRatingFeedback("");
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
            <header className="sticky top-0 z-40 border-b border-white/5 relative overflow-hidden">
              {/* Cover Background */}
              {config.coverUrl && (
                <>
                  <img
                    src={config.coverUrl}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50" />
                </>
              )}
              <div className={`relative max-w-lg mx-auto px-4 py-5 flex items-center justify-between ${!config.coverUrl ? 'bg-[#0D0D0D]/95 backdrop-blur-sm' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[var(--primary)] flex-shrink-0">
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
              <p className="text-[var(--primary)] text-xs font-medium">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Globe className="h-4 w-4 text-[var(--primary)]" />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Menu className="h-4 w-4 text-white/70" />
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors relative">
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
                    <ShoppingBag className="h-5 w-5 text-[var(--primary)]" />
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
                          <h4 className="font-bold text-sm text-white">
                            {lang === "ar" ? item.dish.nameAr : item.dish.nameFr}
                          </h4>
                          <span className="text-xs font-semibold text-[var(--primary)]">
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
                      <span className="text-[var(--primary)]">
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
          <h2 className="text-[var(--primary)] text-sm font-semibold tracking-widest uppercase whitespace-nowrap">
            {t.menuTitle}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      {/* ─── Category Tabs ─── */}
      <div className="max-w-lg mx-auto px-4 pb-6">
        <div
          className="flex gap-2 overflow-x-auto category-scrollbar"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              selectedCategory === "all"
                ? "bg-[var(--primary)] text-black shadow-lg shadow-[var(--primary)]/20"
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
                    ? "bg-[var(--primary)] text-black shadow-lg shadow-[var(--primary)]/20"
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
      <div className="max-w-lg mx-auto px-4 space-y-4 pb-6">
        {filteredDishes.length === 0 && (
          <div className="text-center py-16">
            <AlertTriangle className="h-12 w-12 mx-auto text-[var(--primary)]/40 mb-4" />
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
            onImageClick={(img) => setLightboxImage(img)}
          />
        ))}
      </div>

      {/* ─── Promo Dishes ─── */}
      {promoDishes.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pb-24 space-y-4">
          {promoDishes.map((dish) => (
            <PromoCard
              key={dish.id}
              dish={dish}
              lang={lang}
              currency={t.currency}
              addToCart={addToCart}
              cart={cart}
              updateQuantity={updateQuantity}
              onImageClick={(img) => setLightboxImage(img)}
            />
          ))}
        </div>
      )}

      {/* ─── Review Collector ─── */}
            <div className="max-w-lg mx-auto px-4 pb-6">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                <p className="text-white/60 text-sm font-medium mb-3">
                  {lang === "ar" ? "هل استمتعت بتجربتك؟" : "Avez-vous apprécié votre expérience ?"}
                </p>
                <button
                  onClick={() => setRatingModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] font-bold text-sm hover:bg-[var(--primary)]/20 transition-all"
                >
                  <Star className="h-4 w-4" />
                  <span>{lang === "ar" ? "قيّم تجربتك" : "Évaluez votre expérience"}</span>
                </button>
              </div>
            </div>
      
            {/* ─── Rating Modal ─── */}
            {ratingModalOpen && (
              <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-5">
                  {!ratingSubmitted ? (
                    <>
                      <div className="text-center space-y-2">
                        <h3 className="text-white font-bold text-lg">
                          {lang === "ar" ? "قيّم تجربتك" : "Évaluez votre expérience"}
                        </h3>
                        <p className="text-white/40 text-sm">
                          {lang === "ar" ? "كيف كانت تجربتك معنا؟" : "Comment s'est passée votre expérience ?"}
                        </p>
                      </div>
                      {/* Stars */}
                                      <div className="flex justify-center gap-2 py-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            onClick={() => handleSubmitRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="transition-transform hover:scale-110"
                                          >
                                            <Star
                                              className={`h-10 w-10 transition-colors ${
                                                star <= (hoveredRating || selectedRating)
                                                  ? "text-yellow-400 fill-yellow-400"
                                                  : "text-white/20"
                                              }`}
                                            />
                                          </button>
                                        ))}
                                      </div>
                    </>
                  ) : (
                    <RatingResult
                      rating={selectedRating}
                      lang={lang}
                      feedback={ratingFeedback}
                      setFeedback={setRatingFeedback}
                      onSubmitFeedback={handleSubmitFeedback}
                      onClose={() => setRatingModalOpen(false)}
                      googleMapsUrl={config.googleMapsUrl}
                    />
                  )}
                  {!ratingSubmitted && (
                    <button
                      onClick={() => { setRatingModalOpen(false); setSelectedRating(0); setHoveredRating(0); }}
                      className="w-full text-white/30 hover:text-white/50 text-sm transition-colors"
                    >
                      {lang === "ar" ? "إلغاء" : "Annuler"}
                    </button>
                  )}
                </div>
              </div>
            )}
      
            {/* ─── Lightbox Modal ─── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={lightboxImage}
            alt="Dish preview"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
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
              <button className="w-full text-black rounded-2xl p-4 shadow-2xl flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98] bg-[var(--primary)]">
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

/* ─── Dish Card (Image Top, Info Below) ─── */
function DishCard({
  dish,
  lang,
  currency,
  addToCart,
  cart,
  updateQuantity,
  onImageClick,
}: {
  dish: Dish;
  lang: "ar" | "fr";
  currency: string;
  addToCart: (d: Dish) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  onImageClick: (img: string) => void;
}) {
  const cartItem = cart.find((item) => item.dish.id === dish.id);

  return (
    <div className="flex gap-3 p-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.10] transition-all duration-200">
      {/* Square Image on the side */}
      <div
        className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group relative"
        onClick={() => onImageClick(dish.image)}
      >
        <img
          src={dish.image}
          alt={lang === "ar" ? dish.nameAr : dish.nameFr}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <Maximize2 className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Info + Actions */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                              <h3 className="text-white font-bold text-sm leading-snug">
                                {lang === "ar" ? dish.nameAr : dish.nameFr}
                              </h3>
                              <p className="text-white/35 text-xs mt-1 line-clamp-2 leading-relaxed">
                                {lang === "ar" ? dish.descriptionAr : dish.descriptionFr}
                              </p>
          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {dish.isNew && (
              <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0 rounded-full border-0">
                {lang === "ar" ? "جديد" : "Nouveau"}
              </Badge>
            )}
            {dish.isBestSeller && (
              <Badge className="bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold px-1.5 py-0 rounded-full border-0">
                {lang === "ar" ? "الأكثر طلباً" : "Populaire"}
              </Badge>
            )}
            {dish.isVegetarian && (
              <Badge className="bg-green-500/15 text-green-400 text-[10px] font-bold px-1.5 py-0 rounded-full border-0">
                {lang === "ar" ? "نباتي" : "Végétarien"}
              </Badge>
            )}
          </div>
        </div>

        {/* Action */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[var(--primary)] font-bold text-sm">
                    {dish.price} {currency}
                  </span>
                  {cartItem ? (
                    <div className="flex items-center gap-1 bg-white/[0.06] rounded-full p-0.5">
                      <button
                        onClick={() => updateQuantity(dish.id, -1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold text-white px-1 min-w-[18px] text-center">
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
                      className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                    >
                      + {lang === "ar" ? "إضافة" : "Ajouter"}
                    </button>
                  )}
                </div>
      </div>
    </div>
  );
}

/* ─── Promo Card ─── */
function PromoCard({
  dish,
  lang,
  currency,
  addToCart,
  cart,
  updateQuantity,
  onImageClick,
}: {
  dish: Dish;
  lang: "ar" | "fr";
  currency: string;
  addToCart: (d: Dish) => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  onImageClick: (img: string) => void;
}) {
  const cartItem = cart.find((item) => item.dish.id === dish.id);
  const promoLabel = lang === "ar" ? (dish.promoLabelAr || "عرض خاص") : (dish.promoLabelFr || "Offre Spéciale");
  const promoText = lang === "ar" ? (dish.promoTextAr || "") : (dish.promoTextFr || "");

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--primary)]/20 bg-[#1A1A1A]">
      {/* Image */}
      <div
        className="relative h-52 w-full overflow-hidden cursor-pointer group"
        onClick={() => onImageClick(dish.image)}
      >
        <img
          src={dish.image}
          alt={lang === "ar" ? dish.nameAr : dish.nameFr}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/30 to-transparent" />
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="absolute top-3 left-3">
          <Badge className="bg-[var(--primary)] text-black border-0 text-xs font-bold px-3 py-1 rounded-full">
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
          <span className="text-[var(--primary)] font-bold text-lg flex-shrink-0">
            {dish.price} {currency}
          </span>
        </div>

        {!cartItem ? (
          <button
            onClick={() => addToCart(dish)}
            className="w-full py-3 rounded-xl bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary-hover)] transition-colors active:scale-[0.98]"
          >
            + {lang === "ar" ? "إضافة للسلة" : "Ajouter au panier"}
          </button>
        ) : (
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

        {promoText && (
                  <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-xl p-4 text-center">
                    <p className="text-[var(--primary)] font-bold text-sm">{promoText}</p>
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        /* ─── Rating Result (after star selection) ─── */
        function RatingResult({
          rating,
          lang,
          feedback,
          setFeedback,
          onSubmitFeedback,
          onClose,
          googleMapsUrl,
        }: {
          rating: number;
          lang: "ar" | "fr";
          feedback: string;
          setFeedback: (v: string) => void;
          onSubmitFeedback: () => void;
          onClose: () => void;
          googleMapsUrl?: string;
        }) {
          const isPositive = rating >= 4;
        
          if (isPositive && googleMapsUrl) {
            return (
              <div className="text-center space-y-4">
                <div className="text-5xl">🌟</div>
                <h3 className="text-white font-bold text-lg">
                  {lang === "ar" ? "شكراً لتقييمك!" : "Merci pour votre avis !"}
                </h3>
                <p className="text-white/50 text-sm">
                  {lang === "ar"
                    ? "يسعدنا تقييمك الإيجابي! هل تود مشاركته على Google Maps؟"
                    : "Nous sommes ravis ! Voulez-vous partager votre avis sur Google Maps ?"}
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{lang === "ar" ? "تقييم على Google" : "Évaluer sur Google"}</span>
                </a>
                <button
                  onClick={onClose}
                  className="block w-full text-white/30 hover:text-white/50 text-sm transition-colors mt-3"
                >
                  {lang === "ar" ? "إغلاق" : "Fermer"}
                </button>
              </div>
            );
          }
        
          if (isPositive) {
            return (
              <div className="text-center space-y-4">
                <div className="text-5xl">🌟</div>
                <h3 className="text-white font-bold text-lg">
                  {lang === "ar" ? "شكراً جزيلاً!" : "Merci beaucoup !"}
                </h3>
                <p className="text-white/50 text-sm">
                  {lang === "ar" ? "تقييمك يهمنا ويساعدنا على التحسين" : "Votre avis compte et nous aide à nous améliorer"}
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-sm"
                >
                  {lang === "ar" ? "تم" : "OK"}
                </button>
              </div>
            );
          }
        
          return (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl">😔</div>
                <h3 className="text-white font-bold text-lg mt-2">
                  {lang === "ar" ? "نأسف لعدم رضاك" : "Nous sommes désolés"}
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  {lang === "ar"
                    ? "أخبرنا بما لم يعجبك لنساعد في تحسين التجربة"
                    : "Dites-nous ce qui n'a pas été à la hauteur"}
                </p>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={lang === "ar" ? "اكتب ملاحظتك هنا..." : "Écrivez votre remarque ici..."}
                className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 rounded-xl p-4 text-sm min-h-[100px] resize-none focus:border-[var(--primary)]/40 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={onSubmitFeedback}
                  disabled={!feedback.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {lang === "ar" ? "إرسال الملاحظة" : "Envoyer"}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-sm"
                >
                  {lang === "ar" ? "إلغاء" : "Annuler"}
                </button>
              </div>
            </div>
          );
        }