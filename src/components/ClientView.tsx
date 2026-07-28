import { useState, useEffect, useCallback, useMemo } from "react";
import { Star, MessageCircle, ShoppingBag, X, Plus, Minus, Maximize2, MapPin, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dish, Category, RestaurantConfig, CartItem } from "../types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientViewProps {
  categories: Category[];
  dishes: Dish[];
  config: RestaurantConfig;
  restaurantId: string;
}

function lightenColor(hex: string, amount: number): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = Math.min(255, Math.round(parseInt(hex.substring(0, 2), 16) + (255 - parseInt(hex.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(hex.substring(2, 4), 16) + (255 - parseInt(hex.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(hex.substring(4, 6), 16) + (255 - parseInt(hex.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function ClientView({ categories, dishes, config, restaurantId }: ClientViewProps) {
  const { toast } = useToast();
  const [lang, setLang] = useState<"ar" | "fr">("ar");
  const isRtl = lang === "ar";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", config.primaryColor);
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
    <div className={`min-h-screen ${bg} ${textColor} transition-colors duration-300`}>
      {/* ─── Header ─── */}
      <header className="relative overflow-hidden">
        {config.coverUrl ? (
          <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden">
            <img
              src={config.coverUrl}
              alt={lang === "ar" ? config.nameAr : config.nameFr}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            {config.logoUrl && (
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-1 bg-black/40 backdrop-blur-sm rounded-full p-0.5">
              <button
                onClick={() => setLang("ar")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  lang === "ar"
                    ? "bg-[var(--primary)] text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => setLang("fr")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  lang === "fr"
                    ? "bg-[var(--primary)] text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                FR
              </button>
            </div>
          </div>
        ) : (
          <div className="relative h-40 sm:h-48 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center">
            {config.logoUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-1 bg-black/40 backdrop-blur-sm rounded-full p-0.5">
              <button
                onClick={() => setLang("ar")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  lang === "ar"
                    ? "bg-[var(--primary)] text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => setLang("fr")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  lang === "fr"
                    ? "bg-[var(--primary)] text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                FR
              </button>
            </div>
          </div>
        )}

        <div className={`px-4 sm:px-6 pb-6 ${config.coverUrl ? "-mt-16 relative z-10" : "pt-4"}`}>
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {lang === "ar" ? config.nameAr : config.nameFr}
            </h1>
            <p className="text-white/60 text-sm mt-1">{t.slogan}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {config.workingHoursAr && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] rounded-full text-xs text-white/60">
                  <Clock className="h-3.5 w-3.5 text-[var(--primary)]" />
                  {t.workingHours}
                </span>
              )}
              {config.googleMapsUrl && (
                <a
                  href={config.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] rounded-full text-xs text-white/60 hover:text-white/80 transition-colors"
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
      <div className={`px-4 sm:px-6 pb-4 ${isDark ? "" : "bg-white border-b border-black/5"}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 overflow-x-auto category-scrollbar pb-2">
            <button
              onClick={() => scrollToCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                selectedCategory === null
                  ? "bg-[var(--primary)] text-black"
                  : `${pillBg} ${isDark ? "text-white/60 hover:text-white hover:bg-white/[0.08]" : "text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-black/[0.06]"}`
              }`}
            >
              {t.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[var(--primary)] text-black"
                    : `${pillBg} ${isDark ? "text-white/60 hover:text-white hover:bg-white/[0.08]" : "text-[#2D2D2D]/60 hover:text-[#2D2D2D] hover:bg-black/[0.06]"}`
                }`}
              >
                {lang === "ar" ? cat.nameAr : cat.nameFr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Dishes Grid ─── */}
            <div className="max-w-lg mx-auto px-4 pb-4 space-y-4">
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
            <div className="px-0 pb-0">
              <div className="rounded-none border-y border-white/[0.06] bg-white/[0.03] py-6 px-4 text-center">
                <p className="text-white/60 text-sm font-medium mb-3">
                  {lang === "ar" ? "هل استمتعت بتجربتك؟" : "Avez-vous apprécié votre expérience ?"}
                </p>
                <button
                  onClick={() => setRatingModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] font-bold text-sm hover:bg-[var(--primary)]/20 transition-all"
                >
            <Star className="h-4 w-4" />
            <span>{lang === "ar" ? "قيّم تجربتك" : "Évaluez votre expérience"}</span>
          </button>
        </div>
      </div>
      
            {/* ─── Footer ─── */}
            <div className="text-center py-4 px-4">
              <p className="text-white/15 text-[11px]">
                {lang === "ar"
                  ? `جميع الحقوق محفوظة © ${config.nameAr} ${new Date().getFullYear()}`
                  : `Tous droits réservés © ${config.nameFr} ${new Date().getFullYear()}`}
              </p>
            </div>
      
            {/* ─── Rating Modal ─── */}
            {ratingModalOpen && (
              <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-5">
                  {!showFeedback ? (
                    <>
                      <div className="text-center space-y-2">
                        <h3 className="text-white font-bold text-lg">
                          {lang === "ar" ? "قيّم تجربتك" : "Évaluez votre expérience"}
                        </h3>
                        <p className="text-white/40 text-sm">
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
                      <button
                        onClick={handleCloseRatingModal}
                        className="w-full text-white/30 hover:text-white/50 text-sm transition-colors"
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
                        className="w-full h-28 bg-white/[0.06] border border-white/[0.10] rounded-xl p-3 text-white text-sm resize-none focus:outline-none focus:border-white/20 placeholder:text-white/20"
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
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/25 transition-all hover:scale-110 active:scale-95 ${
          cartCount > 0 ? "right-24" : "right-6"
        }`}
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
                  {t.viewOrder}
                </span>
              </button>
            </SheetTrigger>

            <SheetContent side="bottom" className="bg-[#1A1A1A] border-t border-white/[0.08] text-white rounded-t-3xl max-h-[70vh] overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
              <SheetHeader>
                <SheetTitle className="text-white text-center text-lg font-bold">{t.cartTitle}</SheetTitle>
              </SheetHeader>

              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingBag className="h-12 w-12 mx-auto text-white/10" />
                  <p className="text-white/40">{t.emptyCart}</p>
                  <p className="text-white/25 text-sm">{t.emptyCartDesc}</p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {cart.map((item) => (
                    <div key={item.dish.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
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
                      <div className="flex items-center gap-1 bg-white/[0.06] rounded-full p-0.5">
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

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                    <span className="text-white font-bold">{t.total}</span>
                    <span className="text-[var(--primary)] font-bold text-lg">
                      {cartTotal} {t.currency}
                    </span>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors mt-4"
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
    <div className="flex gap-3 p-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.10] transition-all duration-200">
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

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="text-white font-bold text-sm leading-snug">
            {lang === "ar" ? dish.nameAr : dish.nameFr}
          </h3>
          <p className="text-white/35 text-xs mt-1 line-clamp-2 leading-relaxed">
            {lang === "ar" ? dish.descriptionAr : dish.descriptionFr}
          </p>
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
            className="w-full py-3 rounded-xl bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary-hover)] transition-all active:scale-[0.98]"
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