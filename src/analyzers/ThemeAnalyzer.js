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

    // Analyze font configuration
    const fontAnalysis = await this.analyzeFontConfiguration(projectDir);

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
      fonts: fontAnalysis,
      projectInfo,
    });

    // Add font issues and recommendations
    if (fontAnalysis.issues) {
      recommendations.push(
        ...fontAnalysis.issues.map((i) => ({
          ...i,
          category: 'fonts',
        }))
      );
    }
    if (fontAnalysis.recommendations) {
      recommendations.push(
        ...fontAnalysis.recommendations.map((r) => ({
          ...r,
          category: 'fonts',
        }))
      );
    }

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
        fontConfiguration: fontAnalysis,
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

    // Check for Scaffold Pattern compliance
    const scaffoldAnalysis = await this.analyzeScaffoldPattern(projectDir);
    results.scaffoldPattern = scaffoldAnalysis;

    // Adjust score based on scaffold pattern
    if (scaffoldAnalysis.mirrorsAtlasStructure) {
      results.score = Math.min(100, results.score + 10);
      results.findings.push({
        check: 'Scaffold Pattern',
        status: 'pass',
        details: 'Theme mirrors Atlas_Core folder structure for easy overrides',
      });
    } else if (scaffoldAnalysis.issues.length > 0) {
      // Add scaffold pattern issues to main issues
      results.issues.push(...scaffoldAnalysis.issues);
    }

    return results;
  }

  /**
   * Analyze if theme follows the Scaffold Pattern (mirrors Atlas_Core structure)
   * Best Practice: Create stubbed files mirroring Atlas structure for predictable overrides
   */
  async analyzeScaffoldPattern(projectDir) {
    const results = {
      mirrorsAtlasStructure: false,
      atlasStructureFound: [],
      recommendedFolders: [],
      stubbedFilesCount: 0,
      populatedFilesCount: 0,
      issues: [],
      recommendations: [],
    };

    const atlasCorePath = path.join(projectDir, 'themesource', 'Atlas_Core', 'web');
    const customThemePath = path.join(projectDir, 'theme', 'web');

    if (!(await this.pathExists(atlasCorePath))) {
      results.issues.push({
        severity: 'warning',
        message: 'Atlas_Core not found - cannot verify scaffold pattern',
        fix: 'Ensure Atlas_Core module is present in themesource/',
      });
      return results;
    }

    if (!(await this.pathExists(customThemePath))) {
      return results;
    }

    // Define expected Atlas folder structure that should be mirrored
    const expectedAtlasFolders = [
      '_base',
      '_helpers',
      '_widgets',
      '_widgets/_core',
      '_widgets/_pluggable',
      '_layouts',
      '_building-blocks',
    ];

    // Check which Atlas folders exist
    for (const folder of expectedAtlasFolders) {
      const atlasPath = path.join(atlasCorePath, folder);
      if (await this.pathExists(atlasPath)) {
        results.atlasStructureFound.push(folder);
      }
    }

    // Check if custom theme mirrors the structure
    let mirroredCount = 0;
    for (const folder of results.atlasStructureFound) {
      const customPath = path.join(customThemePath, folder);
      if (await this.pathExists(customPath)) {
        mirroredCount++;
      } else {
        results.recommendedFolders.push(folder);
      }
    }

    // Calculate scaffold compliance
    const complianceRatio =
      results.atlasStructureFound.length > 0
        ? mirroredCount / results.atlasStructureFound.length
        : 0;

    results.mirrorsAtlasStructure = complianceRatio >= 0.7; // 70% threshold

    // Analyze file stubs vs populated files
    try {
      const scssFiles = await this.findFilesRecursive(customThemePath, '.scss');
      for (const file of scssFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const strippedContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();

        if (strippedContent.length < 50) {
          results.stubbedFilesCount++;
        } else {
          results.populatedFilesCount++;
        }
      }
    } catch (error) {
      // Ignore file read errors
    }

    // Generate recommendations
    if (!results.mirrorsAtlasStructure && results.recommendedFolders.length > 0) {
      results.issues.push({
        severity: 'suggestion',
        message: 'Custom theme does not fully mirror Atlas_Core structure',
        details: `Missing folders: ${results.recommendedFolders.join(', ')}`,
        fix: 'Create matching folder structure with stubbed (empty) SCSS files for future overrides',
      });

      results.recommendations.push({
        title: 'Implement Scaffold Pattern',
        description:
          'Mirror the Atlas_Core folder structure in your custom theme. Create empty stubbed files that serve as placeholders for future customizations.',
        benefit:
          'Makes it immediately clear where to add overrides, prevents duplication, follows cascade correctly',
        folders: results.recommendedFolders,
        example: `// In ${
          results.recommendedFolders[0] || '_widgets'
        }/_buttons.scss:\n// Custom button overrides - leave empty if no customizations needed\n// Override Atlas_Core styles here\n`,
      });
    }

    // Check for potential duplication issues
    const mainScssPath = path.join(customThemePath, 'main.scss');
    if (await this.pathExists(mainScssPath)) {
      try {
        const mainContent = await fs.readFile(mainScssPath, 'utf-8');

        // Check for imports of Atlas files (potential duplication)
        if (
          mainContent.includes('themesource/Atlas_Core') ||
          mainContent.includes('../themesource/Atlas_Core')
        ) {
          results.issues.push({
            severity: 'critical',
            message: 'main.scss imports from Atlas_Core - this causes CSS duplication!',
            fix: 'Remove Atlas_Core imports from main.scss. Only import YOUR custom override files. Atlas is automatically compiled by Mendix.',
          });
        }

        // Check for full Atlas import
        if (mainContent.includes('@import') && mainContent.toLowerCase().includes('atlas')) {
          const atlasImportMatch = mainContent.match(/@import\s+['"][^'"]*atlas[^'"]*['"]/gi);
          if (atlasImportMatch) {
            results.issues.push({
              severity: 'warning',
              message: `Potential Atlas import detected: ${atlasImportMatch[0]}`,
              fix: 'Verify this import is necessary. Atlas styles are automatically included by Mendix.',
            });
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    return results;
  }

  /**
   * Find files recursively with a specific extension
   */
  async findFilesRecursive(dir, extension) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findFilesRecursive(fullPath, extension);
          files.push(...subFiles);
        } else if (entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors (permission issues, etc.)
    }

    return files;
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

    // Detailed design properties analysis
    if (analysis.hasDesignProperties) {
      analysis.designPropertiesAnalysis = await this.analyzeDesignProperties(modulePath);
    }

    return analysis;
  }

  /**
   * Analyze design-properties.json for a module
   * Validates CSS classes exist in SCSS and checks for proper structure
   * Enhanced with comprehensive checks for common pitfalls
   */
  async analyzeDesignProperties(modulePath) {
    const results = {
      valid: true,
      propertyCount: 0,
      propertyTypes: {},
      widgetTypes: [],
      missingClasses: [],
      cssVariables: [],
      issues: [],
      recommendations: [],
      criticalWarnings: [],
    };

    // Valid property types in Mendix design-properties.json
    const validPropertyTypes = [
      'Toggle',
      'Dropdown',
      'Colorpicker',
      'ToggleButtonGroup',
      'Spacing',
    ];

    // Valid core widget types (from Model SDK)
    const validCoreWidgets = [
      'DivContainer',
      'Text',
      'ActionButton',
      'LinkButton',
      'Image',
      'StaticImage',
      'DynamicImage',
      'Label',
      'Title',
      'PageTitle',
      'TextBox',
      'TextArea',
      'ReferenceSelector',
      'InputReferenceSetSelector',
      'DatePicker',
      'DropDown',
      'CheckBox',
      'RadioButtons',
      'DataGrid2',
      'ListView',
      'TabContainer',
      'GroupBox',
      'ScrollContainer',
      'LayoutGrid',
      'Table',
      'Snippet',
      'DataView',
      'NavigationTree',
      'MenuBar',
      'Header',
      'Footer',
      'All',
    ];

    // Check both web and native
    for (const platform of ['web', 'native']) {
      const dpPath = path.join(modulePath, platform, 'design-properties.json');

      if (!(await this.pathExists(dpPath))) {
        continue;
      }

      try {
        const content = await fs.readFile(dpPath, 'utf-8');
        const designProps = JSON.parse(content);

        // Analyze the structure
        if (Array.isArray(designProps)) {
          for (const widgetGroup of designProps) {
            // Collect widget types
            if (widgetGroup.widgetTypes && Array.isArray(widgetGroup.widgetTypes)) {
              for (const wt of widgetGroup.widgetTypes) {
                if (!results.widgetTypes.includes(wt)) {
                  results.widgetTypes.push(wt);
                }
                // Validate widget type (allow pluggable widget IDs like com.mendix.*)
                if (!validCoreWidgets.includes(wt) && !wt.includes('.')) {
                  results.issues.push({
                    severity: 'warning',
                    message: `Unknown widget type: "${wt}"`,
                    fix: 'Verify widget type name matches Model SDK documentation or use fully qualified pluggable widget ID',
                  });
                }
              }
            }

            if (widgetGroup.properties) {
              for (const prop of widgetGroup.properties) {
                results.propertyCount++;

                // Validate property type
                const propType = prop.type || 'unknown';
                results.propertyTypes[propType] = (results.propertyTypes[propType] || 0) + 1;

                if (!validPropertyTypes.includes(propType)) {
                  results.issues.push({
                    severity: 'critical',
                    message: `Invalid property type: "${propType}"`,
                    fix: `Use one of: ${validPropertyTypes.join(', ')}`,
                  });
                }

                // CRITICAL CHECK: Category cannot be "Common"
                if (prop.category && prop.category.toLowerCase() === 'common') {
                  results.criticalWarnings.push({
                    severity: 'critical',
                    message: `Property "${prop.name}" uses reserved category "Common"`,
                    fix: 'Change category to a different name like "Appearance" or "Layout". "Common" is reserved by Mendix.',
                  });
                  results.valid = false;
                }

                // Validate required fields based on property type
                this.validatePropertyFields(prop, results);

                // Collect CSS classes that need validation
                if (prop.class) {
                  // Toggle type - single class
                  await this.validateCssClass(modulePath, platform, prop.class, results);
                }

                // Track CSS variables from Colorpicker and Spacing types
                if (prop.property) {
                  results.cssVariables.push({
                    name: prop.property,
                    type: propType,
                    propertyName: prop.name,
                  });
                }

                if (prop.options && Array.isArray(prop.options)) {
                  // Check for duplicate classes in options
                  const optionClasses = prop.options.filter((o) => o.class).map((o) => o.class);
                  const duplicates = optionClasses.filter(
                    (item, index) => optionClasses.indexOf(item) !== index && item !== ''
                  );
                  if (duplicates.length > 0) {
                    results.issues.push({
                      severity: 'warning',
                      message: `Property "${prop.name}" has duplicate option classes: ${[
                        ...new Set(duplicates),
                      ].join(', ')}`,
                      fix: 'Ensure each option has a unique class name',
                    });
                  }

                  // Dropdown/ToggleButtonGroup - validate each option's class
                  for (const option of prop.options) {
                    if (option.class) {
                      await this.validateCssClass(modulePath, platform, option.class, results);
                    }
                  }
                }
              }
            }
          }
        }

        results.platforms = results.platforms || [];
        results.platforms.push(platform);
      } catch (error) {
        results.valid = false;
        results.issues.push({
          severity: 'critical',
          message: `Invalid JSON in ${platform}/design-properties.json: ${error.message}`,
          fix: 'Validate JSON syntax in design-properties.json',
        });
      }
    }

    // Add recommendations if missing classes found
    if (results.missingClasses.length > 0) {
      results.issues.push({
        severity: 'important',
        message: `${results.missingClasses.length} CSS class(es) in design-properties.json not found in SCSS`,
        details:
          results.missingClasses.slice(0, 5).join(', ') +
          (results.missingClasses.length > 5
            ? ` ...and ${results.missingClasses.length - 5} more`
            : ''),
        fix: 'Ensure all CSS classes referenced in design-properties.json exist in your SCSS files',
      });
    }

    // Add recommendation about CSS variables
    if (results.cssVariables.length > 0) {
      results.recommendations.push({
        title: 'CSS Variables in Design Properties',
        description: `Found ${results.cssVariables.length} CSS variable(s) used. Ensure each is defined with a fallback value in your SCSS.`,
        example: 'background-color: var(--my-color, #ffffff);',
        variables: results.cssVariables.slice(0, 5),
      });
    }

    // Add critical migration warning if this is a custom module
    const moduleName = path.basename(modulePath);
    if (!['Atlas_Core', 'Atlas_Web_Content', 'Atlas_NativeMobile_Content'].includes(moduleName)) {
      results.recommendations.push({
        title: 'Migration Warning',
        severity: 'critical',
        description:
          'When moving or changing themes, you MUST copy design-properties.json to the new theme module. Forgetting this file will cause all custom styling options to disappear in Studio Pro!',
        checklist: [
          'Copy design-properties.json to new theme module',
          'Verify all CSS classes exist in new theme SCSS',
          'Test in Studio Pro that design options appear correctly',
        ],
      });
    }

    return results;
  }

  /**
   * Validate that required fields are present for each property type
   */
  validatePropertyFields(prop, results) {
    const requiredFields = {
      Toggle: ['type', 'name', 'class'],
      Dropdown: ['type', 'name', 'options'],
      Colorpicker: ['type', 'name', 'property'],
      ToggleButtonGroup: ['type', 'name', 'options'],
      Spacing: ['type', 'name', 'property'],
    };

    const required = requiredFields[prop.type];
    if (required) {
      for (const field of required) {
        if (!prop[field]) {
          results.issues.push({
            severity: 'warning',
            message: `Property "${prop.name || 'unnamed'}" (${
              prop.type
            }) missing required field: ${field}`,
            fix: `Add the "${field}" field to this design property`,
          });
        }
      }
    }
  }

  /**
   * Validate that a CSS class exists in SCSS files
   */
  async validateCssClass(modulePath, platform, className, results) {
    if (!className) return;

    const platformPath = path.join(modulePath, platform);
    try {
      const scssFiles = await this.findFilesRecursive(platformPath, '.scss');

      let classFound = false;
      const classPattern = new RegExp(`\\.${className.replace(/[-]/g, '[-]')}\\b`);

      for (const file of scssFiles) {
        const content = await fs.readFile(file, 'utf-8');
        if (classPattern.test(content)) {
          classFound = true;
          break;
        }
      }

      if (!classFound) {
        results.missingClasses.push(className);
      }
    } catch (error) {
      // Ignore validation errors
    }
  }

  /**
   * Analyze font configuration in the theme
   */
  async analyzeFontConfiguration(projectDir) {
    const results = {
      fontStrategy: 'unknown',
      fontImportVariable: null,
      issues: [],
      recommendations: [],
      gdprCompliant: null,
    };

    const customVarsPath = path.join(projectDir, 'theme', 'web', 'custom-variables.scss');

    if (!(await this.pathExists(customVarsPath))) {
      return results;
    }

    try {
      const content = await fs.readFile(customVarsPath, 'utf-8');

      // Check for $font-family-import variable
      const fontImportMatch = content.match(/\$font-family-import\s*:\s*["']([^"']+)["']/);

      if (fontImportMatch) {
        results.fontImportVariable = fontImportMatch[1];

        if (fontImportMatch[1].includes('fonts.googleapis.com')) {
          results.fontStrategy = 'google-cdn';
          results.gdprCompliant = false;
          results.recommendations.push({
            severity: 'suggestion',
            message: 'Using Google Fonts CDN - consider local fonts for GDPR compliance',
            fix: 'Download fonts from github.com/mendix/open-sans, place in theme/web/fonts/, update $font-family-import to "./fonts/open-sans.css"',
            impact:
              'Google Fonts may track users via IP address, which requires consent under GDPR',
          });
        } else if (fontImportMatch[1].startsWith('./') || fontImportMatch[1].startsWith('../')) {
          results.fontStrategy = 'local';
          results.gdprCompliant = true;

          // Verify the local font file exists
          const fontPath = path.join(
            projectDir,
            'theme',
            'web',
            fontImportMatch[1].replace('./', '')
          );
          if (!(await this.pathExists(fontPath))) {
            results.issues.push({
              severity: 'important',
              message: `Local font file not found: ${fontImportMatch[1]}`,
              fix: 'Ensure font CSS file exists at the specified path',
            });
          }
        } else {
          results.fontStrategy = 'external';
        }
      } else {
        // No custom font import - using Atlas defaults
        results.fontStrategy = 'atlas-default';
        results.recommendations.push({
          severity: 'suggestion',
          message:
            'Using Atlas default fonts (Google Fonts CDN) - consider configuring for your brand',
          fix: 'Add $font-family-import variable in custom-variables.scss to configure fonts',
        });
      }

      // Check for font family variables
      const hasFontFamily = /\$font-family-(base|headings)/.test(content);
      if (!hasFontFamily) {
        results.recommendations.push({
          severity: 'suggestion',
          message: 'No custom font family variables defined',
          fix: 'Define $font-family-base and $font-family-headings for consistent typography',
        });
      }

      // Check for font fallback stack
      const fontFamilyMatch = content.match(/\$font-family-base\s*:\s*([^;]+)/);
      if (fontFamilyMatch && !fontFamilyMatch[1].includes(',')) {
        results.issues.push({
          severity: 'suggestion',
          message: 'Font family has no fallback fonts',
          fix: "Add fallback fonts: $font-family-base: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;",
        });
      }
    } catch (error) {
      results.issues.push({
        severity: 'warning',
        message: `Could not analyze font configuration: ${error.message}`,
      });
    }

    return results;
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

    // Add scaffold pattern recommendations if present
    if (analyses.structure.scaffoldPattern) {
      const scaffold = analyses.structure.scaffoldPattern;

      if (scaffold.recommendations && scaffold.recommendations.length > 0) {
        for (const rec of scaffold.recommendations) {
          recommendations.push({
            severity: 'important',
            category: 'scaffold-pattern',
            message: rec.title,
            fix: rec.description,
            impact: rec.benefit,
            details: rec.folders ? `Create these folders: ${rec.folders.join(', ')}` : null,
          });
        }
      }

      // Warn if populated files without scaffold structure
      if (scaffold.populatedFilesCount > 3 && !scaffold.mirrorsAtlasStructure) {
        recommendations.push({
          severity: 'important',
          category: 'scaffold-pattern',
          message: 'Custom theme has styles but does not mirror Atlas structure',
          fix: 'Reorganize styles to match Atlas_Core folder structure. Create corresponding folders and move styles to matching locations.',
          impact:
            'Makes maintenance easier, prevents developer confusion about where to add overrides',
        });
      }
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

      // Check for design properties in custom modules
      for (const mod of analyses.modules.modules) {
        if (mod.hasDesignProperties && mod.designPropertiesAnalysis) {
          const dpAnalysis = mod.designPropertiesAnalysis;

          // Add missing CSS class issues
          if (dpAnalysis.issues) {
            for (const issue of dpAnalysis.issues) {
              recommendations.push({
                ...issue,
                category: 'design-properties',
                module: mod.name,
              });
            }
          }
        }
      }

      // Add design-properties.json migration reminder for custom modules
      const customModulesWithDesignProps = analyses.modules.modules.filter(
        (m) =>
          m.hasDesignProperties &&
          !['Atlas_Core', 'Atlas_Web_Content', 'Atlas_NativeMobile_Content'].includes(m.name)
      );

      if (customModulesWithDesignProps.length > 0) {
        recommendations.push({
          severity: 'important',
          category: 'design-properties',
          message: '⚠️ Remember: When migrating themes, ALWAYS copy design-properties.json!',
          fix: 'If you copy/migrate to a new theme, ensure design-properties.json is also copied to preserve Studio Pro design options',
          impact: 'Without this file, widgets lose their custom styling options in Studio Pro',
          modules: customModulesWithDesignProps.map((m) => m.name),
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
    if (
      message.includes('scaffold') ||
      message.includes('mirror') ||
      message.includes('atlas structure')
    ) {
      return 'scaffold-pattern';
    }
    if (message.includes('duplication') || message.includes('imports from atlas')) {
      return 'scaffold-pattern';
    }
    if (message.includes('design-properties') || message.includes('css class')) {
      return 'design-properties';
    }
    if (message.includes('font') || message.includes('gdpr') || message.includes('typography')) {
      return 'fonts';
    }
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
