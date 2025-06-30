import * as core from "@actions/core";
import * as fs from "fs/promises";
import * as path from "path";

export interface PromptConfig {
  path: string;
  content: string;
}

export async function preparePrompt(options: {
  promptFile?: string;
}): Promise<PromptConfig> {
  
  if (!options.promptFile) {
    throw new Error("No prompt file provided");
  }

  // Read prompt from file
  try {
    const content = await fs.readFile(options.promptFile, "utf8");
    core.info(`📝 Loaded prompt from: ${options.promptFile}`);
    core.info(`Prompt preview: ${content.substring(0, 100)}...`);
    
    return {
      path: options.promptFile,
      content: content
    };
  } catch (error) {
    throw new Error(`Failed to read prompt file: ${error}`);
  }
}
