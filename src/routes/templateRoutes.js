'use strict';

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

/**
 * Template Management Routes
 * Provides RESTful endpoints for managing template-to-instance inheritance
 * Supports all template types: skills, job roles, leave types, performance reviews, etc.
 */

// List available templates by type
router.get('/templates/:templateType',
  authenticateToken,
  requirePermission('template:read'),
  templateController.listTemplates
);

// Get specific template details
router.get('/templates/:templateType/:templateId',
  authenticateToken,
  requirePermission('template:read'),
  templateController.getTemplate
);

// Import template as organization instance
router.post('/organizations/:organizationId/templates/import',
  authenticateToken,
  requirePermission('template:import'),
  templateController.importTemplate
);

// Bulk import multiple templates
router.post('/organizations/:organizationId/templates/bulk-import',
  authenticateToken,
  requirePermission('template:import'),
  templateController.bulkImportTemplates
);

// List organization's customized instances
router.get('/organizations/:organizationId/instances/:templateType',
  authenticateToken,
  requirePermission('template:read'),
  templateController.listOrganizationInstances
);

// Get specific organization instance
router.get('/organizations/:organizationId/instances/:templateType/:instanceId',
  authenticateToken,
  requirePermission('template:read'),
  templateController.getOrganizationInstance
);

// Customize an existing instance
router.put('/organizations/:organizationId/instances/:templateType/:instanceId/customize',
  authenticateToken,
  requirePermission('template:edit'),
  templateController.customizeInstance
);

// Sync instance with template updates
router.put('/organizations/:organizationId/instances/:templateType/:instanceId/sync',
  authenticateToken,
  requirePermission('template:sync'),
  templateController.syncInstanceWithTemplate
);

// Get inheritance information
router.get('/organizations/:organizationId/instances/:templateType/:instanceId/inheritance',
  authenticateToken,
  requirePermission('template:read'),
  templateController.getInheritanceInfo
);

// Get organization's template customization statistics
router.get('/organizations/:organizationId/templates/stats',
  authenticateToken,
  requirePermission('template:read'),
  templateController.getCustomizationStats
);

// Search templates by criteria
router.post('/templates/search',
  authenticateToken,
  requirePermission('template:read'),
  templateController.searchTemplates
);

// Compare template versions or instances
router.post('/templates/compare',
  authenticateToken,
  requirePermission('template:read'),
  templateController.compareTemplates
);

// Export organization instances
router.get('/organizations/:organizationId/instances/:templateType/export',
  authenticateToken,
  requirePermission('template:export'),
  templateController.exportInstances
);

// Template validation and preview
router.post('/templates/:templateType/:templateId/preview',
  authenticateToken,
  requirePermission('template:read'),
  templateController.previewTemplateImport
);

module.exports = router;