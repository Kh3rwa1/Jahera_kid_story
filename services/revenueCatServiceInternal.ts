// CACHE BUSTER: 2026-04-09T01:50:00Z - FORCING METRO RE-BUNDLE
import { logger } from '@/utils/logger';
import { Platform } from 'react-native';

let Purchases: any = null;
let PurchasesPackage: any = null;
let LOG_LEVEL: any = null;
let RevenueCatUI: any = null;

if (Platform.OS !== 'web') {
  try {
    const rc = require('react-native-purchases');
    Purchases = rc.default;
    PurchasesPackage = rc.PurchasesPackage;
    LOG_LEVEL = rc.LOG_LEVEL;
  } catch {
    // SDK not available
  }

  try {
    const rcui = require('react-native-purchases-ui');
    RevenueCatUI = rcui.default ?? rcui;
  } catch {
    // SDK not available
  }
}

export type PlanType = 'free' | 'pro' | 'family';

export interface RCPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}

export interface RCOffering {
  weekly: RCPackage | null;
  monthly: RCPackage | null;
  yearly: RCPackage | null;
  family: RCPackage | null;
  raw: unknown;
}

export interface RCCustomerInfo {
  plan: PlanType;
  isActive: boolean;
  expiresAt: string | null;
}

export interface RCPaywallResult {
  purchased: boolean;
  restored: boolean;
  cancelled: boolean;
  plan: PlanType;
}

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

const ENTITLEMENT_PRO = 'pro';
const ENTITLEMENT_FAMILY = 'family';

let _isConfigured = false;

function getApiKey(): string {
  if (Platform.OS === 'ios') return IOS_KEY;
  if (Platform.OS === 'android') return ANDROID_KEY;
  return '';
}

function extractPlan(customerInfo: any): PlanType {
  if (!customerInfo?.entitlements?.active) return 'free';
  const active = customerInfo.entitlements.active;
  if (active[ENTITLEMENT_FAMILY]) return 'family';
  if (active[ENTITLEMENT_PRO]) return 'pro';
  return 'free';
}

function extractExpiry(customerInfo: any): string | null {
  if (!customerInfo?.entitlements?.active) return null;
  const active = customerInfo.entitlements.active;
  const entitlement = active[ENTITLEMENT_FAMILY] || active[ENTITLEMENT_PRO];
  return entitlement?.expirationDate ?? null;
}

export const revenueCatService = {
  async configure(userId?: string): Promise<void> {
    const p = Purchases; // Capture to local variable for closure safety
    if (Platform.OS === 'web' || !p) return;
    
    const apiKey = getApiKey();
    if (!apiKey) return;

    try {
      // Secondary guard for internal Purchases state
      if (!p) return;
      
      const isConfiguredFunc = p.isConfigured;
      const alreadySet = typeof isConfiguredFunc === 'function' 
        ? await isConfiguredFunc.call(p)
        : _isConfigured;
      
      if (!alreadySet && p.configure) {
        await p.configure({ apiKey });
        _isConfigured = true;
      }

      if (userId && p.logIn) {
        await p.logIn(userId);
      }
    } catch (err) {
      logger.debug('[RevenueCat] configure skip (bridge inactive)');
    }
  },

  async identify(userId: string): Promise<void> {
    const p = Purchases;
    if (Platform.OS === 'web' || !p) return;
    try {
      if (_isConfigured && p.logIn) {
        await p.logIn(userId);
      }
    } catch (err) {
      logger.debug('[RevenueCat] identify skip');
    }
  },

  async reset(): Promise<void> {
    const p = Purchases;
    if (Platform.OS === 'web' || !p) return;
    try {
      if (_isConfigured && p.logOut) {
        await p.logOut();
      }
    } catch (err) {
      logger.debug('[RevenueCat] reset skip');
    }
  },

  async getOfferings(): Promise<RCOffering> {
    const empty: RCOffering = { weekly: null, monthly: null, yearly: null, family: null, raw: null };
    const p = Purchases;
    if (Platform.OS === 'web' || !p || !_isConfigured) return empty;

    try {
      const offerings = await p.getOfferings();
      const current = offerings.current;
      if (!current) return empty;

      const findPackage = (id: string) =>
        current.availablePackages?.find((pkg: any) =>
          pkg.packageType === id || pkg.identifier?.toLowerCase().includes(id.toLowerCase())
        ) ?? null;

      return {
        weekly: findPackage('WEEKLY') ?? findPackage('weekly'),
        monthly: findPackage('MONTHLY') ?? findPackage('monthly'),
        yearly: findPackage('ANNUAL') ?? findPackage('yearly'),
        family: findPackage('family'),
        raw: current,
      };
    } catch (err) {
      logger.debug('[RevenueCat] getOfferings failed');
      return empty;
    }
  },

  async purchasePackage(rcPackage: any): Promise<{ success: boolean; plan: PlanType; cancelled: boolean }> {
    const p = Purchases;
    if (Platform.OS === 'web' || !p || !rcPackage || !_isConfigured) {
      return { success: false, plan: 'free', cancelled: false };
    }

    try {
      const result = await p.purchasePackage(rcPackage);
      const plan = extractPlan(result.customerInfo);
      return { success: plan !== 'free', plan, cancelled: false };
    } catch (err: any) {
      if (err?.userCancelled) {
        return { success: false, plan: 'free', cancelled: true };
      }
      logger.warn('[RevenueCat] purchasePackage error:', err);
      throw err;
    }
  },

  async presentPaywall(offering?: any): Promise<RCPaywallResult> {
    const empty: RCPaywallResult = { purchased: false, restored: false, cancelled: true, plan: 'free' };
    const rui = RevenueCatUI;
    const p = Purchases;
    if (Platform.OS === 'web' || !rui) return empty;

    try {
      const params = offering ? { offering } : undefined;
      const result = await rui.presentPaywall(params);
      const purchased = result === 'PURCHASED';
      const restored = result === 'RESTORED';
      
      let customerInfo = null;
      if ((purchased || restored) && p && _isConfigured && p.getCustomerInfo) {
        customerInfo = await p.getCustomerInfo();
      }

      const plan = customerInfo ? extractPlan(customerInfo) : 'free';
      return { purchased, restored, cancelled: !purchased && !restored, plan };
    } catch (err) {
      logger.debug('[RevenueCat] presentPaywall exception');
      return empty;
    }
  },

  async presentPaywallIfNeeded(entitlementId: string): Promise<RCPaywallResult> {
    const empty: RCPaywallResult = { purchased: false, restored: false, cancelled: true, plan: 'free' };
    const rui = RevenueCatUI;
    const p = Purchases;
    if (Platform.OS === 'web' || !rui) return empty;

    try {
      const result = await rui.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: entitlementId,
      });
      const purchased = result === 'PURCHASED';
      const restored = result === 'RESTORED';
      const notRequired = result === 'NOT_PRESENTED';
      
      let customerInfo = null;
      if (p && _isConfigured && (purchased || restored || notRequired) && p.getCustomerInfo) {
        customerInfo = await p.getCustomerInfo();
      }

      const plan = customerInfo ? extractPlan(customerInfo) : 'free';
      return { purchased, restored, cancelled: !purchased && !restored && !notRequired, plan };
    } catch (err) {
      logger.debug('[RevenueCat] presentPaywallIfNeeded exception');
      return empty;
    }
  },

  async presentCustomerCenter(onRestored?: (plan: PlanType) => void): Promise<void> {
    const rui = RevenueCatUI;
    if (Platform.OS === 'web' || !rui) return;

    try {
      await rui.presentCustomerCenter({
        customerCenterActionListener: {
          onRestoreCompleted: async (customerInfo: any) => {
            if (onRestored) {
              const plan = extractPlan(customerInfo);
              onRestored(plan);
            }
          },
        },
      });
    } catch (err) {
      logger.debug('[RevenueCat] presentCustomerCenter exception');
    }
  },

  addCustomerInfoListener(callback: (info: RCCustomerInfo) => void): () => void {
    const p = Purchases;
    if (Platform.OS === 'web' || !p || !_isConfigured || !p.addCustomerInfoUpdateListener) return () => {};

    try {
      const listener = (customerInfo: any) => {
        const plan = extractPlan(customerInfo);
        callback({
          plan,
          isActive: plan !== 'free',
          expiresAt: extractExpiry(customerInfo),
        });
      };
      
      p.addCustomerInfoUpdateListener(listener);
      return () => {
        try {
          p.removeCustomerInfoUpdateListener?.(listener);
        } catch {
          // ignore
        }
      };
    } catch (err) {
      logger.debug('[RevenueCat] addCustomerInfoListener exception');
      return () => {};
    }
  },

  async restorePurchases(): Promise<RCCustomerInfo> {
    const empty: RCCustomerInfo = { plan: 'free', isActive: false, expiresAt: null };
    const p = Purchases;
    if (Platform.OS === 'web' || !p || !_isConfigured) return empty;

    try {
      const customerInfo = await p.restorePurchases();
      const plan = extractPlan(customerInfo);
      return { plan, isActive: plan !== 'free', expiresAt: extractExpiry(customerInfo) };
    } catch (err) {
      logger.debug('[RevenueCat] restorePurchases failed');
      return empty;
    }
  },

  async getCustomerInfo(): Promise<RCCustomerInfo> {
    const empty: RCCustomerInfo = { plan: 'free', isActive: false, expiresAt: null };
    const p = Purchases;
    if (Platform.OS === 'web' || !p || !_isConfigured || !p.getCustomerInfo) return empty;

    try {
      const customerInfo = await p.getCustomerInfo();
      const plan = extractPlan(customerInfo);
      return { plan, isActive: plan !== 'free', expiresAt: extractExpiry(customerInfo) };
    } catch (err) {
      logger.debug('[RevenueCat] getCustomerInfo exception');
      return empty;
    }
  },

  isAvailable(): boolean {
    return Platform.OS !== 'web' && !!Purchases && !!getApiKey();
  },

  isUIAvailable(): boolean {
    return Platform.OS !== 'web' && !!RevenueCatUI && !!getApiKey();
  },
};
