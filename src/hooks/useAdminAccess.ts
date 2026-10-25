import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseConfigured } from "../lib/supabase";
import { getAdminSessionUser, subscribeToAdminAuth } from "../services/adminAuthService";

export function useAdminAccess(localPreview: boolean) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(localPreview || !supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let active = true;
    getAdminSessionUser().then((current) => {
      if (!active) return;
      setUser(current);
      setAuthReady(true);
    }).catch(() => {
      if (active) setAuthReady(true);
    });
    const unsubscribe = subscribeToAdminAuth((current) => setUser(current));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { user, setUser, authReady, dashboardAccess: localPreview || Boolean(user) };
}
