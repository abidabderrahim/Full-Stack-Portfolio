// Get Cookies Tokens From Backend .
export const fetchUser = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 401) return null;
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    return data?.user ?? null;
  } catch (err) {

    if (import.meta.env.DEV) {
      console.error("fetchUser error:", err);
    }
    return null;
  }
};