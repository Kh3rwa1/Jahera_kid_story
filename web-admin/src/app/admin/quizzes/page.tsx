import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import QuizzesClient from "./QuizzesClient";

export const revalidate = 30;

async function getQuizzes() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

  const [questions, attempts] = await Promise.all([
    databases.listDocuments(db, "quiz_questions", [Query.limit(100), Query.orderDesc("$createdAt")]),
    databases.listDocuments(db, "quiz_attempts", [Query.limit(1)]).catch(() => ({ total: 0 })),
  ]);

  return {
    questions: questions.documents.map((d: Record<string, unknown>) => ({
      id: String(d.$id),
      storyId: String(d.story_id || ""),
      text: String(d.question_text || ""),
      order: Number(d.question_order || 0),
      date: String(d.$createdAt),
    })),
    total: questions.total,
    attempts: attempts.total,
  };
}

export default async function QuizzesPage() {
  const data = await getQuizzes();
  return <QuizzesClient data={data} />;
}
