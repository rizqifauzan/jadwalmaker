"use client";

import { useEffect } from "react";
import { bootstrapStorage } from "@/lib/storage/repo";

export function ClientBootstrap(): null {
  useEffect(() => {
    bootstrapStorage();
  }, []);

  return null;
}
