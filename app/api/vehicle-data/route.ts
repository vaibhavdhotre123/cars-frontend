// Proxies the free NHTSA vPIC API (US gov, no key) for real-world car makes/models.
// Server-side so there are no CORS issues; responses are cached for a day.
//
//   GET /api/vehicle-data            -> { makes: string[] }   (passenger-car makes)
//   GET /api/vehicle-data?make=tesla -> { models: string[] }  (models for that make)

const NHTSA = "https://vpic.nhtsa.dot.gov/api/vehicles";
const DAY = 60 * 60 * 24;

type MakeRow = { MakeName?: string };
type ModelRow = { Model_Name?: string };

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(request: Request) {
  const make = new URL(request.url).searchParams.get("make");

  try {
    if (make && make.trim()) {
      const res = await fetch(
        `${NHTSA}/GetModelsForMake/${encodeURIComponent(make.trim())}?format=json`,
        { next: { revalidate: DAY } }
      );
      const data = await res.json();
      const rows: ModelRow[] = Array.isArray(data?.Results) ? data.Results : [];
      const models = Array.from(
        new Set(rows.map((r) => r.Model_Name).filter((m): m is string => !!m))
      ).sort();
      return Response.json({ models });
    }

    const res = await fetch(`${NHTSA}/GetMakesForVehicleType/car?format=json`, {
      next: { revalidate: DAY },
    });
    const data = await res.json();
    const rows: MakeRow[] = Array.isArray(data?.Results) ? data.Results : [];
    const makes = Array.from(
      new Set(rows.map((r) => (r.MakeName ? titleCase(r.MakeName) : "")).filter(Boolean))
    ).sort();
    return Response.json({ makes });
  } catch {
    // Graceful: the form still works with free-text entry if the API is down.
    return Response.json({ makes: [], models: [] });
  }
}
