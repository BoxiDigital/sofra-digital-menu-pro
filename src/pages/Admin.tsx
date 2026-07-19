import { useState, useEffect } from 'react';
import { DISHES, CATEGORIES } from '@/data';
import { Button, Card, CardContent, CardHeader, Input, Label, List, ListItem, ListItemText, Typography } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const Admin = () => {
  const { i18n } = useTranslation();
  const [dishes, setDishes] = useState(DISHES);
  const [categories, setCategories] = useState(CATEGORIES);
  const [selectedDish, setSelectedDish] = useState(null);
  const [newDish, setNewDish] = useState({} as any);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLang, setSelectedLang] = useState('ar');

  const { toast } = useToast();

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

  // Filter dishes
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = searchTerm === '' || 
      dish.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descriptionAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descriptionFr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle dish selection
  const handleSelectDish = (dish: any) => {
    setSelectedDish(dish);
    setEditMode(true);
    setNewDish({ ...dish });
  };

  // Handle dish update
  const handleUpdateDish = () => {
    const updatedDishes = dishes.map(d => {
      if (d.id === selectedDish.id) {
        return { ...d, ...newDish };
      }
      return d;
    });
    setDishes(updatedDishes);
    setEditMode(false);
    toast({
      title: 'تم تحديث الطبق',
      description: `${selectedDish.nameAr}`,
      variant: 'success',
    });
  };

  // Handle dish deletion
  const handleDeleteDish = () => {
    const updatedDishes = dishes.filter(d => d.id !== selectedDish.id);
    setDishes(updatedDishes);
    setEditMode(false);
    toast({
      title: 'تم حذف الطبق',
      description: `${selectedDish.nameAr}`,
      variant: 'warning',
    });
  };

  // Handle new dish creation
  const handleCreateDish = () => {
    const newDishId = `dish-${Date.now()}`;
    const updatedDishes = [...dishes, { ...newDish, id: newDishId }];
    setDishes(updatedDishes);
    setEditMode(false);
    setNewDish({} as any);
    toast({
      title: 'تم إضافة طبق جديد',
      description: `${newDish.nameAr}`,
      variant: 'success',
    });
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
        <p className="text-xl text-gray-600 text-center mb-3">{selectedLang === 'ar' ? 'إدارة القائمة' : 'Menu Management'}</p>
      </div>

      {/* Language Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {selectedLang === 'ar' ? 'اللغة' : 'Language'}
        </label>
        <select
          value={selectedLang}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ar">العربية</option>
          <option value="fr">الفرنسية</option>
        </select>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="max-w-2xl mx-auto w-full">
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

      {/* Dish Management */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDishes.map(dish => (
          <div key={dish.id} className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
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
            <div className="p-3 flex items-center justify-between">
              <Button 
                variant="primary" 
                onClick={() => handleSelectDish(dish)} 
                className="w-full justify-center py-2"
              >
                {selectedLang === 'ar' ? 'تعديل' : 'Edit'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteDish} 
                className="w-full justify-center py-2 ml-2"
              >
                {selectedLang === 'ar' ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Form for New/Edit Dish */}
      {editMode && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <form>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedLang === 'ar' ? 'اسم الطبق' : 'Dish Name'}
              </label>
              <Input
                type="text"
                value={newDish.nameAr}
                onChange={(e) => setNewDish({ ...newDish, nameAr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedLang === 'ar' ? 'الوصف' : 'Description'}
              </label>
              <Input
                type="text"
                value={newDish.descriptionAr}
                onChange={(e) => setNewDish({ ...newDish, descriptionAr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedLang === 'ar' ? 'السعر' : 'Price'}
              </label>
              <Input
                type="number"
                value={newDish.price}
                onChange={(e) => setNewDish({ ...newDish, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedLang === 'ar' ? 'الفئة' : 'Category'}
              </label>
              <select
                value={newDish.category}
                onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر الفئة</option>
                {CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {selectedLang === 'ar' ? category.nameAr : category.nameFr}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedLang === 'ar' ? 'الصور' : 'Images'}
              </label>
              {/* Image upload would go here in a real app */}
            </div>
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedLang === 'ar' ? 'الخصائص' : 'Options'}
              </Label>
              <div className="flex flex-wrap gap-2">
                {['isNew', 'isBestSeller', 'isVegetarian', 'isHalal', 'isGlutenFree'].map(option => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newDish[option]}
                      onChange={(e) => setNewDish({ ...newDish, [option]: e.target.checked })}
                      className="mr-2"
                    />
                    <span>
                      {selectedLang === 'ar' ? 
                        {isNew: 'جديد', isBestSeller: 'الأكثر طلباً', isVegetarian: 'نباتي', isHalal: 'حلال', isGlutenFree: 'بدون غلوتين'}[option]} : 
                        {isNew: 'New', isBestSeller: 'Best Seller', isVegetarian: 'Vegetarian', isHalal: 'Halal', isGlutenFree: 'Gluten Free'}[option]
                      }
                    </span>
                  </div>
                ))}
            </div>
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                onClick={handleDeleteDish} 
                className="w-full py-2"
              >
                {selectedLang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button 
                variant="primary" 
                onClick={editMode ? handleUpdateDish : handleCreateDish} 
                className="w-full py-2 ml-2"
              >
                {selectedLang === 'ar' ? 'تأكيد' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;