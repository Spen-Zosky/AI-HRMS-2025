const logger = require('../utils/logger');
const aiServiceFactory = require('./aiServiceFactory');
const predictiveAnalytics = require('./predictiveAnalytics');
const skillsGapAnalysis = require('./skillsGapAnalysis');
const learningPathRecommendations = require('./learningPathRecommendations');
const { Employee, LeaveRequest, User } = require('../../models');
const { Op } = require('sequelize');

/**
 * Enhanced HR Copilot Service
 * Advanced AI-powered HR assistant with natural language processing,
 * automated report generation, and intelligent recommendations
 */
class EnhancedCopilot {
    constructor() {
        this.initialized = false;
        this.conversationHistory = new Map();
        this.reportTemplates = new Map();
        this.nlpProcessor = null;
    }

    /**
     * Initialize the Enhanced HR Copilot
     */
    async initialize() {
        if (this.initialized) return;

        try {
            logger.info('Initializing Enhanced HR Copilot...');

            // Initialize AI provider (with fallback)
            try {
                await aiServiceFactory.initialize();
                this.aiProvider = await aiServiceFactory.getProvider();
            } catch (error) {
                logger.warn('AI Provider unavailable, using mock responses:', error.message);
                this.aiProvider = this.createMockAIProvider();
            }

            // Initialize predictive analytics
            await predictiveAnalytics.initialize();

            // Load NLP models and templates
            await this.loadNLPProcessor();
            await this.loadReportTemplates();
            await this.loadKnowledgeBase();

            this.initialized = true;
            logger.info('✅ Enhanced HR Copilot initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Enhanced HR Copilot:', error);
            throw error;
        }
    }

    /**
     * Process natural language queries and provide intelligent responses
     */
    async processQuery(query, userId, context = {}) {
        try {
            if (!this.initialized) await this.initialize();

            // Parse and understand the query
            const parsedQuery = await this.parseNaturalLanguage(query);

            // Get conversation context
            const conversationContext = this.getConversationContext(userId);

            // Determine query intent and extract entities
            const intent = await this.determineIntent(parsedQuery, conversationContext);

            // Process based on intent
            let response;
            switch (intent.type) {
                case 'data_query':
                    response = await this.processDataQuery(intent, context);
                    break;
                case 'analytics_request':
                    response = await this.processAnalyticsRequest(intent, context);
                    break;
                case 'report_generation':
                    response = await this.generateReport(intent, context);
                    break;
                case 'recommendation_request':
                    response = await this.generateRecommendations(intent, context);
                    break;
                case 'policy_question':
                    response = await this.answerPolicyQuestion(intent, context);
                    break;
                case 'prediction_request':
                    response = await this.makePredictions(intent, context);
                    break;
                case 'workflow_automation':
                    response = await this.automateWorkflow(intent, context);
                    break;
                default:
                    response = await this.generateGenericResponse(query, context);
            }

            // Update conversation history
            this.updateConversationHistory(userId, query, response);

            // Add follow-up suggestions
            response.followUpSuggestions = await this.generateFollowUpSuggestions(intent, response);

            return response;

        } catch (error) {
            logger.error('Error processing query:', error);
            return {
                type: 'error',
                message: 'I encountered an error processing your request. Please try rephrasing your question.',
                error: error.message
            };
        }
    }

    /**
     * Generate automated reports based on templates and data
     */
    async generateAutomatedReport(reportType, parameters = {}) {
        try {
            if (!this.initialized) await this.initialize();

            const template = this.reportTemplates.get(reportType);
            if (!template) {
                throw new Error(`Report template '${reportType}' not found`);
            }

            logger.info(`Generating ${reportType} report with parameters:`, parameters);

            // Collect data based on report type
            const reportData = await this.collectReportData(reportType, parameters);

            // Generate insights and analysis
            const insights = await this.generateReportInsights(reportType, reportData);

            // Create visualizations data
            const visualizations = await this.generateVisualizationsData(reportType, reportData);

            // Generate executive summary
            const executiveSummary = await this.generateExecutiveSummary(reportData, insights);

            // Create actionable recommendations
            const recommendations = await this.generateActionableRecommendations(reportType, reportData, insights);

            const report = {
                title: template.title,
                reportType,
                generatedAt: new Date(),
                parameters,
                executiveSummary,
                sections: await this.generateReportSections(template, reportData, insights),
                visualizations,
                recommendations,
                keyMetrics: await this.extractKeyMetrics(reportType, reportData),
                dataSourcesUsed: this.getDataSources(reportType),
                confidenceLevel: this.calculateReportConfidence(reportData),
                nextActions: await this.suggestNextActions(reportType, insights)
            };

            logger.info(`✅ ${reportType} report generated successfully`);
            return report;

        } catch (error) {
            logger.error(`Error generating ${reportType} report:`, error);
            throw error;
        }
    }

    /**
     * Intelligent notification system
     */
    async generateIntelligentNotifications(userId) {
        try {
            if (!this.initialized) await this.initialize();

            const notifications = [];

            // Check for urgent HR matters
            const urgentMatters = await this.identifyUrgentMatters();
            notifications.push(...urgentMatters);

            // Predictive alerts
            const predictiveAlerts = await this.generatePredictiveAlerts();
            notifications.push(...predictiveAlerts);

            // Compliance reminders
            const complianceReminders = await this.generateComplianceReminders();
            notifications.push(...complianceReminders);

            // Performance insights
            const performanceInsights = await this.generatePerformanceInsights();
            notifications.push(...performanceInsights);

            // Sort by priority and relevance
            return notifications
                .sort((a, b) => b.priority - a.priority)
                .slice(0, 10); // Top 10 notifications

        } catch (error) {
            logger.error('Error generating notifications:', error);
            return [];
        }
    }

    /**
     * Email draft generation for HR communications
     */
    async generateEmailDraft(emailType, context) {
        try {
            if (!this.initialized) await this.initialize();

            const templates = {
                offer_letter: 'Generate a professional job offer letter',
                rejection_email: 'Generate a respectful candidate rejection email',
                performance_review_reminder: 'Generate a performance review reminder email',
                policy_update: 'Generate a policy update announcement email',
                team_announcement: 'Generate a team announcement email',
                training_invitation: 'Generate a training invitation email'
            };

            const prompt = templates[emailType] || 'Generate a professional HR email';

            const emailContent = await this.aiProvider.generateText(
                `${prompt} based on the following context: ${JSON.stringify(context)}

                Please include:
                - Professional tone and language
                - Clear subject line
                - Proper greeting and closing
                - All relevant details from the context
                - Call to action where appropriate

                Format as a complete email with subject line.`,
                { maxTokens: 800, temperature: 0.3 }
            );

            return {
                type: emailType,
                subject: this.extractEmailSubject(emailContent),
                body: this.extractEmailBody(emailContent),
                tone: 'professional',
                generatedAt: new Date(),
                context: context
            };

        } catch (error) {
            logger.error('Error generating email draft:', error);
            throw error;
        }
    }

    /**
     * Meeting scheduler with intelligent suggestions
     */
    async scheduleMeeting(requirements) {
        try {
            const {
                meetingType,
                participants,
                duration,
                priority,
                preferredTimes,
                context
            } = requirements;

            // Analyze participant availability (mock implementation)
            const availabilityAnalysis = await this.analyzeParticipantAvailability(participants);

            // Generate optimal time slots
            const optimalSlots = this.generateOptimalTimeSlots(
                availabilityAnalysis,
                duration,
                preferredTimes,
                priority
            );

            // Create meeting agenda suggestions
            const agendaSuggestions = await this.generateMeetingAgenda(meetingType, context);

            // Generate pre-meeting preparation items
            const preparationItems = await this.generatePreparationItems(meetingType, participants);

            return {
                suggestedSlots: optimalSlots,
                agenda: agendaSuggestions,
                preparation: preparationItems,
                participants: participants.map(p => ({
                    ...p,
                    availability: availabilityAnalysis[p.id],
                    timezone: this.getUserTimezone(p.id)
                })),
                meetingType,
                estimatedDuration: duration,
                priority,
                recommendations: await this.generateMeetingRecommendations(meetingType, participants)
            };

        } catch (error) {
            logger.error('Error scheduling meeting:', error);
            throw error;
        }
    }

    /**
     * Workflow automation engine
     */
    async automateWorkflow(workflowType, triggerData) {
        try {
            if (!this.initialized) await this.initialize();

            const workflows = {
                new_hire_onboarding: async (data) => await this.automateOnboarding(data),
                performance_review_cycle: async (data) => await this.automatePerformanceReview(data),
                leave_approval: async (data) => await this.automateLeaveApproval(data),
                skill_gap_alert: async (data) => await this.automateSkillGapAlert(data),
                retention_risk_alert: async (data) => await this.automateRetentionAlert(data)
            };

            const workflowFunction = workflows[workflowType];
            if (!workflowFunction) {
                throw new Error(`Workflow '${workflowType}' not supported`);
            }

            const result = await workflowFunction(triggerData);

            logger.info(`✅ Automated workflow '${workflowType}' completed`);
            return {
                workflowType,
                status: 'completed',
                result,
                triggeredAt: new Date(),
                actions: result.actions,
                notifications: result.notifications
            };

        } catch (error) {
            logger.error(`Error automating workflow '${workflowType}':`, error);
            throw error;
        }
    }

    // Private helper methods

    async parseNaturalLanguage(query) {
        // Simplified NLP parsing - in production would use advanced NLP library
        const tokens = query.toLowerCase().split(' ');
        const entities = this.extractEntities(tokens);
        const keywords = this.extractKeywords(tokens);

        return {
            originalQuery: query,
            tokens,
            entities,
            keywords,
            sentiment: this.analyzeSentiment(query)
        };
    }

    async determineIntent(parsedQuery, context) {
        const { keywords, entities } = parsedQuery;

        // Rule-based intent classification (simplified)
        if (keywords.some(k => ['report', 'generate', 'create'].includes(k))) {
            return { type: 'report_generation', entities, confidence: 0.8 };
        }

        if (keywords.some(k => ['predict', 'forecast', 'will'].includes(k))) {
            return { type: 'prediction_request', entities, confidence: 0.85 };
        }

        if (keywords.some(k => ['analyze', 'analytics', 'insights'].includes(k))) {
            return { type: 'analytics_request', entities, confidence: 0.9 };
        }

        if (keywords.some(k => ['recommend', 'suggest', 'advice'].includes(k))) {
            return { type: 'recommendation_request', entities, confidence: 0.75 };
        }

        if (keywords.some(k => ['policy', 'rule', 'guideline'].includes(k))) {
            return { type: 'policy_question', entities, confidence: 0.7 };
        }

        if (keywords.some(k => ['how many', 'what is', 'show me'].includes(k))) {
            return { type: 'data_query', entities, confidence: 0.8 };
        }

        return { type: 'general_question', entities, confidence: 0.5 };
    }

    async processDataQuery(intent, context) {
        const { entities } = intent;

        // Process different types of data queries
        if (entities.includes('employees')) {
            const employeeData = await this.getEmployeeMetrics();
            return {
                type: 'data_response',
                message: `We currently have ${employeeData.total} employees across ${employeeData.departments} departments.`,
                data: employeeData,
                visualization: 'employee_overview'
            };
        }

        if (entities.includes('leave')) {
            const leaveData = await this.getLeaveMetrics();
            return {
                type: 'data_response',
                message: `There are ${leaveData.pending} pending leave requests and ${leaveData.approved} approved this month.`,
                data: leaveData,
                visualization: 'leave_status'
            };
        }

        return {
            type: 'data_response',
            message: 'I can help you with employee data, leave information, performance metrics, and more. What specific information are you looking for?'
        };
    }

    async processAnalyticsRequest(intent, context) {
        const analytics = await predictiveAnalytics.generateAnalyticsDashboard();

        return {
            type: 'analytics_response',
            message: 'Here are the latest HR analytics insights:',
            data: analytics,
            insights: [
                `Current retention rate is ${(analytics.overview.retentionRate * 100).toFixed(1)}%`,
                `Average performance score is ${analytics.overview.avgPerformance.toFixed(2)}`,
                `Average time to hire is ${analytics.overview.avgTimeToHire} days`
            ],
            recommendations: analytics.recommendations.slice(0, 3)
        };
    }

    async generateReport(intent, context) {
        const reportType = this.extractReportType(intent.entities) || 'employee_summary';
        const report = await this.generateAutomatedReport(reportType, context);

        return {
            type: 'report_response',
            message: `I've generated your ${report.title} report.`,
            report: report,
            downloadUrl: `/api/reports/${report.id}/download`,
            previewUrl: `/api/reports/${report.id}/preview`
        };
    }

    async loadNLPProcessor() {
        // Initialize NLP processing capabilities
        this.nlpProcessor = {
            entityExtractor: this.createEntityExtractor(),
            intentClassifier: this.createIntentClassifier(),
            sentimentAnalyzer: this.createSentimentAnalyzer()
        };
    }

    async loadReportTemplates() {
        this.reportTemplates.set('employee_summary', {
            title: 'Employee Summary Report',
            sections: ['overview', 'demographics', 'performance', 'retention']
        });

        this.reportTemplates.set('retention_analysis', {
            title: 'Employee Retention Analysis',
            sections: ['retention_metrics', 'risk_factors', 'predictions', 'recommendations']
        });

        this.reportTemplates.set('skills_gap_report', {
            title: 'Skills Gap Analysis Report',
            sections: ['current_skills', 'required_skills', 'gaps', 'training_plan']
        });

        this.reportTemplates.set('performance_trends', {
            title: 'Performance Trends Report',
            sections: ['performance_overview', 'trends', 'forecasts', 'interventions']
        });
    }

    async loadKnowledgeBase() {
        // Load HR policies, procedures, and best practices
        this.knowledgeBase = {
            policies: await this.loadHRPolicies(),
            procedures: await this.loadHRProcedures(),
            bestPractices: await this.loadBestPractices(),
            compliance: await this.loadComplianceGuidelines()
        };
    }

    getConversationContext(userId) {
        return this.conversationHistory.get(userId) || { messages: [], context: {} };
    }

    updateConversationHistory(userId, query, response) {
        const history = this.conversationHistory.get(userId) || { messages: [] };
        history.messages.push({
            timestamp: new Date(),
            query,
            response: response.message || response.type,
            intent: response.intent
        });

        // Keep only last 10 messages
        if (history.messages.length > 10) {
            history.messages = history.messages.slice(-10);
        }

        this.conversationHistory.set(userId, history);
    }

    extractEntities(tokens) {
        const entities = [];
        const entityKeywords = {
            employee: ['employee', 'employees', 'staff', 'team', 'people'],
            leave: ['leave', 'vacation', 'time off', 'pto', 'absence'],
            performance: ['performance', 'review', 'rating', 'evaluation'],
            salary: ['salary', 'compensation', 'pay', 'wage', 'benefit'],
            department: ['department', 'team', 'division', 'group'],
            skill: ['skill', 'skills', 'competency', 'capability', 'expertise']
        };

        for (const [entity, keywords] of Object.entries(entityKeywords)) {
            if (tokens.some(token => keywords.includes(token))) {
                entities.push(entity);
            }
        }

        return entities;
    }

    extractKeywords(tokens) {
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'who'];
        return tokens.filter(token => !stopWords.includes(token) && token.length > 2);
    }

    analyzeSentiment(query) {
        // Simplified sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing'];

        const tokens = query.toLowerCase().split(' ');
        const positive = tokens.filter(token => positiveWords.includes(token)).length;
        const negative = tokens.filter(token => negativeWords.includes(token)).length;

        if (positive > negative) return 'positive';
        if (negative > positive) return 'negative';
        return 'neutral';
    }

    // Mock implementations for demonstration
    async getEmployeeMetrics() {
        return {
            total: 247,
            departments: 5,
            newHires: 12,
            active: 245,
            onLeave: 8
        };
    }

    async getLeaveMetrics() {
        return {
            pending: 12,
            approved: 23,
            rejected: 2,
            totalDays: 156
        };
    }

    extractReportType(entities) {
        if (entities.includes('employee')) return 'employee_summary';
        if (entities.includes('performance')) return 'performance_trends';
        if (entities.includes('skill')) return 'skills_gap_report';
        return 'employee_summary';
    }

    extractEmailSubject(content) {
        const lines = content.split('\n');
        const subjectLine = lines.find(line => line.toLowerCase().includes('subject:'));
        return subjectLine ? subjectLine.replace(/subject:\s*/i, '').trim() : 'HR Communication';
    }

    extractEmailBody(content) {
        const lines = content.split('\n');
        const subjectIndex = lines.findIndex(line => line.toLowerCase().includes('subject:'));
        return lines.slice(subjectIndex + 1).join('\n').trim();
    }

    async generateFollowUpSuggestions(intent, response) {
        const suggestions = [
            "Tell me more about retention risks",
            "Generate a detailed report",
            "Show me performance trends",
            "What are the top skills gaps?",
            "How can we improve hiring speed?"
        ];
        return suggestions.slice(0, 3);
    }

    createEntityExtractor() { return { extract: (text) => this.extractEntities(text.split(' ')) }; }
    createIntentClassifier() { return { classify: (text) => ({ intent: 'general', confidence: 0.5 }) }; }
    createSentimentAnalyzer() { return { analyze: (text) => this.analyzeSentiment(text) }; }

    async loadHRPolicies() { return { count: 25, lastUpdated: new Date() }; }
    async loadHRProcedures() { return { count: 15, lastUpdated: new Date() }; }
    async loadBestPractices() { return { count: 50, lastUpdated: new Date() }; }
    async loadComplianceGuidelines() { return { count: 12, lastUpdated: new Date() }; }

    createMockAIProvider() {
        return {
            generateText: async (prompt, options = {}) => {
                // Mock AI responses for testing
                if (prompt.includes('offer letter')) {
                    return `Subject: Job Offer - Software Engineer Position

Dear John Smith,

We are pleased to offer you the position of Software Engineer at our company with a starting salary of $120,000 annually. Your start date is October 1st, 2025.

We look forward to having you join our team.

Best regards,
HR Department`;
                }

                if (prompt.includes('performance review')) {
                    return `Subject: Performance Review Reminder

Dear Team Member,

This is a reminder that your quarterly performance review is scheduled for next week. Please prepare your self-assessment and gather relevant project documentation.

Best regards,
HR Team`;
                }

                return `Professional response to: ${prompt.substring(0, 50)}...

This is a mock AI-generated response for testing purposes. In production, this would be generated by an actual AI service.

Best regards,
AI Assistant`;
            }
        };
    }
}

module.exports = new EnhancedCopilot();