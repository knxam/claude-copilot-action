import * as core from "@actions/core";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export async function setupOAuth(): Promise<void> {
  core.info("🔑 Setting up Claude OAuth authentication...");

  // Prepare OAuth script path
  const scriptPath = path.join(__dirname, "..", "scripts", "prepare-oauth.sh");
  
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`OAuth setup script not found at ${scriptPath}`);
  }

  // Set OAuth environment variables
  process.env.USE_OAUTH = 'true';
  // process.env.CLAUDE_ACCESS_TOKEN = process.env.INPUT_CLAUDE_ACCESS_TOKEN;
  // process.env.CLAUDE_REFRESH_TOKEN = process.env.INPUT_CLAUDE_REFRESH_TOKEN;
  // process.env.CLAUDE_EXPIRES_AT = process.env.INPUT_CLAUDE_EXPIRES_AT;

  try {
    execSync(`bash ${scriptPath}`, { 
      stdio: 'inherit',
      env: process.env
    });
    core.info("✅ OAuth authentication configured");
  } catch (error) {
    throw new Error(`Failed to setup OAuth: ${error}`);
  }
}
