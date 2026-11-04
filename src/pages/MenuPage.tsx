import { useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import {
  getRestaurantBySlug,
  getCategoriesByRestaurant,
  getDishesByRestaurant,
  trackEvent,
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import ClientView from "../components/ClientView";
import { Settings, Loader2 } from "lucide-react";

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
    const [restaurantId, setRestaurantId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

  // Keep CSS variables in sync so the loading/error states reflect the theme
  useEffect(() => {
    if (config) {
      const title = `${config.nameAr} — قائمة رقمية | سُفرة`;
      const desc = config.sloganAr || `${config.nameAr} — منيو رقمي احترافي`;
      const image = config.logoUrl || config.coverUrl || '';
      
      document.title = title;
      
      const setMeta = (property: string, content: string) => {
        let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('property', property);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };
      
      const setNameMeta = (name: string, content: string) => {
        let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('name', name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };
      
      setMeta('og:title', title);
      setMeta('og:description', desc);
      if (image) setMeta('og:image', image);
      setMeta('og:url', window.location.href);
      setNameMeta('description', desc);
      setNameMeta('twitter:title', title);
      setNameMeta('twitter:description', desc);
      if (image) setNameMeta('twitter:image', image);
    }
  }, [config]);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    loadRestaurant(slug);
  }, [slug]);

  const loadRestaurant = async (slug: string) => {
    try {
      const restaurant = await getRestaurantBySlug(slug);
      if (!restaurant) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const [cats, dsh] = await Promise.all([
        getCategoriesByRestaurant(restaurant.id),
        getDishesByRestaurant(restaurant.id),
      ]);

      // استخراج config بدون id و slug
      const { id, slug: _, ...cfg } = restaurant;
            setRestaurantId(id);
            setConfig(cfg);
      setCategories(cats);
      setDishes(dsh);
      // Track analytics: scan view
      trackEvent(restaurant.id, "scan_view").catch(() => {});
    } catch (err) {
      console.error("[MenuPage] Error:", err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] gap-3">
        <Loader2 className="h-8 w-8 text-[var(--primary)] animate-spin" />
        <p className="text-white/50 text-sm">جاري تحميل قائمة المطعم...</p>
      </div>
    );
  }

  if (notFound || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
        <div className="text-center space-y-6">
          <p className="text-4xl">🔍</p>
          <h2 className="text-2xl font-bold text-white">المطعم غير موجود</h2>
          <p className="text-white/50">تأكد من الرابط أو كود QR</p>
          <Link
            to="/"
            className="inline-block text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ClientView categories={categories} dishes={dishes} config={config} restaurantId={restaurantId} />

      <footer className="bg-zinc-900 text-zinc-400 py-8 text-center text-xs border-t border-zinc-800">
        <div className="max-w-md mx-auto px-4 space-y-3">
          <p className="text-white/60 font-semibold">{config.nameAr}</p>
          <p>© {new Date().getFullYear()} {config.nameAr}. جميع الحقوق محفوظة.</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-white/30 hover:text-white/50 font-semibold transition-colors text-xs"
            >
              <Settings className="h-3 w-3" />
              <span>مشغّل بواسطة سُفرة</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}