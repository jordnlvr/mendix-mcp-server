#!/usr/bin/env node

/**
 * Mendix Expert MCP Server - CLI Entry Point
 * 
 * This CLI starts the MCP server in stdio mode.
 * 
 * Usage:
 *   npx @jordnlvr/mendix-mcp-server
 *   
 * Or after global install:
 *   mendix-mcp-server
 */

import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', 'src', 'index.js');

// Import and run the server
const serverModule = await import(serverPath);

// If the module exports a start function, call it
if (typeof serverModule.start === 'function') {
  serverModule.start();
} else if (typeof serverModule.default === 'function') {
  serverModule.default();
}
// Otherwise, the server starts automatically on import
