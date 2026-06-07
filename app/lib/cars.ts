// Client-side API for the dealership inventory.
// Talks to the Spring Boot cars-backend CRUD endpoints under /api/cars.

const API_BASE =
  process.env.NEXT_PUBLIC_CARS_API ?? "http://localhost:8081/api/cars";

export type CarStatus = "Available" | "Reserved" | "Sold";

export type Car = {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  status: CarStatus;
  imageUrl?: string | null;
};

// Fields the user supplies when creating/updating a car (no id).
export type CarInput = Omit<Car, "id">;

async function handle<T>(res: Response): Promise<T> {
  // 204 No Content (delete) has no body to parse.
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

export async function listCars(): Promise<Car[]> {
  let res: Response;
  try {
    res = await fetch(API_BASE, { cache: "no-store" });
  } catch {
    networkError();
  }
  return handle<Car[]>(res);
}

export async function createCar(input: CarInput): Promise<Car> {
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
  return handle<Car>(res);
}

export async function updateCar(id: number, input: CarInput): Promise<Car> {
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
  return handle<Car>(res);
}

export async function deleteCar(id: number): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  } catch {
    networkError();
  }
  await handle<void>(res);
}
