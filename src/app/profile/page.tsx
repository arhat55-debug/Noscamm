import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProfileRedirectPage() {
  const { user, profile } = await requireUser();
  redirect(`/users/${profile?.username ?? user.id}`);
}
