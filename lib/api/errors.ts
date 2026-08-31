import axios from "axios";

export function getApiError(err: unknown): { code?: string; message?: string } {
  if (axios.isAxiosError(err)) {
    const error = err.response?.data?.error;
    return { code: error?.code, message: error?.message };
  }
  return {};
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  return getApiError(err).message ?? fallback;
}
