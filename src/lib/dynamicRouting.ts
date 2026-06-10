/**
 * Dynamic Routing System for Multi-Device Storefronts
 * Supports App-First fallback routing for Mobile (Universal/App Links)
 * and Web-First fallback routing for Desktop platforms.
 */

export const DEFAULT_SOCIAL_CHANNELS = {
  whatsapp: '213550000000', // Algerian WhatsApp Country Prefix + Phone Number template
  instagram: 'shoplix',      // Instagram profile handle (or complete HTTPS link)
  facebook: 'shoplix.dz',    // Facebook page identification
  telegram: 'shoplix_dz',    // Telegram channel reference handle
};

export interface DeviceInfo {
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isDesktop: boolean;
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isMobile: false, isAndroid: false, isIOS: false, isDesktop: true };
  }
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  
  // Android detection
  const isAndroid = /android/i.test(ua);
  
  const isMobile = isAndroid || isIOS;
  
  return {
    isMobile,
    isAndroid,
    isIOS,
    isDesktop: !isMobile
  };
}

/**
 * Builds a device-aware, high-performance link with fallback.
 * Uses Universal Links on iOS and App Links on Android for an App-First experience.
 * On desktop, routes through secure HTTPS browser fallbacks (e.g. WhatsApp Web, Web Instagram).
 */
export function getRouteUrl(type: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'store' | 'track' | 'contact', customValue?: string): string {
  const { isMobile } = getDeviceInfo();
  const value = customValue || DEFAULT_SOCIAL_CHANNELS[type as keyof typeof DEFAULT_SOCIAL_CHANNELS] || '';

  switch (type) {
    case 'whatsapp': {
      // Clean phone number: remove any leading +, non-digits
      const phone = value.replace(/\D/g, '');
      const defaultPhone = phone || '213550000000';
      if (isMobile) {
        // Direct mobile universal link (opens app automatically on iOS/Android if installed)
        return `https://wa.me/${defaultPhone}`;
      } else {
        // Desktop best behavior (routes to api.whatsapp.com which prompts Desktop client or Whatsapp Web seamlessly)
        return `https://api.whatsapp.com/send?phone=${defaultPhone}`;
      }
    }
    
    case 'instagram': {
      // If full HTTP link is provided, return as is (which will act as Universal Link)
      if (value.startsWith('http')) {
        return value;
      }
      // If it's a handle, build an elegant HTTPS URL
      // This behaves as a Universal Link on modern smartphones (intercepted by Instagram native client)
      return `https://instagram.com/${value.replace('@', '')}`;
    }

    case 'facebook': {
      if (value.startsWith('http')) {
        return value;
      }
      return `https://facebook.com/${value}`;
    }

    case 'telegram': {
      if (value.startsWith('http')) {
        return value;
      }
      // Standard Telegram HTTPS Universal link: t.me
      return `https://t.me/${value.startsWith('@') ? value.slice(1) : value}`;
    }

    case 'store': {
      // Universal storefront/native routing link
      // Falls back to the current origin if no app/custom URL is absolute
      if (value.startsWith('http') || value.startsWith('/')) {
        return value;
      }
      return `https://${value}`;
    }

    case 'track': {
      // Standard order tracking. Since there is no custom system, 
      // let's direct them to contact us via WhatsApp for live tracking support,
      // or open a clean pre-filled WhatsApp message.
      const phone = DEFAULT_SOCIAL_CHANNELS.whatsapp;
      const msg = encodeURIComponent("مرحباً، أود تتبع حالة طلبي من فضلك.");
      if (isMobile) {
        return `https://wa.me/${phone}?text=${msg}`;
      } else {
        return `https://api.whatsapp.com/send?phone=${phone}&text=${msg}`;
      }
    }

    case 'contact': {
      // Direct Live Support WhatsApp/Call channel
      const phone = DEFAULT_SOCIAL_CHANNELS.whatsapp;
      const msg = encodeURIComponent("السلام عليكم، لدي استفسار بخصوص المتجر.");
      if (isMobile) {
        return `https://wa.me/${phone}?text=${msg}`;
      } else {
        return `https://api.whatsapp.com/send?phone=${phone}&text=${msg}`;
      }
    }

    default:
      return value.startsWith('http') ? value : `https://${value}`;
  }
}

/**
 * Executes a safe device-aware redirection.
 * Respects sandbox environments and prevents common browser popup blocked errors.
 */
export function navigateDeviceAware(type: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'store' | 'track' | 'contact', customValue?: string): void {
  const url = getRouteUrl(type, customValue);
  
  // Safe opening via blank window reference
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) {
    win.focus();
  } else {
    // If popup-blocker triggers, fallback gracefully
    window.location.href = url;
  }
}
