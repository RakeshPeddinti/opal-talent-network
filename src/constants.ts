export const SERVICE_CATEGORIES = [
  'Beauty',
  'Plumbing',
  'Roofing',
  'Handyman',
  'Electric',
  'Pest Control',
  'Party Planner',
  'Cloud Kitchen'
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

export const FEATURE_FLAGS: Record<ServiceCategory, boolean> = {
  'Beauty': true,
  'Plumbing': false,
  'Roofing': false,
  'Handyman': true,
  'Electric': false,
  'Pest Control': false,
  'Party Planner': true,
  'Cloud Kitchen': true
};

export const VISIBLE_SERVICE_CATEGORIES = SERVICE_CATEGORIES.filter(cat => FEATURE_FLAGS[cat]) as ServiceCategory[];

import { ProductArticle } from './types';

export const SHOP_DEPARTMENTS = [
  'Clothing',
  'Shoes',
  'Kitchen wear',
  'Autocare',
  'Home & Living',
  'Electronics',
  'Beauty & Personal Care'
] as const;

export type ShopDepartment = typeof SHOP_DEPARTMENTS[number];

export const DEPARTMENT_ITEMS: Record<string, ProductArticle[]> = {
  'Clothing': [
    {
      id: 'prod-clo-01',
      name: 'Italian Cashmere Blend Tailored Overcoat',
      description: 'Double-breasted structured silhouette crafted from virgin wool and Mongolian cashmere with horn button closure.',
      price: 280,
      originalPrice: 350,
      department: 'Clothing',
      brand: 'Milano Sartoriale',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 84,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Camel Tan', hex: '#c19a6b' },
        { name: 'Charcoal Grey', hex: '#374151' },
        { name: 'Midnight Black', hex: '#111827' }
      ],
      inStock: true,
      stockCount: 14,
      sku: 'CLO-CASH-01',
      tags: ['Brand New', 'Cashmere', 'Autumn/Winter']
    },
    {
      id: 'prod-clo-02',
      name: 'Mulberry Silk Evening Midi Dress',
      description: 'Bias-cut 100% 19mm mulberry silk with delicate cowl neckline and adjustable French seam straps.',
      price: 195,
      originalPrice: 240,
      department: 'Clothing',
      brand: 'Aura Atelier',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800',
      rating: 5.0,
      reviewsCount: 62,
      sizes: ['XS', 'S', 'M', 'L'],
      colors: [
        { name: 'Emerald Green', hex: '#065f46' },
        { name: 'Champagne Gold', hex: '#d4af37' },
        { name: 'Ruby Wine', hex: '#881337' }
      ],
      inStock: true,
      stockCount: 8,
      sku: 'CLO-SILK-02',
      tags: ['100% Pure Silk', 'Evening Wear']
    },
    {
      id: 'prod-clo-03',
      name: 'Organic Pima Cotton Oxford Shirt',
      description: 'Long-staple Peruvian pima cotton with mother-of-pearl buttons, single-needle tailoring, and button-down collar.',
      price: 85,
      department: 'Clothing',
      brand: 'Heritage Clothiers',
      image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviewsCount: 119,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Crisp White', hex: '#f8fafc' },
        { name: 'Sky Blue', hex: '#93c5fd' },
        { name: 'Navy Stripe', hex: '#1e3a8a' }
      ],
      inStock: true,
      stockCount: 35,
      sku: 'CLO-SHIRT-03',
      tags: ['Organic Cotton', 'Essential']
    },
    {
      id: 'prod-clo-04',
      name: 'Structured French Linen Leisure Blazer',
      description: 'Unstructured breathable Normandy linen blazer, patch pockets, half-lined for effortless summer sophistication.',
      price: 165,
      originalPrice: 210,
      department: 'Clothing',
      brand: 'Riviera Fine Garments',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 47,
      sizes: ['38R', '40R', '42R', '44R'],
      colors: [
        { name: 'Oatmeal Natural', hex: '#d6c7b2' },
        { name: 'Deep Navy', hex: '#1e293b' },
        { name: 'Sage Olive', hex: '#4d7c0f' }
      ],
      inStock: true,
      stockCount: 11,
      sku: 'CLO-BLAZ-04',
      tags: ['French Linen', 'Breathable']
    }
  ],
  'Shoes': [
    {
      id: 'prod-sho-01',
      name: 'Handcrafted Italian Calfskin Chelsea Boots',
      description: 'Full-grain Tuscan calf leather with Goodyear welted Dainite rubber sole and reinforced pull tabs.',
      price: 220,
      originalPrice: 275,
      department: 'Shoes',
      brand: 'Vero Cuoio Firenze',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 93,
      sizes: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
      colors: [
        { name: 'Cognac Brown', hex: '#78350f' },
        { name: 'Obsidian Black', hex: '#0f172a' },
        { name: 'Dark Walnut', hex: '#451a03' }
      ],
      inStock: true,
      stockCount: 16,
      sku: 'SHO-CHEL-01',
      tags: ['Tuscan Leather', 'Goodyear Welt']
    },
    {
      id: 'prod-sho-02',
      name: 'Minimalist Low-Top Leather Sneakers',
      description: 'Buttery Italian nappa leather, cushioned memory foam insole, and vulcanized margom-style cupsole.',
      price: 145,
      department: 'Shoes',
      brand: 'Monochrome Footwear',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviewsCount: 140,
      sizes: ['US 7.5', 'US 8.5', 'US 9.5', 'US 10.5', 'US 11.5'],
      colors: [
        { name: 'Pure White', hex: '#f9fafb' },
        { name: 'Chalk & Gum', hex: '#e2e8f0' },
        { name: 'Triple Black', hex: '#18181b' }
      ],
      inStock: true,
      stockCount: 28,
      sku: 'SHO-SNEAK-02',
      tags: ['Nappa Leather', 'All Day Comfort']
    },
    {
      id: 'prod-sho-03',
      name: 'Full-Brogue Leather Oxford Dress Shoes',
      description: 'Hand-burnished museum calf leather, closed lacing system, and bevelled waist leather outsole.',
      price: 240,
      originalPrice: 290,
      department: 'Shoes',
      brand: 'Kingsman Cobblers',
      image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=800',
      rating: 5.0,
      reviewsCount: 51,
      sizes: ['US 8', 'US 8.5', 'US 9', 'US 10', 'US 11'],
      colors: [
        { name: 'Burnished Tan', hex: '#92400e' },
        { name: 'Polished Black', hex: '#09090b' },
        { name: 'Oxblood Burgundy', hex: '#4c0519' }
      ],
      inStock: true,
      stockCount: 9,
      sku: 'SHO-OXFD-03',
      tags: ['Hand Burnished', 'Formal Luxury']
    },
    {
      id: 'prod-sho-04',
      name: 'Waterproof Nubuck Alpine Trail Boots',
      description: 'Seam-sealed oiled nubuck with Vibram Arctic grip lug sole and padded merino wool collar.',
      price: 175,
      department: 'Shoes',
      brand: 'Peak & Trail Outfitters',
      image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 78,
      sizes: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
      colors: [
        { name: 'Saddle Tan', hex: '#b45309' },
        { name: 'Forest Green', hex: '#14532d' },
        { name: 'Storm Grey', hex: '#4b5563' }
      ],
      inStock: true,
      stockCount: 15,
      sku: 'SHO-TRAL-04',
      tags: ['Waterproof', 'Vibram Sole']
    }
  ],
  'Kitchen wear': [
    {
      id: 'prod-kit-01',
      name: '67-Layer Damascus Steel 8" Chef Knife',
      description: 'Japanese VG-10 core forged with 66 alternating stainless steel layers and ergonomic stabilized burlwood octagonal handle.',
      price: 135,
      originalPrice: 175,
      department: 'Kitchen wear',
      brand: 'Sakai Damascus Forged',
      image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800',
      rating: 5.0,
      reviewsCount: 112,
      sizes: ['8-Inch Chef', '6-Inch Utility', '3.5-Inch Paring', '3-Piece Master Set'],
      colors: [
        { name: 'Burlwood Amber', hex: '#78350f' },
        { name: 'Ebony Resin', hex: '#18181b' },
        { name: 'Ocean Pearl Hybrid', hex: '#1d4ed8' }
      ],
      inStock: true,
      stockCount: 22,
      sku: 'KIT-KNIF-01',
      tags: ['VG-10 Steel', 'Razor Sharp', '67 Layers']
    },
    {
      id: 'prod-kit-02',
      name: 'Enameled Cast Iron Dutch Oven (5.5 Qt)',
      description: 'Heavyweight enameled cast iron delivering superior heat retention and self-basting lid condensation rings.',
      price: 160,
      originalPrice: 200,
      department: 'Kitchen wear',
      brand: 'Fonte Royale Cookware',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 168,
      sizes: ['3.5 Quart', '5.5 Quart', '7.0 Quart Large'],
      colors: [
        { name: 'Cerise Red', hex: '#dc2626' },
        { name: 'Matte Onyx', hex: '#1c1917' },
        { name: 'Provence Lilac', hex: '#a855f7' },
        { name: 'Ocean Teal', hex: '#0f766e' }
      ],
      inStock: true,
      stockCount: 19,
      sku: 'KIT-DUTCH-02',
      tags: ['Heavy Cast Iron', 'Oven Safe 500°F']
    },
    {
      id: 'prod-kit-03',
      name: 'Precision Temperature Gooseneck Pour-Over Kettle',
      description: 'Strix-controlled rapid boil with 1-degree precision dial, built-in brew stopwatch, and ergonomic counterbalanced handle.',
      price: 95,
      department: 'Kitchen wear',
      brand: 'Aura Barista Lab',
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviewsCount: 88,
      sizes: ['0.9 Liter Compact', '1.2 Liter Standard'],
      colors: [
        { name: 'Matte Black', hex: '#262626' },
        { name: 'Brushed Copper', hex: '#b45309' },
        { name: 'Mirror Stainless', hex: '#cbd5e1' }
      ],
      inStock: true,
      stockCount: 30,
      sku: 'KIT-KETT-03',
      tags: ['Electric Gooseneck', 'Brew Stopwatch']
    },
    {
      id: 'prod-kit-04',
      name: 'Hand-Carved End-Grain Walnut Butcher Block',
      description: 'Sustainably sourced American black walnut with juice groove and side finger grips, pre-treated with organic beeswax.',
      price: 85,
      originalPrice: 110,
      department: 'Kitchen wear',
      brand: 'Timber & Hearth Craft',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 75,
      sizes: ['Medium (12x16")', 'Large (15x20")', 'Chef Block (18x24")'],
      colors: [
        { name: 'American Walnut', hex: '#451a03' },
        { name: 'Maple & Cherry Stripe', hex: '#78350f' }
      ],
      inStock: true,
      stockCount: 12,
      sku: 'KIT-BLOK-04',
      tags: ['End Grain', 'Beeswax Finish']
    }
  ],
  'Autocare': [
    {
      id: 'prod-aut-01',
      name: 'Pro Hydrophobic 9H Nano-Ceramic Coating System',
      description: 'True 9H hardness multi-year nano-quartz liquid glass providing intense water beading, UV rejection, and mirror reflections.',
      price: 89,
      originalPrice: 120,
      department: 'Autocare',
      brand: 'Apex NanoTech Auto',
      image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=800',
      rating: 5.0,
      reviewsCount: 204,
      sizes: ['30ml Single Car Kit', '50ml SUV Kit', '100ml Multi-Vehicle Master'],
      colors: [
        { name: 'Diamond Gloss Shield', hex: '#38bdf8' },
        { name: 'Stealth Satin Barrier', hex: '#475569' }
      ],
      inStock: true,
      stockCount: 42,
      sku: 'AUT-CER-01',
      tags: ['9H Hardness', '3-Year Hydrophobic']
    },
    {
      id: 'prod-aut-02',
      name: 'Cordless Dual-Action Orbital Car Polisher & Buffer',
      description: 'Brushless motor with 6 variable speeds (2000-5000 OPM), dual 4.0Ah lithium batteries, and 5-inch backing pad.',
      price: 149,
      originalPrice: 189,
      department: 'Autocare',
      brand: 'Velocity Detailing Tools',
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 96,
      sizes: ['5-Inch Standard Kit', '3-Inch & 5-Inch Dual Head Bundle'],
      colors: [
        { name: 'Carbon & Gold', hex: '#d97706' },
        { name: 'Titanium Grey', hex: '#334155' }
      ],
      inStock: true,
      stockCount: 18,
      sku: 'AUT-POL-02',
      tags: ['Cordless', 'Brushless Motor']
    },
    {
      id: 'prod-aut-03',
      name: 'Ultra-Plush Korean 1200 GSM Twist Loop Drying Towel',
      description: 'Zero-scratch banded edge microfiber capable of drying an entire full-size SUV in a single swipe without wringing.',
      price: 36,
      department: 'Autocare',
      brand: 'ShineGuard Detailing',
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviewsCount: 182,
      sizes: ['20x30" Large (2-Pack)', '25x36" Extra Large (2-Pack)'],
      colors: [
        { name: 'Gunmetal Grey', hex: '#4b5563' },
        { name: 'Electric Blue', hex: '#2563eb' },
        { name: 'High-Viz Orange', hex: '#ea580c' }
      ],
      inStock: true,
      stockCount: 50,
      sku: 'AUT-TWL-03',
      tags: ['1200 GSM', 'Scratch-Free']
    },
    {
      id: 'prod-aut-04',
      name: 'Heavy-Duty Brass Snow Foam Cannon with Wide Mouth',
      description: 'Precision adjustable soap nozzle and wide stabilization base producing ultra-thick shaving cream foam blankets.',
      price: 48,
      department: 'Autocare',
      brand: 'HydroFoam Labs',
      image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 133,
      sizes: ['1/4" Quick Connect', 'M22 Pressure Adapter'],
      colors: [
        { name: 'Translucent Amber Tank', hex: '#d97706' },
        { name: 'Clear Graduated Tank', hex: '#e2e8f0' }
      ],
      inStock: true,
      stockCount: 25,
      sku: 'AUT-FOAM-04',
      tags: ['Solid Brass Core', 'Wide Stability Base']
    }
  ],
  'Home & Living': [
    {
      id: 'prod-hom-01',
      name: '100% French Stonewashed Linen Duvet & Sheet Set',
      description: 'Woven from harvested Normandy flax, pre-washed for vintage softness, naturally thermoregulating for year-round sleep.',
      price: 195,
      originalPrice: 245,
      department: 'Home & Living',
      brand: 'Linen Atelier Paris',
      image: 'https://images.unsplash.com/photo-1558882224-dda166733046?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 147,
      sizes: ['Twin', 'Full/Queen', 'King', 'Cal King'],
      colors: [
        { name: 'Sand Dunes', hex: '#d6c7b2' },
        { name: 'Slate Charcoal', hex: '#334155' },
        { name: 'Terracotta Rust', hex: '#c2410c' },
        { name: 'Forest Moss', hex: '#166534' }
      ],
      inStock: true,
      stockCount: 16,
      sku: 'HOM-LNN-01',
      tags: ['French Flax', 'Thermoregulating']
    },
    {
      id: 'prod-hom-02',
      name: 'Solid Travertine Marble Fluted Table Lamp',
      description: 'Honest solid natural travertine base with geometric fluting, antique brass fittings, and textured linen drum shade.',
      price: 140,
      department: 'Home & Living',
      brand: 'Lumiere Architectural',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
      rating: 5.0,
      reviewsCount: 42,
      sizes: ['Tabletop 15" Height', 'Grand Accent 20" Height'],
      colors: [
        { name: 'Warm Ivory Travertine', hex: '#f5f5f4' },
        { name: 'Nero Marquina Black', hex: '#1c1917' }
      ],
      inStock: true,
      stockCount: 7,
      sku: 'HOM-LMP-02',
      tags: ['Natural Travertine', 'Dimmable']
    },
    {
      id: 'prod-hom-03',
      name: 'Hand-Poured Soy Wax Botanical Candle & Brass Cloche',
      description: 'Slow-burning organic soy wax, crackling wooden wicks, and pure essential oil scent profiles in hand-blown amber glass.',
      price: 42,
      department: 'Home & Living',
      brand: 'Botanique Maison',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviewsCount: 110,
      sizes: ['8 oz (45 hr burn)', '14 oz 3-Wick (80 hr burn)'],
      colors: [
        { name: 'Smoked Vanilla & Amber', hex: '#d97706' },
        { name: 'Santal & Cedar', hex: '#78350f' },
        { name: 'Bergamot & White Fig', hex: '#059669' }
      ],
      inStock: true,
      stockCount: 38,
      sku: 'HOM-CNDL-03',
      tags: ['Organic Soy', 'Wood Wick']
    }
  ],
  'Electronics': [
    {
      id: 'prod-ele-01',
      name: 'Active Noise-Cancelling Spatial Wireless Headphones',
      description: 'Custom 40mm bio-cellulose drivers, 38-hour battery, hybrid ANC with transparency mode, and ultra-plush protein leather.',
      price: 269,
      originalPrice: 329,
      department: 'Electronics',
      brand: 'Acoustic SoundCraft',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
      rating: 5.0,
      reviewsCount: 230,
      sizes: ['Standard Ergonomic Over-Ear'],
      colors: [
        { name: 'Matte Obsidian', hex: '#0f172a' },
        { name: 'Moonlight Silver', hex: '#cbd5e1' },
        { name: 'Champagne Rose', hex: '#fda4af' }
      ],
      inStock: true,
      stockCount: 21,
      sku: 'ELE-HEAD-01',
      tags: ['Lossless Audio', '38h Battery', 'Spatial ANC']
    },
    {
      id: 'prod-ele-02',
      name: '4K Ultra-Portable Smart Cinema Projector',
      description: 'Native 4K HDR10+ with 1800 ANSI lumens, auto-keystone autofocus, built-in Harman Kardon audio, and Android TV streaming.',
      price: 399,
      originalPrice: 470,
      department: 'Electronics',
      brand: 'Lumina Tech Vision',
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 88,
      sizes: ['Compact Cinema Edition (2.4 lbs)'],
      colors: [
        { name: 'Space Grey Anodized', hex: '#374151' },
        { name: 'Arctic Glacier White', hex: '#f8fafc' }
      ],
      inStock: true,
      stockCount: 10,
      sku: 'ELE-PROJ-02',
      tags: ['4K Cinema', 'Harman Kardon Audio']
    },
    {
      id: 'prod-ele-03',
      name: 'Magnetic 3-in-1 Fast Wireless Charging Station',
      description: 'Simultaneously fast charges iPhone, Apple Watch, and AirPods with 15W Qi2 certified magnetic alignment and solid walnut base.',
      price: 68,
      department: 'Electronics',
      brand: 'ChargeVolt Pro',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      rating: 4.8,
      reviewsCount: 165,
      sizes: ['Desk Compact Pad'],
      colors: [
        { name: 'Walnut & Gunmetal', hex: '#451a03' },
        { name: 'Matte Black Anodized', hex: '#18181b' },
        { name: 'Frost Silver Aluminum', hex: '#e2e8f0' }
      ],
      inStock: true,
      stockCount: 33,
      sku: 'ELE-CHRG-03',
      tags: ['Qi2 15W Fast Charge', 'Solid Wood']
    }
  ],
  'Beauty & Personal Care': [
    {
      id: 'prod-bea-01',
      name: 'Pure Botanical Cold-Pressed Face Oil & Jade Ritual Set',
      description: 'Formulated with organic rosehip, squalane, and prickly pear seed oil alongside an authentic hand-carved jade gua sha stone.',
      price: 62,
      originalPrice: 78,
      department: 'Beauty & Personal Care',
      brand: 'Opal Wellness Botanicals',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 142,
      sizes: ['30ml Ritual Set', '50ml Deluxe Master Set'],
      colors: [
        { name: 'Imperial Jade Green', hex: '#059669' },
        { name: 'Rose Quartz Pink', hex: '#f43f5e' }
      ],
      inStock: true,
      stockCount: 29,
      sku: 'BEA-ROIL-01',
      tags: ['100% Organic', 'Cold-Pressed', 'Gua Sha Included']
    },
    {
      id: 'prod-bea-02',
      name: 'Ionic High-Speed Professional Ceramic Hair Dryer',
      description: '110,000 RPM brushless motor delivering 200 million negative ions, thermostatic intelligent heat control to prevent frizz.',
      price: 185,
      originalPrice: 225,
      department: 'Beauty & Personal Care',
      brand: 'LuxeAir Styling Tech',
      image: 'https://images.unsplash.com/photo-1522337660859-02fbefce4ff4?auto=format&fit=crop&q=80&w=800',
      rating: 4.9,
      reviewsCount: 104,
      sizes: ['Salon Pro Set (3 Magnetic Nozzles Included)'],
      colors: [
        { name: 'Matte Rose Gold', hex: '#be185d' },
        { name: 'Graphite Charcoal', hex: '#334155' },
        { name: 'Pearl Lustre White', hex: '#f8fafc' }
      ],
      inStock: true,
      stockCount: 15,
      sku: 'BEA-DRYR-02',
      tags: ['110k RPM Brushless', 'Intelligent Heat Sensor']
    }
  ]
};


export const SERVICE_TEMPLATES: Record<ServiceCategory, Array<{ name: string, description: string, price: number, duration: string, image: string }>> = {
  'Beauty': [
    { name: 'Classic Haircut', description: 'Professional haircut and styling.', price: 50, duration: '45 min', image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800' },
    { name: 'Facial Treatment', description: 'Deep cleansing and hydration.', price: 80, duration: '60 min', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800' },
    { name: 'Pedicure Spa', description: 'Relaxing foot soak, exfoliation, and nail care.', price: 45, duration: '45 min', image: 'https://images.unsplash.com/photo-1519415510236-8559b1985602?auto=format&fit=crop&q=80&w=800' },
    { name: 'Manicure Deluxe', description: 'Complete hand care with premium polish.', price: 35, duration: '30 min', image: 'https://images.unsplash.com/photo-1604654894610-df490668711d?auto=format&fit=crop&q=80&w=800' },
    { name: 'Eyebrows Shaping', description: 'Professional eyebrow shaping and threading.', price: 25, duration: '20 min', image: 'https://images.unsplash.com/photo-1522337660859-02fbefce4ff4?auto=format&fit=crop&q=80&w=800' },
    { name: 'Golden Facial', description: 'Premium 24K gold leaf facial treatment.', price: 120, duration: '75 min', image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Designer Haircut', description: 'Custom haircut tailored to your face shape.', price: 65, duration: '60 min', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800' },
    { name: 'Hair Colouring', description: 'Professional hair coloring and highlights.', price: 90, duration: '120 min', image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800' }
  ],
  'Plumbing': [
    { name: 'Leak Repair', description: 'Fixing leaky faucets and pipes.', price: 120, duration: '60 min', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800' },
    { name: 'Drain Cleaning', description: 'Professional drain unclogging.', price: 90, duration: '45 min', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800' }
  ],
  'Roofing': [
    { name: 'Roof Inspection', description: 'Complete structural assessment.', price: 100, duration: '60 min', image: 'https://images.unsplash.com/photo-1632759162353-194941ee24fd?auto=format&fit=crop&q=80&w=800' },
    { name: 'Gutter Cleaning', description: 'Removal of debris and blockage.', price: 75, duration: '90 min', image: 'https://images.unsplash.com/photo-1517646288273-96b9624b7ecd?auto=format&fit=crop&q=80&w=800' }
  ],
  'Handyman': [
    { name: 'Furniture Assembly', description: 'Expert assembly of flat-pack furniture, desks, bed frames, and shelving units.', price: 75, duration: '60 min', image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=800' },
    { name: 'TV & Art Mounting', description: 'Secure wall mounting of televisions, heavy mirrors, artwork, and wall shelves.', price: 65, duration: '45 min', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800' },
    { name: 'Drywall & Hole Patching', description: 'Seamless drywall patching, hole filling, sanding, and smooth wall repair.', price: 90, duration: '60 min', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800' },
    { name: 'Door & Fixture Repair', description: 'Fixing squeaky hinges, doorknobs, cabinet handles, and minor hardware adjustments.', price: 80, duration: '45 min', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800' }
  ],
  'Electric': [
    { name: 'Outlet Installation', description: 'New electrical outlet setup.', price: 110, duration: '60 min', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800' },
    { name: 'Light Fixture Repair', description: 'Fixing or replacing lights.', price: 95, duration: '45 min', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800' }
  ],
  'Pest Control': [
    { name: 'General Treatment', description: 'Standard pest protection.', price: 130, duration: '60 min', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=800' },
    { name: 'Termite Inspection', description: 'Detailed termite check.', price: 150, duration: '90 min', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=800' }
  ],
  'Party Planner': [
    { name: 'Event Consultation', description: 'Initial planning session.', price: 100, duration: '60 min', image: 'https://images.unsplash.com/photo-1530103862676-fa8c91bbe81b?auto=format&fit=crop&q=80&w=800' },
    { name: 'Decoration Setup', description: 'On-site venue decoration.', price: 200, duration: '120 min', image: 'https://images.unsplash.com/photo-1533281808624-e9b07b4294ff?auto=format&fit=crop&q=80&w=800' }
  ],
  'Cloud Kitchen': [
    { name: 'Meal Prep Subscription', description: 'Weekly healthy meal planning.', price: 150, duration: '30 min', image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&q=80&w=800' },
    { name: 'Bulk Catering Order', description: 'Large scale food preparation.', price: 300, duration: '180 min', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800' }
  ]
};

export const TALENT_NETWORK_MODULES = [
  'Open Requirements (Single-Liners)',
  'Registered Candidate Directory',
  'My Professional Profile',
  'Publish Requirement (Vendors)'
] as const;

export type TalentNetworkModule = typeof TALENT_NETWORK_MODULES[number];
