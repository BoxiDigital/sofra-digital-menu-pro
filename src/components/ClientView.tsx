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
                      onClose={handleCloseModal}
                      googleMapsUrl={config.googleMapsUrl}
                    />
                  )}
                  {!ratingSubmitted && (
                    <button
                      onClick={handleCloseModal}
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