/**
 * Mendix Theme Analyzer v2.0
 *
 * Focused analysis of Mendix web app themes against documented best practices.
 * Based on official Mendix documentation: https://docs.mendix.com/howto/front-end/customize-styling-new/
 *
 * SCOPE: Web apps only (SCSS-based themes)
 * NOTE: Native mobile theme analysis is NOT included. This analyzer focuses on
 *       progressive/web applications which represent the majority use case.
 *
 * WHAT THIS ANALYZES:
 * 1. Custom Theme Structure - Does it follow Mendix's recommended folder structure?
 * 2. SCSS Quality - Variables, organization, imports, hardcoded values
 * 3. Color Scheme - Consistency, brand colors, accessibility considerations
 * 4. Override Patterns - Are Atlas styles being overridden correctly?
 * 5. Performance - Selector efficiency, nesting depth, file size
 * 6. Maintainability - Comments, organization, naming conventions
 *
 * WHAT THIS DOES NOT ANALYZE:
 * - Native mobile themes (JS-based) - out of scope
 * - Marketplace modules - they're third-party, not user code
 * - Atlas_Core internals - it's always present, always required
 *
 * @version 2.0.0
 * @author Kelly Seale / Mendix Expert MCP Server
 */

import { promises as fs } from 'fs';
import path from 'path';

class ThemeAnalyzer {
  constructor() {
    // Expected files per Mendix documentation
    this.expectedFiles = {
      'theme/web/custom-variables.scss': {
        required: true,
        purpose: 'Theme settings (colors, fonts, spacing)',
        docRef: 'https://docs.mendix.com/howto/front-end/customize-styling-new/#file-and-folder',
      },
      'theme/web/main.scss': {
        required: true,
        purpose: 'Entry point for custom styling',
        docRef: 'https://docs.mendix.com/howto/front-end/customize-styling-new/#file-and-folder',
      },
      'theme/web/exclusion-variables.scss': {
        required: false,
        purpose: 'Disable default Atlas styling for specific widgets',
        docRef:
          'https://docs.mendix.com/howto/front-end/customize-styling-new/#disable-default-styling',
      },
      'theme/web/settings.json': {
        required: true,
        purpose: 'CSS file loading configuration',
        docRef: 'https://docs.mendix.com/howto/front-end/customize-styling-new/#importing-css',
      },
    };

    // SCSS patterns to detect
    this.patterns = {
      // Hardcoded values that should be variables
      hardcodedColor: /#[0-9a-fA-F]{3,8}(?!\s*;?\s*\/\/\s*var)/g,
      hardcodedPx: /:\s*\d+px(?!\s*;?\s*\/\/\s*var)/g,
      hardcodedEm: /:\s*\d+(\.\d+)?em(?!\s*;?\s*\/\/\s*var)/g,
      hardcodedRem: /:\s*\d+(\.\d+)?rem(?!\s*;?\s*\/\/\s*var)/g,

      // Good patterns
      scssVariable: /\$[\w-]+/g,
      cssVariable: /var\(--[\w-]+\)/g,

      // Import patterns
      importStatement: /@import\s+["']([^"']+)["']/g,
      atlasImport: /@import\s+["'][^"']*Atlas_Core[^"']*["']/g,

      // Nesting depth (4+ levels is problematic)
      deepNesting: /^(\s{8}|\t{4})\s*[.#\w&]/gm,

      // Duplicate selectors (potential issue)
      classSelector: /^\s*\.[\w-]+\s*\{/gm,

      // Comments
      blockComment: /\/\*[\s\S]*?\*\//g,
      lineComment: /\/\/.*/g,
    };

    // Brand color variable names from Atlas (both SCSS and CSS custom properties)
    this.brandColors = [
      '$brand-primary',
      '$brand-secondary',
      '$brand-success',
      '$brand-warning',
      '$brand-danger',
      '$brand-info',
      '$brand-default',
    ];

    // CSS custom property equivalents (modern approach)
    this.cssCustomPropertyBrandColors = [
      '--brand-primary',
      '--brand-secondary',
      '--brand-success',
      '--brand-warning',
      '--brand-danger',
      '--brand-info',
      '--brand-default',
    ];
  }

  /**
   * Main analysis entry point
   * @param {string} projectPath - Path to .mpr file or project directory
   * @returns {object} Complete analysis results
   */
  async analyze(projectPath) {
    const startTime = Date.now();
    const projectDir = projectPath.endsWith('.mpr') ? path.dirname(projectPath) : projectPath;

    // Initialize results structure
    const results = {
      projectPath: projectDir,
      analyzedAt: new Date().toISOString(),
      scope: 'Web themes only (SCSS). Native mobile themes are not analyzed.',

      // High-level verdicts (the important stuff)
      verdicts: [],

      // Detailed analysis sections
      structure: await this.analyzeStructure(projectDir),
      scssQuality: await this.analyzeScssQuality(projectDir),
      colorScheme: await this.analyzeColorScheme(projectDir),
      overridePatterns: await this.analyzeOverridePatterns(projectDir),
      performance: await this.analyzePerformance(projectDir),
      maintainability: await this.analyzeMaintainability(projectDir),

      // Module inventory (informational only)
      modules: await this.inventoryModules(projectDir),

      // Actionable recommendations
      recommendations: [],

      // Timing
      analysisTimeMs: 0,
    };

    // Generate verdicts from analysis
    results.verdicts = this.generateVerdicts(results);

    // Generate prioritized recommendations
    results.recommendations = this.generateRecommendations(results);

    // Calculate overall score and grade
    const { score, grade } = this.calculateScore(results);
    results.score = score;
    results.grade = grade;

    // Generate summary
    results.summary = this.generateSummary(results);

    results.analysisTimeMs = Date.now() - startTime;
    return results;
  }

  // ========================================
  // STRUCTURE ANALYSIS
  // ========================================

  async analyzeStructure(projectDir) {
    const structure = {
      hasThemeFolder: false,
      hasThemesourceFolder: false,
      files: {},
      issues: [],
      score: 0,
    };

    // Check theme folder
    const themePath = path.join(projectDir, 'theme', 'web');
    structure.hasThemeFolder = await this.pathExists(themePath);

    // Check themesource folder
    const themesourcePath = path.join(projectDir, 'themesource');
    structure.hasThemesourceFolder = await this.pathExists(themesourcePath);

    if (!structure.hasThemeFolder) {
      structure.issues.push({
        severity: 'critical',
        message: 'Missing theme/web folder',
        fix: 'Create theme/web folder with custom-variables.scss and main.scss',
      });
      return structure;
    }

    // Check each expected file
    let foundCount = 0;
    let requiredCount = 0;

    for (const [relativePath, info] of Object.entries(this.expectedFiles)) {
      const fullPath = path.join(projectDir, relativePath);
      const exists = await this.pathExists(fullPath);

      structure.files[relativePath] = {
        exists,
        required: info.required,
        purpose: info.purpose,
      };

      if (info.required) {
        requiredCount++;
        if (exists) foundCount++;
        else {
          structure.issues.push({
            severity: 'important',
            message: `Missing required file: ${relativePath}`,
            purpose: info.purpose,
            fix: `Create ${relativePath} - ${info.purpose}`,
            docRef: info.docRef,
          });
        }
      }
    }

    // Check for custom SCSS files in theme/web
    structure.customFiles = await this.findScssFiles(themePath);
    structure.customFileCount = structure.customFiles.length;

    structure.score = requiredCount > 0 ? Math.round((foundCount / requiredCount) * 100) : 100;
    return structure;
  }

  // ========================================
  // SCSS QUALITY ANALYSIS
  // ========================================

  async analyzeScssQuality(projectDir) {
    const quality = {
      variableUsage: { count: 0, files: [] },
      hardcodedValues: { count: 0, examples: [], files: [] },
      importStructure: { valid: true, issues: [] },
      score: 100,
      issues: [],
    };

    const themePath = path.join(projectDir, 'theme', 'web');
    if (!(await this.pathExists(themePath))) return quality;

    const scssFiles = await this.findScssFiles(themePath);
    let totalHardcoded = 0;
    let totalVariables = 0;

    for (const file of scssFiles) {
      const content = await this.safeReadFile(file);
      if (!content) continue;

      const fileName = path.basename(file);

      // Count variable usage (good)
      const scssVars = content.match(this.patterns.scssVariable) || [];
      const cssVars = content.match(this.patterns.cssVariable) || [];
      totalVariables += scssVars.length + cssVars.length;

      // Find hardcoded values (bad) - exclude custom-variables.scss where they're defined
      if (!fileName.includes('custom-variables')) {
        const hardcodedColors = content.match(this.patterns.hardcodedColor) || [];
        const hardcodedPx = content.match(this.patterns.hardcodedPx) || [];

        const hardcodedInFile = hardcodedColors.length + hardcodedPx.length;
        if (hardcodedInFile > 0) {
          totalHardcoded += hardcodedInFile;
          quality.hardcodedValues.files.push({
            file: fileName,
            colors: hardcodedColors.slice(0, 5),
            pixels: hardcodedPx.slice(0, 5),
            count: hardcodedInFile,
          });
        }
      }

      // Check for problematic Atlas imports in main.scss
      if (fileName === 'main.scss') {
        const atlasImports = content.match(this.patterns.atlasImport);
        if (atlasImports) {
          quality.importStructure.valid = false;
          quality.importStructure.issues.push({
            severity: 'critical',
            message: 'main.scss imports Atlas_Core directly - causes CSS duplication!',
            fix: 'Remove Atlas imports. Atlas is compiled automatically by Mendix.',
            found: atlasImports,
          });
        }
      }
    }

    quality.variableUsage.count = totalVariables;
    quality.hardcodedValues.count = totalHardcoded;

    // Score calculation
    if (totalHardcoded > 20) {
      quality.score -= 30;
      quality.issues.push({
        severity: 'important',
        message: `${totalHardcoded} hardcoded values found - use SCSS variables instead`,
        fix: 'Define values in custom-variables.scss and reference them with $variable-name',
      });
    } else if (totalHardcoded > 5) {
      quality.score -= 15;
      quality.issues.push({
        severity: 'suggestion',
        message: `${totalHardcoded} hardcoded values found - consider using variables`,
      });
    }

    if (!quality.importStructure.valid) {
      quality.score -= 40;
    }

    quality.score = Math.max(0, quality.score);
    return quality;
  }

  // ========================================
  // COLOR SCHEME ANALYSIS
  // ========================================

  async analyzeColorScheme(projectDir) {
    const colorScheme = {
      brandColorsConfigured: false,
      customColors: [],
      colorConsistency: 'unknown',
      potentialIssues: [],
      score: 100,
      variableSource: null,
    };

    // Get full content by following imports
    const customVarsPath = path.join(projectDir, 'theme', 'web', 'custom-variables.scss');
    const { content, resolvedPath } = await this.resolveVariablesContent(
      projectDir,
      customVarsPath
    );

    if (!content) {
      colorScheme.score = 50;
      colorScheme.potentialIssues.push({
        severity: 'important',
        message: 'custom-variables.scss not found or empty',
        fix: 'Create custom-variables.scss with brand color definitions',
      });
      return colorScheme;
    }

    colorScheme.variableSource = resolvedPath;

    // Check for brand color definitions (both SCSS variables and CSS custom properties)
    const definedBrandColors = [];

    // Check SCSS variables ($brand-*)
    for (const brandColor of this.brandColors) {
      const regex = new RegExp(`\\${brandColor}\\s*:`, 'g');
      if (regex.test(content)) {
        definedBrandColors.push(brandColor);
      }
    }

    // Check CSS custom properties (--brand-*) - modern approach used by SmartHub and others
    for (const cssVar of this.cssCustomPropertyBrandColors) {
      const regex = new RegExp(`${cssVar}\\s*:`, 'g');
      if (regex.test(content)) {
        definedBrandColors.push(cssVar);
      }
    }

    colorScheme.brandColorsConfigured = definedBrandColors.length >= 3;
    colorScheme.definedBrandColors = definedBrandColors;

    // Extract all color definitions
    const colorDefinitions = content.match(/\$[\w-]+:\s*#[0-9a-fA-F]{3,8}/g) || [];
    colorScheme.customColors = colorDefinitions.slice(0, 20); // First 20

    // Check for color consistency (same color defined multiple times with different names)
    const colorValues = {};
    for (const def of colorDefinitions) {
      const match = def.match(/(#[0-9a-fA-F]{3,8})/);
      if (match) {
        const color = match[1].toLowerCase();
        if (!colorValues[color]) colorValues[color] = [];
        colorValues[color].push(def.split(':')[0].trim());
      }
    }

    // Find duplicates
    const duplicates = Object.entries(colorValues).filter(([, vars]) => vars.length > 1);
    if (duplicates.length > 0) {
      colorScheme.colorConsistency = 'has-duplicates';
      colorScheme.potentialIssues.push({
        severity: 'suggestion',
        message: 'Same color value defined with multiple variable names',
        examples: duplicates.slice(0, 3).map(([color, vars]) => `${color}: ${vars.join(', ')}`),
        fix: 'Consider consolidating duplicate color definitions',
      });
      colorScheme.score -= 10;
    } else {
      colorScheme.colorConsistency = 'good';
    }

    if (!colorScheme.brandColorsConfigured) {
      colorScheme.score -= 20;
      colorScheme.potentialIssues.push({
        severity: 'important',
        message: 'Brand colors not fully configured',
        fix: 'Define $brand-primary, $brand-success, $brand-warning, $brand-danger at minimum',
      });
    }

    colorScheme.score = Math.max(0, colorScheme.score);
    return colorScheme;
  }

  // ========================================
  // OVERRIDE PATTERNS ANALYSIS
  // ========================================

  async analyzeOverridePatterns(projectDir) {
    const overrides = {
      usesExclusionVariables: false,
      exclusionsConfigured: [],
      overrideApproach: 'unknown',
      issues: [],
      score: 100,
    };

    // Check exclusion-variables.scss
    const exclusionPath = path.join(projectDir, 'theme', 'web', 'exclusion-variables.scss');
    const exclusionContent = await this.safeReadFile(exclusionPath);

    if (exclusionContent) {
      overrides.usesExclusionVariables = true;

      // Find enabled exclusions
      const enabledExclusions = exclusionContent.match(/\$exclude-[\w-]+:\s*true/g) || [];
      overrides.exclusionsConfigured = enabledExclusions.map((e) => e.split(':')[0].trim());

      if (enabledExclusions.length > 0) {
        overrides.overrideApproach = 'exclusion-based';
      }
    }

    // Check main.scss for override patterns
    const mainPath = path.join(projectDir, 'theme', 'web', 'main.scss');
    const mainContent = await this.safeReadFile(mainPath);

    if (mainContent) {
      // Check import count
      const imports = mainContent.match(this.patterns.importStatement) || [];
      overrides.importCount = imports.length;

      // Good: imports are organized
      if (imports.length > 0 && !overrides.overrideApproach) {
        overrides.overrideApproach = 'import-based';
      }

      // Check for direct style rules in main.scss (not ideal for large apps)
      const styleRules = mainContent.match(/^\s*[.#][\w-]+\s*\{/gm) || [];
      if (styleRules.length > 10) {
        overrides.issues.push({
          severity: 'suggestion',
          message: `main.scss has ${styleRules.length} direct style rules`,
          fix: 'Consider organizing styles into separate files and importing them',
        });
        overrides.score -= 10;
      }
    }

    return overrides;
  }

  // ========================================
  // PERFORMANCE ANALYSIS
  // ========================================

  async analyzePerformance(projectDir) {
    const performance = {
      deepNesting: { count: 0, files: [] },
      totalScssSize: 0,
      fileCount: 0,
      issues: [],
      score: 100,
    };

    const themePath = path.join(projectDir, 'theme', 'web');
    if (!(await this.pathExists(themePath))) return performance;

    const scssFiles = await this.findScssFiles(themePath);
    performance.fileCount = scssFiles.length;

    for (const file of scssFiles) {
      const content = await this.safeReadFile(file);
      if (!content) continue;

      performance.totalScssSize += content.length;

      // Check for deep nesting (4+ levels)
      const deepNested = content.match(this.patterns.deepNesting) || [];
      if (deepNested.length > 0) {
        performance.deepNesting.count += deepNested.length;
        performance.deepNesting.files.push(path.basename(file));
      }
    }

    // Score adjustments
    if (performance.deepNesting.count > 10) {
      performance.score -= 20;
      performance.issues.push({
        severity: 'important',
        message: `${performance.deepNesting.count} instances of deep nesting (4+ levels)`,
        fix: 'Flatten nested selectors for better CSS performance',
        files: performance.deepNesting.files,
      });
    } else if (performance.deepNesting.count > 0) {
      performance.score -= 5;
      performance.issues.push({
        severity: 'suggestion',
        message: `${performance.deepNesting.count} instances of deep nesting`,
        fix: 'Consider flattening deeply nested selectors',
      });
    }

    // Large theme warning
    if (performance.totalScssSize > 100000) {
      // 100KB
      performance.issues.push({
        severity: 'suggestion',
        message: `Theme SCSS is ${Math.round(
          performance.totalScssSize / 1024
        )}KB - consider optimization`,
        fix: 'Review for unused styles, consider code splitting',
      });
      performance.score -= 10;
    }

    performance.score = Math.max(0, performance.score);
    return performance;
  }

  // ========================================
  // MAINTAINABILITY ANALYSIS
  // ========================================

  async analyzeMaintainability(projectDir) {
    const maintainability = {
      hasComments: false,
      commentRatio: 0,
      fileOrganization: 'unknown',
      namingConventions: 'unknown',
      issues: [],
      score: 100,
    };

    const themePath = path.join(projectDir, 'theme', 'web');
    if (!(await this.pathExists(themePath))) return maintainability;

    const scssFiles = await this.findScssFiles(themePath);
    let totalLines = 0;
    let commentLines = 0;
    let filesWithComments = 0;

    for (const file of scssFiles) {
      const content = await this.safeReadFile(file);
      if (!content) continue;

      const lines = content.split('\n');
      totalLines += lines.length;

      // Count comment lines
      const blockComments = content.match(this.patterns.blockComment) || [];
      const lineComments = content.match(this.patterns.lineComment) || [];
      const fileCommentCount = blockComments.length + lineComments.length;

      if (fileCommentCount > 0) filesWithComments++;
      commentLines += fileCommentCount;
    }

    maintainability.hasComments = commentLines > 0;
    maintainability.commentRatio =
      totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0;

    // File organization check
    const customFiles = scssFiles.filter(
      (f) => !path.basename(f).startsWith('custom-variables') && path.basename(f) !== 'main.scss'
    );

    if (customFiles.length === 0) {
      maintainability.fileOrganization = 'minimal';
    } else if (customFiles.length < 5) {
      maintainability.fileOrganization = 'basic';
    } else {
      maintainability.fileOrganization = 'well-organized';
    }

    // Scoring
    if (maintainability.commentRatio < 2) {
      maintainability.score -= 15;
      maintainability.issues.push({
        severity: 'suggestion',
        message: 'Low comment ratio - consider adding documentation',
        fix: 'Add comments explaining purpose of custom styles',
      });
    }

    if (filesWithComments < scssFiles.length / 2 && scssFiles.length > 2) {
      maintainability.score -= 10;
      maintainability.issues.push({
        severity: 'suggestion',
        message: `Only ${filesWithComments}/${scssFiles.length} SCSS files have comments`,
      });
    }

    maintainability.score = Math.max(0, maintainability.score);
    return maintainability;
  }

  // ========================================
  // MODULE INVENTORY (Informational Only)
  // ========================================

  async inventoryModules(projectDir) {
    const inventory = {
      marketplace: [],
      project: [],
      uiResourceModules: [],
      note: 'Marketplace modules are third-party and not analyzed in detail.',
    };

    const themesourcePath = path.join(projectDir, 'themesource');
    if (!(await this.pathExists(themesourcePath))) return inventory;

    try {
      const entries = await fs.readdir(themesourcePath, { withFileTypes: true });
      const modules = entries.filter((e) => e.isDirectory()).map((e) => e.name);

      // Known marketplace modules (common ones)
      const knownMarketplace = [
        'Atlas_Core',
        'Atlas_Web_Content',
        'Atlas_NativeMobile_Content',
        'Administration',
        'MxModelReflection',
        'Encryption',
        'CommunityCommons',
        'Nanoflow_Commons',
        'Web_Actions',
        'Data_Widgets',
        'Charts',
        'Calendar',
        'AnyChart',
        'Maps',
      ];

      for (const mod of modules) {
        const isMarketplace = knownMarketplace.some(
          (m) => mod.toLowerCase() === m.toLowerCase() || mod.startsWith('com.mendix')
        );

        const modInfo = {
          name: mod,
          hasWebTheme: await this.pathExists(path.join(themesourcePath, mod, 'web')),
          hasDesignProperties: await this.pathExists(
            path.join(themesourcePath, mod, 'web', 'design-properties.json')
          ),
        };

        if (isMarketplace) {
          inventory.marketplace.push(modInfo);
        } else {
          inventory.project.push(modInfo);

          // Check if it's marked as UI resource (has styling)
          if (modInfo.hasWebTheme) {
            inventory.uiResourceModules.push(mod);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return inventory;
  }

  // ========================================
  // VERDICT GENERATION
  // ========================================

  generateVerdicts(results) {
    const verdicts = [];

    // Verdict 1: Theme Structure
    verdicts.push({
      check: 'Theme Structure',
      status:
        results.structure.score >= 75 ? 'PASS' : results.structure.score >= 50 ? 'WARN' : 'FAIL',
      score: results.structure.score,
      detail:
        results.structure.score >= 75
          ? 'Theme folder structure follows Mendix best practices'
          : `Missing required files: ${
              Object.entries(results.structure.files)
                .filter(([, f]) => f.required && !f.exists)
                .map(([p]) => path.basename(p))
                .join(', ') || 'Check structure'
            }`,
    });

    // Verdict 2: SCSS Variable Usage
    const varRatio =
      results.scssQuality.variableUsage.count > 0 && results.scssQuality.hardcodedValues.count > 0
        ? results.scssQuality.variableUsage.count /
          (results.scssQuality.variableUsage.count + results.scssQuality.hardcodedValues.count)
        : 1;

    verdicts.push({
      check: 'SCSS Variable Usage',
      status: varRatio >= 0.8 ? 'PASS' : varRatio >= 0.5 ? 'WARN' : 'FAIL',
      score: Math.round(varRatio * 100),
      detail:
        varRatio >= 0.8
          ? `Good use of SCSS variables (${results.scssQuality.variableUsage.count} variables found)`
          : `${results.scssQuality.hardcodedValues.count} hardcoded values should be variables`,
    });

    // Verdict 3: Import Structure (critical check)
    verdicts.push({
      check: 'Import Structure',
      status: results.scssQuality.importStructure.valid ? 'PASS' : 'FAIL',
      score: results.scssQuality.importStructure.valid ? 100 : 0,
      detail: results.scssQuality.importStructure.valid
        ? 'No problematic Atlas imports detected'
        : 'CRITICAL: main.scss imports Atlas_Core directly - causes CSS duplication!',
    });

    // Verdict 4: Color Scheme
    const colorSource = results.colorScheme.variableSource
      ? ` (from ${results.colorScheme.variableSource})`
      : '';
    verdicts.push({
      check: 'Color Scheme Configuration',
      status: results.colorScheme.brandColorsConfigured ? 'PASS' : 'WARN',
      score: results.colorScheme.score,
      detail: results.colorScheme.brandColorsConfigured
        ? `Brand colors configured${colorSource}: ${
            results.colorScheme.definedBrandColors?.slice(0, 5).join(', ') || 'Yes'
          }${results.colorScheme.definedBrandColors?.length > 5 ? '...' : ''}`
        : 'Brand colors not fully configured - customize your color palette',
    });

    // Verdict 5: Performance
    verdicts.push({
      check: 'CSS Performance',
      status:
        results.performance.deepNesting.count === 0
          ? 'PASS'
          : results.performance.deepNesting.count < 5
          ? 'WARN'
          : 'FAIL',
      score: results.performance.score,
      detail:
        results.performance.deepNesting.count === 0
          ? 'No deep selector nesting detected'
          : `${results.performance.deepNesting.count} instances of deep nesting (affects performance)`,
    });

    // Verdict 6: Maintainability
    verdicts.push({
      check: 'Code Maintainability',
      status:
        results.maintainability.hasComments &&
        results.maintainability.fileOrganization !== 'minimal'
          ? 'PASS'
          : 'WARN',
      score: results.maintainability.score,
      detail: results.maintainability.hasComments
        ? `${results.maintainability.commentRatio}% comment ratio, ${results.maintainability.fileOrganization} file organization`
        : 'Add comments to improve maintainability',
    });

    return verdicts;
  }

  // ========================================
  // RECOMMENDATIONS
  // ========================================

  generateRecommendations(results) {
    const recommendations = [];

    // Collect all issues from all sections
    const allIssues = [
      ...(results.structure.issues || []),
      ...(results.scssQuality.issues || []),
      ...(results.scssQuality.importStructure?.issues || []),
      ...(results.colorScheme.potentialIssues || []),
      ...(results.overridePatterns.issues || []),
      ...(results.performance.issues || []),
      ...(results.maintainability.issues || []),
    ];

    // Sort by severity
    const severityOrder = { critical: 0, important: 1, suggestion: 2 };
    allIssues.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));

    // Convert to recommendations
    for (const issue of allIssues) {
      recommendations.push({
        priority:
          issue.severity === 'critical'
            ? 'HIGH'
            : issue.severity === 'important'
            ? 'MEDIUM'
            : 'LOW',
        issue: issue.message,
        recommendation: issue.fix || 'Review and address this issue',
        docRef: issue.docRef,
      });
    }

    return recommendations;
  }

  // ========================================
  // SCORING
  // ========================================

  calculateScore(results) {
    // Weight the different areas
    const weights = {
      structure: 0.2,
      scssQuality: 0.25,
      colorScheme: 0.15,
      overridePatterns: 0.1,
      performance: 0.15,
      maintainability: 0.15,
    };

    let weightedSum = 0;

    weightedSum += (results.structure.score || 0) * weights.structure;
    weightedSum += (results.scssQuality.score || 0) * weights.scssQuality;
    weightedSum += (results.colorScheme.score || 0) * weights.colorScheme;
    weightedSum += (results.overridePatterns.score || 0) * weights.overridePatterns;
    weightedSum += (results.performance.score || 0) * weights.performance;
    weightedSum += (results.maintainability.score || 0) * weights.maintainability;

    const score = Math.round(weightedSum);

    // Grade assignment
    let grade;
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return { score, grade };
  }

  // ========================================
  // SUMMARY GENERATION
  // ========================================

  generateSummary(results) {
    let summary = `## Theme Analysis Summary\n\n`;
    summary += `**Overall Grade: ${results.grade}** (Score: ${results.score}/100)\n\n`;
    summary += `_Scope: Web app themes only. Native mobile themes not analyzed._\n\n`;

    // Verdicts section
    summary += `### Verdicts\n\n`;
    for (const verdict of results.verdicts) {
      const icon = verdict.status === 'PASS' ? '✅' : verdict.status === 'FAIL' ? '❌' : '⚠️';
      summary += `${icon} **${verdict.check}**: ${verdict.status} - ${verdict.detail}\n`;
    }

    // Quick stats
    summary += `\n### Statistics\n`;
    summary += `- Custom SCSS files: ${results.structure.customFileCount || 0}\n`;
    summary += `- SCSS variables used: ${results.scssQuality.variableUsage?.count || 0}\n`;
    summary += `- Hardcoded values: ${results.scssQuality.hardcodedValues?.count || 0}\n`;
    summary += `- Project modules with themes: ${results.modules.uiResourceModules?.length || 0}\n`;

    // Top recommendations
    const highPriority = results.recommendations.filter((r) => r.priority === 'HIGH');
    if (highPriority.length > 0) {
      summary += `\n### ⚠️ High Priority Issues\n`;
      for (const rec of highPriority.slice(0, 3)) {
        summary += `- ${rec.issue}\n`;
      }
    }

    return summary;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async safeReadFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  async findScssFiles(dir) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...(await this.findScssFiles(fullPath)));
        } else if (entry.name.endsWith('.scss')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore errors
    }
    return files;
  }

  /**
   * Resolve variables content by following @import statements
   * This handles the common pattern where custom-variables.scss imports from a theme module
   * @param {string} projectDir - Project root directory
   * @param {string} startFile - Initial file to read
   * @returns {object} { content: string, resolvedPath: string }
   */
  async resolveVariablesContent(projectDir, startFile) {
    const content = await this.safeReadFile(startFile);
    if (!content) {
      return { content: null, resolvedPath: null };
    }

    // Check for @import statements that point to variable files
    const importMatch = content.match(/@import\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const importPath = importMatch[1];

      // Resolve the import path relative to the file's directory
      let resolvedPath;
      if (importPath.startsWith('../') || importPath.startsWith('./')) {
        // Relative import
        resolvedPath = path.resolve(path.dirname(startFile), importPath);
      } else {
        // Could be a module import, try themesource
        resolvedPath = path.join(projectDir, 'themesource', importPath);
      }

      // Add .scss extension if not present
      if (!resolvedPath.endsWith('.scss')) {
        // Try with underscore prefix (SCSS partial convention)
        const withUnderscore = path.join(
          path.dirname(resolvedPath),
          '_' + path.basename(resolvedPath) + '.scss'
        );
        const withoutUnderscore = resolvedPath + '.scss';

        if (await this.pathExists(withUnderscore)) {
          resolvedPath = withUnderscore;
        } else if (await this.pathExists(withoutUnderscore)) {
          resolvedPath = withoutUnderscore;
        }
      }

      // Try to read the imported file
      const importedContent = await this.safeReadFile(resolvedPath);
      if (importedContent) {
        // Return the imported content (the real variables)
        return {
          content: importedContent,
          resolvedPath: path.relative(projectDir, resolvedPath),
        };
      }
    }

    // No import found or couldn't resolve - use original content
    return { content, resolvedPath: path.relative(projectDir, startFile) };
  }
}

export default ThemeAnalyzer;
