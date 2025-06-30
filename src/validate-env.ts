import * as core from "@actions/core";

export function validateEnvironmentVariables(): void {
  // Check if we're in GitHub Actions
  if (!process.env.GITHUB_ACTIONS) {
    core.warning("Not running in GitHub Actions environment");
  }

  // Check authentication method
  const useOAuth = process.env.INPUT_USE_OAUTH === 'true';
  const anthropicApiKey = process.env.INPUT_ANTHROPIC_API_KEY;
  const useBedrock = process.env.INPUT_USE_BEDROCK === 'true';
  const useVertex = process.env.INPUT_USE_VERTEX === 'true';

  if (useOAuth) {
    // Validate OAuth tokens
    if (!process.env.INPUT_CLAUDE_ACCESS_TOKEN) {
      throw new Error("claude_access_token is required when use_oauth is true");
    }
    if (!process.env.INPUT_CLAUDE_REFRESH_TOKEN) {
      throw new Error("claude_refresh_token is required when use_oauth is true");
    }
    if (!process.env.INPUT_CLAUDE_EXPIRES_AT) {
      throw new Error("claude_expires_at is required when use_oauth is true");
    }
  } else if (!useBedrock && !useVertex) {
    // For direct API, we need an API key
    if (!anthropicApiKey) {
      throw new Error("anthropic_api_key is required when not using OAuth, Bedrock, or Vertex");
    }
  }

  // Validate required inputs
  if (!process.env.INPUT_PROMPT_FILE) {
    throw new Error("prompt_file is required");
  }

  core.info("✅ Environment variables validated");
}
