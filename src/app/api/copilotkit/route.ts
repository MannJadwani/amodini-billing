import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
const aiConfigured = apiKey.trim().length > 0 && apiKey !== "your_openrouter_key";

const openai = new OpenAI({
  apiKey: apiKey || "missing-api-key",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_TITLE || "Simple Billing",
  },
});

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: process.env.OPENROUTER_MODEL || "nex-agi/nex-n2-pro:free",
  disableParallelToolCalls: true,
});

const runtime = new CopilotRuntime();

export const POST = async (request: NextRequest) => {
  // Fail gracefully when no AI key is set instead of throwing a 500 — the UI
  // already shows a friendly "AI helper not configured" message, but a stray
  // request should still return a clean response.
  if (!aiConfigured) {
    return NextResponse.json(
      { error: "AI helper not configured. Set OPENROUTER_API_KEY to enable chat." },
      { status: 503 },
    );
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(request);
};
