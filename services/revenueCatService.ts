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
    // RC UI SDK not available
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
  raw: any | null;
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
      logger.warn('[RevenueCat] configure error:', err);
    }
  },

  async identify(userId: string): Promise<void> {
    if (Platform.OS === 'web' || !Purchases) return;
    try {
      await Purchases.logIn(userId);
    } catch (err) {
      logger.warn('[RevenueCat] identify error:', err);
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
    const empty: RCOffering = { weekly: null, monthly: null, yearly: null, family: null, raw: null };
    if (Platform.OS === 'web' || !Purchases) return empty;

    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) return empty;

      const findPackage = (id: string) =>
        current.availablePackages?.find((p: any) =>
          p.packageType === id || p.identifier?.toLowerCase().includes(id.toLowerCase())
        ) ?? null;

      return {
        weekly: findPackage('WEEKLY') ?? findPackage('weekly'),
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

  async presentPaywall(offering?: any): Promise<RCPaywallResult> {
    const empty: RCPaywallResult = { purchased: false, restored: false, cancelled: true, plan: 'free' };
    if (Platform.OS === 'web' || !RevenueCatUI) return empty;

    try {
      const params = offering ? { offering } : undefined;
      const result = await RevenueCatUI.presentPaywall(params);
      const purchased = result === 'PURCHASED';
      const restored = result === 'RESTORED';
      const customerInfo = purchased || restored
        ? await Purchases?.getCustomerInfo?.()
        : null;
      const plan = customerInfo ? extractPlan(customerInfo) : 'free';
      return {
        purchased,
        restored,
        cancelled: !purchased && !restored,
        plan,
      };
    } catch (err) {
      console.warn('[RevenueCat] presentPaywall error:', err);
      return empty;
    }
  },

  async presentPaywallIfNeeded(entitlementId: string): Promise<RCPaywallResult> {
    const empty: RCPaywallResult = { purchased: false, restored: false, cancelled: true, plan: 'free' };
    if (Platform.OS === 'web' || !RevenueCatUI) return empty;

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: entitlementId,
      });
      const purchased = result === 'PURCHASED';
      const restored = result === 'RESTORED';
      const notRequired = result === 'NOT_PRESENTED';
      const customerInfo = (purchased || restored || notRequired)
        ? await Purchases?.getCustomerInfo?.()
        : null;
      const plan = customerInfo ? extractPlan(customerInfo) : 'free';
      return {
        purchased,
        restored,
        cancelled: !purchased && !restored && !notRequired,
        plan,
      };
    } catch (err) {
      console.warn('[RevenueCat] presentPaywallIfNeeded error:', err);
      return empty;
    }
  },

  async presentCustomerCenter(onRestored?: (plan: PlanType) => void): Promise<void> {
    if (Platform.OS === 'web' || !RevenueCatUI) return;

    try {
      await RevenueCatUI.presentCustomerCenter({
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
      console.warn('[RevenueCat] presentCustomerCenter error:', err);
    }
  },

  addCustomerInfoListener(callback: (info: RCCustomerInfo) => void): () => void {
    if (Platform.OS === 'web' || !Purchases) return () => {};

    try {
      const listener = (customerInfo: any) => {
        const plan = extractPlan(customerInfo);
        callback({
          plan,
          isActive: plan !== 'free',
          expiresAt: extractExpiry(customerInfo),
        });
      };
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => {
        try {
          Purchases.removeCustomerInfoUpdateListener?.(listener);
        } catch {
          // ignore
        }
      };
    } catch (err) {
      console.warn('[RevenueCat] addCustomerInfoListener error:', err);
      return () => {};
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

  isUIAvailable(): boolean {
    return Platform.OS !== 'web' && !!RevenueCatUI && !!getApiKey();
  },
};
