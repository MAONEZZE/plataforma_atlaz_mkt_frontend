"use client";

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const baseURL = "/api/v1";

export const api = axios.create({ baseURL });

api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    cfg.headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return cfg;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as RetryConfig | undefined;
    if (err.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(err);
    }
    original._retry = true;
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }
    original.headers.set("Authorization", `Bearer ${data.session.access_token}`);
    return api(original);
  },
);
