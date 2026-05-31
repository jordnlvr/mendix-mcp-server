# Security Policy

## Supported Versions

| Version | Supported              |
| ------- | ---------------------- |
| 2.1.x   | ✅ Current             |
| 2.0.x   | ⚠️ Security fixes only |
| < 2.0   | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Security Considerations

This MCP server:

- **Does NOT** store credentials - uses environment variables for tokens
- **Does NOT** execute arbitrary code - only reads/analyzes files
- **Does NOT** make network requests without explicit user action
- **ONLY** accesses file paths explicitly provided by the user

### Best Practices

1. Don't commit sensitive data to knowledge base files
2. Keep your Node.js version updated
3. Review knowledge entries before adding (especially from community sources)
4. Use environment variables for any API tokens (e.g., `MENDIX_TOKEN`)
