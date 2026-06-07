// Server-side proxy to the OpenAI Chat Completions API.
// The API key lives ONLY here (server env) — never shipped to the browser.
//
// Requires OPENAI_API_KEY in .env.local (and a dev-server restart to pick it up).
// Optionally set OPENAI_MODEL (defaults to gpt-4o-mini).

type ChatMessage = { role: "user" | "assistant"; content: string };

type CarLike = {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  status: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "AI isn't configured. Add OPENAI_API_KEY to .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  let body: { messages?: ChatMessage[]; cars?: CarLike[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Keep only the recent turns to bound prompt size.
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const cars = Array.isArray(body.cars) ? body.cars : [];

  // Compact the inventory so the prompt stays small.
  const inventory = cars.map((c) => ({
    id: c.id,
    make: c.make,
    model: c.model,
    year: c.year,
    price: c.price,
    mileage: c.mileage,
    status: c.status,
  }));

  const system = [
    "You are an assistant embedded in a car dealership dashboard.",
    "Answer questions ONLY using the inventory JSON provided below.",
    "Be concise and practical. Use USD for money (e.g. $42,990).",
    "Prefer short lists or small numbers. If the data can't answer, say so plainly.",
    "Status values are: Available, Reserved, Sold.",
    "",
    `Inventory JSON (${inventory.length} cars):`,
    JSON.stringify(inventory),
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      let message = "The AI request failed.";
      try {
        const apiErr = JSON.parse(raw)?.error;
        if (apiErr?.type === "insufficient_quota") {
          message =
            "Your OpenAI account has no remaining quota. Add credits/billing at platform.openai.com/settings/organization/billing.";
        } else if (res.status === 401) {
          message = "Your OpenAI API key is invalid or revoked. Check OPENAI_API_KEY in .env.local.";
        } else if (res.status === 429) {
          message = "OpenAI rate limit reached. Wait a moment and try again.";
        } else if (apiErr?.message) {
          message = apiErr.message;
        }
      } catch {
        // non-JSON error body — keep the generic message
      }
      return Response.json({ error: message }, { status: res.status });
    }

    const data = await res.json();
    const reply: string =
      data?.choices?.[0]?.message?.content?.trim() ?? "No response.";
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "Could not reach the AI service." }, { status: 502 });
  }
}
