import { NextResponse } from "next/server";

// Tells the client whether an AI key is configured on the server, so the
// assistant can show live chat or a friendly "not configured" message.
// Never exposes the key itself.
export function GET() {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
  const configured = key.trim().length > 0 && key !== "your_openrouter_key";
  return NextResponse.json({ configured });
}
