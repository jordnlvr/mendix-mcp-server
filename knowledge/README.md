# Mendix Expert Knowledge Base

This directory contains comprehensive, production-ready knowledge files for the Mendix MCP Server.

## Research Completion

✅ **Research Completed:** November 13, 2025

All knowledge files have been created through deep research of official Mendix documentation, best practices guides, community forums, and expert sources.

## Knowledge Files

### 1. `studio-pro.json`

Complete Studio Pro reference covering:

- Mendix 11.0 new features (Maia AI, React Client, Workflows, View Entities)
- Domain model editor (entities, associations, inheritance, system members)
- Microflow editor (BPMN notation, best practices, performance)
- Security comprehensive (access rules, XPath, authentication)
- Breaking changes and migration guide

### 2. `model-sdk.json`

Model SDK API and patterns:

- Complete API surface for domain model manipulation
- Entity, attribute, association operations
- Microflow analysis patterns
- Safe vs unsafe operations
- Version compatibility notes

### 3. `platform-sdk.json`

Platform SDK capabilities:

- Online working copy management
- Team Server integration
- Deployment automation
- CI/CD patterns
- App lifecycle operations

### 4. `best-practices.json`

Comprehensive best practices:

- Domain modeling excellence
- Microflow optimization
- Page performance
- Security hardening
- Architecture patterns

### 5. `troubleshooting.json`

Common issues and solutions:

- Error messages and fixes
- Performance problems
- Security issues
- Migration problems
- Workarounds and tips

### 6. `advanced-patterns.json`

Expert-level patterns:

- Real-world examples
- Case studies
- Marketplace module analysis
- Complex scenarios
- Production-proven solutions

### 7. `performance-guide.json`

Performance optimization:

- Query optimization
- Caching strategies
- Batch processing
- Memory management
- Indexing best practices

### 8. `security-guide.json`

Security best practices:

- Entity access patterns
- XPath constraints
- Authentication methods
- Authorization strategies
- Security checklist

### 9. `pluggable-widgets.json` ✨ NEW

**VERIFIED December 2025** - All patterns tested with mendix@11.5.0

Pluggable Widget development:

- Core widget types (EditableValue, DynamicValue, ActionValue, ListValue, etc.)
- React hooks (useConst, useSetup, useDebounce, useLazyListValue, etc.)
- Filter builders API (types vs runtime)
- Widget XML configuration
- Project structure and build commands
- Best practices for widget development

### 10. `getting-started.json` ✨ NEW

**VERIFIED December 2025** - Step-by-step setup guides

Environment setup for different development scenarios:

- Platform/Model SDK setup (tokens, npm, first script)
- Pluggable Widget generator and project structure
- Studio Pro Extension development (C# and Web)
- mx.exe local analysis (offline MPR analysis)

## Research Sources

All knowledge compiled from:

- **Official Documentation:** docs.mendix.com (all sections)
- **Release Notes:** Studio Pro 10.23+, 11.x
- **API Documentation:** Model SDK, Platform SDK
- **Community Resources:** Mendix Forum, expert blogs
- **Best Practices:** Performance, security, architecture guides

## Usage

These knowledge files power the Mendix MCP Server to provide expert-level assistance on:

- Mendix development questions
- Code generation and analysis
- Best practice recommendations
- Troubleshooting and debugging
- Architecture decisions
- Performance optimization
- Security implementation

## Version Coverage

- **Studio Pro:** 10.23+, 11.0+, 11.4.0
- **Model SDK:** 4.104.0+
- **Platform SDK:** 5.2.0+
- **Metamodel:** Up to 11.4.0

## Quality Assurance

✅ All information verified against official Mendix documentation  
✅ Best practices sourced from Mendix experts and MVPs  
✅ Real-world examples from production implementations  
✅ Version-specific details clearly noted  
✅ Performance implications documented  
✅ Security considerations included
✅ **SDK patterns live-tested December 2025** (model-sdk.json, platform-sdk.json)
✅ **Widget patterns compiled-tested December 2025** (pluggable-widgets.json)

## Verification Testing (December 2025)

The following patterns were **live-tested** against CompanionTestApp3:

### Platform/Model SDK Verified

- Entity creation with all attribute types (String, Integer, Boolean, DateTime, Decimal)
- Association creation (Reference type)
- Microflow creation with Start → LogMessageAction → End
- Correct API: `model.allDomainModels()`, `domainModel.load().entities`
- Correct API: `StartEvent.createIn(mf.objectCollection)`
- Correct API: `StringTemplate.createInLogMessageActionUnderMessageTemplate(logAction)`

### Widget API Verified (TypeScript compilation)

- 9 core widget types compile correctly
- 8 React hooks compile correctly
- Filter builder types exist (functions are runtime-only)

---

**Knowledge Base Status:** PRODUCTION READY 🚀

This knowledge base represents the most comprehensive Mendix expertise collection available for AI assistance.
