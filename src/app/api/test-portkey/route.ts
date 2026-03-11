import { NextResponse } from "next/server";
import Portkey from "portkey-ai";

export async function GET() {
  const apiKey = process.env.PORTKEY_API_KEY;
  const gatewayUrl = process.env.PORTKEY_GATEWAY_URL;
  const virtualKey = process.env.PORTKEY_VIRTUAL_KEY;

  // Check env vars
  const envStatus = {
    PORTKEY_API_KEY: apiKey ? "✅ Set" : "❌ Missing",
    PORTKEY_GATEWAY_URL: gatewayUrl ? `✅ ${gatewayUrl}` : "❌ Missing",
    PORTKEY_VIRTUAL_KEY: virtualKey ? "✅ Set" : "⚠️ Not set (optional)",
  };

  if (!apiKey) {
    return NextResponse.json({
      status: "error",
      message: "PORTKEY_API_KEY not configured",
      envStatus,
    }, { status: 500 });
  }

  // Try a simple completion
  try {
    const portkey = new Portkey({
      apiKey: apiKey,
      baseURL: gatewayUrl || "https://api.portkey.ai/v1",
      ...(virtualKey ? { virtualKey } : {}),
    });

    const response = await portkey.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are The Plug, an AI campaign optimization agent for PurePlay. Respond in one sentence.",
        },
        {
          role: "user",
          content: "Say hello and confirm you're working.",
        },
      ],
      max_tokens: 50,
    });

    const reply = response.choices?.[0]?.message?.content;

    return NextResponse.json({
      status: "success",
      message: "Portkey connection working!",
      envStatus,
      model: response.model,
      reply,
    });
  } catch (error: unknown) {
    const err = error as Error & { status?: number; message?: string };
    return NextResponse.json({
      status: "error",
      message: `Portkey call failed: ${err.message}`,
      envStatus,
      errorDetail: err.status || "unknown",
    }, { status: 500 });
  }
}
