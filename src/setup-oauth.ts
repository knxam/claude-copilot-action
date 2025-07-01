import * as core from "@actions/core";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";

const OAUTH_TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token';
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';

interface OAuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | number; // Может быть и строкой (из секрета) и числом
  secretsAdminPat?: string;
}

interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
}

function tokenExpired(expiresAt: string | number): boolean {
  // Add 60 minutes buffer to refresh before actual expiry
  const bufferMs = 60 * 60 * 1000;
  
  try {
    let expiresAtMs: number;
    
    if (typeof expiresAt === 'number') {
      // Already a timestamp in milliseconds
      expiresAtMs = expiresAt;
    } else if (typeof expiresAt === 'string') {
      // Try to parse as number first (timestamp)
      const timestamp = parseInt(expiresAt);
      if (!isNaN(timestamp)) {
        expiresAtMs = timestamp;
      } else {
        // Try to parse as ISO date string
        const expiresAtDate = new Date(expiresAt);
        if (!isNaN(expiresAtDate.getTime())) {
          expiresAtMs = expiresAtDate.getTime();
        } else {
          core.warning(`Unable to parse expiresAt date: ${expiresAt}`);
          return true;
        }
      }
    } else {
      core.warning(`Invalid expiresAt type: ${typeof expiresAt}`);
      return true;
    }
    
    const currentTime = Date.now();
    return currentTime >= (expiresAtMs - bufferMs);
  } catch (error) {
    core.warning(`Error parsing expiresAt date: ${error}`);
    return true;
  }
}

async function performRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  try {
    core.info(`Attempting to refresh token using refresh token: ${refreshToken.substring(0, 10)}...`);
    
    const response = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
    });

    core.info(`Refresh response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json() as TokenRefreshResponse;
      
      // Calculate expiration timestamp in milliseconds
      const expiresAt = Date.now() + (data.expires_in * 1000);
      
      core.info(`Token refreshed successfully. New expiration: ${new Date(expiresAt).toISOString()}`);
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: expiresAt,
      };
    } else {
      const errorBody = await response.text();
      core.error(`Token refresh failed: ${response.status} - ${errorBody}`);
      return null;
    }
  } catch (error) {
    core.error(`Error making refresh request: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

function updateGitHubSecrets(secretsAdminPat: string, accessToken: string, refreshToken: string, expiresAt: string | number) {
  const env = { ...process.env, GH_TOKEN: secretsAdminPat };
  
  try {
    // Update CLAUDE_ACCESS_TOKEN
    execSync(`gh secret set CLAUDE_ACCESS_TOKEN --body "${accessToken}"`, { env, stdio: 'inherit' });
    core.info('✅ Updated CLAUDE_ACCESS_TOKEN secret');
    
    // Update CLAUDE_REFRESH_TOKEN
    execSync(`gh secret set CLAUDE_REFRESH_TOKEN --body "${refreshToken}"`, { env, stdio: 'inherit' });
    core.info('✅ Updated CLAUDE_REFRESH_TOKEN secret');
    
    // Update CLAUDE_EXPIRES_AT (as string)
    execSync(`gh secret set CLAUDE_EXPIRES_AT --body "${expiresAt}"`, { env, stdio: 'inherit' });
    core.info('✅ Updated CLAUDE_EXPIRES_AT secret');
  } catch (error) {
    core.error('Failed to update GitHub secrets');
    throw error;
  }
}

export async function setupOAuth(): Promise<void> {
  core.info("🔑 Setting up Claude OAuth authentication...");

  const credentials: OAuthCredentials = {
    accessToken: process.env.INPUT_CLAUDE_ACCESS_TOKEN!,
    refreshToken: process.env.INPUT_CLAUDE_REFRESH_TOKEN!,
    expiresAt: process.env.INPUT_CLAUDE_EXPIRES_AT!,
    secretsAdminPat: process.env.INPUT_SECRETS_ADMIN_PAT,
  };

  // Debug log
  core.debug(`expiresAt value: ${credentials.expiresAt}`);

  // Prepare OAuth script path
  const scriptPath = path.join(__dirname, "..", "scripts", "prepare-oauth.sh");
  
  if (!await fs.access(scriptPath).then(() => true).catch(() => false)) {
    throw new Error(`OAuth setup script not found at ${scriptPath}`);
  }

  let accessToken = credentials.accessToken;
  let refreshToken = credentials.refreshToken;
  let expiresAt: string | number = credentials.expiresAt;

  // Check if token needs refresh
  if (tokenExpired(expiresAt)) {
    if (!credentials.secretsAdminPat) {
      core.warning(`
⚠️  OAuth token is expiring soon but SECRETS_ADMIN_PAT is not set!
⚠️  
⚠️  The GitHub Action cannot automatically refresh your OAuth tokens without the SECRETS_ADMIN_PAT.
⚠️  Your Claude Code execution may fail if the token expires during the workflow.
⚠️  
⚠️  To enable automatic token refresh:
⚠️  1. Create a Personal Access Token with 'secrets:write' permission
⚠️  2. Add it as a repository secret named SECRETS_ADMIN_PAT
⚠️  3. Pass it to this action using: secrets_admin_pat: \${{ secrets.SECRETS_ADMIN_PAT }}
⚠️  
⚠️  Continuing with potentially expired token...
`);
    } else {
      core.info('🔄 Token expired or expiring soon, refreshing...');
      const newTokens = await performRefresh(refreshToken);
      
      if (newTokens) {
        accessToken = newTokens.accessToken;
        refreshToken = newTokens.refreshToken;
        expiresAt = newTokens.expiresAt;
        
        core.info('✅ Token refreshed successfully!');
        
        // Update GitHub secrets with new tokens
        core.info('📝 Updating GitHub secrets with refreshed tokens...');
        updateGitHubSecrets(credentials.secretsAdminPat, accessToken, refreshToken, expiresAt);
      } else {
        core.error('Failed to refresh token, using existing credentials');
      }
    }
  } else {
    // Parse expiresAt to get milliseconds
    let expiresAtMs: number;
    if (typeof expiresAt === 'number') {
      expiresAtMs = expiresAt;
    } else {
      expiresAtMs = parseInt(expiresAt);
    }
    
    if (!isNaN(expiresAtMs)) {
      const minutesUntilExpiry = Math.round((expiresAtMs - Date.now()) / 1000 / 60);
      core.info(`✅ Token is still valid (expires in ${minutesUntilExpiry} minutes)`);
    } else {
      core.warning(`Invalid expiresAt format: ${expiresAt}`);
    }
  }

  // Set OAuth environment variables for the script
  process.env.USE_OAUTH = 'true';
  process.env.CLAUDE_ACCESS_TOKEN = accessToken;
  process.env.CLAUDE_REFRESH_TOKEN = refreshToken;
  process.env.CLAUDE_EXPIRES_AT = String(expiresAt); // Всегда передаем как строку

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
