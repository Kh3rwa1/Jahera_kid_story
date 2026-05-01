import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";

export const revalidate = 30;

export default async function SubscriptionsPage() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";
  const subs = await databases.listDocuments(db, "subscriptions", [Query.limit(1)]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Subscriptions</h1>
        <p className="text-sm text-[var(--text-muted)]">{subs.total} active subscriptions</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 text-center">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">MRR</div>
          <div className="text-3xl font-bold text-white">$0</div>
          <div className="text-xs text-[var(--accent-green)] mt-1">Ready for RevenueCat</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Subscribers</div>
          <div className="text-3xl font-bold text-white">{subs.total}</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Churn Rate</div>
          <div className="text-3xl font-bold text-white">0%</div>
        </div>
      </div>

      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-xl font-semibold text-white mb-2">Revenue Dashboard Ready</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          When RevenueCat is connected, this page will show MRR, subscriber count,
          churn rate, LTV, and individual subscription details in real-time.
        </p>
      </div>
    </div>
  );
}
