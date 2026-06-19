// Fetch a notebook cover image for a destination (Unsplash by default, AI fallback/option)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, mode = "unsplash" } = await req.json();
    if (!destination || typeof destination !== "string" || destination.length > 200) {
      return new Response(JSON.stringify({ error: "destination required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "ai") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{
            role: "user",
            content: `Beautiful cinematic illustration of ${destination}, travel notebook cover, dreamy atmosphere, vibrant colors, no text, 16:9`,
          }],
          modalities: ["image", "text"],
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("AI cover error", r.status, t);
        return new Response(JSON.stringify({ error: "AI cover failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await r.json();
      const imgUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
        || data.choices?.[0]?.message?.images?.[0]?.url
        || null;
      return new Response(JSON.stringify({ url: imgUrl, source: "ai" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Unsplash
    const UNSPLASH = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH) {
      return new Response(JSON.stringify({ url: null, source: "none" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const q = encodeURIComponent(`${destination} travel landscape`);
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=5&orientation=landscape&content_filter=high`, {
      headers: { Authorization: `Client-ID ${UNSPLASH}` },
    });
    if (!r.ok) {
      return new Response(JSON.stringify({ url: null, source: "none" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const pick = data.results?.[Math.floor(Math.random() * Math.min(5, data.results?.length || 0))];
    return new Response(JSON.stringify({
      url: pick?.urls?.regular || null,
      thumb: pick?.urls?.small || null,
      author: pick?.user?.name || null,
      source: "unsplash",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("journal-cover error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
