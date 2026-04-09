import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      baseUrl?: string;
      model?: string;
      apiKey?: string;
      messages?: Array<{ role: string; content: string }>;
    };

    const { baseUrl, model, apiKey, messages } = body;

    if (!baseUrl || !model || !apiKey || !messages) {
      return NextResponse.json(
        { error: "Missing required fields (baseUrl, model, apiKey, messages)." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(baseUrl);
    } catch {
      return NextResponse.json({ error: `Invalid baseUrl: "${baseUrl}"` }, { status: 400 });
    }

    console.log(`[AI Proxy] Streaming → ${parsedUrl.toString()} | model: ${model}`);

    const upstream = await fetch(parsedUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      return NextResponse.json(
        { error: `API Provider Error ${upstream.status}: ${errorText}` },
        { status: upstream.status }
      );
    }

    // Forward the raw SSE stream directly to the browser
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    const cause =
      error instanceof Error && (error as NodeJS.ErrnoException).cause
        ? String((error as NodeJS.ErrnoException).cause)
        : "";
    const msg = error instanceof Error ? error.message : String(error);
    const detail = cause ? `${msg} (cause: ${cause})` : msg;
    console.error(`[AI Proxy] Error: ${detail}`);
    return NextResponse.json({ error: `Proxy Server Error: ${detail}` }, { status: 500 });
  }
}
