import { useState, useEffect } from 'react';
import { useRouter } from 'react-router-dom';
import { DISHES, CATEGORIES, CartItem } from '@/data';
import { Button, Card, CardContent, CardHeader, Input, Label, List, ListItem, ListItemText, Typography } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const router = useRouter();
  const { i18n } = useTranslation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLang, setSelectedLang] = useState('ar');

  const { toast } = useToast();

  // Calculate total quantity
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filter dishes based on search and category
  const filteredDishes = DISHES.filter(dish => {
    const matchesSearch = searchTerm === '' || 
      dish.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descriptionAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descriptionFr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle adding to cart
  const addToCart = (dish: any) => {
    setCart(prev => [...prev, { dish, quantity: 1 }]);
    toast({
      title: 'تم إضافة الطبق إلى السلة',
      description: `${dish.nameAr}`,
      variant: 'success',
    });
  };

  // Handle language change
  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle category filter change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  // WhatsApp share URL
  const getWhatsAppUrl = () => {
    const cartItems = cart.map(item => `${item.dish.nameAr} x${item.quantity}`).join('\n');
    const message = encodeURIComponent(
      `أرغب في طلب:\n${cartItems}\nالمجموع: ${cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0)} MAD`
    );
    return `https://wa.me/?text=${message}`;
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'السلة فارغة',
        description: 'أضف بعض الأطباق إلى سلتك قبل المتابعة',
        variant: 'warning',
      });
      return;
    }
    router.push('/admin'); // In a real app, this would trigger WhatsApp
    toast({
      title: 'تم إرسال الطلب!',
      description: 'سيتم إرسال طلبك عبر واتساب',
      variant: 'success',
    });
  };

  // Toggle dish availability badge
  const AvailabilityBadge = ({ isAvailable }: { isAvailable: boolean }) => {
    if (!isAvailable) return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">غير متوفر</span>;
    if (isAvailable) return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">متوفر</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-cream-light p-4">
      {/* Header with Restaurant Info */}
      <div className="text-center mb-6">
        <img 
          src="/images/logo.png" 
          alt="شعار رياض النكهات" 
          className="h-12 w-12 object-contain mx-auto mb-2"
        />
        <h1 className="text-3xl font-bold text-primary text-center mb-1">{selectedLang === 'ar' ? 'رياض النكهات' : 'Riad des Saveurs'}</h1>
        <p className="text-xl text-gray-600 text-center mb-3">{selectedLang === 'ar' ? 'مطعم تقليدي مغربي أصيل' : 'Authentic Moroccan Restaurant'}</p>
        <p className="text-lg font-medium text-gray-500 text-center mb-1">{selectedLang === 'ar' ? '24/7 خدمة' : '24/7 Service'}</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl mx-auto w-full">
          <input
            type="text"
            placeholder={selectedLang === 'ar' ? 'ابحث عن طبق...' : 'Rechercher un plat...'}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Label className="pointer-events-none absolute left-3 top-2.5">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-21.35M8.65 3.35l-4.35 21.35M3.35 3.35l21 21M3.35 21l21 21" />
            </svg>
          </Label>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="max-w-2xl mx-auto w-full bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Label className="mb-2 mb-sm-0 text-sm font-medium text-gray-700">{selectedLang === 'ar' ? 'فئة' : 'Category'}</Label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="flex-1 sm:ml-4 sm:pl-3 sm:py-2 sm:text-base text-gray-500 bg-white border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{selectedLang === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
            {CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {selectedLang === 'ar' ? category.nameAr : category.nameFr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dish Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDishes.map(dish => (
          <div key={dish.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img 
              src={dish.image} 
              alt={selectedLang === 'ar' ? dish.nameAr : dish.nameFr} 
              className="w-full h-48 object-cover" 
            />
            <div className="p-3">
              <CardHeader>
                <Typography variant="subtitle" className="text-primary">
                  {selectedLang === 'ar' ? dish.nameAr : dish.nameFr}
                </Typography>
              </CardHeader>
              <CardContent className="mt-1">
                <Typography variant="body" className="text-gray-600 line-clamp-2">
                  {selectedLang === 'ar' ? dish.descriptionAr : dish.descriptionFr}
                </Typography>
                <div className="mt-2 flex items-center justify-between">
                  <Typography variant="body" className="text-xl font-semibold">
                    {selectedLang === 'ar' ? `${dish.price} درهم` : `${dish.price} MAD`}
                  </Typography>
                  <div className="flex items-center">
                    {dish.isNew && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-blue-500">جديد</span>}
                    {dish.isBestSeller && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-yellow-500">الأكثر طلباً</span>}
                    {dish.isVegetarian && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-green-500">نباتي</span>}
                    {dish.isHalal && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-indigo-500">حلال</span>}
                    {dish.isGlutenFree && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white bg-purple-500">بدون غلوتين</span>}
                  </div>
                </div>
              </CardContent>
            </div>
            <div className="p-3 flex flex-col items-center">
              <Button 
                variant="primary" 
                onClick={() => addToCart(dish)} 
                className="w-full justify-center py-2"
              >
                {selectedLang === 'ar' ? 'إضافة' : 'Ajouter'}
              </Button>
              <div className="mt-2">
                <span className="text-xs text-gray-400">
                  {selectedLang === 'ar' ? 'الدرهم المغربي (MAD)' : 'Moroccan Dirham (MAD)'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 sm:w-96 flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
          <Typography variant="heading-sm" className="font-medium text-gray-800">
            {selectedLang === 'ar' ? 'سلتك' : 'Your Cart'}
          </Typography>
          <span className="text-lg font-semibold text-primary" id="cart-count">
            {totalQuantity}
          </span>
        </div>
        <List className="flex-1 overflow-y-auto">
          {cart.map((item, index) => (
            <ListItem key={item.dish.id} className="py-1 border-b border-gray-50">
              <ListItemText
                primaryLine={selectedLang === 'ar' ? `${item.dish.nameAr}` : `${item.dish.nameFr}`}
                secondaryLine={selectedLang === 'ar' ? `${item.quantity} × ${item.dish.price} MAD` : `${item.quantity} × ${item.dish.price} MAD`}
              />
            </ListItem>
          ))}
        </List>
        <div className="mt-4 flex justify-between items-center">
          <Typography variant="subtitle" className="font-medium text-gray-800">
            {selectedLang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}
          </Typography>
          <Typography variant="subtitle" className="font-medium text-primary">
            {cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0)} MAD
          </Typography>
        </div>
        <div className="mt-4">
          <Button 
            variant="destructive" 
            onClick={handleCheckout} 
            className="w-full justify-center py-2"
          >
            {selectedLang === 'ar' ? 'إرسال الطلب عبر واتساب' : 'Send via WhatsApp'}
          </Button>
          <div className="mt-2 text-center text-xs text-gray-400">
            {selectedLang === 'ar' ? 'أو ابحث عنا في واتساب' : 'Or find us on WhatsApp'}
          </div>
          <a 
            href={getWhatsAppUrl()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:text-blue-700"
          >
            {selectedLang === 'ar' ? 'فتح واتساب' : 'Open WhatsApp'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;