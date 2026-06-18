// Decodes a VIN into make/model/year using the free NHTSA vPIC API (no key).
// Server-side proxy (no CORS), cached for a day.
//
//   GET /api/decode-vin?vin=5YJ3E1EA7KF317953 -> { make, model, year } | { error }

const NHTSA = "https://vpic.nhtsa.dot.gov/api/vehicles";

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(request: Request) {
  const vin = new URL(request.url).searchParams.get("vin")?.trim();
  if (!vin) {
    return Response.json({ error: "Enter a VIN." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${NHTSA}/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { next: { revalidate: 60 * 60 * 24 } }
    );
    const data = await res.json();
    const r = Array.isArray(data?.Results) ? data.Results[0] : null;

    const make = r?.Make ? titleCase(String(r.Make)) : "";
    const model = r?.Model ? String(r.Model) : "";
    const year = r?.ModelYear ? String(r.ModelYear) : "";

    if (!make && !model && !year) {
      return Response.json({
        error: "Couldn't decode that VIN. Please check it and try again.",
      });
    }
    return Response.json({ make, model, year });
  } catch {
    return Response.json({ error: "Could not reach the VIN service." });
  }
}
