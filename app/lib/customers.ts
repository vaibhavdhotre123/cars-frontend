// Client-side API for dealership customers.
// Talks to the Spring Boot cars-backend CRUD endpoints under /api/customers.

const API_BASE =
  process.env.NEXT_PUBLIC_CUSTOMERS_API ?? "http://localhost:8081/api/customers";

export type CustomerStatus = "Lead" | "Active" | "Inactive";

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  city?: string | null;
  status: CustomerStatus;
  notes?: string | null;
};

export type CustomerInput = Omit<Customer, "id">;

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

export async function listCustomers(): Promise<Customer[]> {
  let res: Response;
  try {
    res = await fetch(API_BASE, { cache: "no-store" });
  } catch {
    networkError();
  }
  return handle<Customer[]>(res);
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
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
  return handle<Customer>(res);
}

export async function updateCustomer(id: number, input: CustomerInput): Promise<Customer> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    networkError();
  }
  return handle<Customer>(res);
}

export async function deleteCustomer(id: number): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  } catch {
    networkError();
  }
  await handle<void>(res);
}
