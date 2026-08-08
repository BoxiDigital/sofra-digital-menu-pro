import { useState, useEffect, useCallback, useMemo } from "react";
import { Star, MessageCircle, ShoppingBag, X, Plus, Minus, Maximize2, MapPin, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dish, Category, RestaurantConfig, CartItem } from "../types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UpsellModal from "./UpsellModal";

interface ClientViewProps {
  categories: Category[];
  dishes: Dish[];
  config: RestaurantConfig;
  restaurantId: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

export default function ClientView({ categories, dishes, config, restaurantId }: ClientViewProps) {
  const { toast } = useToast();
  const [lang, setLang] = useState<"ar" | "fr">("ar");
  const isRtl = lang === "ar";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Upsell state
  const [upsellDish, setUpsellDish] = useState<Dish | null>(null);
  const [upsellItems, setUpsellItems] = useState<Dish[]>([]);

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
      const root = document.documentElement;
      const { r, g, b } = hexToRgb(config.primaryColor);
      root.style.setProperty("--primary", config.primaryColor);
      root.style.setProperty("--primary-r", String(r));
      root.style.setProperty("--primary-g", String(g));
      root.style.setProperty("--primary-b", String(b));
      root.style.setProperty("--primary-hover", lightenColor(config.primaryColor, 0.15));
    }, [config.primaryColor]);

  const t = useMemo(() => ({
    cartTitle: lang === "ar" ? "سلة الطلبات" : "Mon panier",
    currency: lang === "ar" ? config.currencyAr : config.currencyFr,
    workingHours: lang === "ar" ? config.workingHoursAr : config.workingHoursFr,
    slogan: lang === "ar" ? config.sloganAr : config.sloganFr,
    viewOrder: lang === "ar" ? "عرض الطلب" : "Voir commande",
    total: lang === "ar" ? "المجموع" : "Total",
    sendWhatsApp: lang === "ar" ? "إرسال الطلب عبر واتساب" : "Envoyer la commande via WhatsApp",
    emptyCart: lang === "ar" ? "سلتك فارغة" : "Votre panier est vide",
    emptyCartDesc: lang === "ar" ? "أضف أطباقاً من القائمة للبدء" : "Ajoutez des plats du menu pour commencer",
    workingTime: lang === "ar" ? "أوقات العمل" : "Horaires",
    location: lang === "ar" ? "موقعنا" : "Emplacement",
    allCategories: lang === "ar" ? "الكل" : "Tout",
    noDishes: lang === "ar" ? "لا توجد أطباق في هذه الفئة" : "Aucun plat dans cette catégorie",
  }), [lang, config]);

  const filteredDishes = useMemo(() => {
    const available = dishes.filter((d) => d.isAvailable);
    if (!selectedCategory) return available;
    return available.filter((d) => d.category === selectedCategory);
  }, [dishes, selectedCategory]);

  const promoDishes = useMemo(() => filteredDishes.filter((d) => d.isPromo), [filteredDishes]);
  const normalDishes = useMemo(() => filteredDishes.filter((d) => !d.isPromo), [filteredDishes]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0), [cart]);

  const addToCart = useCallback((dish: Dish) => {
    // Check if dish has upsell suggestions
    const upsellIds = dish.upsellIds || [];
    if (upsellIds.length > 0) {
      const upsellDishes = dishes.filter(d => upsellIds.includes(d.id) && d.isAvailable);
      if (upsellDishes.length > 0) {
        setUpsellDish(dish);
        setUpsellItems(upsellDishes);
        return;
      }
    }
    // No upsells, add directly
    addToCartDirect(dish);
  }, [dishes]);

  const addToCartDirect = useCallback((dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  }, []);

  const handleUpsellAddToCart = useCallback((dish: Dish, selectedUpsells: Dish[]) => {
    addToCartDirect(dish);
    selectedUpsells.forEach(u => addToCartDirect(u));
    setUpsellDish(null);
    setUpsellItems([]);
  }, [addToCartDirect]);

  const handleUpsellClose = useCallback(() => {
    // Add just the main dish when user skips
    if (upsellDish) {
      addToCartDirect(upsellDish);
    }
    setUpsellDish(null);
    setUpsellItems([]);
  }, [upsellDish, addToCartDirect]);

  const updateQuantity = useCallback((dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.dish.id === dishId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const generateWhatsAppMessage = useCallback(() => {
    const itemsText = cart
      .map((item) => {
        const name = lang === "ar" ? item.dish.nameAr : item.dish.nameFr;
        return `${name} ×${item.quantity} - ${item.dish.price * item.quantity} ${t.currency}`;
      })
      .join("\n");

    const template = lang === "ar" ? config.whatsappMessageAr : config.whatsappMessageFr;
    return template
      .replace("{items}", itemsText)
      .replace("{total}", `${cartTotal} ${t.currency}`);
  }, [cart, cartTotal, lang, config, t.currency]);

  const whatsappUrl = useMemo(() => {
    const message = encodeURIComponent(generateWhatsAppMessage());
    return `https://wa.me/${config.whatsappNumber}?text=${message}`;
  }, [generateWhatsAppMessage, config.whatsappNumber]);

  const handleRatingClick = useCallback((rating: number) => {
      setSelectedRating(rating);
      setHoveredRating(rating);
      if (rating >= 4) {
        // 4-5 stars: redirect to Google Maps
        setRatingModalOpen(false);
        if (config.googleMapsUrl) {
          window.open(config.googleMapsUrl, "_blank");
        }
        toast({
          title: lang === "ar" ? "شكراً لتقييمك!" : "Merci pour votre avis !",
          description: lang === "ar"
            ? "نقدر وقتك ونعدك بتقديم الأفضل دائماً"
            : "Nous apprécions votre temps et promettons de toujours offrir le meilleur",
        });
        setTimeout(() => {
          setSelectedRating(0);
          setHoveredRating(0);
        }, 500);
      } else {
        // 1-3 stars: show feedback form
        setShowFeedback(true);
      }
    }, [config.googleMapsUrl, lang, toast]);
  
    const handleSubmitFeedback = useCallback(async () => {
      if (!feedbackText.trim()) return;
      setSubmittingReview(true);
      try {
        const { error } = await supabase
          .from("reviews")
          .insert({
            restaurant_id: restaurantId,
            rating: selectedRating,
            feedback: feedbackText.trim(),
          });
        if (error) throw error;
        toast({
          title: lang === "ar" ? "تم الإرسال" : "Envoyé !",
          description: lang === "ar"
            ? "شكراً لملاحظاتك، سنعمل على التحسين"
            : "Merci pour votre retour, nous allons nous améliorer",
        });
        setRatingModalOpen(false);
        setShowFeedback(false);
        setFeedbackText("");
        setSelectedRating(0);
        setHoveredRating(0);
      } catch (err) {
        toast({
          title: lang === "ar" ? "خطأ" : "Erreur",
          description: lang === "ar"
            ? "حدث خطأ، حاول مرة أخرى"
            : "Une erreur est survenue, réessayez",
          variant: "destructive",
        });
        console.error("Failed to submit review:", err);
      } finally {
        setSubmittingReview(false);
      }
    }, [feedbackText, restaurantId, selectedRating, lang, toast]);
  
    const handleCloseRatingModal = useCallback(() => {
      setRatingModalOpen(false);
      setSelectedRating(0);
      setHoveredRating(0);
      setShowFeedback(false);
      setFeedbackText("");
    }, []);

  const scrollToCategory = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
  }, []);

  const backgroundColorMap = {
    dark: "bg-[#0D0D0D]",
    cream: "bg-[#FDF6EE]",
    white: "bg-white",
  };
  const textColorMap = {
    dark: "text-white",
    cream: "text-[#2D2D2D]",
    white: "text-[#1A1A1A]",
  };
  const mutedTextMap = {
    dark: "text-white/50",
    cream: "text-[#2D2D2D]/50",
    white: "text-[#1A1A1A]/50",
  };
  const cardBgMap = {
    dark: "bg-white/[0.03] border-white/[0.06]",
    cream: "bg-black/[0.02] border-black/[0.04]",
    white: "bg-black/[0.01] border-black/[0.04]",
  };
  const pillBgMap = {
    dark: "bg-white/[0.05] border-white/[0.08]",
    cream: "bg-black/[0.03] border-black/[0.05]",
    white: "bg-black/[0.03] border-black/[0.05]",
  };

  const bg = backgroundColorMap[config.backgroundColor] || backgroundColorMap.dark;
  const textColor = textColorMap[config.backgroundColor] || textColorMap.dark;
  const mutedText = mutedTextMap[config.backgroundColor] || mutedTextMap.dark;
  const cardBg = cardBgMap[config.backgroundColor] || cardBgMap.dark;
  const pillBg = pillBgMap[config.backgroundColor] || pillBgMap.dark;
  const isDark = config.backgroundColor === "dark";

  return (
      <div className={`min-h-screen ${bg} ${textColor} transition-colors duration-500 relative`}>
        {/* Upsell Modal */}
        {upsellDish && (
          <UpsellModal
            lang={lang}
            currency={t.currency}
            dish={upsellDish}
            upsells={upsellItems}
            onClose={handleUpsellClose}
            onAddToCart={handleUpsellAddToCart}
          />
        )}

        {/* ─── Atmospheric Lighting Effects ─── */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                  {/* Top warm glow — animated float */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[150px] animate-glow-pulse" style={{ background: `radial-gradient(ellipse at center, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.25) 0%, transparent 70%)` }} />
                  {/* Mid-left floating orb */}
                  <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full blur-[120px] animate-float-slower opacity-15" style={{ background: `radial-gradient(circle, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.2) 0%, transparent 70%)` }} />
                  {/* Bottom-right floating orb */}
                  <div className="absolute bottom-0 -right-20 w-[500px] h-[350px] rounded-full blur-[130px] animate-float-wide opacity-10" style={{ background: `radial-gradient(circle, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.18) 0%, transparent 70%)` }} />
                  {/* Subtle bottom ambient */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] animate-glow-pulse opacity-10" style={{ background: `radial-gradient(ellipse at center, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.15) 0%, transparent 70%)`, animationDelay: "1.5s" }} />
                </div>
  
        {/* ─── Header ─── */}
        <header className="relative overflow-hidden z-10">
          {config.coverUrl ? (
            <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
              <img
                src={config.coverUrl}
                alt={lang === "ar" ? config.nameAr : config.nameFr}
                className="w-full h-full object-cover scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Cinematic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 via-40% to-[#080808]/20" />
              {/* Warm accent gradient on top of image */}
              <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${config.primaryColor}20 0%, transparent 50%, ${config.primaryColor}10 100%)` }} />
              {config.logoUrl && (
                <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-sm">
                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20 flex gap-1 bg-black/30 backdrop-blur-xl border border-white/[0.06] rounded-full p-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <button
                  onClick={() => setLang("ar")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    lang === "ar"
                      ? "bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(200,162,77,0.3)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLang("fr")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    lang === "fr"
                      ? "bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(200,162,77,0.3)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  FR
                </button>
              </div>
            </div>
          ) : (
            <div className="relative h-48 sm:h-56 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0D0D0D] to-[#0A0A0A]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[100px] opacity-20" style={{ background: `radial-gradient(ellipse at center, ${config.primaryColor}40 0%, transparent 70%)` }} />
              {config.logoUrl && (
                <div className="relative z-10 w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-sm">
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex gap-1 bg-black/30 backdrop-blur-xl border border-white/[0.06] rounded-full p-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <button
                  onClick={() => setLang("ar")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    lang === "ar"
                      ? "bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(200,162,77,0.3)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLang("fr")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    lang === "fr"
                      ? "bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(200,162,77,0.3)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  FR
                </button>
              </div>
            </div>
          )}
  
          <div className={`px-4 sm:px-6 pb-8 ${config.coverUrl ? "-mt-20 relative z-10" : "pt-6"}`}>
            <div className="max-w-lg mx-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
                {lang === "ar" ? config.nameAr : config.nameFr}
              </h1>
              <p className="text-white/50 text-sm mt-2 font-medium">{t.slogan}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {config.workingHoursAr && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-white/50 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {t.workingHours}
                  </span>
                )}
                {config.googleMapsUrl && (
                  <a
                    href={config.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-white/50 hover:text-white/70 transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {t.location}
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

      {/* ─── Category Pills ─── */}
            <div className="px-4 sm:px-6 pb-5 relative z-10">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2.5 overflow-x-auto category-scrollbar pb-2">
                  <button
                    onClick={() => scrollToCategory(null)}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 backdrop-blur-xl border shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${
                                          selectedCategory === null
                                            ? "bg-[var(--primary)] text-black border-[var(--primary)] shadow-[0_0_30px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.35)]"
                                            : "bg-white/[0.03] border-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.10]"
                                        }`}
                  >
                    {t.allCategories}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 backdrop-blur-xl border shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${
                                              selectedCategory === cat.id
                                                ? "bg-[var(--primary)] text-black border-[var(--primary)] shadow-[0_0_30px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.35)]"
                                                : "bg-white/[0.03] border-white/[0.05] text-white/50 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.10]"
                                            }`}
                    >
                      {lang === "ar" ? cat.nameAr : cat.nameFr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

      {/* ─── Dishes Grid ─── */}
                        <div className="max-w-lg mx-auto px-4 pb-4 space-y-4 relative z-10 stagger-entrance">
        {promoDishes.map((dish) => (
          <PromoCard
            key={dish.id}
            dish={dish}
            lang={lang}
            currency={t.currency}
            addToCart={addToCart}
            cart={cart}
            updateQuantity={updateQuantity}
            onImageClick={setLightboxImage}
          />
        ))}

        {normalDishes.length === 0 && promoDishes.length === 0 ? (
          <div className="text-center py-20">
            <p className={`${mutedText} text-sm`}>{t.noDishes}</p>
          </div>
        ) : (
          normalDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              lang={lang}
              currency={t.currency}
              addToCart={addToCart}
              cart={cart}
              updateQuantity={updateQuantity}
              onImageClick={setLightboxImage}
            />
          ))
        )}
      </div>

      {/* ─── Review Collector ─── */}
            <div className="relative z-10">
              <div className="border-y border-white/[0.04] bg-white/[0.01] backdrop-blur-2xl py-8 px-4 text-center shadow-[0_0_60px_rgba(0,0,0,0.4)]">
                <p className="text-white/40 text-sm font-medium mb-4 tracking-wide">
                  {lang === "ar" ? "هل استمتعت بتجربتك؟" : "Avez-vous apprécié votre expérience ?"}
                </p>
                <button
                  onClick={() => setRatingModalOpen(true)}
                  className="inline-flex items-center gap-3 px-16 py-7 rounded-full backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] text-[var(--primary)] font-bold text-2xl hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_30px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.15)]"
                >
                  <Star className="h-7 w-7" />
                  <span>{lang === "ar" ? "قيّم تجربتك" : "Évaluez votre expérience"}</span>
                </button>
              </div>
            </div>
      
            {/* ─── Footer ─── */}
            <div className="text-center py-6 px-4 relative z-10">
              <p className="text-white/10 text-[11px] tracking-wider font-medium">
                {lang === "ar"
                  ? `© ${new Date().getFullYear()} ${config.nameAr} — جميع الحقوق محفوظة`
                  : `© ${new Date().getFullYear()} ${config.nameFr} — Tous droits réservés`}
              </p>
            </div>
      
            {/* ─── Rating Modal ─── */}
                  {ratingModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                      <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] rounded-[1.5rem] p-7 w-full max-w-sm space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_40px_rgba(200,162,77,0.04)]">
                  {!showFeedback ? (
                    <>
                      <div className="text-center space-y-2">
                        <h3 className="text-white font-bold text-lg tracking-tight">
                                                {lang === "ar" ? "قيّم تجربتك" : "Évaluez votre expérience"}
                                              </h3>
                                              <p className="text-white/25 text-sm font-medium">
                                                {lang === "ar"
                                                  ? "اختر تقييمك وسنوجهك لصفحة التقييم"
                                                  : "Choisissez votre note, vous serez redirigé"}
                                              </p>
                      </div>
                      <div className="flex justify-center gap-2 py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                                                      key={star}
                                                      onClick={() => handleRatingClick(star)}
                                                      onMouseEnter={() => setHoveredRating(star)}
                                                      onMouseLeave={() => setHoveredRating(0)}
                                                      className="transition-all duration-300 hover:scale-125 hover:drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]"
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
                      <button
                                          onClick={handleCloseRatingModal}
                                          className="w-full text-white/20 hover:text-white/40 text-sm transition-all duration-300 py-2 font-medium"
                                        >
                                          {lang === "ar" ? "إلغاء" : "Annuler"}
                                        </button>
                    </>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <div className="flex justify-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-6 w-6 ${
                                star <= selectedRating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-white/20"
                              }`}
                            />
                          ))}
                        </div>
                        <h3 className="text-white font-bold text-lg">
                          {lang === "ar" ? "نأسف لسماع ذلك" : "Nous sommes désolés"}
                        </h3>
                        <p className="text-white/40 text-sm">
                          {lang === "ar"
                            ? "أخبرنا بما لم يعجبك لنساعد في تحسين تجربتك"
                            : "Dites-nous ce qui n'a pas été à la hauteur pour améliorer votre expérience"}
                        </p>
                      </div>
                      <textarea
                                          value={feedbackText}
                                          onChange={(e) => setFeedbackText(e.target.value)}
                                          placeholder={lang === "ar" ? "اكتب ملاحظاتك هنا..." : "Écrivez vos remarques ici..."}
                                          className="w-full h-28 bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05] placeholder:text-white/15 transition-all duration-300"
                                          autoFocus
                                        />
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowFeedback(false);
                            setSelectedRating(0);
                            setHoveredRating(0);
                            setFeedbackText("");
                          }}
                          className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-white/50 text-sm font-medium hover:bg-white/[0.04] transition-colors"
                        >
                          {lang === "ar" ? "رجوع" : "Retour"}
                        </button>
                        <button
                          onClick={handleSubmitFeedback}
                          disabled={!feedbackText.trim() || submittingReview}
                          className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary-hover)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {submittingReview
                            ? (lang === "ar" ? "جاري الإرسال..." : "Envoi...")
                            : (lang === "ar" ? "إرسال" : "Envoyer")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

      {/* ─── Lightbox Modal ─── */}
            {lightboxImage && (
              <div
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                onClick={() => setLightboxImage(null)}
              >
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-300 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                >
                  <X className="h-5 w-5 text-white/70" />
                </button>
                <img
                  src={lightboxImage}
                  alt="Dish preview"
                  className="max-w-full max-h-[85vh] object-contain rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

      {/* ─── Floating WhatsApp Button ─── */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`fixed bottom-6 z-50 w-14 h-14 bg-emerald-500 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.25)] transition-all duration-500 hover:scale-110 active:scale-95 hover:shadow-[0_12px_40px_rgba(16,185,129,0.35)] hover:rounded-[1.25rem] border border-emerald-400/20 ${
                cartCount > 0 ? "right-24" : "right-6"
              }`}
            >
              <MessageCircle className="h-6 w-6 text-white drop-shadow-lg" fill="white" />
            </a>

      {/* ─── Floating Cart Bar ─── */}
            {cartCount > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="w-full text-black rounded-[1rem] p-4 flex items-center justify-between transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] bg-[var(--primary)] animate-cta-pulse ripple-container">
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
                  {t.viewOrder}
                </span>
              </button>
            </SheetTrigger>

            <SheetContent side="bottom" className="bg-[#080808]/95 backdrop-blur-3xl border-t border-white/[0.05] text-white rounded-t-[1.5rem] max-h-[70vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.6)]" dir={isRtl ? "rtl" : "ltr"}>
              <SheetHeader>
                <SheetTitle className="text-white text-center text-lg font-bold">{t.cartTitle}</SheetTitle>
              </SheetHeader>

              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                                  <ShoppingBag className="h-14 w-14 mx-auto text-white/[0.04]" />
                                  <p className="text-white/25 font-medium">{t.emptyCart}</p>
                                  <p className="text-white/10 text-sm font-medium">{t.emptyCartDesc}</p>
                                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {cart.map((item) => (
                    <div key={item.dish.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] backdrop-blur-md border border-white/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.dish.image} alt={lang === "ar" ? item.dish.nameAr : item.dish.nameFr} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-bold truncate">
                          {lang === "ar" ? item.dish.nameAr : item.dish.nameFr}
                        </h4>
                        <span className="text-[var(--primary)] text-xs font-bold">
                          {item.dish.price} {t.currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/[0.04] backdrop-blur-md rounded-full p-0.5 border border-white/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                        <button
                          onClick={() => updateQuantity(item.dish.id, -1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1 min-w-[18px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.dish.id, 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--primary)]/5 backdrop-blur-md border border-[var(--primary)]/15 shadow-[0_0_20px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.05)]">
                    <span className="text-white font-bold">{t.total}</span>
                    <span className="text-[var(--primary)] font-bold text-lg">
                      {cartTotal} {t.currency}
                    </span>
                  </div>

                  <a
                                      href={whatsappUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all duration-300 mt-4 shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.35)]"
                                      onClick={clearCart}
                                    >
                    <MessageCircle className="h-5 w-5" fill="white" />
                    <span>{t.sendWhatsApp}</span>
                  </a>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}

/* ─── Dish Card ─── */
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
      <div className="flex gap-4 p-3 rounded-[1.25rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-2xl hover:border-[rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.12)] hover:bg-white/[0.04] transition-all duration-500 shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.06)] group/card">
        <div
          className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer relative shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          onClick={() => onImageClick(dish.image)}
        >
          <img
            src={dish.image}
            alt={lang === "ar" ? dish.nameAr : dish.nameFr}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
            }}
          />
          {/* Subtle inner glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px]">
            <Maximize2 className="h-4 w-4 text-white drop-shadow-lg" />
          </div>
        </div>
  
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-white font-bold text-sm leading-snug tracking-tight">
              {lang === "ar" ? dish.nameAr : dish.nameFr}
            </h3>
            <p className="text-white/30 text-xs mt-1 line-clamp-2 leading-relaxed font-medium">
              {lang === "ar" ? dish.descriptionAr : dish.descriptionFr}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {dish.isNew && (
                <Badge className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/10 backdrop-blur-sm">
                  {lang === "ar" ? "جديد" : "Nouveau"}
                </Badge>
              )}
              {dish.isBestSeller && (
                <Badge className="bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--primary)]/20 backdrop-blur-sm">
                  {lang === "ar" ? "الأكثر طلباً" : "Populaire"}
                </Badge>
              )}
              {dish.isVegetarian && (
                <Badge className="bg-green-500/10 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-400/10 backdrop-blur-sm">
                  {lang === "ar" ? "نباتي" : "Végétarien"}
                </Badge>
              )}
            </div>
          </div>
  
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[var(--primary)] font-bold text-sm drop-shadow-[0_0_8px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.2)]">
              {dish.price} {currency}
            </span>
            {cartItem ? (
              <div className="flex items-center gap-1 bg-white/[0.05] backdrop-blur-md rounded-full p-0.5 border border-white/[0.06] shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                <button
                  onClick={() => updateQuantity(dish.id, -1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-xs font-bold text-white px-1 min-w-[18px] text-center">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(dish.id, 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(dish)}
                className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.3)]"
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
      <div className="rounded-[1.5rem] overflow-hidden border border-white/[0.05] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] group/promo hover:shadow-[0_12px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.1)] hover:border-[rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.2)] transition-all duration-700">
        <div
          className="relative h-60 w-full overflow-hidden cursor-pointer"
          onClick={() => onImageClick(dish.image)}
        >
          <img
            src={dish.image}
            alt={lang === "ar" ? dish.nameAr : dish.nameFr}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover/promo:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
            }}
          />
          {/* Cinematic depth overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 via-50% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/5 via-transparent to-transparent opacity-0 group-hover/promo:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/promo:opacity-100 transition-all duration-500 border border-white/[0.06]">
            <Maximize2 className="h-4 w-4 text-white" />
          </div>
          <div className="absolute top-4 left-4">
            <Badge className="bg-[var(--primary)] text-black border-0 text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_4px_20px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.3)] backdrop-blur-sm">
              {promoLabel}
            </Badge>
          </div>
        </div>
  
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight">
                {lang === "ar" ? dish.nameAr : dish.nameFr}
              </h3>
              <p className="text-white/30 text-sm mt-1.5 leading-relaxed font-medium">
                {lang === "ar" ? dish.descriptionAr : dish.descriptionFr}
              </p>
            </div>
            <span className="text-[var(--primary)] font-bold text-lg flex-shrink-0 drop-shadow-[0_0_10px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.2)]">
              {dish.price} {currency}
            </span>
          </div>
  
          {!cartItem ? (
            <button
              onClick={() => addToCart(dish)}
              className="w-full py-3.5 rounded-xl bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary-hover)] transition-all duration-300 active:scale-[0.97] shadow-[0_4px_20px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.25)] hover:shadow-[0_6px_30px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.4)] ripple-container"
            >
              + {lang === "ar" ? "إضافة للسلة" : "Ajouter au panier"}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-4 bg-white/[0.04] backdrop-blur-md rounded-xl p-2.5 w-full border border-white/[0.05] shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
              <button
                onClick={() => updateQuantity(dish.id, -1)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-bold text-white text-base">{cartItem.quantity}</span>
              <button
                onClick={() => updateQuantity(dish.id, 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
  
          {promoText && (
            <div className="bg-[var(--primary)]/5 backdrop-blur-md border border-[var(--primary)]/20 rounded-xl p-4 text-center shadow-[0_0_20px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.06)]">
              <p className="text-[var(--primary)] font-bold text-sm">{promoText}</p>
            </div>
          )}
        </div>
      </div>
    );
}