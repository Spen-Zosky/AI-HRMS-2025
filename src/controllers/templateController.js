'use strict';

const templateInheritanceService = require('../services/templateInheritanceService');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { validateUUID, validateTemplateType } = require('../utils/validators');

/**
 * Template Management Controller
 * Handles all template-to-instance inheritance operations
 */
class TemplateController {

  /**
   * List available templates by type
   * GET /api/templates/:templateType
   */
  async listTemplates(req, res, next) {
    try {
      const { templateType } = req.params;
      const { page = 1, limit = 20, search, category, active = true } = req.query;

      validateTemplateType(templateType);

      const offset = (page - 1) * limit;
      const templates = await templateInheritanceService.listTemplates(templateType, {
        offset,
        limit: parseInt(limit),
        search,
        category,
        active: active === 'true'
      });

      res.json({
        success: true,
        data: {
          templates: templates.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: templates.count,
            pages: Math.ceil(templates.count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific template details
   * GET /api/templates/:templateType/:templateId
   */
  async getTemplate(req, res, next) {
    try {
      const { templateType, templateId } = req.params;

      validateTemplateType(templateType);
      validateUUID(templateId, 'templateId');

      const template = await templateInheritanceService.getTemplate(templateId, templateType);
      if (!template) {
        throw new NotFoundError(`Template ${templateId} not found`);
      }

      res.json({
        success: true,
        data: { template }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Import template as organization instance
   * POST /api/organizations/:organizationId/templates/import
   */
  async importTemplate(req, res, next) {
    try {
      const { organizationId } = req.params;
      const { templateId, templateType, customizations = {}, autoSync = true } = req.body;

      validateUUID(organizationId, 'organizationId');
      validateUUID(templateId, 'templateId');
      validateTemplateType(templateType);

      const instance = await templateInheritanceService.importTemplate(
        organizationId,
        templateId,
        {
          templateType,
          customizations,
          autoSync
        }
      );

      res.status(201).json({
        success: true,
        message: 'Template imported successfully',
        data: { instance }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk import multiple templates
   * POST /api/organizations/:organizationId/templates/bulk-import
   */
  async bulkImportTemplates(req, res, next) {
    try {
      const { organizationId } = req.params;
      const { templateIds, templateType, defaultCustomizations = {}, autoSync = true } = req.body;

      validateUUID(organizationId, 'organizationId');
      validateTemplateType(templateType);

      if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new ValidationError('templateIds must be a non-empty array');
      }

      templateIds.forEach(id => validateUUID(id, 'templateId'));

      const result = await templateInheritanceService.bulkImportTemplates(
        organizationId,
        templateIds,
        {
          templateType,
          customizations: defaultCustomizations,
          autoSync
        }
      );

      res.status(201).json({
        success: true,
        message: `Bulk import completed: ${result.summary.successful}/${result.summary.total} successful`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List organization's customized instances
   * GET /api/organizations/:organizationId/instances/:templateType
   */
  async listOrganizationInstances(req, res, next) {
    try {
      const { organizationId, templateType } = req.params;
      const { includeTemplate = false, includeInheritance = true } = req.query;

      validateUUID(organizationId, 'organizationId');
      validateTemplateType(templateType);

      const instances = await templateInheritanceService.getOrganizationInstances(
        organizationId,
        templateType,
        {
          includeTemplate: includeTemplate === 'true',
          includeInheritance: includeInheritance === 'true'
        }
      );

      res.json({
        success: true,
        data: {
          instances,
          count: instances.length,
          templateType
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific organization instance
   * GET /api/organizations/:organizationId/instances/:templateType/:instanceId
   */
  async getOrganizationInstance(req, res, next) {
    try {
      const { organizationId, templateType, instanceId } = req.params;
      const { includeTemplate = true, includeInheritance = true } = req.query;

      validateUUID(organizationId, 'organizationId');
      validateTemplateType(templateType);
      validateUUID(instanceId, 'instanceId');

      const instance = await templateInheritanceService.getInstance(instanceId, templateType);
      if (!instance || instance.organization_id !== organizationId) {
        throw new NotFoundError('Instance not found');
      }

      // Optionally include template and inheritance data
      let enrichedInstance = instance.toJSON();

      if (includeTemplate === 'true' && instance.template_id) {
        const templateId = templateInheritanceService.getTemplateIdFromInstance(instance, templateType);
        const template = await templateInheritanceService.getTemplate(templateId, templateType);
        enrichedInstance.template = template;
      }

      if (includeInheritance === 'true') {
        // The inheritance data should already be included via associations
        // This is handled in the service layer
      }

      res.json({
        success: true,
        data: { instance: enrichedInstance }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Customize an existing instance
   * PUT /api/organizations/:organizationId/instances/:templateType/:instanceId/customize
   */
  async customizeInstance(req, res, next) {
    try {
      const { organizationId, templateType, instanceId } = req.params;
      const { customizations } = req.body;

      validateUUID(organizationId, 'organizationId');
      validateTemplateType(templateType);
      validateUUID(instanceId, 'instanceId');

      if (!customizations || typeof customizations !== 'object') {
        throw new ValidationError('customizations object is required');
      }

      // Verify instance belongs to organization
      const instance = await templateInheritanceService.getInstance(instanceId, templateType);
      if (!instance || instance.organization_id !== organizationId) {
        throw new NotFoundError('Instance not found');
      }

      const updatedInstance = await templateInheritanceService.customizeInstance(
        instanceId,
        customizations,
        templateType
      );

      res.json({
        success: true,
        message: 'Instance customized successfully',
        data: { instance: updatedInstance }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync instance with template updates
   * PUT /api/organizations/:organizationId/instances/:templateType/:instanceId/sync
   */
  async syncInstanceWithTemplate(req, res, next) {
    try {
      const { organizationId, templateType, instanceId } = req.params;
      const { syncFields = [] } = req.body;

      validateUUID(organizationId, 'organizationId');
      validateTemplateType(templateType);
      validateUUID(instanceId, 'instanceId');

      // Verify instance belongs to organization
      const instance = await templateInheritanceService.getInstance(instanceId, templateType);
      if (!instance || instance.organization_id !== organizationId) {
        throw new NotFoundError('Instance not found');
      }

      const result = await templateInheritanceService.syncInstanceWithTemplate(
        instanceId,
        syncFields,
        templateType
      );

      res.json({
        success: result.success,
        message: result.success ? 'Instance synced successfully' : 'Sync conflicts detected',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inheritance information
   * GET /api/organizations/:organizationId/instances/:templateType/:instanceId/inheritance
   */
  async getInheritanceInfo(req, res, next) {
    try {
      const { organizationId, templateType, instanceId } = req.params;

      validateUUID(organizationId, 'organizationId');
      validateTemplateType(templateType);
      validateUUID(instanceId, 'instanceId');

      const instance = await templateInheritanceService.getInstance(instanceId, templateType);
      if (!instance || instance.organization_id !== organizationId) {
        throw new NotFoundError('Instance not found');
      }

      const templateId = templateInheritanceService.getTemplateIdFromInstance(instance, templateType);
      const template = await templateInheritanceService.getTemplate(templateId, templateType);

      const inheritanceInfo = {
        instance_id: instanceId,
        template_id: templateId,
        template_type: templateType,
        inheritance_type: instance.inheritance_type,
        customization_level: instance.customization_level,
        auto_sync_enabled: instance.auto_sync_enabled,
        last_template_sync: instance.last_template_sync,
        can_auto_sync: instance.canAutoSync ? instance.canAutoSync() : false,
        template_info: template ? {
          id: templateId,
          name: template.name || template.title || template.skill_name || template.role_title,
          version: template.version || template.template_version,
          last_updated: template.updated_at
        } : null
      };

      res.json({
        success: true,
        data: { inheritance: inheritanceInfo }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organization's template customization statistics
   * GET /api/organizations/:organizationId/templates/stats
   */
  async getCustomizationStats(req, res, next) {
    try {
      const { organizationId } = req.params;
      const { templateType } = req.query;

      validateUUID(organizationId, 'organizationId');
      if (templateType) {
        validateTemplateType(templateType);
      }

      const stats = {};

      if (templateType) {
        // Get stats for specific template type
        stats[templateType] = await templateInheritanceService.getCustomizationStats(
          organizationId,
          templateType
        );
      } else {
        // Get stats for all template types
        const supportedTypes = [
          'skill', 'job_role', 'leave_type', 'performance_review', 'benefit_package',
          'training_program', 'compliance_checklist', 'onboarding_workflow',
          'policy_document', 'compensation_band', 'career_path', 'reporting_structure'
        ];

        for (const type of supportedTypes) {
          try {
            stats[type] = await templateInheritanceService.getCustomizationStats(
              organizationId,
              type
            );
          } catch (error) {
            // Skip if no instances of this type exist
            stats[type] = {
              total: 0,
              full_inheritance: 0,
              partial_inheritance: 0,
              override: 0,
              avg_customization_level: 0
            };
          }
        }
      }

      res.json({
        success: true,
        data: {
          organization_id: organizationId,
          customization_stats: stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search templates by criteria
   * POST /api/templates/search
   */
  async searchTemplates(req, res, next) {
    try {
      const { templateTypes = [], searchTerm, categories = [], tags = [], page = 1, limit = 20 } = req.body;

      const offset = (page - 1) * limit;
      const results = await templateInheritanceService.searchTemplates({
        templateTypes,
        searchTerm,
        categories,
        tags,
        offset,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: {
          results: results.templates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: results.total,
            pages: Math.ceil(results.total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Compare template versions or instances
   * POST /api/templates/compare
   */
  async compareTemplates(req, res, next) {
    try {
      const { sourceId, targetId, sourceType, targetType = 'template', comparisonFields = [] } = req.body;

      validateUUID(sourceId, 'sourceId');
      validateUUID(targetId, 'targetId');
      validateTemplateType(sourceType);

      const comparison = await templateInheritanceService.compareTemplates({
        sourceId,
        targetId,
        sourceType,
        targetType,
        comparisonFields
      });

      res.json({
        success: true,
        data: { comparison }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export organization instances
   * GET /api/organizations/:organizationId/instances/:templateType/export
   */
  async exportInstances(req, res, next) {
    try {
      const { organizationId, templateType } = req.params;
      const { format = 'json', includeTemplate = true, includeInheritance = true } = req.query;

      validateUUID(organizationId, 'organizationId');
      validateTemplateType(templateType);

      const instances = await templateInheritanceService.getOrganizationInstances(
        organizationId,
        templateType,
        {
          includeTemplate: includeTemplate === 'true',
          includeInheritance: includeInheritance === 'true'
        }
      );

      const exportData = {
        organization_id: organizationId,
        template_type: templateType,
        exported_at: new Date().toISOString(),
        instances
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csv = await templateInheritanceService.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${templateType}_instances_${organizationId}.csv"`);
        return res.send(csv);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${templateType}_instances_${organizationId}.json"`);
      res.json(exportData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Template validation and preview
   * POST /api/templates/:templateType/:templateId/preview
   */
  async previewTemplateImport(req, res, next) {
    try {
      const { templateType, templateId } = req.params;
      const { organizationId, customizations = {} } = req.body;

      validateTemplateType(templateType);
      validateUUID(templateId, 'templateId');
      validateUUID(organizationId, 'organizationId');

      const preview = await templateInheritanceService.previewTemplateImport(
        organizationId,
        templateId,
        templateType,
        customizations
      );

      res.json({
        success: true,
        data: { preview }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TemplateController();