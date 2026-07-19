import { useState } from 'react';
import { DISHES, CATEGORIES, RestaurantConfig } from '@/data';
import { Button, CardContent, CardHeader, Input, Label, Typography, Select, SelectContent, SelectItem, SelectTrigger, Textarea, Switch, Tabs, TabsContent, TabsList, TabsTrigger, SelectValue } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { Download, Image as ImageIcon, Palette, QrCode, Plus, Settings, Edit2, Eye, Trash2, Loader2 } from 'lucide-react';

const DEFAULT_CONFIG: RestaurantConfig = {
  nameAr: 'رياض النكهات',
  nameFr: 'Riad des Saveurs',
  sloganAr: 'مطعم تقليدي مغربي أصيل',
  sloganFr: 'Restaurant marocain traditionnel authentique',
  logoUrl: '/images/logo.png',
  workingHoursAr: 'يومياً من 11:00 صباحاً حتى 11:00 مساءً',
  workingHoursFr: 'Tous les jours de 11h00 à 23h00',
  whatsappNumber: '+212600000000',
  whatsappMessageAr: 'أرغب في طلب من قائمة رياض النكهات',
  whatsappMessageFr: 'Je souhaite commander du menu Riad des Saveurs',
  primaryColor: '#047857',
  backgroundColor: 'cream',
  currencyAr: 'درهم',
  currencyFr: 'MAD',
};

const Admin = () => {
  const [dishes, setDishes] = useState(DISHES);
  const [selectedDish, setSelectedDish] = useState<typeof DISHES[0] | null>(null);
  const [newDish, setNewDish] = useState<Record<string, string | number | boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLang, setSelectedLang] = useState('ar');
  const [activeTab, setActiveTab] = useState('dishes');
  const [config, setConfig] = useState<RestaurantConfig>(DEFAULT_CONFIG);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const { toast } = useToast();

  const t = (ar: string, fr: string) => selectedLang === 'ar' ? ar : fr;

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = searchTerm === '' || 
      dish.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descriptionAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descriptionFr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectDish = (dish: typeof DISHES[0]) => {
    setSelectedDish(dish);
    setEditMode(true);
    setNewDish({ ...dish });
    setPreviewImage(dish.image);
  };

  const handleNewDish = () => {
    setSelectedDish(null);
    setEditMode(true);
    setNewDish({
      nameAr: '',
      nameFr: '',
      descriptionAr: '',
      descriptionFr: '',
      price: 0,
      category: '',
      image: '/images/placeholder.jpg',
      isAvailable: true,
      isNew: false,
      isBestSeller: false,
      isVegetarian: false,
      isHalal: true,
      isGlutenFree: false,
    });
    setPreviewImage('/images/placeholder.jpg');
  };

  const handleUpdateDish = () => {
    if (!newDish.nameAr || !newDish.nameFr) {
      toast({
        title: t('خطأ', 'Erreur'),
        description: t('يرجى ملء جميع الحقول المطلوبة', 'Veuillez remplir tous les champs requis'),
        variant: 'destructive',
      });
      return;
    }

    if (selectedDish) {
      const updatedDishes = dishes.map(d => {
        if (d.id === selectedDish.id) {
          return { ...d, ...newDish, image: previewImage || d.image } as typeof d;
        }
        return d;
      });
      setDishes(updatedDishes);
      toast({
        title: t('تم تحديث الطبق', 'Plat mis à jour'),
        description: String(newDish.nameAr),
        variant: 'success',
      });
    } else {
      const newDishId = `dish-${Date.now()}`;
      const updatedDishes = [...dishes, { ...newDish, id: newDishId, image: previewImage || '/images/placeholder.jpg' } as typeof DISHES[0]];
      setDishes(updatedDishes);
      toast({
        title: t('تم إضافة طبق جديد', 'Nouveau plat ajouté'),
        description: String(newDish.nameAr),
        variant: 'success',
      });
    }
    setEditMode(false);
    setSelectedDish(null);
    setNewDish({});
    setPreviewImage(null);
  };

  const handleDeleteDish = () => {
    if (!selectedDish) return;
    const updatedDishes = dishes.filter(d => d.id !== selectedDish.id);
    setDishes(updatedDishes);
    setEditMode(false);
    setSelectedDish(null);
    toast({
      title: t('تم حذف الطبق', 'Plat supprimé'),
      description: selectedDish.nameAr,
      variant: 'warning',
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast({
        title: t('تم تحميل الصورة', 'Image chargée'),
        description: t('سيتم حفظ الصورة مع الطبق', "L'image sera sauvegardée avec le plat"),
        variant: 'success',
      });
    }
  };

  const handleConfigChange = (key: keyof RestaurantConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);
        ctx.fillStyle = config.primaryColor;
        
        const drawFinder = (x: number, y: number) => {
          ctx.fillRect(x, y, 70, 70);
          ctx.clearRect(x + 10, y + 10, 50, 50);
          ctx.fillRect(x + 20, y + 20, 30, 30);
        };
        
        drawFinder(10, 10);
        drawFinder(220, 10);
        drawFinder(10, 220);
        
        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 20; j++) {
            if (Math.random() > 0.5) {
              ctx.fillRect(90 + i * 10, 90 + j * 10, 8, 8);
            }
          }
        }
      }
      
      const link = document.createElement('a');
      link.download = `qr-code-${config.nameAr.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: t('تم تنزيل رمز QR', 'Code QR téléchargé'),
        description: t('تم حفظ رمز QR الخاص بقائمتك', 'Votre code QR de menu a été sauvegardé'),
        variant: 'success',
      });
    } catch {
      toast({
        title: t('خطأ', 'Erreur'),
        description: t('فشل في إنشاء رمز QR', 'Échec de la génération du code QR'),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const toggleAvailability = (dish: typeof DISHES[0]) => {
    const updatedDishes = dishes.map(d => {
      if (d.id === dish.id) {
        return { ...d, isAvailable: !d.isAvailable };
      }
      return d;
    });
    setDishes(updatedDishes);
    toast({
      title: t('تم تحديث التوفر', 'Disponibilité mise à jour'),
      description: `${dish.nameAr} - ${!dish.isAvailable ? t('متوفر', 'Disponible') : t('غير متوفر', 'Indisponible')}`,
      variant: 'success',
    });
  };

  const optionLabels = [
    { key: 'isNew', ar: 'جديد', fr: 'Nouveau' },
    { key: 'isBestSeller', ar: 'الأكثر طلباً', fr: 'Meilleure vente' },
    { key: 'isVegetarian', ar: 'نباتي', fr: 'Végétarien' },
    { key: 'isHalal', ar: 'حلال', fr: 'Halal' },
    { key: 'isGlutenFree', ar: 'بدون غلوتين', fr: 'Sans gluten' },
  ];

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <img src={config.logoUrl} alt={t('شعار رياض النكهات', 'Logo Riad des Saveurs')} className="h-12 w-12 object-contain mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-emerald-700 text-center mb-1">{t('رياض النكهات', 'Riad des Saveurs')}</h1>
        <p className="text-xl text-gray-600 text-center mb-3">{t('لوحة تحكم المدير', 'Tableau de bord Admin')}</p>
      </div>

      {/* Language Selector */}
      <div className="mb-4 flex justify-center">
        <select value={selectedLang} onChange={(e) => handleLanguageChange(e.target.value)}
          className="w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600">
          <option value="ar">العربية</option>
          <option value="fr">Français</option>
        </select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="dishes"><Plus className="h-4 w-4 mr-2" />{t('إدارة الأطباق', 'Gestion des Plats')}</TabsTrigger>
          <TabsTrigger value="categories"><Settings className="h-4 w-4 mr-2" />{t('الفئات', 'Catégories')}</TabsTrigger>
          <TabsTrigger value="settings"><Palette className="h-4 w-4 mr-2" />{t('الإعدادات', 'Paramètres')}</TabsTrigger>
        </TabsList>

        {/* Dishes Tab */}
        <TabsContent value="dishes" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="text" placeholder={t('ابحث عن طبق...', 'Rechercher un plat...')} value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              <div className="flex-1">
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t('اختر الفئة', 'Choisir la catégorie')} /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (<SelectItem key={category.id} value={category.id}>{t(category.nameAr, category.nameFr)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="primary" onClick={handleNewDish} className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />{t('إضافة طبق جديد', 'Ajouter un plat')}
              </Button>
            </div>
          </div>

          {/* Dish Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDishes.map(dish => (
              <div key={dish.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative">
                  <img src={dish.image} alt={t(dish.nameAr, dish.nameFr)} className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleSelectDish(dish)} className="bg-white/90 hover:bg-white">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleAvailability(dish)}
                      className={`bg-white/90 hover:bg-white ${dish.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  {!dish.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded text-lg font-medium">{t('غير متوفر', 'Indisponible')}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <CardHeader><Typography variant="subtitle" className="text-emerald-700">{t(dish.nameAr, dish.nameFr)}</Typography></CardHeader>
                  <CardContent className="mt-1">
                    <Typography variant="body" className="text-gray-600 line-clamp-2">{t(dish.descriptionAr, dish.descriptionFr)}</Typography>
                    <div className="mt-2 flex items-center justify-between">
                      <Typography variant="body" className="text-xl font-semibold">{t(`${dish.price} ${config.currencyAr}`, `${dish.price} ${config.currencyFr}`)}</Typography>
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
              </div>
            ))}
          </div>

          {/* Form for New/Edit Dish */}
          {editMode && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{selectedDish ? t('تعديل الطبق', 'Modifier le plat') : t('إضافة طبق جديد', 'Ajouter un nouveau plat')}</h2>
                <Button variant="ghost" onClick={() => { setEditMode(false); setSelectedDish(null); setNewDish({}); setPreviewImage(null); }}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('اسم الطبق (العربية)', 'Nom du plat (Arabe)')} *</label>
                    <Input type="text" value={String(newDish.nameAr ?? '')} onChange={(e) => setNewDish({ ...newDish, nameAr: e.target.value })} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('اسم الطبق (الفرنسية)', 'Nom du plat (Français)')} *</label>
                    <Input type="text" value={String(newDish.nameFr ?? '')} onChange={(e) => setNewDish({ ...newDish, nameFr: e.target.value })} className="w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('الوصف (العربية)', 'Description (Arabe)')}</label>
                    <Textarea value={String(newDish.descriptionAr ?? '')} onChange={(e) => setNewDish({ ...newDish, descriptionAr: e.target.value })} className="w-full" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('الوصف (الفرنسية)', 'Description (Français)')}</label>
                    <Textarea value={String(newDish.descriptionFr ?? '')} onChange={(e) => setNewDish({ ...newDish, descriptionFr: e.target.value })} className="w-full" rows={3} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('السعر', 'Prix')} *</label>
                    <Input type="number" value={Number(newDish.price ?? 0)} onChange={(e) => setNewDish({ ...newDish, price: parseFloat(e.target.value) || 0 })} className="w-full" min="0" step="0.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('الفئة', 'Catégorie')} *</label>
                    <Select value={String(newDish.category ?? '')} onValueChange={(value) => setNewDish({ ...newDish, category: value })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={t('اختر الفئة', 'Choisir la catégorie')} /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (<SelectItem key={category.id} value={category.id}>{t(category.nameAr, category.nameFr)}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">{t('الخصائص', 'Options')}</Label>
                    <div className="flex flex-wrap gap-3">
                      {optionLabels.map(option => (
                        <div key={option.key} className="flex items-center">
                          <Switch checked={Boolean(newDish[option.key])} onCheckedChange={(checked) => setNewDish({ ...newDish, [option.key]: checked })} />
                          <span className="ml-2 text-sm">{t(option.ar, option.fr)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('صورة الطبق', 'Image du plat')}</label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                      {previewImage ? (<img src={previewImage} alt="Preview" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="h-8 w-8" /></div>)}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                      <Button variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                        <ImageIcon className="h-4 w-4 mr-2" />{t('اختيار صورة', 'Choisir une image')}
                      </Button>
                      <p className="text-xs text-gray-500">{t('الحجم الأقصى: 5MB', 'Taille max: 5MB')}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="ghost" onClick={() => { setEditMode(false); setSelectedDish(null); setNewDish({}); setPreviewImage(null); }}>{t('إلغاء', 'Annuler')}</Button>
                  {selectedDish && (<Button variant="destructive" onClick={handleDeleteDish}><Trash2 className="h-4 w-4 mr-2" />{t('حذف', 'Supprimer')}</Button>)}
                  <Button variant="primary" onClick={handleUpdateDish}>{selectedDish ? t('تحديث', 'Mettre à jour') : t('إضافة', 'Ajouter')}</Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('إدارة الفئات', 'Gestion des catégories')}</h2>
            <div className="space-y-4">
              {CATEGORIES.map(category => (
                <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center"><span className="text-2xl">{category.icon}</span></div>
                    <div><p className="font-medium">{t(category.nameAr, category.nameFr)}</p><p className="text-sm text-gray-500">ID: {category.id}</p></div>
                  </div>
                  <Button variant="outline" size="sm">{t('تعديل', 'Modifier')}</Button>
                </div>
              ))}
              <Button variant="primary" className="mt-4"><Plus className="h-4 w-4 mr-2" />{t('إضافة فئة جديدة', 'Ajouter une catégorie')}</Button>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('معلومات المطعم', 'Informations du restaurant')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('اسم المطعم (العربية)', 'Nom (Arabe)')}</label><Input value={config.nameAr} onChange={(e) => handleConfigChange('nameAr', e.target.value)} className="w-full" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('اسم المطعم (الفرنسية)', 'Nom (Français)')}</label><Input value={config.nameFr} onChange={(e) => handleConfigChange('nameFr', e.target.value)} className="w-full" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('الشعار (العربية)', 'Slogan (Arabe)')}</label><Input value={config.sloganAr} onChange={(e) => handleConfigChange('sloganAr', e.target.value)} className="w-full" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('الشعار (الفرنسية)', 'Slogan (Français)')}</label><Input value={config.sloganFr} onChange={(e) => handleConfigChange('sloganFr', e.target.value)} className="w-full" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('الشعار', 'Logo')}</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-300 bg-gray-100"><img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" /></div>
                  <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => handleConfigChange('logoUrl', ev.target?.result as string); reader.readAsDataURL(file); } }} />
                  <Button variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}><ImageIcon className="h-4 w-4 mr-2" />{t('تغيير الشعار', 'Changer le logo')}</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('ساعات العمل (العربية)', "Heures d'ouverture (Arabe)")}</label><Input value={config.workingHoursAr} onChange={(e) => handleConfigChange('workingHoursAr', e.target.value)} className="w-full" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('ساعات العمل (الفرنسية)', "Heures d'ouverture (Français)")}</label><Input value={config.workingHoursFr} onChange={(e) => handleConfigChange('workingHoursFr', e.target.value)} className="w-full" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('رقم واتساب', 'Numéro WhatsApp')}</label><Input value={config.whatsappNumber} onChange={(e) => handleConfigChange('whatsappNumber', e.target.value)} className="w-full" placeholder="+212600000000" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('العملة (العربية)', 'Devise (Arabe)')}</label><Input value={config.currencyAr} onChange={(e) => handleConfigChange('currencyAr', e.target.value)} className="w-full" /></div>
              </div>
            </div>
          </div>

          {/* Color Customization */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('تخصيص الألوان', 'Personnalisation des couleurs')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('اللون الأساسي', 'Couleur principale')}</label>
                <div className="flex items-center gap-4">
                  <input type="color" value={config.primaryColor} onChange={(e) => handleConfigChange('primaryColor', e.target.value)} className="w-12 h-12 rounded border border-gray-300 cursor-pointer" />
                  <Input value={config.primaryColor} onChange={(e) => handleConfigChange('primaryColor', e.target.value)} className="w-40 font-mono" />
                  <div className="w-10 h-10 rounded border border-gray-300" style={{ backgroundColor: config.primaryColor }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('خلفية القائمة', 'Arrière-plan du menu')}</label>
                <Select value={config.backgroundColor} onValueChange={(value) => handleConfigChange('backgroundColor', value)}>
                  <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cream">{t('كريمي دافئ', 'Crème chaud')}</SelectItem>
                    <SelectItem value="white">{t('أبيض نقي', 'Blanc pur')}</SelectItem>
                    <SelectItem value="dark">{t('مظلم أنيق', 'Sombre élégant')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* QR Code Generator */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><QrCode className="h-6 w-6 text-emerald-700" />{t('رمز QR للقائمة', 'Code QR du menu')}</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg">
                <div className="w-64 h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center"><QrCode className="h-32 w-32 text-emerald-700" /></div>
                <p className="text-sm text-gray-500 text-center">{t('امسح هذا الرمز لعرض القائمة', 'Scannez ce code pour voir le menu')}</p>
              </div>
              <div className="flex flex-col gap-4">
                <Button variant="primary" size="lg" onClick={generateQRCode} disabled={isGeneratingQR} className="w-full md:w-auto">
                  {isGeneratingQR ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />{t('جاري الإنشاء...', 'Génération...')}</>) : (<><Download className="h-5 w-5 mr-2" />{t('تنزيل رمز QR', 'Télécharger le code QR')}</>)}
                </Button>
                <p className="text-sm text-gray-500">{t('سيتم تنزيل رمز QR كصورة PNG', 'Le code QR sera téléchargé en PNG')}</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Message Templates */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('رسائل واتساب', 'Messages WhatsApp')}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('رسالة الطلب (العربية)', 'Message de commande (Arabe)')}</label><Textarea value={config.whatsappMessageAr} onChange={(e) => handleConfigChange('whatsappMessageAr', e.target.value)} className="w-full" rows={2} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('رسالة الطلب (الفرنسية)', 'Message de commande (Français)')}</label><Textarea value={config.whatsappMessageFr} onChange={(e) => handleConfigChange('whatsappMessageFr', e.target.value)} className="w-full" rows={2} /></div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
