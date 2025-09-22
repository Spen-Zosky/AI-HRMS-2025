'use strict';

const { ValidationError } = require('./errors');

/**
 * Common validation utilities
 */

/**
 * Validate UUID format
 */
function validateUUID(value, fieldName = 'id') {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }

  return true;
}

/**
 * Validate template type
 */
function validateTemplateType(templateType) {
  const supportedTypes = [
    'skill',
    'job_role',
    'leave_type',
    'performance_review',
    'benefit_package',
    'training_program',
    'compliance_checklist',
    'onboarding_workflow',
    'policy_document',
    'compensation_band',
    'career_path',
    'reporting_structure'
  ];

  if (!templateType) {
    throw new ValidationError('templateType is required');
  }

  if (!supportedTypes.includes(templateType)) {
    throw new ValidationError(
      `Unsupported template type: ${templateType}. Supported types: ${supportedTypes.join(', ')}`
    );
  }

  return true;
}

/**
 * Validate inheritance type
 */
function validateInheritanceType(inheritanceType) {
  const validTypes = ['full', 'partial', 'override'];

  if (!inheritanceType) {
    throw new ValidationError('inheritanceType is required');
  }

  if (!validTypes.includes(inheritanceType)) {
    throw new ValidationError(
      `Invalid inheritance type: ${inheritanceType}. Valid types: ${validTypes.join(', ')}`
    );
  }

  return true;
}

/**
 * Validate customization level
 */
function validateCustomizationLevel(level) {
  if (level === undefined || level === null) {
    throw new ValidationError('customizationLevel is required');
  }

  const numLevel = Number(level);
  if (isNaN(numLevel) || numLevel < 0 || numLevel > 100) {
    throw new ValidationError('customizationLevel must be a number between 0 and 100');
  }

  return true;
}

/**
 * Validate pagination parameters
 */
function validatePagination(page, limit) {
  const numPage = Number(page || 1);
  const numLimit = Number(limit || 20);

  if (isNaN(numPage) || numPage < 1) {
    throw new ValidationError('page must be a positive integer');
  }

  if (isNaN(numLimit) || numLimit < 1 || numLimit > 100) {
    throw new ValidationError('limit must be a positive integer between 1 and 100');
  }

  return { page: numPage, limit: numLimit };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email) {
    throw new ValidationError('email is required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('email must be a valid email address');
  }

  return true;
}

/**
 * Validate string length
 */
function validateStringLength(value, fieldName, minLength = 0, maxLength = 255) {
  if (!value && minLength > 0) {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (value && typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  if (value && (value.length < minLength || value.length > maxLength)) {
    throw new ValidationError(
      `${fieldName} must be between ${minLength} and ${maxLength} characters`
    );
  }

  return true;
}

/**
 * Validate array
 */
function validateArray(value, fieldName, minItems = 0, maxItems = null) {
  if (!value && minItems > 0) {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (value && !Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  if (value && value.length < minItems) {
    throw new ValidationError(`${fieldName} must contain at least ${minItems} items`);
  }

  if (value && maxItems && value.length > maxItems) {
    throw new ValidationError(`${fieldName} must contain at most ${maxItems} items`);
  }

  return true;
}

/**
 * Validate JSON object
 */
function validateJSON(value, fieldName) {
  if (!value) {
    return true; // Optional JSON fields
  }

  if (typeof value === 'string') {
    try {
      JSON.parse(value);
    } catch (error) {
      throw new ValidationError(`${fieldName} must be valid JSON`);
    }
  } else if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be a JSON object`);
  }

  return true;
}

/**
 * Validate date format
 */
function validateDate(value, fieldName) {
  if (!value) {
    return true; // Optional date fields
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }

  return true;
}

/**
 * Validate boolean
 */
function validateBoolean(value, fieldName) {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`);
  }

  return true;
}

/**
 * Validate numeric range
 */
function validateNumericRange(value, fieldName, min = null, max = null) {
  if (value === undefined || value === null) {
    return true; // Optional numeric fields
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }

  if (min !== null && numValue < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }

  if (max !== null && numValue > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }

  return true;
}

/**
 * Sanitize and validate search term
 */
function validateSearchTerm(searchTerm, maxLength = 100) {
  if (!searchTerm) {
    return '';
  }

  if (typeof searchTerm !== 'string') {
    throw new ValidationError('searchTerm must be a string');
  }

  // Remove potentially dangerous characters
  const sanitized = searchTerm.replace(/[<>'"&]/g, '').trim();

  if (sanitized.length > maxLength) {
    throw new ValidationError(`searchTerm must be at most ${maxLength} characters`);
  }

  return sanitized;
}

module.exports = {
  validateUUID,
  validateTemplateType,
  validateInheritanceType,
  validateCustomizationLevel,
  validatePagination,
  validateEmail,
  validateStringLength,
  validateArray,
  validateJSON,
  validateDate,
  validateBoolean,
  validateNumericRange,
  validateSearchTerm
};