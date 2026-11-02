import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ShoppingBag, 
  Tag, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  X, 
  DollarSign, 
  Layers, 
  Package, 
  Sparkles, 
  Search, 
  ExternalLink, 
  LogOut, 
  Check, 
  ChevronDown, 
  Building2, 
  Palette, 
  Ruler, 
  Hash, 
  BarChart3,
  RefreshCw,
  MapPin,
  Star,
  ThumbsUp
} from 'lucide-react';
import { StarRating } from './StarRating';
import { ProductArticle, ProductArticleColor, ReviewRecord } from '../types';
import { SHOP_DEPARTMENTS, ShopDepartment } from '../constants';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  getDocs 
} from 'firebase/firestore';
import { cn } from '../utils';

interface SellerDashboardProps {
  user: any;
  onLogout: () => void;
  onSwitchToClientView: () => void;
}

// Preset color options for quick addition
const QUICK_COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: 'Onyx Black', hex: '#111827' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Camel Tan', hex: '#C19A6B' },
  { name: 'Midnight Navy', hex: '#1E3A8A' },
  { name: 'Olive Forest', hex: '#365314' },
  { name: 'Burgundy Wine', hex: '#881337' },
  { name: 'Charcoal Grey', hex: '#4B5563' },
  { name: 'Champagne Gold', hex: '#D4AF37' },
  { name: 'Terracotta Rust', hex: '#C2410C' },
  { name: 'Silver Steel', hex: '#94A3B8' }
];

// Department size recommendations
const SIZE_PRESETS_BY_DEPARTMENT: Record<string, string[]> = {
  'Clothing': ['XS', 'S', 'M', 'L', 'XL', '2XL'],
  'Shoes': ['US 7', 'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 10.5', 'US 11', 'US 12'],
  'Kitchen wear': ['Standard', 'Compact (1.5L)', 'Medium (3.0L)', 'Large (5.5L)', 'Chef Set (7-Piece)'],
  'Autocare': ['16 oz', '32 oz', '1 Gallon', 'Complete Kit', 'Universal Fit'],
  'Home & Living': ['Single', 'Twin', 'Queen', 'King', 'Standard', 'Deluxe'],
  'Electronics': ['64GB', '128GB', '256GB', '512GB', 'Standard Edition', 'Pro Edition'],
  'Beauty & Personal Care': ['30 ml', '50 ml', '100 ml', 'Travel Size', 'Full Routine Set']
};

export const DEMO_STARTER_PRODUCTS: ProductArticle[] = [
  {
    id: 'demo-prod-1',
    name: 'Milano Sartoriale 100% Extrafine Merino Overcoat',
    department: 'Clothing',
    price: 295,
    originalPrice: 380,
    stockCount: 24,
    inStock: true,
    sku: 'OPL-CLO-7721',
    description: 'Bespoke hand-tailored double-breasted overcoat cut from pure Italian Merino wool with horn buttons and cupro silk lining.',
    image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&q=80&w=800',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Onyx Black', hex: '#111827' },
      { name: 'Camel Tan', hex: '#C19A6B' },
      { name: 'Charcoal Grey', hex: '#4B5563' }
    ],
    brand: 'Milano Sartoriale',
    sellerCompanyName: 'Milano Sartoriale',
    sellerAddress: '450 N Rodeo Dr, Beverly Hills, CA 90210',
    sellerUid: 'demo_seller_preview',
    rating: 4.9,
    reviewsCount: 38,
    tags: ['Brand New', 'Clothing', 'Merino Wool']
  },
  {
    id: 'demo-prod-2',
    name: 'Tuscan Hand-Burnished Goodyear Calfskin Oxford Shoes',
    department: 'Shoes',
    price: 240,
    originalPrice: 310,
    stockCount: 18,
    inStock: true,
    sku: 'OPL-SHO-4109',
    description: 'Heritage Italian cap-toe Oxfords crafted with vegetable-tanned French calfskin leather and Goodyear welted leather soles.',
    image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=800',
    sizes: ['US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 11'],
    colors: [
      { name: 'Cognac Tan', hex: '#9A3412' },
      { name: 'Onyx Black', hex: '#111827' }
    ],
    brand: 'Milano Sartoriale',
    sellerCompanyName: 'Milano Sartoriale',
    sellerAddress: '450 N Rodeo Dr, Beverly Hills, CA 90210',
    sellerUid: 'demo_seller_preview',
    rating: 5.0,
    reviewsCount: 22,
    tags: ['Brand New', 'Shoes', 'Goodyear Welt']
  },
  {
    id: 'demo-prod-3',
    name: 'Apex Master 7-Piece Damascus Steel Culinary Knife Set',
    department: 'Kitchen wear',
    price: 185,
    originalPrice: 240,
    stockCount: 15,
    inStock: true,
    sku: 'OPL-KIT-9023',
    description: '67-layer Japanese AUS-10 Damascus steel blades featuring vacuum heat-treated 60±2 HRC cores and ergonomic pakkawood handles.',
    image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800',
    sizes: ['Chef Set (7-Piece)', 'Standard (3-Piece)'],
    colors: [
      { name: 'Rosewood Steel', hex: '#4A0404' },
      { name: 'Stainless Silver', hex: '#94A3B8' }
    ],
    brand: 'Milano Sartoriale',
    sellerCompanyName: 'Milano Sartoriale',
    sellerAddress: '450 N Rodeo Dr, Beverly Hills, CA 90210',
    sellerUid: 'demo_seller_preview',
    rating: 4.8,
    reviewsCount: 19,
    tags: ['Brand New', 'Kitchen wear', 'Damascus Steel']
  },
  {
    id: 'demo-prod-4',
    name: 'Graphene Ceramic Ultra-Shield Hydrophobic Detailing Kit',
    department: 'Autocare',
    price: 75,
    originalPrice: 95,
    stockCount: 40,
    inStock: true,
    sku: 'OPL-AUT-3312',
    description: '10H hardness graphene ceramic coating providing 5+ years of hydrophobic water beading, UV rejection, and mirror paint gloss.',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=800',
    sizes: ['Complete Kit', '32 oz Refill'],
    colors: [
      { name: 'Mirror Gloss', hex: '#111827' },
      { name: 'Deep Cobalt', hex: '#1E3A8A' }
    ],
    brand: 'Milano Sartoriale',
    sellerCompanyName: 'Milano Sartoriale',
    sellerAddress: '450 N Rodeo Dr, Beverly Hills, CA 90210',
    sellerUid: 'demo_seller_preview',
    rating: 4.9,
    reviewsCount: 47,
    tags: ['Brand New', 'Autocare', 'Ceramic']
  }
];

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  user,
  onLogout,
  onSwitchToClientView
}) => {
  const [products, setProducts] = useState<ProductArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductArticle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDepartment, setFormDepartment] = useState<string>(SHOP_DEPARTMENTS[0]);
  const [formPrice, setFormPrice] = useState<string>('');
  const [formOriginalPrice, setFormOriginalPrice] = useState<string>('');
  const [formStockCount, setFormStockCount] = useState<string>('25');
  const [formSku, setFormSku] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [formColors, setFormColors] = useState<ProductArticleColor[]>([
    { name: 'Onyx Black', hex: '#111827' }
  ]);
  const [colorPickerHex, setColorPickerHex] = useState('#C19A6B');
  const [colorNameInput, setColorNameInput] = useState('Camel Tan');
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sellerCompanyName = user?.companyName || user?.businessName || user?.name || user?.displayName || 'My Retail Boutique';
  const defaultSellerAddress = user?.companyAddress || user?.businessAddress || user?.address || '450 N Rodeo Dr, Beverly Hills, CA 90210';
  const [formSellerAddress, setFormSellerAddress] = useState(defaultSellerAddress);
  const sellerUid = user?.uid || user?.id || 'anonymous_seller';
  const sellerEmail = user?.email || '';

  // Seller Reviews State
  const [sellerReviews, setSellerReviews] = useState<ReviewRecord[]>([]);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  useEffect(() => {
    const reviewsRef = collection(db, 'reviews');
    const unsub = onSnapshot(reviewsRef, (snapshot) => {
      const allRev = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ReviewRecord[];
      const myReviews = allRev.filter(r => 
        r.targetType === 'seller' && (
          (r.targetId && r.targetId === sellerUid) ||
          (r.targetName && sellerCompanyName && r.targetName.trim().toLowerCase() === sellerCompanyName.trim().toLowerCase()) ||
          user?.role === 'admin' || user?.email === 'rakesh2xplore@gmail.com'
        )
      );
      setSellerReviews(myReviews);
    }, (err) => {
      console.warn("Seller reviews listener notice:", err);
    });

    return () => unsub();
  }, [sellerUid, sellerCompanyName, user]);

  const sellerAverageRating = useMemo(() => {
    if (sellerReviews.length === 0) return 5.0;
    const sum = sellerReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return Math.round((sum / sellerReviews.length) * 10) / 10;
  }, [sellerReviews]);

  // Real-time Firestore Listener for this Seller's Products
  useEffect(() => {
    setIsLoading(true);
    const productsRef = collection(db, 'products');

    // Subscribe to products collection
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const items: ProductArticle[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Check if item belongs to this seller (by uid or email or companyName)
        const isOwner = 
          data.sellerUid === sellerUid ||
          (sellerEmail && data.sellerEmail && data.sellerEmail.toLowerCase() === sellerEmail.toLowerCase()) ||
          (data.brand && data.brand.toLowerCase() === sellerCompanyName.toLowerCase());

        if (isOwner) {
          items.push({
            id: docSnap.id,
            name: data.name || '',
            description: data.description || '',
            price: Number(data.price) || 0,
            originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
            department: data.department || 'Clothing',
            brand: data.brand || sellerCompanyName,
            image: data.image || '',
            rating: typeof data.rating === 'number' ? data.rating : 5.0,
            reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 1,
            sizes: Array.isArray(data.sizes) && data.sizes.length > 0 ? data.sizes : ['Standard'],
            colors: Array.isArray(data.colors) && data.colors.length > 0 ? data.colors : [{ name: 'Standard', hex: '#000000' }],
            inStock: data.inStock !== false,
            stockCount: typeof data.stockCount === 'number' ? data.stockCount : 10,
            sku: data.sku || `SKU-${docSnap.id.substring(0, 6).toUpperCase()}`,
            sellerUid: data.sellerUid,
            sellerEmail: data.sellerEmail,
            sellerCompanyName: data.sellerCompanyName || data.brand,
            sellerAddress: data.sellerAddress || defaultSellerAddress,
            createdAt: data.createdAt
          });
        }
      });

      if (items.length === 0) {
        setProducts(DEMO_STARTER_PRODUCTS);
      } else {
        setProducts(items);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching seller products:', error);
      setProducts(DEMO_STARTER_PRODUCTS);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [sellerUid, sellerEmail, sellerCompanyName, defaultSellerAddress]);

  // Open Form for New Product
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDepartment(SHOP_DEPARTMENTS[0]);
    setFormPrice('');
    setFormOriginalPrice('');
    setFormStockCount('25');
    const autoSku = `OPL-${formDepartment.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormSku(autoSku);
    setFormDescription('');
    setFormSellerAddress(defaultSellerAddress);
    setFormImageUrl('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800');
    setFormSizes(SIZE_PRESETS_BY_DEPARTMENT[SHOP_DEPARTMENTS[0]]?.slice(0, 4) || ['S', 'M', 'L']);
    setFormColors([
      { name: 'Onyx Black', hex: '#111827' },
      { name: 'Camel Tan', hex: '#C19A6B' }
    ]);
    setIsFormOpen(true);
  };

  // Open Form to Edit Existing Product
  const handleOpenEditProduct = (prod: ProductArticle) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormDepartment(prod.department);
    setFormPrice(prod.price.toString());
    setFormOriginalPrice(prod.originalPrice ? prod.originalPrice.toString() : '');
    setFormStockCount((prod.stockCount ?? 15).toString());
    setFormSku(prod.sku);
    setFormDescription(prod.description);
    setFormSellerAddress(prod.sellerAddress || defaultSellerAddress);
    setFormImageUrl(prod.image);
    setFormSizes([...prod.sizes]);
    setFormColors([...prod.colors]);
    setIsFormOpen(true);
  };

  // Handle department change in form - auto updates recommended sizes if none chosen
  const handleDepartmentChange = (dept: string) => {
    setFormDepartment(dept);
    const presets = SIZE_PRESETS_BY_DEPARTMENT[dept];
    if (presets && formSizes.length === 0) {
      setFormSizes(presets.slice(0, 4));
    }
    if (!editingProduct) {
      setFormSku(`OPL-${dept.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // Image File Upload with FileReader (instant Base64 preview)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ text: 'Please select a valid image file (PNG, JPG, WEBP).', type: 'error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ text: 'Image file size should be less than 2MB for fast loading.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result as string;
      setFormImageUrl(base64Url);
      setStatusMessage({ text: 'Image uploaded and processed successfully!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Sizes handlers
  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (!formSizes.includes(trimmed)) {
      setFormSizes([...formSizes, trimmed]);
    }
    setCustomSizeInput('');
  };

  const handleTogglePresetSize = (size: string) => {
    if (formSizes.includes(size)) {
      if (formSizes.length > 1) {
        setFormSizes(formSizes.filter(s => s !== size));
      }
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    if (formSizes.length <= 1) {
      setStatusMessage({ text: 'A product must have at least one size specification.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    setFormSizes(formSizes.filter(s => s !== sizeToRemove));
  };

  // Colors handlers
  const handleAddColor = () => {
    const trimmedName = colorNameInput.trim();
    if (!trimmedName) return;
    const exists = formColors.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setStatusMessage({ text: `Color "${trimmedName}" is already added.`, type: 'error' });
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }
    setFormColors([...formColors, { name: trimmedName, hex: colorPickerHex }]);
    setColorNameInput('');
  };

  const handleAddQuickColor = (color: { name: string; hex: string }) => {
    const exists = formColors.some(c => c.name.toLowerCase() === color.name.toLowerCase());
    if (!exists) {
      setFormColors([...formColors, color]);
    }
  };

  const handleRemoveColor = (nameToRemove: string) => {
    if (formColors.length <= 1) {
      setStatusMessage({ text: 'A product must have at least one color option.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    setFormColors(formColors.filter(c => c.name !== nameToRemove));
  };

  // Save or Update Product to Firestore
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setStatusMessage({ text: 'Product name is required.', type: 'error' });
      return;
    }
    const parsedPrice = parseFloat(formPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setStatusMessage({ text: 'Please enter a valid price greater than $0.', type: 'error' });
      return;
    }
    if (!formImageUrl.trim()) {
      setStatusMessage({ text: 'Please upload an image or enter an image URL.', type: 'error' });
      return;
    }
    if (formSizes.length === 0) {
      setStatusMessage({ text: 'Please specify at least one size.', type: 'error' });
      return;
    }
    if (formColors.length === 0) {
      setStatusMessage({ text: 'Please specify at least one color option.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const productPayload = {
      name: formName.trim(),
      department: formDepartment,
      price: parsedPrice,
      originalPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : null,
      stockCount: parseInt(formStockCount, 10) || 10,
      inStock: (parseInt(formStockCount, 10) || 10) > 0,
      sku: formSku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
      description: formDescription.trim() || `Brand new authentic ${formName} crafted with premium quality standards.`,
      image: formImageUrl.trim(),
      sizes: formSizes,
      colors: formColors,
      brand: sellerCompanyName,
      sellerCompanyName: sellerCompanyName,
      sellerAddress: formSellerAddress.trim() || defaultSellerAddress,
      sellerUid: sellerUid,
      sellerEmail: sellerEmail,
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewsCount: editingProduct ? (editingProduct.reviewsCount || 1) : 1,
      tags: ['Brand New', formDepartment, sellerCompanyName],
      updatedAt: serverTimestamp()
    };

    try {
      if (editingProduct) {
        // Update document
        const prodRef = doc(db, 'products', editingProduct.id);
        await updateDoc(prodRef, productPayload);
        setStatusMessage({ text: `"${formName}" updated successfully!`, type: 'success' });
      } else {
        // Create document
        await addDoc(collection(db, 'products'), {
          ...productPayload,
          createdAt: serverTimestamp()
        });
        setStatusMessage({ text: `"${formName}" published to ${formDepartment} department!`, type: 'success' });
      }

      setIsFormOpen(false);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setStatusMessage({ text: err.message || 'Failed to save product to database.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (prod: ProductArticle) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.name}" from your catalog?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'products', prod.id));
      setStatusMessage({ text: `Product "${prod.name}" removed from catalog.`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setStatusMessage({ text: err.message || 'Failed to delete product.', type: 'error' });
    }
  };

  // Toggle in stock
  const handleToggleStock = async (prod: ProductArticle) => {
    try {
      const prodRef = doc(db, 'products', prod.id);
      await updateDoc(prodRef, {
        inStock: !prod.inStock,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error('Error toggling stock:', err);
    }
  };

  // Sample catalog loader for sellers who want quick starter items
  const handleLoadSampleInventory = async () => {
    setIsSaving(true);
    try {
      const sampleItem = {
        name: `${sellerCompanyName} Signature Merino Knit`,
        department: 'Clothing',
        price: 145,
        originalPrice: 180,
        stockCount: 30,
        inStock: true,
        sku: `SIG-${Math.floor(100 + Math.random() * 900)}`,
        description: 'Ultra-soft fine gauge knit crafted from 100% sustainable extrafine Australian merino wool with ribbed trims.',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [
          { name: 'Onyx Black', hex: '#111827' },
          { name: 'Camel Tan', hex: '#C19A6B' },
          { name: 'Pure Cream', hex: '#FAF9F6' }
        ],
        brand: sellerCompanyName,
        sellerCompanyName: sellerCompanyName,
        sellerUid: sellerUid,
        sellerEmail: sellerEmail,
        rating: 4.9,
        reviewsCount: 12,
        tags: ['Brand New', 'Clothing', 'Merino'],
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'products'), sampleItem);
      setStatusMessage({ text: 'Sample product added to your catalog!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ text: 'Failed to create sample product.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDeptFilter === 'ALL' || p.department === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [products, searchTerm, selectedDeptFilter]);

  // Aggregate stats
  const totalInventoryUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stockCount ?? 0), 0);
  }, [products]);

  const activeDepartmentsCount = useMemo(() => {
    const depts = new Set(products.map(p => p.department));
    return depts.size;
  }, [products]);

  const averagePrice = useMemo(() => {
    if (products.length === 0) return 0;
    const sum = products.reduce((s, p) => s + p.price, 0);
    return Math.round(sum / products.length);
  }, [products]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20 pt-24 font-sans selection:bg-brand-gold/30">
      {/* Top Banner Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-gold/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-dark text-brand-gold flex items-center justify-center shrink-0 shadow-md border border-brand-gold/30">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold/15 text-brand-dark border border-brand-gold/30">
                  Verified Product Seller
                </span>
                <span className="text-xs text-brand-muted">
                  {sellerEmail}
                </span>
                <button
                  type="button"
                  onClick={() => setIsReviewsOpen(!isReviewsOpen)}
                  className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer shadow-2xs"
                  title="Click to view verified customer reviews"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{sellerAverageRating}★ Rating</span>
                  <span className="text-amber-700 font-normal">({sellerReviews.length} Reviews)</span>
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark">
                {sellerCompanyName}
              </h1>
              <p className="text-xs sm:text-sm text-brand-muted mt-1">
                Product Catalog Management • Real-time live listing in <strong className="text-brand-dark">Shop By Department</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap z-10">
            <button
              onClick={onSwitchToClientView}
              className="px-4 py-2.5 rounded-xl border border-brand-gold/30 bg-white hover:bg-brand-cream text-brand-dark text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs"
            >
              <Eye className="w-4 h-4 text-brand-gold" />
              Storefront Preview
            </button>

            <button
              onClick={handleOpenNewProduct}
              className="px-5 py-2.5 rounded-xl bg-brand-dark text-white hover:bg-brand-gold hover:text-brand-dark text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Status Toast */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "mt-4 p-4 rounded-2xl flex items-center gap-3 shadow-md border text-sm font-medium",
                statusMessage.type === 'success' 
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                  : "bg-red-50 border-red-300 text-red-800"
              )}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white p-5 rounded-2xl border border-brand-gold/15 shadow-xs">
            <div className="flex items-center justify-between text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">
              <span>Active Products</span>
              <ShoppingBag className="w-4 h-4 text-brand-gold" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark">
              {products.length}
            </div>
            <p className="text-[11px] text-brand-muted mt-1">Live in customer catalog</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-gold/15 shadow-xs">
            <div className="flex items-center justify-between text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">
              <span>Departments</span>
              <Layers className="w-4 h-4 text-brand-gold" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark">
              {activeDepartmentsCount}
            </div>
            <p className="text-[11px] text-brand-muted mt-1">Matching SHOP BY DEPARTMENT</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-gold/15 shadow-xs">
            <div className="flex items-center justify-between text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Inventory</span>
              <Package className="w-4 h-4 text-brand-gold" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark">
              {totalInventoryUnits}
            </div>
            <p className="text-[11px] text-brand-muted mt-1">Brand new retail units</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-gold/15 shadow-xs">
            <div className="flex items-center justify-between text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">
              <span>Average Price</span>
              <DollarSign className="w-4 h-4 text-brand-gold" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark">
              ${averagePrice}
            </div>
            <p className="text-[11px] text-brand-muted mt-1">Per brand new article</p>
          </div>

          <div 
            onClick={() => setIsReviewsOpen(!isReviewsOpen)}
            className="bg-white p-5 rounded-2xl border border-brand-gold/30 shadow-xs cursor-pointer hover:border-brand-gold transition-all col-span-2 md:col-span-1"
            title="Click to view client reviews and star rating breakdown"
          >
            <div className="flex items-center justify-between text-brand-muted text-xs font-bold uppercase tracking-wider mb-2">
              <span>Store Rating</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-500 flex items-center gap-1.5">
              <span>{sellerAverageRating}</span>
              <span className="text-xs font-sans text-brand-muted font-normal">({sellerReviews.length})</span>
            </div>
            <p className="text-[11px] text-brand-gold font-bold mt-1 underline">
              {isReviewsOpen ? 'Hide Testimonials' : 'View Verified Reviews →'}
            </p>
          </div>
        </div>

        {/* Seller Customer Reviews Showcase */}
        {isReviewsOpen && (
          <div className="mt-6 p-6 sm:p-8 bg-white rounded-3xl border border-brand-gold/30 shadow-md animate-fadeIn space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-gold/15">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gold block">
                  Customer Reputation & Feedback
                </span>
                <h3 className="text-xl font-serif font-bold text-brand-dark">
                  Verified Reviews for {sellerCompanyName}
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Real feedback left by clients who purchased and received products from your boutique.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{sellerAverageRating} / 5.0</span>
                  <span className="text-amber-700 font-normal">({sellerReviews.length} Ratings)</span>
                </div>
              </div>
            </div>

            {sellerReviews.length === 0 ? (
              <div className="text-center py-12 text-brand-muted text-xs italic">
                <Star className="w-8 h-8 text-brand-gold/30 mx-auto mb-2" />
                No retail customer reviews received yet. Verified ratings will appear here as orders are delivered and picked up.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {sellerReviews.map((rev) => (
                  <div key={rev.id || `${rev.referenceId}-${rev.customerName}`} className="p-4 rounded-2xl bg-brand-cream/30 border border-brand-gold/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={rev.rating} size="xs" />
                        <span className="font-serif font-bold text-brand-dark">{rev.title || 'Verified Order Review'}</span>
                      </div>
                      <span className="text-[10px] text-brand-muted">Ref: {rev.referenceId}</span>
                    </div>
                    <p className="italic text-brand-dark/85">"{rev.comment}"</p>
                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rev.tags.map((t: string) => (
                          <span key={t} className="text-[9px] px-2 py-0.5 bg-white rounded border border-brand-gold/20 text-brand-muted">
                            ✓ {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="pt-2 border-t border-brand-gold/10 flex items-center justify-between text-[11px] text-brand-muted">
                      <span className="font-bold text-brand-dark">{rev.customerName}</span>
                      {rev.recommend && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <ThumbsUp className="w-2.5 h-2.5" /> Recommends
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-brand-gold/15 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, SKU..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl text-xs font-medium border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted shrink-0 mr-1">
              Department:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDeptFilter('ALL')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shrink-0",
                selectedDeptFilter === 'ALL'
                  ? "bg-brand-dark text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              All ({products.length})
            </button>
            {SHOP_DEPARTMENTS.map(dept => {
              const count = products.filter(p => p.department === dept).length;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDeptFilter(dept)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shrink-0",
                    selectedDeptFilter === dept
                      ? "bg-brand-gold text-brand-dark shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  {dept} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Catalog Display */}
        {isLoading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-brand-gold/15">
            <RefreshCw className="w-8 h-8 text-brand-gold animate-spin mx-auto mb-3" />
            <p className="text-sm font-serif font-bold text-brand-dark">Loading your live product articles...</p>
            <p className="text-xs text-brand-muted mt-1">Connecting to Firestore products database</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white rounded-3xl border border-dashed border-brand-gold/30 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-brand-cream/80 text-brand-gold flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-brand-dark mb-1">
              {products.length === 0 ? 'No Products Added Yet' : 'No Matching Products Found'}
            </h3>
            <p className="text-xs text-brand-muted max-w-md mx-auto mb-6">
              {products.length === 0
                ? `Welcome, ${sellerCompanyName}! Start by uploading your first brand new product article. It will appear live under the SHOP BY DEPARTMENT dropdown.`
                : 'Try clearing your search query or department filter.'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={handleOpenNewProduct}
                className="px-6 py-3 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-brand-dark transition-all shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Product
              </button>
              {products.length === 0 && (
                <button
                  onClick={handleLoadSampleInventory}
                  disabled={isSaving}
                  className="px-5 py-3 bg-brand-cream text-brand-dark border border-brand-gold/30 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-xs"
                >
                  Load Sample Product
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-brand-gold/15 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-56 bg-stone-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-dark text-white shadow-xs">
                        Brand New
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-brand-dark shadow-xs border border-brand-gold/20">
                        {product.department}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleToggleStock(product)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs transition-colors",
                          product.inStock
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                        )}
                        title="Click to toggle stock status"
                      >
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      SKU: {product.sku}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
                        {product.brand}
                      </span>
                      <span className="text-xs font-semibold text-stone-500">
                        Stock: <strong className="text-stone-800">{product.stockCount}</strong>
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-brand-dark leading-snug line-clamp-1 mb-2">
                      {product.name}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">
                      {product.description}
                    </p>

                    {/* Price and Original Price (NO DURATION) */}
                    <div className="flex items-baseline gap-2.5 mb-4 pb-3 border-b border-stone-100">
                      <span className="text-2xl font-serif font-bold text-brand-dark">
                        ${product.price}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <span className="text-xs text-stone-400 line-through">
                            ${product.originalPrice}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Save ${(product.originalPrice - product.price).toFixed(0)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Sizes Display */}
                    <div className="mb-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                        <Ruler className="w-3 h-3 text-brand-gold" />
                        Available Sizes ({product.sizes.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.map(size => (
                          <span
                            key={size}
                            className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[11px] font-semibold rounded-md border border-stone-200"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Colors Display */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                        <Palette className="w-3 h-3 text-brand-gold" />
                        Available Colors ({product.colors.length}):
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {product.colors.map(col => (
                          <div
                            key={col.name}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-50 border border-stone-200 text-[10px] font-medium text-stone-700"
                            title={col.name}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span>{col.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Showroom Pickup Address */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-start gap-1.5 text-[11px] text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-stone-700 block text-[10px] uppercase tracking-wider">Pickup Showroom:</span>
                        <span className="truncate block text-stone-600 font-medium">{product.sellerAddress || '450 N Rodeo Dr, Beverly Hills, CA 90210'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 py-3.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-stone-400 font-medium">
                    Department: <strong className="text-stone-700">{product.department}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditProduct(product)}
                      className="p-2 rounded-lg bg-white border border-stone-200 text-stone-700 hover:text-brand-gold hover:border-brand-gold transition-colors shadow-2xs"
                      title="Edit Product"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="p-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors shadow-2xs"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* =============================================================== */}
      {/* Product Creation / Edit Modal */}
      {/* =============================================================== */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-brand-gold/30 my-8 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-brand-gold/15 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                    {sellerCompanyName} • Product Seller Portal
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-brand-dark">
                    {editingProduct ? 'Edit Product Article' : 'List Brand New Product'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-5 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* 1. Department Selection (STRICT MATCH with SHOP BY DEPARTMENT) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand-gold" />
                      Product Department (Matches SHOP BY DEPARTMENT)
                    </label>
                    <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={formDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full appearance-none px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-brand-dark focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none cursor-pointer"
                      required
                    >
                      {SHOP_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gold">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Your product will instantly appear in the storefront under this department.
                  </p>
                </div>

                {/* 2. Product Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                    Product Title / Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Italian Virgin Wool Overcoat, Ergonomic Ceramic Chef Knife"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                  />
                </div>

                {/* 3. Price & Stock (NO DURATION) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                      Price ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.5"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="120.00"
                        className="w-full pl-8 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono font-bold text-brand-dark focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                      MSRP / Original Price ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(e.target.value)}
                        placeholder="160.00"
                        className="w-full pl-8 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono text-stone-700 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                      Inventory Stock Units
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formStockCount}
                      onChange={(e) => setFormStockCount(e.target.value)}
                      placeholder="25"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono text-stone-800 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                </div>

                {/* SKU Code */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                      SKU Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormSku(`OPL-${formDepartment.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[10px] text-brand-gold hover:underline font-bold uppercase"
                    >
                      Regenerate SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. OPL-CLO-4921"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-800 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                  />
                </div>

                {/* Showroom / Storefront Address for Boutique Pickup */}
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                      Showroom / Storefront Address (for Boutique Pickup)
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">
                      Pickup Location
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-2.5 leading-relaxed">
                    When customers choose <strong className="text-brand-dark">Boutique Pickup</strong> in Shopping, this verified showroom address is linked into their checkout, confirmation manifest, and instant dispatch SMS.
                  </p>
                  <div className="relative mb-2">
                    <MapPin className="w-4 h-4 text-brand-gold absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formSellerAddress}
                      onChange={(e) => setFormSellerAddress(e.target.value)}
                      placeholder="e.g. 450 N Rodeo Dr, Beverly Hills, CA 90210"
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-brand-dark font-medium focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Presets:</span>
                    {[
                      '450 N Rodeo Dr, Beverly Hills, CA 90210',
                      '720 5th Ave, New York, NY 10019',
                      '660 N Michigan Ave, Chicago, IL 60611',
                      '333 Post St, San Francisco, CA 94108'
                    ].map(addr => (
                      <button
                        key={addr}
                        type="button"
                        onClick={() => setFormSellerAddress(addr)}
                        className="text-[10px] px-2 py-0.5 bg-white hover:bg-brand-cream border border-stone-200 rounded text-stone-600 transition-colors"
                      >
                        {addr.split(',')[0]} ({addr.split(',')[1]?.trim()})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Product Image Upload / URL */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-brand-gold" />
                      Product Image
                    </label>
                    <div className="flex bg-white p-0.5 rounded-lg border border-stone-200">
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('upload')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                          imageUploadMode === 'upload' ? "bg-brand-dark text-white shadow-2xs" : "text-stone-500"
                        )}
                      >
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('url')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                          imageUploadMode === 'url' ? "bg-brand-dark text-white shadow-2xs" : "text-stone-500"
                        )}
                      >
                        Image URL
                      </button>
                    </div>
                  </div>

                  {imageUploadMode === 'upload' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-brand-gold/40 hover:border-brand-gold hover:bg-brand-cream/30 rounded-xl p-5 text-center cursor-pointer transition-all bg-white"
                      >
                        <Upload className="w-6 h-6 text-brand-gold mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-brand-dark">
                          Click to select image file from your device
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Supports PNG, JPG, WebP up to 2MB (Converted instantly for preview)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-brand-gold outline-none"
                      />
                    </div>
                  )}

                  {/* Image Preview */}
                  {formImageUrl && (
                    <div className="mt-3 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-stone-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">Image Ready</p>
                        <p className="text-[10px] text-stone-400 truncate">
                          {formImageUrl.startsWith('data:') ? 'Local file processed' : formImageUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-md"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. List of Sizes */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-brand-gold" />
                    List of Sizes
                  </label>
                  <p className="text-[11px] text-stone-400 mb-2.5">
                    Click preset buttons to toggle, or type custom sizes (e.g. shoe sizes, dimensions, volume).
                  </p>

                  {/* Preset chips for the active department */}
                  {SIZE_PRESETS_BY_DEPARTMENT[formDepartment] && (
                    <div className="mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                        Recommended for {formDepartment}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SIZE_PRESETS_BY_DEPARTMENT[formDepartment].map(preset => {
                          const isSelected = formSizes.includes(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleTogglePresetSize(preset)}
                              className={cn(
                                "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                                isSelected
                                  ? "bg-brand-dark text-white border-brand-dark shadow-2xs"
                                  : "bg-white text-stone-700 border-stone-300 hover:border-brand-gold"
                              )}
                            >
                              {preset} {isSelected && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Custom Size Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSize();
                        }
                      }}
                      placeholder="Add custom size (e.g., US 11.5, 750ml, King)..."
                      className="flex-1 px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-brand-gold outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSize}
                      className="px-4 py-2 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-brand-dark transition-all"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Selected Sizes Badges */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      Active Sizes for this Product ({formSizes.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {formSizes.map(size => (
                        <span
                          key={size}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-brand-gold/40 text-brand-dark font-semibold text-xs rounded-lg shadow-2xs"
                        >
                          {size}
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(size)}
                            className="text-stone-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. List of Colors */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-brand-gold" />
                    List of Colors (Swatches & Color Names)
                  </label>
                  <p className="text-[11px] text-stone-400 mb-2.5">
                    Specify color options so customers can preview shades and select them during checkout.
                  </p>

                  {/* Quick Color Palette */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      Quick Palette:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_COLOR_PALETTE.map(col => {
                        const isAdded = formColors.some(c => c.name.toLowerCase() === col.name.toLowerCase());
                        return (
                          <button
                            key={col.name}
                            type="button"
                            onClick={() => handleAddQuickColor(col)}
                            disabled={isAdded}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all",
                              isAdded
                                ? "opacity-40 cursor-default bg-stone-200 border-stone-300 text-stone-500"
                                : "bg-white hover:border-brand-gold border-stone-300 text-stone-700 cursor-pointer shadow-2xs"
                            )}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span>{col.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Color Creator */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 mb-3 bg-white p-2.5 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="color"
                        value={colorPickerHex}
                        onChange={(e) => setColorPickerHex(e.target.value)}
                        className="w-10 h-9 rounded-lg border border-stone-300 cursor-pointer bg-transparent"
                        title="Pick color hex"
                      />
                      <span className="text-xs font-mono text-stone-500">{colorPickerHex}</span>
                    </div>

                    <input
                      type="text"
                      value={colorNameInput}
                      onChange={(e) => setColorNameInput(e.target.value)}
                      placeholder="Color Name (e.g. Camel Tan, Forest Green)..."
                      className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:ring-2 focus:ring-brand-gold outline-none w-full"
                    />

                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="px-4 py-2 bg-brand-dark text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-brand-dark transition-all w-full sm:w-auto shrink-0"
                    >
                      + Add Color
                    </button>
                  </div>

                  {/* Selected Colors Badges */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      Active Colors for this Product ({formColors.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {formColors.map(col => (
                        <span
                          key={col.name}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-brand-gold/40 text-brand-dark text-xs font-medium rounded-full shadow-2xs"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(col.name)}
                            className="text-stone-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 7. Product Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                    Product Description & Craftsmanship Details
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe material composition, brand craftsmanship, warranty, and special details..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-brand-gold outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-7 py-3 rounded-xl bg-brand-dark text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-brand-dark transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving Product...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {editingProduct ? 'Update Product' : 'Publish Product to Storefront'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
