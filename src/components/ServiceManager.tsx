import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Star, Filter, Lock, ChevronDown } from 'lucide-react';
import { Service } from '../types';
import { cn } from '../utils';
import { VISIBLE_SERVICE_CATEGORIES, SERVICE_TEMPLATES } from '../constants';

import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface ServiceManagerProps {
  onLogout: () => void;
  providerName: string;
  providerCategory?: string;
  addTrigger?: number;
  user: any;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({ 
  onLogout, 
  providerName, 
  providerCategory,
  addTrigger = 0,
  user
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const effectiveCategory = providerCategory || user?.category || 'Handyman';
  const [filterCategory, setFilterCategory] = useState<string>(effectiveCategory);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>(effectiveCategory);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (effectiveCategory) {
      setFilterCategory(effectiveCategory);
      setSelectedTemplateCategory(effectiveCategory);
    }
  }, [effectiveCategory]);

  const canonicalProviderName = providerName || user?.businessName || user?.displayName || user?.name || 'Registered Service Provider';

  const isMyService = useCallback((s: any) => {
    if (!user) return false;
    // Match by providerId (UID), email, or business name
    const isOwner = (s.providerId && s.providerId === user.uid) ||
      (s.providerId && user.email && s.providerId.toLowerCase() === user.email.toLowerCase()) ||
      (canonicalProviderName && s.providerName && s.providerName.trim().toLowerCase() === canonicalProviderName.trim().toLowerCase());
    
    if (!isOwner) return false;

    // STRICT CATEGORY ENFORCEMENT:
    // A Handyman provider view must ONLY show Handyman services.
    // A Beauty provider view must ONLY show Beauty services.
    // A Kitchen provider view must ONLY show Cloud Kitchen services.
    // A Party Planner provider view must ONLY show Party Planner services.
    if (effectiveCategory) {
      if (effectiveCategory === 'Beauty') {
        return s.category === 'Beauty' || s.category === 'Beauty & Wellness';
      }
      return s.category === effectiveCategory;
    }
    return true;
  }, [user, canonicalProviderName, effectiveCategory]);

  const openModal = useCallback((service?: Partial<Service>, defaultCategory?: string) => {
    const categoryToUse = defaultCategory || service?.category || effectiveCategory;
    const defaultImage = effectiveCategory === 'Handyman'
      ? 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=800'
      : effectiveCategory === 'Cloud Kitchen'
      ? 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&q=80&w=800'
      : effectiveCategory === 'Party Planner'
      ? 'https://images.unsplash.com/photo-1530103862676-fa8c91bbe81b?auto=format&fit=crop&q=80&w=800'
      : 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800';

    setEditingService(service ? {
      ...service,
      category: (service.category || categoryToUse) as any,
      providerName: canonicalProviderName
    } : {
      name: '',
      description: '',
      price: 0,
      duration: effectiveCategory === 'Cloud Kitchen' ? 'Direct Order' : '60 min',
      category: categoryToUse as any,
      image: defaultImage,
      providerName: canonicalProviderName,
      providerRating: 5
    });
    setIsModalOpen(true);
  }, [effectiveCategory, canonicalProviderName, user]);

  useEffect(() => {
    if (addTrigger > 0) {
      openModal();
    }
  }, [addTrigger, openModal]);

  useEffect(() => {
    if (!user) return;

    const servicesRef = collection(db, 'services');
    // Fetch and strictly filter to only the logged-in provider's services
    const unsubscribe = onSnapshot(servicesRef, (snapshot) => {
      const allServices = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          price: typeof d.price === 'number' && !Number.isNaN(d.price) ? d.price : (parseFloat(String(d.price)) || 0),
          providerRating: typeof d.providerRating === 'number' && !Number.isNaN(d.providerRating) ? d.providerRating : 5
        };
      }) as any[];
      const myServices = allServices.filter(isMyService);
      setServices(myServices);
      setIsLoading(false);
    }, (error) => {
      console.error("Services fetch error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, isMyService]);

  const handleQuickAddTemplate = async (template: any, categoryOverride?: string) => {
    if (!user) return;
    setError(null);
    try {
      const targetCat = categoryOverride || effectiveCategory;
      const bName = canonicalProviderName;
      const serviceData = {
        name: template.name,
        description: template.description,
        price: template.price,
        duration: template.duration,
        category: targetCat,
        image: template.image || (targetCat === 'Handyman'
          ? 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=800'
          : 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800'),
        providerId: user.uid,
        providerName: bName,
        providerRating: 5.0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'services'), serviceData);
      setSuccessMsg(`Added "${template.name}" (${targetCat}) to your services!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error("Quick add error:", err);
      setError(err.message || "Failed to add service");
    }
  };

  const handleLoadSampleServices = async (categoryToLoad?: string) => {
    if (!user) return;
    setError(null);
    setIsLoading(true);
    try {
      const targetCat = (categoryToLoad || effectiveCategory) as any;
      const templates = SERVICE_TEMPLATES[targetCat as keyof typeof SERVICE_TEMPLATES] || SERVICE_TEMPLATES['Handyman'] || [];
      const bName = canonicalProviderName;
      const promises = templates.map(t => {
        return addDoc(collection(db, 'services'), {
          name: t.name,
          description: t.description,
          price: t.price,
          duration: t.duration,
          category: targetCat,
          image: t.image,
          providerId: user.uid,
          providerName: bName,
          providerRating: 5.0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await Promise.all(promises);
      setSuccessMsg(`Successfully loaded ${templates.length} sample ${targetCat} services!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Failed to import sample services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !user) {
      setError("Authentication error. Please try logging in again.");
      return;
    }
    setError(null);

    try {
      const finalImage = editingService.image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800';
      const cleanPrice = typeof editingService.price === 'number' && !Number.isNaN(editingService.price)
        ? editingService.price
        : (parseFloat(String(editingService.price)) || 0);
      const cleanRating = typeof editingService.providerRating === 'number' && !Number.isNaN(editingService.providerRating)
        ? editingService.providerRating
        : (parseFloat(String(editingService.providerRating)) || 5);

      if (editingService.id) {
        const { id, ...data } = editingService;
        await updateDoc(doc(db, 'services', id), {
          ...data,
          price: cleanPrice,
          providerRating: cleanRating,
          providerName: canonicalProviderName,
          image: finalImage,
          providerId: editingService.providerId || user.uid,
          updatedAt: serverTimestamp()
        });
        setSuccessMsg(`Updated "${editingService.name}" successfully!`);
      } else {
        const serviceData = {
          ...editingService,
          price: cleanPrice,
          providerRating: cleanRating,
          image: finalImage,
          providerId: user.uid,
          providerName: canonicalProviderName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'services'), serviceData);
        setSuccessMsg(`Created "${editingService.name}" successfully!`);
      }
      setTimeout(() => setSuccessMsg(null), 3500);
      setIsModalOpen(false);
      setEditingService(null);
    } catch (error: any) {
      console.error("Detailed service save error:", error);
      setError(error.message || "Failed to save service");
    }
  };

  const confirmDelete = async () => {
    if (!deletingService) return;
    setIsDeleting(true);
    setError(null);

    try {
      if (deletingService.id) {
        await deleteDoc(doc(db, 'services', deletingService.id));
      }
      setServices(prev => prev.filter(s => s.id !== deletingService.id));
      setSuccessMsg(`Service "${deletingService.name}" was successfully deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setDeletingService(null);
    } catch (error: any) {
      console.error("Delete service error:", error);
      setError(error.message || "Failed to delete service. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Strictly filtered to the active provider view category
  const filteredServices = services;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-serif mb-2">Manage Services</h3>
          <p className="text-brand-muted text-sm">Create, organize, and view your active {effectiveCategory} service catalog.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Provider own services indicator */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-brand-gold/25 shadow-sm text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-brand-dark uppercase tracking-wider">{effectiveCategory} Catalog ({services.length})</span>
          </div>

          <button
            onClick={() => handleLoadSampleServices()}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold/15 border border-brand-gold/40 text-brand-dark rounded-xl hover:bg-brand-gold hover:text-white transition-all text-xs font-bold uppercase tracking-wider shadow-sm"
            title={`Import pre-configured sample ${effectiveCategory} services directly to your catalog`}
          >
            ⚡ Load Sample {effectiveCategory} Services
          </button>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-brand-gold transition-all shadow-md text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm flex items-center justify-between">
          <span className="font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-800 text-xs font-bold uppercase">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 text-xs font-bold uppercase">Dismiss</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="space-y-8">
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-brand-gold/30 p-8">
            <h4 className="text-2xl font-serif mb-2">No {effectiveCategory} Services Found</h4>
            <p className="text-brand-muted max-w-md mx-auto mb-6 text-sm">
              You haven't added any {effectiveCategory} services yet. You can import sample services for {effectiveCategory} with one click, or create custom services below.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => handleLoadSampleServices()}
                className="px-6 py-3 bg-brand-gold text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all shadow-lg flex items-center gap-2"
              >
                ⚡ Import Sample {effectiveCategory} Services
              </button>
              <button 
                onClick={() => openModal()}
                className="px-6 py-3 bg-brand-dark text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold transition-all shadow-lg"
              >
                + Create Custom Service
              </button>
            </div>
          </div>

          {/* Prompt with templates directly if empty */}
          <div className="bg-brand-cream/50 p-8 md:p-12 rounded-[40px] border border-brand-gold/10">
            <h4 className="text-2xl font-serif mb-2 text-center">Quick Start with Templates for All Types</h4>
            <p className="text-brand-muted text-center mb-6 max-w-md mx-auto text-sm">
              Select a service category below to browse templates and add services for any type with 1-click or customized details.
            </p>

            {/* Category selection dropdown for templates */}
            <div className="max-w-xs mx-auto mb-8">
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-muted text-center mb-2">
                Template Category
              </label>
              <div className="relative">
                <select
                  value={selectedTemplateCategory}
                  onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-brand-gold/30 rounded-2xl text-xs font-bold uppercase tracking-wider text-brand-dark focus:border-brand-gold outline-none shadow-sm cursor-pointer"
                >
                  {VISIBLE_SERVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-brand-gold absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(SERVICE_TEMPLATES[selectedTemplateCategory as keyof typeof SERVICE_TEMPLATES] || []).map((template, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-3xl border border-brand-gold/10 hover:border-brand-gold hover:shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                      <img src={template.image} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-serif text-lg">{template.name}</h5>
                      <span className="text-brand-gold font-serif font-bold">${template.price}</span>
                    </div>
                    <p className="text-brand-muted text-xs line-clamp-2 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{template.duration}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold">{selectedTemplateCategory}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-brand-gold/10">
                    <button
                      type="button"
                      onClick={() => handleQuickAddTemplate(template, selectedTemplateCategory)}
                      className="flex-1 py-2 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-gold transition-all"
                    >
                      + Add (1-Click)
                    </button>
                    <button
                      type="button"
                      onClick={() => openModal({ ...template, category: selectedTemplateCategory as any }, selectedTemplateCategory)}
                      className="px-3 py-2 border border-brand-gold/30 text-brand-dark rounded-xl text-xs font-medium hover:bg-brand-cream transition-all"
                    >
                      Customize
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-brand-gold/10 overflow-hidden shadow-sm group"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => openModal(service)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-brand-dark hover:bg-brand-gold hover:text-white transition-all shadow-md"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingService(service)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-md"
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-brand-gold text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                      {service.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-serif">{service.name}</h4>
                    <p className="font-serif text-brand-gold text-lg">${service.price}</p>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-brand-dark">{service.providerName}</span>
                    <span className="flex items-center gap-0.5 text-[10px] bg-brand-cream px-1.5 py-0.5 rounded text-brand-gold">
                      <Star className="w-3 h-3 fill-brand-gold" />
                      {service.providerRating}
                    </span>
                  </div>
                  <p className="text-sm text-brand-muted line-clamp-2 mb-4">{service.description}</p>
                  <div className="flex items-center gap-2 text-xs text-brand-muted font-bold uppercase tracking-widest">
                    <span>{service.duration}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Template Strip */}
          <div className="mt-12 bg-brand-cream/40 p-8 rounded-3xl border border-brand-gold/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="font-serif text-xl">Add More Services by Category</h4>
                <p className="text-xs text-brand-muted">Select any type to quickly add popular templates to your catalog.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLoadSampleServices(selectedTemplateCategory)}
                  className="px-4 py-2 bg-brand-gold text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-dark transition-all self-start sm:self-auto"
                >
                  + Load All {selectedTemplateCategory}
                </button>
              </div>
            </div>

            {/* Category dropdown */}
            <div className="max-w-xs mb-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-muted mb-1.5">
                Template Category
              </label>
              <div className="relative">
                <select
                  value={selectedTemplateCategory}
                  onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-brand-gold/30 rounded-xl text-xs font-bold uppercase tracking-wider text-brand-dark focus:border-brand-gold outline-none shadow-sm cursor-pointer"
                >
                  {VISIBLE_SERVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-brand-gold absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(SERVICE_TEMPLATES[selectedTemplateCategory as keyof typeof SERVICE_TEMPLATES] || SERVICE_TEMPLATES['Beauty'])?.slice(0, 4).map((template, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-brand-gold/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{template.name}</p>
                    <p className="text-xs text-brand-gold font-serif">${template.price} • {template.duration}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate(template, selectedTemplateCategory)}
                    className="px-2.5 py-1.5 bg-brand-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-brand-gold transition-all shrink-0"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {isModalOpen && editingService && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-brand-gold/20 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setIsModalOpen(false);
                }}
                className="absolute top-6 right-6 p-2 hover:bg-brand-cream rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-4xl font-serif mb-8">
                {editingService.id ? 'Edit Service' : 'Add New Service'}
              </h3>

              {!editingService.id && (
                <div className="mb-8 p-6 bg-brand-cream rounded-2xl border border-brand-gold/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-4">Quick Templates</p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_TEMPLATES[editingService.category as any]?.map((template, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingService({ 
                          ...editingService, 
                          ...template,
                          providerName: canonicalProviderName
                        })}
                        className="px-4 py-2 bg-white border border-brand-gold/20 rounded-xl text-xs font-medium hover:border-brand-gold hover:bg-brand-gold/5 transition-all"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Service Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                      value={editingService.name || ''}
                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Category</label>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dark bg-brand-gold/20 px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-gold/30">
                        {effectiveCategory} View
                      </span>
                    </div>
                    <select
                      className="w-full px-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                      value={editingService.category || effectiveCategory}
                      onChange={(e) => setEditingService({ ...editingService, category: e.target.value as any })}
                    >
                      {VISIBLE_SERVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Description</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none resize-none"
                    value={editingService.description || ''}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-widest text-brand-muted flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-brand-gold" />
                        Service Provider Name
                      </label>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dark bg-brand-gold/20 px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-gold/30">
                        <Lock className="w-2.5 h-2.5 text-brand-dark" /> Uneditable
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        readOnly
                        disabled
                        type="text"
                        className="w-full px-4 py-3 bg-brand-cream/80 border border-brand-gold/25 rounded-xl font-medium text-brand-dark cursor-not-allowed select-none opacity-90 shadow-inner"
                        value={canonicalProviderName}
                        title="Service Provider Name is locked to your registered profile and cannot be edited."
                      />
                    </div>
                    <p className="text-[11px] text-brand-muted flex items-center gap-1">
                      <span>✓ Locked to registered name ({canonicalProviderName})</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Provider Rating (0-5)</label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      className="w-full px-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                      value={
                        editingService.providerRating !== undefined && !Number.isNaN(editingService.providerRating)
                          ? String(editingService.providerRating)
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingService({
                          ...editingService,
                          providerRating: val === '' ? ('' as any) : (parseFloat(val) || 0)
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Price ($)</label>
                    <input
                      required
                      type="number"
                      step="any"
                      min="0"
                      className="w-full px-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                      value={
                        editingService.price !== undefined && !Number.isNaN(editingService.price)
                          ? String(editingService.price)
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingService({
                          ...editingService,
                          price: val === '' ? ('' as any) : (parseFloat(val) || 0)
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Duration (e.g., 60 min)</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                      value={editingService.duration || ''}
                      onChange={(e) => setEditingService({ ...editingService, duration: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                    <input
                      type="url"
                      className="w-full pl-12 pr-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                      value={editingService.image || ''}
                      onChange={(e) => setEditingService({ ...editingService, image: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-6 flex flex-wrap gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-brand-dark text-white rounded-xl font-medium hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingService.id ? 'Update Service' : 'Create Service'}
                  </button>
                  {editingService.id && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = services.find(s => s.id === editingService.id) || (editingService as Service);
                        setIsModalOpen(false);
                        setDeletingService(target);
                      }}
                      className="px-6 py-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      title="Delete this service"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                    }}
                    className="px-8 py-4 border border-brand-gold/20 rounded-xl font-medium hover:bg-brand-cream transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App Delete Confirmation Modal (Reliable in iframe, no window.confirm) */}
      <AnimatePresence>
        {deletingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-100 relative"
            >
              <button 
                type="button"
                onClick={() => setDeletingService(null)} 
                disabled={isDeleting}
                className="absolute top-5 right-5 text-brand-muted hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100 shadow-sm">
                <Trash2 className="w-8 h-8" />
              </div>

              <h4 className="text-2xl font-serif text-center mb-2">Delete Service?</h4>
              <p className="text-center text-sm text-brand-muted mb-6">
                Are you sure you want to delete <strong className="text-brand-dark font-semibold">"{deletingService.name}"</strong>? This will permanently remove it from your services.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingService(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 bg-brand-cream text-brand-dark rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-red-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
