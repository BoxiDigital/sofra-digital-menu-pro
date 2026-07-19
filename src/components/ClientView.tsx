import { useState } from "react";
import { Category, Dish, RestaurantConfig, CartItem } from "../types";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Sparkles,
  Leaf,
  Wheat,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface ClientViewProps {
  categories: Category[];
  dishes: Dish[];
  config: RestaurantConfig;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Sparkles: Sparkles,
  Utensils: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  ),
  Beef: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  Sandwich: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1"/>
      <rect x="3" y="10" width="18" height="4" rx="1"/>
      <rect x="3" y="16" width="18" height="3" rx="1"/>
    </svg>
  ),
  Cake: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
      <path d="M2 21h20"/>
      <path d="M7 8v2"/>
      <path d="M12 8v2"/>
      <path d="M17 8v2"/>
      <path d="M7 4h.01"/>
      <path d="M12 4h.01"/>
      <path d="M17 4h.01"/>
    </svg>
  ),
  Coffee: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
      <line x1="6" x2="6" y1="2" y2="4"/>
      <line x1="10" x2="10" y1="2" y2="4"/>
      <line x1="14" x2="14" y1="2" y2="4"/>
    </svg>
  ),
};

const bgColors = {
  dark: "bg-[#0D0D0D]",
  cream: "bg-[#F5F0E8]",
  white: "bg-white",
};

const cardBgColors = {
  dark: "bg-white/[0.03] border-white/[0.06]",
  cream: "bg-white/80 border-amber-200/40",
  white: "bg-white border-gray-200",
};

const textColors = {
  dark: { primary: "text-white", secondary: "text-white/60", muted: "text-white/35" },
  cream: { primary: "text-stone-800", secondary: "text-stone-500", muted: "text-stone-400" },
  white: { primary: "text-gray-800", secondary: "text-gray-500", muted: "text-gray-400" },
};

const catBgColors = {
  dark: "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white",
  cream: "bg-amber-100/60 text-stone-600 hover:bg-amber-200/80 hover:text-stone-800",
  white: "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800",
};

const catActiveBgColors = {
  dark: "bg-[#C8A24D] text-black shadow-lg shadow-[#C8A24D]/20",
  cream: "bg-[#C8A24D] text-black shadow-lg shadow-[#C8A24D]/20",
  white: "bg-[#C8A24D] text-white shadow-lg shadow-[#C8A24D]/20",
};

export default function ClientView({ categories, dishes, config }: ClientViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const bg = bgColors[config.backgroundColor] || bgColors.dark;
  const cardBg = cardBgColors[config.backgroundColor] || cardBgColors.dark;
  const txt = textColors[config.backgroundColor] || textColors.dark;
  const catBg = catBgColors[config.backgroundColor] || catBgColors.dark;
  const catActiveBg = catActiveBgColors[config.backgroundColor] || catActiveBgColors.dark;

  const filteredDishes = selectedCategory === "all"
    ? dishes
    : dishes.filter((d) => d.category === selectedCategory);

  const handleImageError = (dishId: string) => {
    setImageErrors((prev) => ({ ...prev, [dishId]: true }));
  };

  const addToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
    showSuccess(`تمت إضافة "${dish.nameAr}" إلى السلة`);
  };

  const removeFromCart = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.dish.id !== dishId));
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.dish.id === dishId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const generateWhatsAppMessage = (): string => {
    const itemsText = cart
      .map((item) => `• ${item.dish.nameAr} x${item.quantity} = ${item.dish.price * item.quantity} ${config.currencyAr}`)
      .join("\n");
    return config.whatsappMessageAr
      .replace("{items}", itemsText)
      .replace("{total}", `${cartTotal} ${config.currencyAr}`);
  };

  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;
    const message = encodeURIComponent(generateWhatsAppMessage());
    const url = `https://wa.me/${config.whatsappNumber}?text=${message}`;
    window.open(url, "_blank");
    setCart([]);
    setIsCartOpen(false);
    showSuccess("تم إرسال طلبك عبر واتساب بنجاح!");
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4" />;
    }
    return <Sparkles className="h-4 w-4" />;
  };

  return (
    <div className={`min-h-screen ${bg} font-sans`} dir="rtl">
      {/* ─── Hero Cover ─── */}
      <div className="relative w-full h-56 sm:h-64 md:h-72 overflow-hidden">
        <img
          src={config.coverUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"}
          alt={config.nameAr}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent" />
        
        {/* Restaurant Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl flex-shrink-0 bg-white/10 backdrop-blur-sm">
              <img
                src={config.logoUrl}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                {config.nameAr}
              </h1>
              <p className="text-sm sm:text-base text-white/70 mt-0.5">
                {config.sloganAr}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Working Hours ─── */}
      <div className={`${bg} -mt-1 relative z-10`}>
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className={`flex items-center justify-center gap-2 ${txt.secondary} text-xs py-2.5 rounded-xl ${cardBg} border`}>
            <Clock className="h-3.5 w-3.5 text-[#C8A24D]" />
            <span>{config.workingHoursAr}</span>
          </div>
        </div>
      </div>

      {/* ─── Category Navigation with Mask ─── */}
      <div className={`${bg} sticky top-0 z-30 pt-4 pb-2`}>
        <div className="max-w-lg mx-auto px-1">
          <div 
            className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none px-1"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)",
            }}
          >
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                selectedCategory === "all"
                  ? catActiveBg
                  : catBg
              }`}
            >
              ✨ الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? catActiveBg
                    : catBg
                }`}
              >
                {getCategoryIcon(cat.icon)}
                <span>{cat.nameAr}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Dishes Grid ─── */}
      <div className={`${bg} pt-1 pb-24`}>
        <div className="max-w-lg mx-auto px-4">
          {filteredDishes.length === 0 ? (
            <div className="text-center py-16">
              <div className={`text-6xl mb-4 opacity-30`}>🍽️</div>
              <p className={`${txt.secondary} font-medium`}>
                لا توجد أطباق في هذه الفئة حالياً
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`${cardBg} border rounded-2xl p-3 flex gap-3 hover:border-[#C8A24D]/20 transition-all duration-200 group relative overflow-hidden`}
                >
                  {/* Labels */}
                  <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                    {dish.isNew && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        جديد
                      </span>
                    )}
                    {dish.isBestSeller && (
                      <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        ⭐ الأكثر طلباً
                      </span>
                    )}
                    {dish.isPromo && (
                      <span className="bg-[#C8A24D]/20 text-[#C8A24D] text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {dish.promoLabelAr || "عرض"}
                      </span>
                    )}
                  </div>

                  {/* Not Available Overlay */}
                  {!dish.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl z-20 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white/80 font-bold text-sm bg-red-500/30 px-4 py-1.5 rounded-full">
                        غير متوفر حالياً
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 relative">
                    {imageErrors[dish.id] ? (
                      <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                        <span className="text-3xl opacity-40">🍽️</span>
                      </div>
                    ) : (
                      <img
                        src={dish.image}
                        alt={dish.nameAr}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => handleImageError(dish.id)}
                        loading="lazy"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className={`font-bold ${txt.primary} text-sm sm:text-base`}>
                        {dish.nameAr}
                      </h3>
                      <p className={`${txt.muted} text-xs mt-0.5 leading-relaxed line-clamp-2`}>
                        {dish.descriptionAr}
                      </p>
                      
                      {/* Badges Row */}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {dish.isVegetarian && (
                          <span className={`${txt.muted} inline-flex items-center gap-1 text-[10px]`}>
                            <Leaf className="h-3 w-3 text-green-400" /> نباتي
                          </span>
                        )}
                        {dish.isHalal && (
                          <span className={`${txt.muted} inline-flex items-center gap-1 text-[10px]`}>
                            <Star className="h-3 w-3 text-[#C8A24D]" /> حلال
                          </span>
                        )}
                        {dish.isGlutenFree && (
                          <span className={`${txt.muted} inline-flex items-center gap-1 text-[10px]`}>
                            <Wheat className="h-3 w-3 text-amber-400" /> بدون غلوتين
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Promo Text */}
                    {dish.isPromo && dish.promoTextAr && (
                      <p className="text-[#C8A24D] text-[10px] font-medium mt-1">
                        {dish.promoTextAr}
                      </p>
                    )}
                  </div>

                  {/* Price + Add Button */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    <span className={`text-[#C8A24D] font-extrabold text-base sm:text-lg`}>
                      {dish.price} <span className="text-xs">{config.currencyAr}</span>
                    </span>
                    {dish.isAvailable && (
                      <button
                        onClick={() => addToCart(dish)}
                        className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center font-bold transition-all shadow-lg shadow-[#C8A24D]/15 hover:shadow-[#C8A24D]/25"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Cart FAB ─── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold px-6 py-3.5 rounded-2xl shadow-2xl shadow-[#C8A24D]/30 flex items-center gap-3 transition-all active:scale-95"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 bg-black text-[#C8A24D] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <span>عرض السلة</span>
            <span className="text-sm opacity-80">{cartTotal} {config.currencyAr}</span>
          </button>
        </div>
      )}

      {/* ─── Cart Drawer ─── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl max-h-[75vh] flex flex-col border-t border-white/[0.08] shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <h2 className="text-white font-bold text-lg">سلة الطلبات</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag className="h-10 w-10 text-white/15 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">السلة فارغة</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.dish.id} className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.05]">
                    <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.dish.image} alt={item.dish.nameAr} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-bold truncate">{item.dish.nameAr}</h4>
                      <p className="text-[#C8A24D] text-xs font-semibold">{item.dish.price} {config.currencyAr}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.dish.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.10] flex items-center justify-center transition-all"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-white font-bold text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.dish.id, 1)}
                        className="w-7 h-7 rounded-lg bg-[#C8A24D]/20 text-[#C8A24D] hover:bg-[#C8A24D]/30 flex items-center justify-center transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.dish.id)}
                      className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-white/[0.06] px-5 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">المجموع</span>
                  <span className="text-[#C8A24D] font-extrabold text-xl">
                    {cartTotal} <span className="text-sm">{config.currencyAr}</span>
                  </span>
                </div>
                <button
                  onClick={sendWhatsAppOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  <span>اطلب عبر واتساب</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}