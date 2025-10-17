/**
 * Content Generation V2 - Vertex AI Client
 * 
 * Simple Vertex AI client for calling Gemini models.
 * Each script specifies its own model name, temperature, etc.
 * 
 * Two clients:
 * 1. Regular Vertex AI - for article generation
 * 2. Grounded Search - for news search with Google Search Retrieval
 * 
 * Automatic logging: All API calls are logged to database automatically
 */

import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';
import { initSchema, logAPICall } from '../database/schema.js';
import { setGlobalDispatcher, Agent } from 'undici';

// Configure undici Agent with longer timeout for large LLM requests
// Default is 300000ms (5 minutes), we set to 600000ms (10 minutes)
setGlobalDispatcher(new Agent({
  headersTimeout: 600000, // 10 minutes
  bodyTimeout: 600000,    // 10 minutes
}));

// Get GCP config from environment
const projectId = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT;
const location = process.env.GCLOUD_LOCATION || 'us-central1';

if (!projectId) {
  throw new Error('GCP_PROJECT_ID or GCLOUD_PROJECT environment variable required');
}

// Initialize Genkit with Vertex AI plugin (for grounded search and generation)
const ai = genkit({
  plugins: [
    vertexAI({
      projectId,
      location,
    }),
  ],
});

// Initialize database schema on module load
try {
  initSchema();
} catch (error) {
  console.warn('⚠️  Could not initialize database schema:', error);
}

/**
 * Get calling script name from stack trace
 */
function getCallingScript(): string {
  const error = new Error();
  const stack = error.stack || '';
  const lines = stack.split('\n');
  
  // Find first line that's not in this file
  for (const line of lines) {
    if (line.includes('.ts') && !line.includes('vertex.ts')) {
      const match = line.match(/([^/\\]+\.ts)/);
      if (match && match[1]) {
        return match[1].replace('.ts', '');
      }
    }
  }
  
  return 'unknown';
}

/**
 * Calculate cost based on model and token usage
 * 
 * Vertex AI Pricing (VERIFIED Oct 2025):
 * https://cloud.google.com/vertex-ai/generative-ai/pricing
 * 
 * Standard Generation (per 1M tokens):
 * - Gemini 2.5 Flash-Lite: $0.10 input, $0.40 output ✅
 * - Gemini 2.5 Flash: $0.30 input, $2.50 output ✅
 * - Gemini 2.5 Pro: $1.25 input (≤200k), $2.50 input (>200k), $10.00 output (≤200k), $15.00 output (>200k) ✅
 * - Gemini 2.0 Flash: $0.15 input, $0.60 output (token-based pricing) ✅
 * - Gemini 2.0 Flash-Lite: $0.075 input, $0.30 output ✅
 * 
 * Grounded Search (with Google Search):
 * - All models: $35 per 1,000 requests + respective output token costs ✅
 * - Free tier: 1,500 daily requests (Flash/Flash-Lite), 10,000 daily (Pro)
 * 
 * Note: 2.5 Pro has tiered pricing based on prompt size (200k token threshold)
 * Note: 2.0 Flash has both token-based and modality-based pricing (we use token-based)
 * 
 * Token Limits (Gemini 2.5 models):
 * - Maximum input tokens: 1,048,576 (1M context window)
 * - Maximum output tokens: 65,536 (default)
 * 
 * @param model - Model name
 * @param inputTokens - Input token count
 * @param outputTokens - Output token count
 * @param isGroundedSearch - Whether this is a grounded search call
 * @returns Cost in USD
 */
function calculateCost(
  model: string, 
  inputTokens: number, 
  outputTokens: number, 
  isGroundedSearch: boolean = false
): number {
  if (isGroundedSearch) {
    // Grounded search pricing: $35 per 1,000 requests + output tokens
    const requestCost = 35 / 1000; // $35 per 1k requests = $0.035 per request
    
    if (model.includes('2.5-pro') || model.includes('2.0-pro')) {
      // 2.5 Pro: $0.035/request + tiered output ($10.00/1M for ≤200k prompts, $15.00/1M for >200k)
      // Simplified: using base rate of $10.00/1M for grounded search (most common case)
      const outputRate = model.includes('2.5-pro') ? 10.00 : 5.00;
      return requestCost + ((outputTokens / 1_000_000) * outputRate);
    }
    
    if (model.includes('flash-lite')) {
      // Flash-Lite: $0.035/request + $0.40/1M output tokens (2.5) or $0.30/1M (2.0)
      const outputRate = model.includes('2.5') ? 0.40 : 0.30;
      return requestCost + ((outputTokens / 1_000_000) * outputRate);
    }
    
    if (model.includes('2.5-flash')) {
      // 2.5 Flash: $0.035/request + $2.50/1M output tokens
      return requestCost + ((outputTokens / 1_000_000) * 2.50);
    }
    
    // 2.0 Flash: $0.035/request + $0.60/1M output tokens
    return requestCost + ((outputTokens / 1_000_000) * 0.60);
  }
  
  // Standard generation pricing
  if (model.includes('2.5-pro') || model.includes('2.0-pro')) {
    // 2.5 Pro: Tiered pricing based on prompt size
    // ≤200k tokens: $1.25/1M input + $10.00/1M output
    // >200k tokens: $2.50/1M input + $15.00/1M output
    // Simplified: using base tier (most common for our use case)
    const inputRate = inputTokens > 200_000 ? 2.50 : 1.25;
    const outputRate = model.includes('2.5-pro') 
      ? (inputTokens > 200_000 ? 15.00 : 10.00)
      : 5.00; // 2.0 Pro rate
    return ((inputTokens / 1_000_000) * inputRate) + ((outputTokens / 1_000_000) * outputRate);
  }
  
  if (model.includes('flash-lite')) {
    // 2.5 Flash-Lite: $0.10/1M input + $0.40/1M output
    // 2.0 Flash-Lite: $0.075/1M input + $0.30/1M output
    const inputRate = model.includes('2.5') ? 0.10 : 0.075;
    const outputRate = model.includes('2.5') ? 0.40 : 0.30;
    return ((inputTokens / 1_000_000) * inputRate) + ((outputTokens / 1_000_000) * outputRate);
  }
  
  if (model.includes('2.5-flash')) {
    // 2.5 Flash: $0.30/1M input + $2.50/1M output
    return ((inputTokens / 1_000_000) * 0.30) + ((outputTokens / 1_000_000) * 2.50);
  }
  
  // 2.0 Flash (default): $0.15/1M input + $0.60/1M output (token-based pricing on Vertex AI)
  return ((inputTokens / 1_000_000) * 0.15) + ((outputTokens / 1_000_000) * 0.60);
}

export interface VertexCallOptions {
  model: string;           // e.g., 'gemini-2.0-flash-exp', 'gemini-1.5-pro'
  temperature?: number;    // 0.0 - 2.0
  maxTokens?: number;      // Max output tokens
  topP?: number;           // Nucleus sampling
  topK?: number;           // Top-k sampling
  schema?: any;            // Zod schema for structured output
}

export interface VertexResponse {
  content: string | any;  // string for text, object for structured output
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * Call Vertex AI with a prompt (regular generation)
 * Automatically logs token usage to database
 * 
 * @param prompt - The text prompt to send
 * @param options - Model configuration (model name, temperature, etc.)
 * @returns Response with content and token usage
 */
export async function callVertex(
  prompt: string,
  options: VertexCallOptions
): Promise<VertexResponse> {
  const {
    model,
    temperature = 0.7,
    maxTokens,
    topP,
    topK,
    schema
  } = options;

  try {
    const generateConfig: any = {
      model: vertexAI.model(model, {
        temperature,
        maxOutputTokens: maxTokens,
        topP,
        topK,
      }),
      prompt,
    };

    // Add structured output if schema provided
    if (schema) {
      generateConfig.output = {
        schema: schema, // Zod schema
      };
    }

    const result = await ai.generate(generateConfig);

    // Get content from structured output or text
    const content = schema ? result.output : (result.text || '');
    const usage = result.usage ? {
      inputTokens: result.usage.inputTokens || 0,
      outputTokens: result.usage.outputTokens || 0,
      totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0),
    } : undefined;

    // Automatically log to database
    if (usage) {
      try {
        logAPICall({
          scriptName: getCallingScript(),
          model,
          callType: 'generation',
          calledAt: new Date().toISOString(),
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          costUsd: calculateCost(model, usage.inputTokens, usage.outputTokens, false),
        });
      } catch (error) {
        console.warn('⚠️  Could not log API call to database:', error);
      }
    }

    return { content, usage };
  } catch (error: any) {
    console.error('❌ Vertex AI call failed:', error.message);
    throw new Error(`Vertex AI error: ${error.message}`);
  }
}

/**
 * Call Vertex AI with Google Search Grounding
 * Used for news search - provides real URLs from Google Search
 * Automatically logs token usage to database
 * 
 * @param prompt - The search prompt
 * @param options - Model configuration
 * @returns Response with content and token usage
 */
export async function callGroundedSearch(
  prompt: string,
  options: VertexCallOptions
): Promise<VertexResponse> {
  const {
    model,
    temperature = 1.0,  // Default to 1.0 for search (as per old config)
    maxTokens,
    topP,
    topK
  } = options;

  try {
    const result = await ai.generate({
      model: vertexAI.model(model, {
        temperature,
        maxOutputTokens: maxTokens,
        topP,
        topK,
      }),
      prompt,
      config: {
        googleSearchRetrieval: {},  // This enables Google Search grounding with real URLs
      },
    });

    const content = result.text || '';
    const usage = result.usage ? {
      inputTokens: result.usage.inputTokens || 0,
      outputTokens: result.usage.outputTokens || 0,
      totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0),
    } : undefined;

    // Automatically log to database
    if (usage) {
      try {
        logAPICall({
          scriptName: getCallingScript(),
          model,
          callType: 'grounded_search',
          calledAt: new Date().toISOString(),
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          costUsd: calculateCost(model, usage.inputTokens, usage.outputTokens, true), // true = grounded search
        });
      } catch (error) {
        console.warn('⚠️  Could not log API call to database:', error);
      }
    }

    return { content, usage };
  } catch (error: any) {
    console.error('❌ Grounded search failed:', error.message);
    throw new Error(`Grounded search error: ${error.message}`);
  }
}

/**
 * Parse JSON response from LLM
 * Handles markdown code blocks and common formatting issues
 */
export function parseJSONResponse<T = any>(response: string): T {
  // Remove markdown code blocks if present
  const cleaned = response
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (error: any) {
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}
