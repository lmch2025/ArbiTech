import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, handleErr } from "@/lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        plan: user.plan
          ? {
              id: user.plan.id,
              code: user.plan.code,
              name: user.plan.name,
              isRealTime: user.plan.isRealTime,
              delaySeconds: user.plan.delaySeconds,
              hasP2PFiat: user.plan.hasP2PFiat,
              hasPush: user.plan.hasPush,
              hasVolume: user.plan.hasVolume,
              hasVipSupport: user.plan.hasVipSupport,
              hasAllPairs: user.plan.hasAllPairs,
            }
          : null,
      },
    });
  } catch (e) {
    return handleErr(e);
  }
}
