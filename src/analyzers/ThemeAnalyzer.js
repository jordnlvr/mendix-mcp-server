/**
 * Mendix Theme Analyzer
 *
 * Deep analysis of Mendix custom themes against best practices.
 * Analyzes both web (SCSS) and native (JS) themes for:
 * - Structure compliance
 * - Variable usage and organization
 * - Design system patterns
 * - Performance considerations
 * - Maintainability
 * - Version compatibility
 *
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';

class ThemeAnalyzer {
  constructor() {
    // Best practices rules and scoring weights
    this.rules = {
      structure: {
        weight: 25,
        checks: [
          'hasThemeFolder',
          'hasThemesourceFolder',
          'hasCustomVariables',
          'hasMainFile',
          'hasExclusionVariables',
          'hasSettingsJson',
          'hasProperFolderStructure',
        ],
      },
      variables: {
        weight: 20,
        checks: [
          'usesDesignTokens',
          'hasColorVariables',
          'hasFontVariables',
          'hasSpacingVariables',
          'avoidsMagicNumbers',
          'variablesAreOrganized',
        ],
      },
      organization: {
        weight: 20,
        checks: [
          'filesSeparatedByPurpose',
          'importsAreOrganized',
          'hasComments',
          'followsNamingConventions',
          'noDeadCode',
        ],
      },
      modularity: {
        weight: 15,
        checks: [
          'usesThemeModule',
          'isUIResourceModule',
          'moduleOrderConfigured',
          'designPropertiesUsed',
        ],
      },
      performance: {
        weight: 10,
        checks: [
          'noDeepNesting',
          'noOverlySpecificSelectors',
          'usesAtlasExclusions',
          'efficientSelectors',
        ],
      },
      compatibility: {
        weight: 10,
        checks: [
          'compatibleWithStudioProVersion',
          'usesCurrentAtlasPatterns',
          'noDeprecatedPatterns',
        ],
      },
    };

    // Pattern definitions for analysis
    this.patterns = {
      // SCSS patterns
      magicNumber: /:\s*\d+px|:\s*\d+em|:\s*\d+rem|#[0-9a-fA-F]{3,6}/g,
      deepNesting: /^\s{12,}/gm, // 4+ levels of nesting
      designToken: /\$[\w-]+/g,
      importStatement: /@import\s+["'][^"']+["']/g,
      colorHex: /#[0-9a-fA-F]{3,8}/g,

      // Variable patterns
      brandVariables: /\$brand-(primary|secondary|success|warning|danger|info|default)/g,
      spacingVariables: /\$spacing-(tiny|small|medium|large|huge)/g,
      fontVariables: /\$font-(family|size|weight)/g,

      // Native JS patterns
      exportConst: /export\s+const\s+\w+/g,
      jsColorHex: /["']#[0-9a-fA-F]{3,8}["']/g,
    };

    // Mendix version compatibility info
    this.versionInfo = {
      10: {
        atlasVersion: '3.x',
        patterns: ['design-properties.json', 'exclusion-variables.scss'],
        deprecated: [],
      },
      11: {
        atlasVersion: '4.x',
        patterns: ['design-properties.json', 'exclusion-variables.scss', 'React Client support'],
        deprecated: ['old dijit widgets'],
      },
    };
  }

  /**
   * Analyze a Mendix project's theme
   * @param {string} projectPath - Path to .mpr file or project directory
   * @param {object} options - Analysis options
   * @returns {object} Analysis results with score and recommendations
   */
  async analyze(projectPath, options = {}) {
    const startTime = Date.now();

    // Determine project directory
    const projectDir = projectPath.endsWith('.mpr') ? path.dirname(projectPath) : projectPath;

    // Gather project info
    const projectInfo = await this.getProjectInfo(projectDir);

    // Analyze theme structure
    const structureAnalysis = await this.analyzeStructure(projectDir);

    // Analyze web theme (SCSS)
    const webAnalysis = await this.analyzeWebTheme(projectDir);

    // Analyze native theme (JS) if present
    const nativeAnalysis = await this.analyzeNativeTheme(projectDir);

    // Analyze themesource modules
    const moduleAnalysis = await this.analyzeThemeModules(projectDir);

    // Calculate overall score
    const scores = this.calculateScores({
      structure: structureAnalysis,
      web: webAnalysis,
      native: nativeAnalysis,
      modules: moduleAnalysis,
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      structure: structureAnalysis,
      web: webAnalysis,
      native: nativeAnalysis,
      modules: moduleAnalysis,
      projectInfo,
    });

    // Determine grade
    const grade = this.calculateGrade(scores.overall);

    return {
      projectPath: projectDir,
      projectInfo,
      analyzedAt: new Date().toISOString(),
      analysisTimeMs: Date.now() - startTime,

      scores: {
        overall: scores.overall,
        grade,
        breakdown: scores.breakdown,
      },

      analysis: {
        structure: structureAnalysis,
        webTheme: webAnalysis,
        nativeTheme: nativeAnalysis,
        modules: moduleAnalysis,
      },

      recommendations: {
        critical: recommendations.filter((r) => r.severity === 'critical'),
        important: recommendations.filter((r) => r.severity === 'important'),
        suggestions: recommendations.filter((r) => r.severity === 'suggestion'),
      },

      summary: this.generateSummary(scores, recommendations, grade),
    };
  }

  /**
   * Get basic project information
   */
  async getProjectInfo(projectDir) {
    const info = {
      directory: projectDir,
      hasTheme: false,
      hasThemesource: false,
      studioProVersion: 'unknown',
      atlasVersion: 'unknown',
    };

    try {
      // Check for theme folder
      const themePath = path.join(projectDir, 'theme');
      info.hasTheme = await this.pathExists(themePath);

      // Check for themesource folder
      const themesourcePath = path.join(projectDir, 'themesource');
      info.hasThemesource = await this.pathExists(themesourcePath);

      // Try to detect Studio Pro version from .mpr or project files
      const mprFiles = await this.findFiles(projectDir, '*.mpr');
      if (mprFiles.length > 0) {
        info.mprFile = mprFiles[0];
      }

      // Check for Atlas_Core to determine Atlas version
      const atlasCorePath = path.join(themesourcePath, 'Atlas_Core');
      if (await this.pathExists(atlasCorePath)) {
        info.hasAtlasCore = true;
        // Could parse version from module if available
      }
    } catch (error) {
      info.error = error.message;
    }

    return info;
  }

  /**
   * Analyze theme folder structure
   */
  async analyzeStructure(projectDir) {
    const results = {
      score: 0,
      maxScore: 100,
      issues: [],
      findings: [],
    };

    const checks = {
      // Theme folder structure
      'theme/web': { required: true, description: 'Web theme folder' },
      'theme/web/custom-variables.scss': { required: true, description: 'Custom variables file' },
      'theme/web/main.scss': { required: true, description: 'Main SCSS file' },
      'theme/web/exclusion-variables.scss': {
        required: false,
        description: 'Atlas exclusion variables',
      },
      'theme/web/settings.json': { required: true, description: 'Theme settings' },
      'theme/native': { required: false, description: 'Native theme folder' },
      'theme/native/custom-variables.js': {
        required: false,
        description: 'Native custom variables',
      },
      'theme/native/main.js': { required: false, description: 'Native main file' },
      themesource: { required: true, description: 'Theme source modules folder' },
      'themesource/Atlas_Core': { required: true, description: 'Atlas Core module' },
    };

    let passedChecks = 0;
    let totalRequired = 0;

    for (const [relativePath, config] of Object.entries(checks)) {
      const fullPath = path.join(projectDir, relativePath);
      const exists = await this.pathExists(fullPath);

      if (config.required) {
        totalRequired++;
        if (exists) {
          passedChecks++;
          results.findings.push({
            check: config.description,
            status: 'pass',
            path: relativePath,
          });
        } else {
          results.issues.push({
            severity: 'critical',
            message: `Missing required: ${config.description}`,
            path: relativePath,
            fix: `Create ${relativePath}`,
          });
        }
      } else if (exists) {
        results.findings.push({
          check: config.description,
          status: 'present',
          path: relativePath,
        });
      }
    }

    results.score = Math.round((passedChecks / totalRequired) * 100);
    return results;
  }

  /**
   * Analyze web theme (SCSS files)
   */
  async analyzeWebTheme(projectDir) {
    const results = {
      score: 0,
      maxScore: 100,
      issues: [],
      findings: [],
      stats: {
        totalFiles: 0,
        totalLines: 0,
        variablesCount: 0,
        importsCount: 0,
        magicNumbersCount: 0,
        deepNestingCount: 0,
      },
    };

    const webThemePath = path.join(projectDir, 'theme', 'web');

    if (!(await this.pathExists(webThemePath))) {
      results.issues.push({
        severity: 'critical',
        message: 'Web theme folder not found',
        fix: 'Create theme/web folder with required files',
      });
      return results;
    }

    // Analyze custom-variables.scss
    const customVarsPath = path.join(webThemePath, 'custom-variables.scss');
    if (await this.pathExists(customVarsPath)) {
      const varsAnalysis = await this.analyzeScssFile(customVarsPath, 'custom-variables');
      results.customVariables = varsAnalysis;

      // Check for proper variable organization
      if (!varsAnalysis.hasColorSection) {
        results.issues.push({
          severity: 'important',
          message: 'Color variables should be grouped together',
          file: 'custom-variables.scss',
          fix: 'Organize color variables in a dedicated section with comments',
        });
      }

      if (varsAnalysis.magicNumbers > 0) {
        results.issues.push({
          severity: 'important',
          message: `Found ${varsAnalysis.magicNumbers} hardcoded values - use variables instead`,
          file: 'custom-variables.scss',
          fix: 'Replace hardcoded colors/sizes with SCSS variables',
        });
      }
    }

    // Analyze main.scss
    const mainPath = path.join(webThemePath, 'main.scss');
    if (await this.pathExists(mainPath)) {
      const mainAnalysis = await this.analyzeScssFile(mainPath, 'main');
      results.mainFile = mainAnalysis;

      if (mainAnalysis.deepNesting > 0) {
        results.issues.push({
          severity: 'important',
          message: `Found ${mainAnalysis.deepNesting} instances of deep nesting (4+ levels)`,
          file: 'main.scss',
          fix: 'Flatten selectors - deep nesting hurts performance and maintainability',
        });
      }
    }

    // Find and analyze all SCSS files
    const scssFiles = await this.findFiles(webThemePath, '**/*.scss');
    results.stats.totalFiles = scssFiles.length;

    for (const file of scssFiles) {
      const content = await fs.readFile(file, 'utf8');
      results.stats.totalLines += content.split('\n').length;
      results.stats.variablesCount += (content.match(this.patterns.designToken) || []).length;
      results.stats.importsCount += (content.match(this.patterns.importStatement) || []).length;
      results.stats.magicNumbersCount += this.countMagicNumbers(content);
      results.stats.deepNestingCount += (content.match(this.patterns.deepNesting) || []).length;
    }

    // Calculate score based on findings
    let deductions = 0;
    deductions += Math.min(30, results.stats.magicNumbersCount * 2); // Max 30 points off for magic numbers
    deductions += Math.min(20, results.stats.deepNestingCount * 5); // Max 20 points off for deep nesting
    deductions += results.issues.filter((i) => i.severity === 'critical').length * 15;
    deductions += results.issues.filter((i) => i.severity === 'important').length * 5;

    results.score = Math.max(0, 100 - deductions);
    return results;
  }

  /**
   * Analyze a single SCSS file
   */
  async analyzeScssFile(filePath, fileType) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    return {
      path: filePath,
      lineCount: lines.length,
      hasComments: content.includes('//') || content.includes('/*'),
      hasColorSection: content.toLowerCase().includes('color') && content.includes('$'),
      hasFontSection: content.toLowerCase().includes('font'),
      hasSpacingSection: content.toLowerCase().includes('spacing'),
      variableCount: (content.match(this.patterns.designToken) || []).length,
      importCount: (content.match(this.patterns.importStatement) || []).length,
      magicNumbers: this.countMagicNumbers(content),
      deepNesting: (content.match(this.patterns.deepNesting) || []).length,
      usesAtlasVariables:
        this.patterns.brandVariables.test(content) || this.patterns.spacingVariables.test(content),
    };
  }

  /**
   * Count magic numbers (hardcoded values that should be variables)
   */
  countMagicNumbers(content) {
    let count = 0;

    // Count hardcoded hex colors not in variable definitions
    const hexColors = content.match(this.patterns.colorHex) || [];
    const inVariables = content.match(/\$[\w-]+:\s*#[0-9a-fA-F]+/g) || [];
    count += Math.max(0, hexColors.length - inVariables.length);

    // Count hardcoded pixel values not in variable definitions
    const pixelValues = content.match(/:\s*\d+px/g) || [];
    count += pixelValues.length;

    return count;
  }

  /**
   * Analyze native theme (JS files)
   */
  async analyzeNativeTheme(projectDir) {
    const results = {
      score: 0,
      maxScore: 100,
      issues: [],
      findings: [],
      present: false,
    };

    const nativeThemePath = path.join(projectDir, 'theme', 'native');

    if (!(await this.pathExists(nativeThemePath))) {
      results.findings.push({
        check: 'Native theme',
        status: 'not-present',
        note: 'Native theme not required for web-only apps',
      });
      results.score = 100; // Not applicable, so no penalty
      return results;
    }

    results.present = true;

    // Analyze custom-variables.js
    const customVarsPath = path.join(nativeThemePath, 'custom-variables.js');
    if (await this.pathExists(customVarsPath)) {
      const content = await fs.readFile(customVarsPath, 'utf8');

      results.customVariables = {
        lineCount: content.split('\n').length,
        exportCount: (content.match(this.patterns.exportConst) || []).length,
        hardcodedColors: (content.match(this.patterns.jsColorHex) || []).length,
      };

      if (results.customVariables.hardcodedColors > 10) {
        results.issues.push({
          severity: 'important',
          message: 'Many hardcoded colors in native variables',
          file: 'custom-variables.js',
          fix: 'Consider using a centralized color palette object',
        });
      }
    }

    results.score = Math.max(0, 100 - results.issues.length * 10);
    return results;
  }

  /**
   * Analyze themesource modules
   */
  async analyzeThemeModules(projectDir) {
    const results = {
      score: 0,
      maxScore: 100,
      modules: [],
      issues: [],
      findings: [],
    };

    const themesourcePath = path.join(projectDir, 'themesource');

    if (!(await this.pathExists(themesourcePath))) {
      results.issues.push({
        severity: 'critical',
        message: 'themesource folder not found',
        fix: 'Ensure project has themesource folder with Atlas_Core',
      });
      return results;
    }

    try {
      const entries = await fs.readdir(themesourcePath, { withFileTypes: true });
      const moduleDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

      for (const moduleName of moduleDirs) {
        const modulePath = path.join(themesourcePath, moduleName);
        const moduleAnalysis = await this.analyzeModule(modulePath, moduleName);
        results.modules.push(moduleAnalysis);
      }

      // Check for Atlas_Core
      const hasAtlasCore = moduleDirs.includes('Atlas_Core');
      if (!hasAtlasCore) {
        results.issues.push({
          severity: 'critical',
          message: 'Atlas_Core module not found',
          fix: 'Import Atlas_Core from the Mendix Marketplace',
        });
      }

      // Check for custom theme modules
      const customModules = moduleDirs.filter(
        (m) => m !== 'Atlas_Core' && m !== 'Atlas_Web_Content' && m !== 'Atlas_NativeMobile_Content'
      );

      if (customModules.length > 0) {
        results.findings.push({
          check: 'Custom theme modules',
          status: 'present',
          modules: customModules,
        });
      }
    } catch (error) {
      results.issues.push({
        severity: 'critical',
        message: `Error analyzing themesource: ${error.message}`,
      });
    }

    results.score = Math.max(
      0,
      100 - results.issues.filter((i) => i.severity === 'critical').length * 25
    );
    return results;
  }

  /**
   * Analyze a single themesource module
   */
  async analyzeModule(modulePath, moduleName) {
    const analysis = {
      name: moduleName,
      hasWebStyling: await this.pathExists(path.join(modulePath, 'web')),
      hasNativeStyling: await this.pathExists(path.join(modulePath, 'native')),
      hasDesignProperties:
        (await this.pathExists(path.join(modulePath, 'web', 'design-properties.json'))) ||
        (await this.pathExists(path.join(modulePath, 'native', 'design-properties.json'))),
      hasPublicFolder: await this.pathExists(path.join(modulePath, 'public')),
    };

    // Count SCSS files in web folder
    if (analysis.hasWebStyling) {
      const webFiles = await this.findFiles(path.join(modulePath, 'web'), '**/*.scss');
      analysis.webFileCount = webFiles.length;
    }

    return analysis;
  }

  /**
   * Calculate scores from analysis results
   */
  calculateScores(analyses) {
    const breakdown = {
      structure: analyses.structure.score,
      webTheme: analyses.web.score,
      nativeTheme: analyses.native.score,
      modules: analyses.modules.score,
    };

    // Weighted average
    const weights = {
      structure: 0.25,
      webTheme: 0.4,
      nativeTheme: 0.15,
      modules: 0.2,
    };

    const overall = Math.round(
      breakdown.structure * weights.structure +
        breakdown.webTheme * weights.webTheme +
        breakdown.nativeTheme * weights.nativeTheme +
        breakdown.modules * weights.modules
    );

    return { overall, breakdown };
  }

  /**
   * Calculate letter grade from score
   */
  calculateGrade(score) {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 60) return 'D-';
    return 'F';
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analyses) {
    const recommendations = [];

    // Collect all issues
    const allIssues = [
      ...(analyses.structure.issues || []),
      ...(analyses.web.issues || []),
      ...(analyses.native.issues || []),
      ...(analyses.modules.issues || []),
    ];

    // Convert issues to recommendations
    for (const issue of allIssues) {
      recommendations.push({
        severity: issue.severity,
        category: this.categorizeIssue(issue),
        message: issue.message,
        file: issue.file || issue.path,
        fix: issue.fix,
        impact: this.getImpactDescription(issue.severity),
      });
    }

    // Add best practice suggestions based on stats
    if (analyses.web.stats) {
      if (analyses.web.stats.totalFiles < 3) {
        recommendations.push({
          severity: 'suggestion',
          category: 'organization',
          message: 'Consider splitting styles into separate files by component/purpose',
          fix: 'Create separate files like _buttons.scss, _forms.scss, _layout.scss',
          impact: 'Improves maintainability and team collaboration',
        });
      }

      if (analyses.web.stats.variablesCount < 10) {
        recommendations.push({
          severity: 'suggestion',
          category: 'design-tokens',
          message: 'Low use of SCSS variables - consider using more design tokens',
          fix: 'Define variables for colors, spacing, fonts, and reuse them throughout',
          impact: 'Ensures consistency and makes global changes easy',
        });
      }
    }

    // Add module-based suggestions
    if (analyses.modules.modules) {
      const hasCustomModule = analyses.modules.modules.some(
        (m) => !['Atlas_Core', 'Atlas_Web_Content', 'Atlas_NativeMobile_Content'].includes(m.name)
      );

      if (!hasCustomModule) {
        recommendations.push({
          severity: 'suggestion',
          category: 'modularity',
          message: 'Consider creating a custom theme module for reusability',
          fix: 'Create a module marked as UI Resources to share styling across apps',
          impact: 'Enables consistent branding across multiple Mendix apps',
        });
      }
    }

    return recommendations;
  }

  /**
   * Categorize an issue
   */
  categorizeIssue(issue) {
    const message = issue.message.toLowerCase();
    if (message.includes('variable') || message.includes('color') || message.includes('token')) {
      return 'design-tokens';
    }
    if (
      message.includes('folder') ||
      message.includes('structure') ||
      message.includes('missing')
    ) {
      return 'structure';
    }
    if (message.includes('nesting') || message.includes('selector')) {
      return 'performance';
    }
    if (message.includes('module')) {
      return 'modularity';
    }
    return 'general';
  }

  /**
   * Get impact description for severity
   */
  getImpactDescription(severity) {
    const impacts = {
      critical: 'Blocking issue - must fix for proper theme functionality',
      important: 'Significant impact on maintainability or performance',
      suggestion: 'Nice to have - improves code quality',
    };
    return impacts[severity] || 'Unknown impact';
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(scores, recommendations, grade) {
    const criticalCount = recommendations.filter((r) => r.severity === 'critical').length;
    const importantCount = recommendations.filter((r) => r.severity === 'important').length;

    let summary = `## Theme Analysis Summary\n\n`;
    summary += `**Overall Grade: ${grade}** (Score: ${scores.overall}/100)\n\n`;

    summary += `### Score Breakdown\n`;
    summary += `- Structure: ${scores.breakdown.structure}/100\n`;
    summary += `- Web Theme: ${scores.breakdown.webTheme}/100\n`;
    summary += `- Native Theme: ${scores.breakdown.nativeTheme}/100\n`;
    summary += `- Theme Modules: ${scores.breakdown.modules}/100\n\n`;

    if (criticalCount > 0) {
      summary += `⚠️ **${criticalCount} critical issue(s)** that need immediate attention\n`;
    }
    if (importantCount > 0) {
      summary += `📋 **${importantCount} important recommendation(s)** to improve your theme\n`;
    }

    summary += `\n### Next Steps\n`;
    if (criticalCount > 0) {
      summary += `1. Fix critical issues first (missing files, broken structure)\n`;
    }
    summary += `2. Replace hardcoded values with SCSS variables\n`;
    summary += `3. Organize styles into logical sections with comments\n`;
    summary += `4. Consider creating a reusable theme module\n`;

    return summary;
  }

  // ========================================
  // Utility Methods
  // ========================================

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async findFiles(dir, pattern) {
    const files = [];
    try {
      const { glob } = await import('glob');
      const matches = await glob(pattern, { cwd: dir, absolute: true });
      return matches;
    } catch {
      // Fallback to simple file listing
      return files;
    }
  }
}

export default ThemeAnalyzer;
