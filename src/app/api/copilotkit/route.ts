import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-openai-api-key",
});

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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
