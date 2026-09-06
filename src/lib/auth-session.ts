import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * The single, server-only source of the authenticated session. Every
 * server-side consumer of identity — pages, and later services — must go
 * through this module rather than reading a cookie or header directly.
 * Memoized with React `cache()` so multiple reads within one render pass
 * hit the auth library once.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Like `getSession`, but redirects unauthenticated requests to `/register`.
 * Use on any page that requires a signed-in user.
 */
export const requireSession = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/register");
  }

  return session;
};
