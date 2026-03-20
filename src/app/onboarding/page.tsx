import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

// Fluxo legado: onboarding não é mais necessário no modelo de org única (QS).
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect("/app");
}
