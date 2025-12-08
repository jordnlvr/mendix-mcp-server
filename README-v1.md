# Mendix Expert MCP Server v2.0

> A modular, scalable, self-learning MCP server providing comprehensive Mendix development knowledge and dynamic project analysis.

## What This Server Provides

### Knowledge Base

- Mendix Studio Pro 10.23+ / 11+ features and capabilities
- Mendix Model SDK and Platform SDK documentation
- Domain modeling best practices
- Microflow patterns and conventions
- Page design principles
- Security and access control
- Integration patterns
- Performance optimization

### Extracted OneTech Knowledge

- Complete RequestHub domain model structure
- MainModule entities and relationships
- Cross-module association patterns
- Real-world Mendix application architecture

### Resources

- Official Mendix documentation references
- Community best practices
- SDK code examples
- Troubleshooting guides
- Version-specific guidance

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure in VS Code

Add to your VS Code `settings.json`:

```json
{
  "mcp-servers": {
    "mendix-expert": {
      "command": "node",
      "args": ["D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\mendix-mcp-server\\server.js"],
      "env": {
        "MENDIX_PROJECT_PATH": "D:\\kelly.seale\\CodeBase\\OneTech-main\\OneTech.mpr",
        "MENDIX_SDK_TOOLKIT_PATH": "D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\Mendix-SDK-Toolkit"
      }
    }
  }
}
```

### 3. Use in Copilot Chat

Once configured, tell Copilot:

```
Use the mendix-expert MCP server to help me with [your Mendix question]
```

## Knowledge Sources

This MCP server aggregates knowledge from:

1. **Official Mendix Docs** - Studio Pro, SDK, best practices
2. **OneTech Project** - Real domain model examples
3. **Mendix SDK Toolkit** - Extracted data and analysis
4. **Community Resources** - Forums, blogs, expert advice
5. **Version-Specific Guides** - Mendix 10.23+ and 11+ specific features

## Available Commands

When using this MCP server through Copilot:

- **"Explain [Mendix concept]"** - Get detailed explanations
- **"Show example of [pattern]"** - Get code examples
- **"Analyze [entity/module]"** - Get analysis from OneTech data
- **"Best practice for [scenario]"** - Get recommendations
- **"Compare [option A] vs [option B]"** - Get guidance
- **"Troubleshoot [issue]"** - Get debugging help

## Project Structure

```
mendix-mcp-server/
├── server.js                 # Main MCP server
├── knowledge/
│   ├── studio-pro.json      # Studio Pro knowledge
│   ├── model-sdk.json       # Model SDK knowledge
│   ├── platform-sdk.json    # Platform SDK knowledge
│   ├── best-practices.json  # Best practices
│   └── troubleshooting.json # Common issues & solutions
├── extractors/
│   ├── onetech-extractor.js # OneTech data access
│   └── sdk-toolkit-link.js  # Link to SDK toolkit
└── package.json
```

## Benefits

1. **Instant Expert Knowledge** - No searching through docs
2. **Context-Aware** - Knows your OneTech project structure
3. **Version-Specific** - Mendix 10.23+ and 11+ guidance
4. **Real Examples** - Uses your actual domain models
5. **Always Available** - Works offline with cached knowledge
6. **Consistent Answers** - Same quality every time

## Knowledge Base Update Strategy

The server can be updated with:

1. Latest Mendix release notes
2. New SDK features
3. Additional OneTech analysis
4. Community-discovered patterns
5. Performance optimization techniques

## Example Usage

**Question:** "What's the best way to implement a many-to-many relationship in Mendix?"

**MCP Response:**

```
In Mendix, implement many-to-many relationships using a joining entity pattern:

1. Create three entities:
   - Entity A (e.g., Request)
   - Entity B (e.g., Specialty)
   - Joining Entity (e.g., RequestSpecialty)

2. Define associations:
   - RequestSpecialty → Request (many-to-one)
   - RequestSpecialty → Specialty (many-to-one)

3. Example from your OneTech project:
   The RequestHub module uses this pattern:
   - Request (main entity)
   - Specialty (configuration entity)
   - RequestSpecialty (joining entity)

   This allows one Request to have multiple Specialties,
   and one Specialty to be used by multiple Requests.

4. Additional fields on the joining entity:
   - Assignee (System.User) - Who handles this specialty for this request
   - Status, priority, notes, etc.

Best Practices:
- Always use a joining entity (never direct many-to-many)
- Add relevant metadata to the joining entity
- Use clear naming: [EntityA][EntityB] or [EntityA][Purpose]
- Include audit fields (CreatedDate, ModifiedDate, etc.)
```

## Future Enhancements

- [ ] Real-time Mendix API integration
- [ ] Automatic knowledge base updates from Mendix releases
- [ ] Integration with Mendix Forum for latest discussions
- [ ] Video tutorial parsing and summarization
- [ ] Community pattern library
- [ ] Performance benchmark data
- [ ] Security vulnerability database

## Contributing

To add knowledge:

1. Edit relevant JSON files in `/knowledge`
2. Follow the schema structure
3. Include source references
4. Test with example queries

---

**This MCP server turns Copilot into a true Mendix expert with deep knowledge of your specific project!**
