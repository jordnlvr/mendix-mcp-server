/**
 * ProjectLoader - Dynamic Mendix project loading
 * Handles loading of any .mpr file with module discovery and caching
 */

import fs from 'fs-extra';
import path from 'path';
import { getConfig } from '../utils/config.js';
import Logger from '../utils/logger.js';
import { validatePath, ValidationError } from '../utils/validator.js';
import CacheManager from './CacheManager.js';

class ProjectLoader {
  constructor(cacheManager = null) {
    this.logger = new Logger('ProjectLoader');
    this.config = getConfig();
    this.cache = cacheManager || new CacheManager();
    this.loadedProjects = new Map();

    this.logger.info('ProjectLoader initialized');
  }

  /**
   * Load a Mendix project from .mpr file or extracted data directory
   * @param {string} projectPath - Path to .mpr file or extracted directory
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Project information and data
   */
  async loadProject(projectPath, options = {}) {
    try {
      // Validate path
      const validPath = await validatePath(projectPath, 'projectPath', {
        mustExist: true,
      });

      // Check cache first
      const cacheKey = `project:${validPath}`;
      const cached = this.cache.get(cacheKey);
      if (cached && !options.forceReload) {
        this.logger.info('Project loaded from cache', { path: validPath });
        return cached;
      }

      // Determine if .mpr file or extracted directory
      const stats = await fs.stat(validPath);
      let projectData;

      if (stats.isFile() && path.extname(validPath) === '.mpr') {
        projectData = await this._loadFromMpr(validPath, options);
      } else if (stats.isDirectory()) {
        projectData = await this._loadFromExtractedData(validPath, options);
      } else {
        throw new ValidationError(
          'projectPath must be a .mpr file or extracted data directory',
          'projectPath'
        );
      }

      // Cache the result
      const cacheTTL = this.config.get('projects.cacheDuration', 7200);
      this.cache.set(cacheKey, projectData, cacheTTL);

      // Store in loaded projects
      this.loadedProjects.set(validPath, {
        data: projectData,
        loadedAt: new Date(),
      });

      this.logger.info('Project loaded successfully', {
        path: validPath,
        modules: projectData.modules.length,
      });

      return projectData;
    } catch (error) {
      this.logger.error('Failed to load project', {
        path: projectPath,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load project from .mpr file (requires extraction)
   * For now, this throws an error directing to use extracted data
   * TODO: Implement direct .mpr reading using Mendix SDK
   */
  async _loadFromMpr(mprPath, options = {}) {
    throw new Error(
      'Direct .mpr loading not yet implemented. Please extract domain model data first using Mendix SDK Toolkit, then load the extracted directory.'
    );

    // Future implementation:
    // 1. Use Mendix Platform SDK to create online working copy
    // 2. Extract domain models, microflows, pages
    // 3. Parse and return structured data
  }

  /**
   * Load project from extracted data directory
   * Expects structure: extracted-data/ModuleName/ModuleName-DomainModel.json
   */
  async _loadFromExtractedData(extractedDir, options = {}) {
    const projectData = {
      path: extractedDir,
      name: path.basename(extractedDir),
      type: 'extracted',
      modules: [],
      loadedAt: new Date().toISOString(),
    };

    // Discover modules in the extracted data directory
    const modules = await this._discoverModules(extractedDir);

    // Load each module's data
    for (const moduleName of modules) {
      try {
        const moduleData = await this._loadModule(extractedDir, moduleName, options);
        projectData.modules.push(moduleData);
      } catch (error) {
        this.logger.warn('Failed to load module', {
          module: moduleName,
          error: error.message,
        });

        if (options.failOnModuleError) {
          throw error;
        }
      }
    }

    return projectData;
  }

  /**
   * Discover available modules in extracted data directory
   */
  async _discoverModules(extractedDir) {
    const modules = [];

    try {
      const subdirs = await fs.readdir(extractedDir);

      for (const subdir of subdirs) {
        const subdirPath = path.join(extractedDir, subdir);
        const stats = await fs.stat(subdirPath);

        if (stats.isDirectory()) {
          // Check if it has domain model data
          const domainModelFile = path.join(subdirPath, `${subdir}-DomainModel.json`);

          if (await fs.pathExists(domainModelFile)) {
            modules.push(subdir);
            this.logger.debug('Discovered module', { module: subdir });
          }
        }
      }
    } catch (error) {
      this.logger.error('Module discovery failed', {
        dir: extractedDir,
        error: error.message,
      });
    }

    return modules;
  }

  /**
   * Load a single module's data
   */
  async _loadModule(extractedDir, moduleName, options = {}) {
    const moduleDir = path.join(extractedDir, moduleName);

    const moduleData = {
      name: moduleName,
      domainModel: null,
      microflows: null,
      pages: null,
      enumerations: null,
    };

    // Load domain model
    const domainModelPath = path.join(moduleDir, `${moduleName}-DomainModel.json`);
    if (await fs.pathExists(domainModelPath)) {
      moduleData.domainModel = await fs.readJson(domainModelPath);
      this.logger.debug('Loaded domain model', { module: moduleName });
    }

    // Load microflows if requested
    if (options.loadMicroflows !== false) {
      const microflowsPath = path.join(moduleDir, `${moduleName}-Microflows.json`);
      if (await fs.pathExists(microflowsPath)) {
        moduleData.microflows = await fs.readJson(microflowsPath);
        this.logger.debug('Loaded microflows', { module: moduleName });
      }
    }

    // Load pages if requested
    if (options.loadPages !== false) {
      const pagesPath = path.join(moduleDir, `${moduleName}-Pages.json`);
      if (await fs.pathExists(pagesPath)) {
        moduleData.pages = await fs.readJson(pagesPath);
        this.logger.debug('Loaded pages', { module: moduleName });
      }
    }

    // Load enumerations
    const enumPath = path.join(moduleDir, `${moduleName}-Enumerations.json`);
    if (await fs.pathExists(enumPath)) {
      moduleData.enumerations = await fs.readJson(enumPath);
      this.logger.debug('Loaded enumerations', { module: moduleName });
    }

    return moduleData;
  }

  /**
   * Get specific module from loaded project
   */
  getModule(projectPath, moduleName) {
    const project = this.loadedProjects.get(projectPath);

    if (!project) {
      throw new Error(`Project not loaded: ${projectPath}`);
    }

    const module = project.data.modules.find((m) => m.name === moduleName);

    if (!module) {
      throw new Error(`Module ${moduleName} not found in project`);
    }

    return module;
  }

  /**
   * Get entity from specific module
   */
  getEntity(projectPath, moduleName, entityName) {
    const module = this.getModule(projectPath, moduleName);

    if (!module.domainModel || !module.domainModel.entities) {
      throw new Error(`No domain model found for module: ${moduleName}`);
    }

    const entity = module.domainModel.entities.find((e) => e.name === entityName);

    if (!entity) {
      throw new Error(`Entity ${entityName} not found in module ${moduleName}`);
    }

    return entity;
  }

  /**
   * List all loaded projects
   */
  listLoadedProjects() {
    return Array.from(this.loadedProjects.entries()).map(([path, info]) => ({
      path,
      name: info.data.name,
      modules: info.data.modules.map((m) => m.name),
      loadedAt: info.loadedAt,
    }));
  }

  /**
   * Unload a project from memory
   */
  unloadProject(projectPath) {
    const removed = this.loadedProjects.delete(projectPath);

    // Also clear from cache
    this.cache.delete(`project:${projectPath}`);

    if (removed) {
      this.logger.info('Project unloaded', { path: projectPath });
    }

    return removed;
  }

  /**
   * Clear all loaded projects
   */
  clearAll() {
    const count = this.loadedProjects.size;
    this.loadedProjects.clear();
    this.cache.invalidate('^project:');

    this.logger.info('All projects cleared', { count });
    return count;
  }

  /**
   * Get statistics about loaded projects
   */
  getStats() {
    const projects = this.listLoadedProjects();
    const totalModules = projects.reduce((sum, p) => sum + p.modules.length, 0);

    return {
      projectsLoaded: projects.length,
      totalModules,
      projects,
      cacheStats: this.cache.getStats(),
    };
  }
}

export default ProjectLoader;
