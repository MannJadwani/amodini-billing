import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "missing-openrouter-api-key",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_APP_TITLE || "Amodini Billing",
  },
});

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: process.env.OPENROUTER_MODEL || "nex-agi/nex-n2-pro:free",
  disableParallelToolCalls: true,
});

const runtime = new CopilotRuntime();

export const POST = async (request: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(request);
};
