import React, { useState, useMemo } from "react";
import { Plus, Check, ShoppingCart, Sparkles, X } from "lucide-react";
import { Dish } from "../types";

interface UpsellModalProps {
  lang: "ar" | "fr" | "en" | "es";
  currency: string;
  dish: Dish;
  upsells: Dish[];
  onClose: () => void;
  onAddToCart: (dish: Dish, upsells: Dish[]) => void;
}

export default function UpsellModal({
  lang,
  currency,
  dish,
  upsells,
  onClose,
  onAddToCart,
}: UpsellModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(upsells.map(u => u.id)));

  const getText = (key: string) => {
    const dicts: Record<string, Record<string, string>> = {
      ar: {
        title: "أكمل وجبتك مع هذه الإضافات",
        subtitle: "اختر ما يناسبك لتكتمل وجبتك",
        addAll: "إضافة الكل للسلة",
        addSelected: "إضافة المختار مع الطبق",
        skip: "لا شكراً، أضف الطبق الأساسي فقط",
        total: "المجموع",
        basePrice: "سعر الطبق",
        upsellsPrice: "الإضافات",
        add: "أضف",
        remove: "إزالة",
        selected: "تم اختياره",
        },
        fr: {
          title: "Complétez votre repas",
          subtitle: "Choisissez les accompagnements parfaits",
          addAll: "Tout ajouter au panier",
          addSelected: "Ajouter la sélection avec le plat",
          skip: "Non merci, ajouter le plat uniquement",
          total: "Total",
          basePrice: "Prix du plat",
          upsellsPrice: "Suppléments",
      add: "Ajouter",
        remove: "Retirer",
        selected: "Sélectionné",
        allSelected: "Tout sélectionné",
      },
      en: {
        title: "Complete Your Meal",
        subtitle: "Choose the perfect sides",
        addAll: "Add all to cart",
        addSelected: "Add selected with dish",
        skip: "No thanks, add main dish only",
        total: "Total",
        basePrice: "Dish price",
        upsellsPrice: "Add-ons",
        add: "Add",
        remove: "Remove",
        selected: "Selected",
        allSelected: "All Selected",
      },
      es: {
        title: "Completa tu Comida",
        subtitle: "Elige los acompañamientos perfectos",
        addAll: "Añadir todo al carrito",
        addSelected: "Añadir selección con el plato",
        skip: "No gracias, solo el plato principal",
        total: "Total",
        basePrice: "Precio del plato",
        upsellsPrice: "Extras",
        add: "Añadir",
        remove: "Quitar",
        selected: "Seleccionado",
        allSelected: "Todo seleccionado",
      },
    };
    return dicts[lang]?.[key] || key;
  };

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(upsells.map(u => u.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const totalUpsellsPrice = useMemo(() => {
    return upsells
      .filter(u => selectedIds.has(u.id))
      .reduce((sum, u) => sum + u.price, 0);
  }, [upsells, selectedIds]);

  const finalTotal = dish.price + totalUpsellsPrice;

  const handleAddAll = () => {
    onAddToCart(dish, upsells.filter(u => selectedIds.has(u.id)));
  };

  const handleSkip = () => {
    onAddToCart(dish, []);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#0D0D0D]/95 backdrop-blur-3xl border border-white/[0.08] rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.7)] text-white" dir={lang === "ar" ? "rtl" : "ltr"}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.06] flex items-center justify-center transition-all"
        >
          <X className="h-4 w-4 text-white/50" />
        </button>

        <div className="p-6 pb-8">
          {/* Header */}
          <div className="text-center mb-6 pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-4">
              <Sparkles className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-bold text-white">{getText("title")}</h2>
            <p className="text-white/40 text-sm mt-1">{getText("subtitle")}</p>
          </div>

          {/* Main dish summary */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.08]">
              <img src={dish.image} alt={lang === "ar" ? dish.nameAr : lang === "fr" ? dish.nameFr : lang === "en" ? dish.nameEn : dish.nameEs} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm">{lang === "ar" ? dish.nameAr : lang === "fr" ? dish.nameFr : lang === "en" ? dish.nameEn : dish.nameEs}</h3>
              <p className="text-[var(--primary)] font-bold text-sm mt-1">{dish.price} {currency}</p>
            </div>
          </div>

          {/* Upsells list */}
          {upsells.length > 0 && (
            <div className="mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs font-medium">
                  {lang === "ar" ? "الإضافات المقترحة" : "Suggestions"}
                </span>
                <button
                  onClick={() => selectedIds.size === upsells.length ? deselectAll() : selectAll()}
                  className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                >
                  {selectedIds.size === upsells.length
                    ? (lang === "ar" ? "إلغاء الكل" : "Tout désélectionner")
                    : (lang === "ar" ? "تحديد الكل" : "Tout sélectionner")}
                </button>
              </div>
              <div className="space-y-2">
                {upsells.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                        isSelected
                          ? "bg-[var(--primary)]/8 border-[var(--primary)]/30 hover:bg-[var(--primary)]/12"
                          : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.10]"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.08]">
                        <img src={item.image} alt={lang === "ar" ? item.nameAr : item.nameFr} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <h4 className="text-white text-sm font-bold truncate">
                          lang === "ar" ? u.nameAr : lang === "fr" ? u.nameFr : lang === "en" ? u.nameEn : u.nameEs
                        </h4>
                        <p className="text-[var(--primary)] text-xs font-bold mt-0.5">+{item.price} {currency}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-[var(--primary)] border-[var(--primary)]"
                          : "border-white/[0.20] bg-transparent"
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total summary */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">{getText("basePrice")}</span>
              <span className="text-white/70">{dish.price} {currency}</span>
            </div>
            {totalUpsellsPrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">{getText("upsellsPrice")}</span>
                <span className="text-[var(--primary)]">+{totalUpsellsPrice} {currency}</span>
              </div>
            )}
            <div className="border-t border-white/[0.06] pt-2 flex justify-between font-bold">
              <span className="text-white">{getText("total")}</span>
              <span className="text-white text-lg">{finalTotal} {currency}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddAll}
              className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(200,162,77,0.25)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>{selectedIds.size === upsells.length ? getText("addAll") : getText("addSelected")}</span>
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 hover:text-white/70 font-medium rounded-xl transition-all duration-300 text-sm"
            >
              {getText("skip")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}