'use strict';

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Template Management Routes
 * Provides RESTful endpoints for managing template-to-instance inheritance
 * Supports all template types: skills, job roles, leave types, performance reviews, etc.
 */

// List available templates by type
router.get('/templates/:templateType',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.listTemplates
);

// Get specific template details
router.get('/templates/:templateType/:templateId',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.getTemplate
);

// Import template as organization instance
router.post('/organizations/:organizationId/templates/import',
  authenticateToken,
  requireRole('admin', 'hr_manager'),
  templateController.importTemplate
);

// Bulk import multiple templates
router.post('/organizations/:organizationId/templates/bulk-import',
  authenticateToken,
  requireRole('admin', 'hr_manager'),
  templateController.bulkImportTemplates
);

// List organization's customized instances
router.get('/organizations/:organizationId/instances/:templateType',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.listOrganizationInstances
);

// Get specific organization instance
router.get('/organizations/:organizationId/instances/:templateType/:instanceId',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.getOrganizationInstance
);

// Customize an existing instance
router.put('/organizations/:organizationId/instances/:templateType/:instanceId/customize',
  authenticateToken,
  requireRole('admin', 'hr_manager'),
  templateController.customizeInstance
);

// Sync instance with template updates
router.put('/organizations/:organizationId/instances/:templateType/:instanceId/sync',
  authenticateToken,
  requireRole('admin', 'hr_manager'),
  templateController.syncInstanceWithTemplate
);

// Get inheritance information
router.get('/organizations/:organizationId/instances/:templateType/:instanceId/inheritance',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.getInheritanceInfo
);

// Get organization's template customization statistics
router.get('/organizations/:organizationId/templates/stats',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.getCustomizationStats
);

// Search templates by criteria
router.post('/templates/search',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.searchTemplates
);

// Compare template versions or instances
router.post('/templates/compare',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.compareTemplates
);

// Export organization instances
router.get('/organizations/:organizationId/instances/:templateType/export',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.exportInstances
);

// Template validation and preview
router.post('/templates/:templateType/:templateId/preview',
  authenticateToken,
  requireRole('admin', 'hr_manager', 'hr_generalist'),
  templateController.previewTemplateImport
);

module.exports = router;