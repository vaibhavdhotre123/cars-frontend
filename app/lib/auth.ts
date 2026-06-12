// Client-side auth helpers. Talks to the Spring Boot backend (cars-backend).

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8081/api/auth";

export type AppUser = {
  id: number;
  name: string;
  email: string;
};

// Throws an Error (with the backend's message) on failure; returns the user on success.
async function postAuth(
  path: string,
  body: Record<string, string>
): Promise<AppUser> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Make sure the backend is running on port 8081."
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message ?? "Something went wrong. Please try again.");
  }
  return data as AppUser;
}

export function register(name: string, email: string, password: string) {
  return postAuth("/register", { name, email, password });
}

export function login(email: string, password: string) {
  return postAuth("/login", { email, password });
}

// Asks the backend to email a password-reset link. Resolves with the backend's
// message. For privacy the backend returns 200 whether or not the email exists.
export async function requestPasswordReset(email: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Make sure the backend is running on port 8081."
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message ?? "Something went wrong. Please try again.");
  }
  return (
    data?.message ??
    "If an account exists for that email, a reset link has been sent."
  );
}

// Persist the logged-in user in the browser (no token in this simple setup).
const STORAGE_KEY = "carsUser";

export function saveUser(user: AppUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getUser(): AppUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}
