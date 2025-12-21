/**
 * Common types used across AI modules
 */

export interface FunctionCall {
  /** Function name */
  name: string;
  /** Function arguments */
  args: Record<string, any>;
}

export interface FunctionResponse {
  /** Function name */
  name: string;
  /** Function response */
  response: Record<string, any>;
}

export interface FunctionDeclaration {
  /** Function name */
  name: string;
  /** Function description */
  description: string;
  /** Function parameters schema */
  parameters?: {
    type: "OBJECT";
    properties: Record<string, any>;
    required?: string[];
  };
}

export type HarmCategory =
  | "HARM_CATEGORY_HARASSMENT"
  | "HARM_CATEGORY_HATE_SPEECH"
  | "HARM_CATEGORY_SEXUALLY_EXPLICIT"
  | "HARM_CATEGORY_DANGEROUS_CONTENT";

export type HarmBlockThreshold =
  | "BLOCK_NONE"
  | "BLOCK_ONLY_HIGH"
  | "BLOCK_MEDIUM_AND_ABOVE"
  | "BLOCK_LOW_AND_ABOVE";

export type SafetySetting = {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
};

export type GeminiModel =
  | "gemini-pro"
  | "gemini-pro-vision"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";
