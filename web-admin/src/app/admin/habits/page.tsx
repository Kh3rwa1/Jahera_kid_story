import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import HabitsClient from "./HabitsClient";

export const revalidate = 30;

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sfo.cloud.appwrite.io/v1";
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "69b5657c000d2c28a436";
const BUCKET = "behavior_assets";

const GOALS = [
  { id: "confidence", label: "Confidence", emoji: "🌟", category: "emotional" },
  { id: "sharing", label: "Sharing", emoji: "🤝", category: "social" },
  { id: "kindness", label: "Kindness", emoji: "💖", category: "social" },
  { id: "discipline", label: "Discipline", emoji: "🧭", category: "discipline" },
  { id: "less_screen", label: "Less Screen Time", emoji: "📵", category: "discipline" },
  { id: "calmness", label: "Calmness", emoji: "🧘", category: "emotional" },
  { id: "courage", label: "Courage", emoji: "🦁", category: "emotional" },
  { id: "honesty", label: "Honesty", emoji: "⭐", category: "social" },
  { id: "empathy", label: "Empathy", emoji: "🫂", category: "social" },
  { id: "gratitude", label: "Gratitude", emoji: "🙏", category: "emotional" },
  { id: "teamwork", label: "Teamwork", emoji: "🏆", category: "social" },
  { id: "curiosity", label: "Curiosity", emoji: "🔬", category: "cognitive" },
  { id: "responsibility", label: "Responsibility", emoji: "🌟", category: "discipline" },
];

export default async function HabitsPage() {
  let files: Record<string, { size: number; updatedAt: string }> = {};

  try {
    const { databases } = createAdminClient();
    // We can\'t use Storage from node-appwrite easily here, so we\'ll build URLs
    // and let the client check them
  } catch {}

  const habits = GOALS.map((g) => ({
    ...g,
    lottieUrl: `${ENDPOINT}/storage/buckets/${BUCKET}/files/${g.id}/view?project=${PROJECT}`,
    previewUrl: `${ENDPOINT}/storage/buckets/${BUCKET}/files/${g.id}/view?project=${PROJECT}`,
  }));

  return <HabitsClient habits={habits} endpoint={ENDPOINT} project={PROJECT} bucket={BUCKET} />;
}
