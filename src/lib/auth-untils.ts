import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Cached session getter — deduplicates auth.api.getSession() calls
 * within a single React server render pass (layout + tRPC middleware).
 */
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export const requireAuth = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }
};

export const requireUnauth = async () => {
  const session = await getSession();

  if (session) {
    redirect("/");
  }
};
