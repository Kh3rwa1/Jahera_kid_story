import { Platform } from 'react-native';

let Purchases: any = null;
let PurchasesPackage: any = null;
let LOG_LEVEL: any = null;

if (Platform.OS !== 'web') {
  try {
    const rc = require('react-native-purchases');
    Purchases = rc.default;
    PurchasesPackage = rc.PurchasesPackage;
    LOG_LEVEL = rc.LOG_LEVEL;
  } catch {
    // SDK not available
  }
}

export type PlanType = 'free' | 'pro' | 'family';

export interface RCOffering {
  monthly: any | null;
  yearly: any | null;
  family: any | null;
  raw: any | null;
}

export interface RCCustomerInfo {
  plan: PlanType;
  isActive: boolean;
  expiresAt: string | null;
}

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

const ENTITLEMENT_PRO = 'pro';
const ENTITLEMENT_FAMILY = 'family';

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
    if (Platform.OS === 'web' || !Purchases) return;
    const apiKey = getApiKey();
    if (!apiKey) return;

    try {
      if (__DEV__ && LOG_LEVEL) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      await Purchases.configure({ apiKey });
      if (userId) {
        await Purchases.logIn(userId);
      }
    } catch (err) {
      console.warn('[RevenueCat] configure error:', err);
    }
  },

  async identify(userId: string): Promise<void> {
    if (Platform.OS === 'web' || !Purchases) return;
    try {
      await Purchases.logIn(userId);
    } catch (err) {
      console.warn('[RevenueCat] identify error:', err);
    }
  },

  async reset(): Promise<void> {
    if (Platform.OS === 'web' || !Purchases) return;
    try {
      await Purchases.logOut();
    } catch (err) {
      console.warn('[RevenueCat] reset error:', err);
    }
  },

  async getOfferings(): Promise<RCOffering> {
    const empty: RCOffering = { monthly: null, yearly: null, family: null, raw: null };
    if (Platform.OS === 'web' || !Purchases) return empty;

    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) return empty;

      const findPackage = (id: string) =>
        current.availablePackages?.find((p: any) =>
          p.packageType === id || p.identifier?.toLowerCase().includes(id)
        ) ?? null;

      return {
        monthly: findPackage('MONTHLY') ?? findPackage('monthly'),
        yearly: findPackage('ANNUAL') ?? findPackage('yearly'),
        family: findPackage('family'),
        raw: current,
      };
    } catch (err) {
      console.warn('[RevenueCat] getOfferings error:', err);
      return empty;
    }
  },

  async purchasePackage(rcPackage: any): Promise<{ success: boolean; plan: PlanType; cancelled: boolean }> {
    if (Platform.OS === 'web' || !Purchases || !rcPackage) {
      return { success: false, plan: 'free', cancelled: false };
    }

    try {
      const result = await Purchases.purchasePackage(rcPackage);
      const plan = extractPlan(result.customerInfo);
      return { success: plan !== 'free', plan, cancelled: false };
    } catch (err: any) {
      if (err?.userCancelled) {
        return { success: false, plan: 'free', cancelled: true };
      }
      console.warn('[RevenueCat] purchasePackage error:', err);
      throw err;
    }
  },

  async restorePurchases(): Promise<RCCustomerInfo> {
    if (Platform.OS === 'web' || !Purchases) {
      return { plan: 'free', isActive: false, expiresAt: null };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const plan = extractPlan(customerInfo);
      return {
        plan,
        isActive: plan !== 'free',
        expiresAt: extractExpiry(customerInfo),
      };
    } catch (err) {
      console.warn('[RevenueCat] restorePurchases error:', err);
      return { plan: 'free', isActive: false, expiresAt: null };
    }
  },

  async getCustomerInfo(): Promise<RCCustomerInfo> {
    if (Platform.OS === 'web' || !Purchases) {
      return { plan: 'free', isActive: false, expiresAt: null };
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const plan = extractPlan(customerInfo);
      return {
        plan,
        isActive: plan !== 'free',
        expiresAt: extractExpiry(customerInfo),
      };
    } catch (err) {
      console.warn('[RevenueCat] getCustomerInfo error:', err);
      return { plan: 'free', isActive: false, expiresAt: null };
    }
  },

  isAvailable(): boolean {
    return Platform.OS !== 'web' && !!Purchases && !!getApiKey();
  },
};
