// Client-side API for sales / deals (links a customer to a car they bought).
// Talks to the Spring Boot cars-backend under /api/deals.

const API_BASE =
  process.env.NEXT_PUBLIC_DEALS_API ?? "http://localhost:8081/api/deals";

export type Deal = {
  id: number;
  carId: number;
  customerId: number;
  salePrice: number;
  soldDate: string; // ISO yyyy-MM-dd
  salesperson?: string | null;
  carLabel: string;
  customerName: string;
  customerEmail?: string | null;
};

export type DealInput = {
  carId: number;
  customerId: number;
  salePrice: number;
  soldDate?: string;
  salesperson?: string;
};

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

function networkError(): never {
  throw new Error(
    "Cannot reach the server. Make sure the backend is running on port 8081."
  );
}

export async function listDeals(): Promise<Deal[]> {
  let res: Response;
  try {
    res = await fetch(API_BASE, { cache: "no-store" });
  } catch {
    networkError();
  }
  return handle<Deal[]>(res);
}

export async function createDeal(input: DealInput): Promise<Deal> {
  let res: Response;
  try {
    res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    networkError();
  }
  return handle<Deal>(res);
}

export async function deleteDeal(id: number): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  } catch {
    networkError();
  }
  await handle<void>(res);
}
