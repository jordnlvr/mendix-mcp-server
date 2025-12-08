/**
 * Input validation utilities
 * Provides consistent validation across all tools
 */

import fs from 'fs-extra';
import path from 'path';

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validate that a value is a non-empty string
 */
function validateString(value, fieldName, options = {}) {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  if (options.required && value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }

  if (options.minLength && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`,
      fieldName
    );
  }

  if (options.maxLength && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      fieldName
    );
  }

  if (options.pattern && !options.pattern.test(value)) {
    throw new ValidationError(`${fieldName} does not match required pattern`, fieldName);
  }

  return value.trim();
}

/**
 * Validate that a path exists and is accessible
 */
async function validatePath(filePath, fieldName, options = {}) {
  if (typeof filePath !== 'string') {
    throw new ValidationError(`${fieldName} must be a string path`, fieldName);
  }

  const normalizedPath = path.normalize(filePath);

  if (options.mustExist) {
    const exists = await fs.pathExists(normalizedPath);
    if (!exists) {
      throw new ValidationError(`${fieldName} does not exist: ${normalizedPath}`, fieldName);
    }
  }

  if (options.mustBeFile) {
    const stats = await fs.stat(normalizedPath);
    if (!stats.isFile()) {
      throw new ValidationError(`${fieldName} must be a file: ${normalizedPath}`, fieldName);
    }
  }

  if (options.mustBeDirectory) {
    const stats = await fs.stat(normalizedPath);
    if (!stats.isDirectory()) {
      throw new ValidationError(`${fieldName} must be a directory: ${normalizedPath}`, fieldName);
    }
  }

  if (options.extension) {
    const ext = path.extname(normalizedPath).toLowerCase();
    if (ext !== options.extension.toLowerCase()) {
      throw new ValidationError(`${fieldName} must have ${options.extension} extension`, fieldName);
    }
  }

  return normalizedPath;
}

/**
 * Validate object structure matches schema
 */
function validateObject(obj, schema, fieldName = 'object') {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new ValidationError(`${fieldName} must be an object`, fieldName);
  }

  // Check required fields
  for (const [key, rules] of Object.entries(schema)) {
    if (rules.required && !(key in obj)) {
      throw new ValidationError(`${fieldName}.${key} is required`, `${fieldName}.${key}`);
    }

    if (key in obj) {
      const value = obj[key];

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        throw new ValidationError(
          `${fieldName}.${key} must be of type ${rules.type}`,
          `${fieldName}.${key}`
        );
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        throw new ValidationError(
          `${fieldName}.${key} must be one of: ${rules.enum.join(', ')}`,
          `${fieldName}.${key}`
        );
      }

      // Custom validator
      if (rules.validator && !rules.validator(value)) {
        throw new ValidationError(`${fieldName}.${key} failed validation`, `${fieldName}.${key}`);
      }
    }
  }

  return obj;
}

/**
 * Validate array contains valid items
 */
function validateArray(arr, itemValidator, fieldName = 'array', options = {}) {
  if (!Array.isArray(arr)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }

  if (options.minLength && arr.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must contain at least ${options.minLength} items`,
      fieldName
    );
  }

  if (options.maxLength && arr.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must contain at most ${options.maxLength} items`,
      fieldName
    );
  }

  if (itemValidator) {
    arr.forEach((item, index) => {
      try {
        itemValidator(item, `${fieldName}[${index}]`);
      } catch (error) {
        throw new ValidationError(
          `${fieldName}[${index}]: ${error.message}`,
          `${fieldName}[${index}]`
        );
      }
    });
  }

  return arr;
}

export { ValidationError, validateArray, validateObject, validatePath, validateString };
