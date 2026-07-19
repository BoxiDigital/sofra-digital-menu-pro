import { useState } from 'react';
import { DISHES, CATEGORIES, config, CartItem } from '@/data';
import { Button, CardContent, CardHeader, Label, List, ListItem, ListItemText, Typography } from '@/components/ui';
import { Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLang, setSelectedLang] = useState('ar');

  const { toast } = useToast();

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredDishes = DISHES.filter(dish => {
    const matchesSearch = searchTerm === '' || 
      dish.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descriptionAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descriptionFr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (dish: typeof DISHES[0]) => {
    setCart(prev => [...prev, { dish, quantity: 1 }]);
    toast({
      title: selectedLang === 'ar' ? 'تم إضافة الطبق إلى السلة' : 'Plat ajouté au panier',
      description: selectedLang === 'ar' ? `${dish.nameAr}` : `${dish.nameFr}`,
      variant: 'success',
    });
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
  };

  const getWhatsAppUrl = () => {
    const cartItems = cart.map(item => `${item.dish.nameAr} x${item.quantity}`).join('\n');
    const message = encodeURIComponent(
      `أرغب في طلب:\n${cartItems}\nالمجموع: ${cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0)} ${config.currencyAr}`
    );
    return `https://wa.me/${config.whatsappNumber}?text=${message}`;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: selectedLang === 'ar' ? 'السلة فارغة' : 'Le panier est vide',
        description: selectedLang === 'ar' ? 'أضف بعض الأطباق إلى سلتك قبل المتابعة' : 'Ajoutez des plats à votre panier avant de continuer',
        variant: 'warning',
      });
      return;
    }
    window.open(getWhatsAppUrl(), '_blank');
    toast({
      title: selectedLang === 'ar' ? 'تم إرسال الطلب!' : 'Commande envoyée!',
      description: selectedLang === 'ar' ? 'سيتم إرسال طلبك عبر واتساب' : 'Votre commande sera envoyée via WhatsApp',
      variant: 'success',
    });
  };

  const t = (ar: string, fr: string) => selectedLang === 'ar' ? ar : fr;

  return (
    <div className="min-h-screen bg-amber-50 p-4 pb-96">
      {/* Header */}
      <div className="text-center mb-6">
        <img 
          src={config.logoUrl} 
          alt={t('شعار رياض النكهات', 'Riad des Saveurs Logo')}
          className="h-12 w-12 object-contain mx-auto mb-2"
        />
        <h1 className="text-3xl font-bold text-emerald-700 text-center mb-1">{t('رياض النكهات', 'Riad des Saveurs')}</h1>
        <p className="text-xl text-gray-600 text-center mb-1">{t('مطعم تقليدي مغربي أصيل', 'Authentic Moroccan Restaurant')}</p>
        <p className="text-sm text-gray-500 text-center">{t('يومياً من 11:00 صباحاً حتى 11:00 مساءً', 'Tous les jours de 11h00 à 23h00')}</p>
      </div>

      {/* Language Selector */}
      <div className="mb-4 flex justify-center">
        <select
          value={selectedLang}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
        </select>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-2xl mx-auto">
        <input
          type="text"
          placeholder={t('ابحث عن طبق...', 'Rechercher un plat...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('الفئة', 'Catégorie')}</Label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">{t('جميع الفئات', 'Toutes les catégories')}</option>
            {CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {t(category.nameAr, category.nameFr)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dish Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {filteredDishes.map(dish => (
          <div key={dish.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative">
              <img 
                src={dish.image} 
                alt={t(dish.nameAr, dish.nameFr)}
                className="w-full h-48 object-cover" 
              />
              <div className="absolute top-2 right-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="bg-white/90 hover:bg-white"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              {!dish.isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-4 py-2 rounded text-lg font-medium">
                    {t('غير متوفر', 'Indisponible')}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <CardHeader>
                <Typography variant="subtitle" className="text-emerald-700">
                  {t(dish.nameAr, dish.nameFr)}
                </Typography>
              </CardHeader>
              <CardContent className="mt-1">
                <Typography variant="body" className="text-gray-600 line-clamp-2">
                  {t(dish.descriptionAr, dish.descriptionFr)}
                </Typography>
                <div className="mt-2 flex items-center justify-between">
                  <Typography variant="body" className="text-xl font-semibold">
                    {t(`${dish.price} ${config.currencyAr}`, `${dish.price} ${config.currencyFr}`)}
                  </Typography>
                  <div className="flex items-center gap-1 flex-wrap">
                    {dish.isNew && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-blue-500">{t('جديد', 'Nouveau')}</span>}
                    {dish.isBestSeller && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-yellow-500">{t('الأكثر طلباً', 'Best-seller')}</span>}
                    {dish.isVegetarian && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-green-500">{t('نباتي', 'Végétarien')}</span>}
                    {dish.isHalal && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-indigo-500">{t('حلال', 'Halal')}</span>}
                    {dish.isGlutenFree && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-purple-500">{t('بدون غلوتين', 'Sans gluten')}</span>}
                  </div>
                </div>
              </CardContent>
            </div>
            <div className="p-3 pt-0">
              <Button 
                variant="primary" 
                onClick={() => addToCart(dish)} 
                className="w-full justify-center py-2"
              >
                {t('إضافة', 'Ajouter')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <Typography variant="heading-sm" className="font-medium text-gray-800">
            {t('سلتك', 'Votre panier')}
          </Typography>
          <span className="text-lg font-semibold text-emerald-700">
            {totalQuantity}
          </span>
        </div>
        <List className="flex-1 overflow-y-auto max-h-60">
          {cart.length === 0 ? (
            <li className="text-sm text-gray-400 py-2">{t('السلة فارغة', 'Panier vide')}</li>
          ) : (
            cart.map((item) => (
              <ListItem key={item.dish.id} className="py-1 border-b border-gray-50">
                <ListItemText
                  primary={t(item.dish.nameAr, item.dish.nameFr)}
                  secondary={t(`${item.quantity} × ${item.dish.price} ${config.currencyAr}`, `${item.quantity} × ${item.dish.price} ${config.currencyFr}`)}
                />
              </ListItem>
            ))
          )}
        </List>
        <div className="mt-4 flex justify-between items-center">
          <Typography variant="subtitle" className="font-medium text-gray-800">
            {t('المجموع:', 'Total:')}
          </Typography>
          <Typography variant="subtitle" className="font-medium text-emerald-700">
            {cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0)} {t(config.currencyAr, config.currencyFr)}
          </Typography>
        </div>
        <Button 
          variant="primary" 
          onClick={handleCheckout} 
          className="w-full justify-center py-2 mt-4"
        >
          {t('إرسال الطلب عبر واتساب', 'Commander via WhatsApp')}
        </Button>
      </div>
    </div>
  );
};

export default Index;
