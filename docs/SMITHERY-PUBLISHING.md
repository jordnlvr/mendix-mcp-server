# Publishing to Smithery Registry

This guide explains how the Mendix Expert MCP Server is published to the [Smithery Registry](https://smithery.ai) and how to update it.

## What is Smithery?

Smithery is the official registry and distribution platform for Model Context Protocol (MCP) servers. It provides:

- **Centralized Discovery** - Users can find and install MCP servers from one location
- **Easy Installation** - One-command install via Smithery CLI
- **Version Management** - Track versions and updates
- **Configuration UI** - User-friendly configuration prompts

## Current Status

✅ **The server is already published on Smithery!**

- **Registry URL**: https://smithery.ai/server/@jordnlvr/mendix-mcp-server
- **npm Package**: `@jordnlvr/mendix-mcp-server`
- **Current Version**: 3.2.0

## How Users Install from Smithery

Users can install the server in multiple ways:

### Option 1: Via Smithery CLI (Recommended)

```bash
# Install the Smithery CLI globally
npm install -g @smithery/cli

# Install Mendix Expert MCP Server
smithery install @jordnlvr/mendix-mcp-server --client claude

# Or for VS Code Copilot
smithery install @jordnlvr/mendix-mcp-server --client vscode
```

### Option 2: Direct npm Install

```bash
npm install -g @jordnlvr/mendix-mcp-server
```

### Option 3: Via MCP Client Configuration

Users can add the server directly to their MCP client config files. See the main [README.md](../README.md) for examples.

## Configuration Options

The server supports optional configuration via `smithery.yaml`:

| Environment Variable | Description | Required |
|---------------------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for enhanced semantic search | No |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key (enterprise) | No |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | No |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Embedding deployment name | No |
| `PINECONE_API_KEY` | Custom Pinecone index API key | No |
| `PINECONE_INDEX` | Custom Pinecone index name | No |
| `DEBUG` | Enable debug logging | No |

**Important**: All configuration is optional! The server works out of the box without any API keys, using local TF-IDF search.

## Publishing Updates to Smithery

Smithery automatically indexes npm packages, so publishing updates is simple:

### Step 1: Update Version

Edit `package.json` and bump the version:

```json
{
  "version": "3.2.1"
}
```

### Step 2: Update CHANGELOG.md

Document your changes under a new version section:

```markdown
## [3.2.1] - 2025-12-11
### Added
- New feature description
### Fixed
- Bug fix description
```

### Step 3: Update smithery.yaml (if needed)

Only update `smithery.yaml` if you're:
- Adding new configuration options
- Changing the server start command
- Modifying environment variable handling

### Step 4: Test Locally

```bash
# Test the server starts correctly
npm start

# Test with Smithery dev mode
npx smithery dev
```

### Step 5: Commit and Tag

```bash
git add -A
git commit -m "v3.2.1: Description of changes"
git push origin main

# Create a git tag
git tag -a v3.2.1 -m "v3.2.1 - Release notes"
git push origin v3.2.1
```

### Step 6: Publish to npm

```bash
npm publish --access public
```

### Step 7: Verify on Smithery

Wait 5-10 minutes for Smithery to index the new npm version, then check:
- https://smithery.ai/server/@jordnlvr/mendix-mcp-server
- Verify the new version appears
- Test installation: `smithery install @jordnlvr/mendix-mcp-server@latest`

## GitHub Actions Automation

The repository includes automated publishing via GitHub Actions:

### `.github/workflows/npm-publish.yml`

This workflow automatically publishes to npm when:
1. You create a GitHub Release
2. The `NPM_TOKEN` secret is configured

To use it:

1. Create a release on GitHub with tag `v3.2.1`
2. The workflow runs automatically
3. Package is published to npm
4. Smithery indexes it within minutes

## Testing the Smithery Configuration

Before publishing, test your `smithery.yaml` configuration:

```bash
# Development mode - tests configuration
npx smithery dev

# Build mode - validates package
npx smithery build

# Test with custom config
npx smithery dev --config '{"DEBUG": true}'
```

## Smithery.yaml Structure

The `smithery.yaml` file defines how Smithery runs the server:

```yaml
runtime: "typescript"          # Language runtime
startCommand:
  type: stdio                  # MCP transport type (stdio/http)
configSchema:                  # JSON Schema for user config
  type: object
  properties:
    OPENAI_API_KEY:
      type: string
      description: "..."
commandFunction: |-            # JavaScript to build start command
  (config) => ({
    command: 'node',
    args: ['src/index.js'],
    env: { ...config }
  })
exampleConfig:                 # Example for testing
  DEBUG: false
```

## Troubleshooting

### Issue: Server not appearing on Smithery

**Solution**: 
- Verify package is published on npm: https://www.npmjs.com/package/@jordnlvr/mendix-mcp-server
- Check `package.json` has correct `module` field pointing to Smithery entry point
- Wait 10-15 minutes for Smithery's indexer to run

### Issue: Configuration not working

**Solution**:
- Validate `smithery.yaml` syntax with `npx smithery build`
- Check `configSchema` follows JSON Schema format
- Test with `npx smithery dev --config '{...}'`

### Issue: Server starts but doesn't respond

**Solution**:
- Verify `src/smithery.js` exports a proper MCP server
- Check logs with `DEBUG=true` environment variable
- Test standalone: `node src/index.js`

## Best Practices

1. **Version Consistency**: Keep `package.json` version in sync with git tags
2. **Semantic Versioning**: Follow semver (major.minor.patch)
3. **Changelog**: Always update CHANGELOG.md before release
4. **Test Before Release**: Run `npm start` and verify functionality
5. **Minimal Config**: Keep configuration optional when possible
6. **Clear Descriptions**: Write clear descriptions in configSchema
7. **Example Values**: Provide exampleConfig for user reference

## Additional Resources

- [Smithery Documentation](https://smithery.ai/docs)
- [Smithery CLI GitHub](https://github.com/smithery-ai/cli)
- [MCP Specification](https://modelcontextprotocol.io/)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v10/commands/npm-publish)

## Support

If you encounter issues with Smithery publishing:

1. Check the [Smithery Documentation](https://smithery.ai/docs)
2. Review the [MCP Specification](https://modelcontextprotocol.io/)
3. Open an issue on [GitHub](https://github.com/jordnlvr/mendix-mcp-server/issues)
4. Contact: kelly.seale@siemens.com

---

**Last Updated**: December 11, 2025  
**Server Version**: 3.2.0
