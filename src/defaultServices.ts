import { Service } from './types';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Empty default services catalog - all services are strictly created and managed in Firestore by providers
export const ALL_DEFAULT_SERVICES: Service[] = [];

export const DEFAULT_BEAUTY_SERVICES: Service[] = [];

/**
 * Seeds beauty sample services to Firestore for a specific provider if explicitly requested.
 */
export async function seedBeautyServicesToFirestore(targetProviderId?: string, targetProviderName?: string) {
  const providerId = targetProviderId || 'provider-opal-beauty';
  const providerName = targetProviderName || 'Opal Luxury Salon';
  const servicesRef = collection(db, 'services');

  const sampleServices: Omit<Service, 'id'>[] = [
    {
      name: 'Classic Haircut',
      description: 'Professional precision haircut and styling.',
      price: 50,
      duration: '45 min',
      category: 'Beauty',
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800',
      providerName,
      providerRating: 5.0,
      providerId
    }
  ];

  const promises = sampleServices.map(service => {
    return addDoc(servicesRef, {
      ...service,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  return await Promise.all(promises);
}
