"use client";
import { useEffect, useState } from "react";
import { getProfile } from "@/actions/profiles";

export function useProfile(userId: string | null) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDisplayName(null);
      setProfileExists(false);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const displayName = await getProfile(userId);
      if (displayName !== null) {
        setProfileExists(true);
        setDisplayName(displayName);
      } else {
        setProfileExists(false);
        setDisplayName(null);
      }
      setLoading(false);
    })();
  }, [userId]);

  return { displayName, setDisplayName, profileExists, loading };
}
