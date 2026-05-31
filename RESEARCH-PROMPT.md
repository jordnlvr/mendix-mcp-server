# 🔬 ULTIMATE MENDIX DEEP RESEARCH PROMPT

Copy this prompt to GitHub Copilot Chat for comprehensive Mendix knowledge extraction:

---

## THE PROMPT

You are now a **Mendix Research AI** tasked with becoming the world's foremost expert on Mendix development. Your mission: conduct the deepest, most comprehensive research ever on Mendix Studio Pro, Mendix SDKs, and modern best practices.

### 🎯 RESEARCH SCOPE

**Primary Focus Areas:**

1. **Mendix Studio Pro 10.23+ and 11+**

   - All new features and capabilities
   - Breaking changes from previous versions
   - Version-specific best practices
   - Migration considerations

2. **Mendix Model SDK**

   - Complete API surface
   - Entity manipulation patterns
   - Domain model reading and analysis
   - Safe vs unsafe operations
   - Version compatibility

3. **Mendix Platform SDK**

   - Online working copy management
   - Team server integration
   - Deployment automation
   - CI/CD patterns

4. **Domain Modeling Excellence**

   - Entity design patterns
   - Association strategies (especially many-to-many)
   - Generalization vs composition
   - Calculated attributes
   - Event handlers
   - Validation rules
   - Index optimization

5. **Microflow Mastery**

   - Error handling patterns
   - Transaction management
   - Performance optimization
   - Async operations
   - Integration patterns
   - Reusability strategies

6. **Page & Widget Expertise**

   - Modern page structures
   - Widget best practices
   - Custom widget development
   - Responsive design
   - Performance considerations
   - Accessibility

7. **Security & Performance**
   - Entity access rules
   - Microflow security
   - Page security
   - Performance profiling
   - Query optimization
   - Caching strategies

### 📚 RESEARCH SOURCES

**Official Documentation:**

- <https://docs.mendix.com/> (ALL sections, prioritize latest)
- Mendix Academy learning paths
- Mendix API documentation
- Release notes for 10.x and 11.x

**Community & Expert Sources:**

- Mendix Forum (<https://forum.mendix.com/>)
- Mendix Community blog posts
- Expert developer blogs
- GitHub repositories with Mendix SDK examples
- Stack Overflow Mendix questions
- YouTube tutorials (Mendix official and expert channels)

**Real-World Examples:**

- Mendix marketplace modules (analyze patterns)
- Open-source Mendix projects
- Community-shared solutions
- Case studies and success stories

### 🔍 RESEARCH METHODOLOGY

**For Each Topic:**

1. **Find Official Guidance**

   - Search docs.mendix.com
   - Find exact API references
   - Note version-specific details

2. **Discover Expert Patterns**

   - Search Mendix Forum for discussions
   - Find blog posts from Mendix MVPs
   - Analyze marketplace module implementations

3. **Identify Common Pitfalls**

   - Search for error messages and solutions
   - Find "lessons learned" posts
   - Document what NOT to do

4. **Validate with Examples**

   - Find working code examples
   - Test concepts against OneTech project
   - Verify best practices are practical

5. **Document Comprehensively**
   - Clear explanations
   - Code examples
   - Visual diagrams (when possible)
   - Version compatibility notes
   - Performance implications
   - Security considerations

### 📊 OUTPUT FORMAT

For each research area, provide:

```json
{
  "topic": "Topic Name",
  "description": "Clear, concise explanation",
  "mendix_versions": ["10.23+", "11.x"],
  "official_docs": ["URL1", "URL2"],
  "best_practices": [
    {
      "practice": "What to do",
      "rationale": "Why it matters",
      "example": "Code or pattern",
      "source": "Where this came from"
    }
  ],
  "common_patterns": [
    {
      "pattern": "Pattern name",
      "use_case": "When to use",
      "implementation": "How to implement",
      "example": "Real code"
    }
  ],
  "anti_patterns": [
    {
      "mistake": "What not to do",
      "why_bad": "Why it's problematic",
      "alternative": "What to do instead"
    }
  ],
  "expert_tips": [
    {
      "tip": "Expert insight",
      "source": "Expert name or forum post",
      "context": "When this applies"
    }
  ],
  "real_world_examples": [
    {
      "scenario": "Real-world use case",
      "solution": "How it was solved",
      "source": "Where found"
    }
  ],
  "performance_notes": "Performance considerations",
  "security_notes": "Security implications",
  "testing_strategy": "How to test this"
}
```

### 🎯 SPECIFIC RESEARCH TASKS

1. **Mendix SDK Deep Dive**

   - How to safely read .mpr files without Studio Pro open
   - Best practices for domain model extraction
   - How to analyze microflows programmatically
   - Page structure reading techniques
   - Cross-module dependency analysis

2. **OneTech Project Analysis**

   - Analyze RequestHub module patterns
   - Identify MainModule architecture
   - Document association strategies used
   - Find optimization opportunities
   - Security implementation review

3. **Modern Development Patterns**

   - Latest Mendix 11 features
   - React-based widget development
   - GraphQL integration
   - External API integration best practices
   - Microservices architecture patterns

4. **Performance Optimization**

   - Database query optimization
   - Caching strategies
   - Lazy loading patterns
   - Batch processing techniques
   - Memory management

5. **Security Hardening**
   - Entity access rule patterns
   - XPath constraint examples
   - Microflow security implementation
   - Authentication patterns
   - Authorization strategies

### 🚀 DELIVERABLES

Save all research to:
`D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge\`

Create these files:

1. `studio-pro.json` - Complete Studio Pro knowledge
2. `model-sdk.json` - Model SDK API and patterns
3. `platform-sdk.json` - Platform SDK capabilities
4. `best-practices.json` - All best practices compiled
5. `troubleshooting.json` - Common issues and solutions
6. `advanced-patterns.json` - Expert-level patterns
7. `performance-guide.json` - Performance optimization
8. `security-guide.json` - Security best practices

### 🎓 SUCCESS CRITERIA

Your research is complete when you can:

- Answer ANY Mendix development question with confidence
- Provide code examples for common scenarios
- Explain trade-offs between different approaches
- Reference official documentation and expert sources
- Suggest optimizations for performance and security
- Identify version-specific considerations
- Provide real-world examples and case studies

### 🔥 GO DEEPER THAN ANYONE HAS GONE BEFORE

Don't just read documentation - UNDERSTAND it:

- Why does Mendix recommend this?
- What are the performance implications?
- How does this scale?
- What are the edge cases?
- What do experts do differently?
- What changed in Mendix 11 and why?

Research techniques:

- Search forum discussions with 100+ views
- Find blog posts from Mendix MVPs and experts
- Analyze popular marketplace modules
- Watch conference talks and webinars
- Read GitHub issues and pull requests
- Study real customer implementations

### 📝 START RESEARCH NOW

Begin with these high-priority topics:

1. Mendix Model SDK - Complete API for domain model reading
2. Association patterns - Especially many-to-many with joining entities
3. Microflow error handling - Modern best practices
4. Performance optimization - Query and caching strategies
5. Security patterns - Entity access and XPath constraints

For each topic, spend 30+ minutes researching:

- Official docs
- Forum discussions
- Expert blogs
- Code examples
- Real implementations

Then compile everything into the JSON format above and save to the knowledge base.

**Your goal: Create the most comprehensive Mendix knowledge base that has ever existed!**

---

## 🎯 HOW TO USE THIS PROMPT

1. Copy the entire prompt above
2. Open GitHub Copilot Chat (Ctrl+Shift+P → "GitHub Copilot: Open Chat")
3. Paste the prompt
4. Let Copilot research for 15-30 minutes
5. Review the generated knowledge files
6. Ask follow-up questions for deeper detail

## 💡 FOLLOW-UP PROMPTS

After initial research, ask:

- "Deep dive into [specific topic] with more examples"
- "Find 10 expert tips for [scenario] from Mendix Forum"
- "Show me 5 different patterns for [problem] with pros/cons"
- "What are the top 10 mistakes developers make with [feature]?"
- "Analyze the OneTech RequestHub module and suggest improvements"

---

**This prompt will make Copilot do the most thorough Mendix research ever conducted!** 🚀
