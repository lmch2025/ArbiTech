import { logoutCurrent } from "@/lib/auth";
import { ok, handleErr } from "@/lib/http";

export async function POST() {
  try {
    await logoutCurrent();
    return ok({ message: "Déconnexion réussie." });
  } catch (e) {
    return handleErr(e);
  }
}
