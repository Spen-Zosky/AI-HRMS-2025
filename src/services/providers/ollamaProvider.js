const axios = require('axios');
const AIProviderInterface = require('../aiProviderInterface');
const logger = require('../../utils/logger');

class OllamaProvider extends AIProviderInterface {
  constructor(config = {}) {
    super(config);
    this.name = 'Ollama';
    this.baseURL = config.baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = config.model || process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.timeout = config.timeout || 120000; // 2 minutes timeout for local AI
  }

  async initialize() {
    try {
      // Check if Ollama server is running
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });

      // Check if the specified model is available
      const availableModels = response.data.models || [];
      const modelExists = availableModels.some(model => model.name.includes(this.model.split(':')[0]));

      if (!modelExists) {
        logger.warn(`Model ${this.model} not found. Available models:`, availableModels.map(m => m.name));
        throw new Error(`Model ${this.model} not available in Ollama`);
      }

      logger.info(`Ollama provider initialized with model: ${this.model}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to initialize Ollama: ${error.message}`);
    }
  }

  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.error('Ollama availability check failed:', error);
      return false;
    }
  }

  async generateText(prompt, options = {}) {
    try {
      const requestBody = {
        model: options.model || this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_k: options.top_k || 40,
          top_p: options.top_p || 0.9,
          num_predict: options.maxTokens || 1000
        }
      };

      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        requestBody,
        { timeout: this.timeout }
      );

      return response.data.response;
    } catch (error) {
      logger.error('Ollama text generation failed:', error);
      throw error;
    }
  }

  async generateJSON(prompt, options = {}) {
    const enhancedPrompt = `${prompt}\n\nRespond with valid JSON only. Do not include any explanatory text.`;
    const text = await this.generateText(enhancedPrompt, options);

    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      return JSON.parse(jsonText);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }

  async generateJobDescription(role, company, requirements = {}) {
    const prompt = `Generate a comprehensive job description for the following position:

Role: ${role.title || role}
Company: ${company.name || 'Company'}
Industry: ${company.industry || 'Technology'}
Company Size: ${company.size || 'Medium'}

Requirements:
- Experience Level: ${requirements.experienceLevel || 'Mid-level'}
- Required Skills: ${requirements.skills ? requirements.skills.join(', ') : 'To be determined'}
- Remote Work: ${requirements.remote ? 'Yes' : 'No'}
- Location: ${requirements.location || 'Various'}

Create a professional job description that includes:
1. Job Title
2. Job Summary (2-3 sentences)
3. Key Responsibilities (5-7 bullet points)
4. Required Qualifications (education, experience, skills)
5. Preferred Qualifications
6. Benefits and Perks
7. Application Instructions

Make the language engaging, professional, and bias-free. Ensure it attracts diverse candidates.`;

    const jobDescription = await this.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 1500
    });

    logger.info(`Generated job description for: ${role.title || role}`);

    return {
      jobDescription,
      metadata: {
        provider: this.name,
        model: this.model,
        tokens: Math.ceil(jobDescription.length / 4), // Approximate token count
        generatedAt: new Date().toISOString()
      }
    };
  }

  async extractSkillsFromText(text, context = 'resume') {
    const prompt = `Analyze the following ${context} text and extract all relevant professional skills.

Text: ${text}

Extract skills in these categories:
1. Technical Skills (programming languages, tools, platforms)
2. Soft Skills (communication, leadership, etc.)
3. Business Skills (project management, analytics, etc.)
4. Industry-Specific Skills

Return ONLY a JSON object with this structure:
{
  "technical": ["skill1", "skill2"],
  "soft": ["skill1", "skill2"],
  "business": ["skill1", "skill2"],
  "industry": ["skill1", "skill2"]
}

Be conservative but thorough. Only include clearly mentioned skills.`;

    try {
      const skills = await this.generateJSON(prompt, {
        temperature: 0.3,
        maxTokens: 800
      });

      logger.info(`Extracted skills from ${context}: ${Object.values(skills).flat().length} total skills`);
      return skills;
    } catch (parseError) {
      logger.warn('Failed to parse skills JSON from Ollama');
      return {
        technical: [],
        soft: [],
        business: [],
        industry: [],
        error: 'JSON parsing failed'
      };
    }
  }

  async enhanceCVParsing(rawText) {
    const prompt = `Parse the following CV/resume text and extract structured information.

CV Text: ${rawText}

Extract and structure the information into JSON format with these sections:
1. Personal Information (name, email, phone, location)
2. Professional Summary
3. Work Experience (companies, positions, dates, descriptions)
4. Education (institutions, degrees, dates)
5. Skills (categorized)
6. Certifications
7. Languages
8. Projects

Return ONLY a JSON object with this structure:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  },
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string"
    }
  ],
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "languages": ["string"]
  },
  "certifications": ["string"],
  "projects": ["string"]
}

Only include information clearly present in the text.`;

    try {
      const parsedCV = await this.generateJSON(prompt, {
        temperature: 0.2,
        maxTokens: 2000
      });

      logger.info(`Enhanced CV parsing completed for: ${parsedCV.personalInfo?.name || 'Unknown'}`);
      return parsedCV;
    } catch (parseError) {
      logger.warn('Failed to parse CV JSON from Ollama');
      return {
        error: 'Failed to parse CV structure',
        raw: 'Ollama JSON parsing failed'
      };
    }
  }

  async generateInterviewQuestions(role, skills = [], experienceLevel = 'mid') {
    const prompt = `Generate interview questions for this position:

Role: ${role}
Required Skills: ${skills.join(', ')}
Experience Level: ${experienceLevel}

Create questions in these categories:
1. Behavioral questions (3-4) - soft skills and cultural fit
2. Technical questions (3-4) - based on required skills
3. Situational questions (2-3) - problem-solving scenarios
4. Motivation questions (1-2) - career goals

Make questions appropriate for ${experienceLevel} level and avoid bias.

Return ONLY a JSON object with this format:
{
  "behavioral": ["question1", "question2"],
  "technical": ["question1", "question2"],
  "situational": ["question1", "question2"],
  "motivation": ["question1", "question2"]
}`;

    try {
      const questions = await this.generateJSON(prompt, {
        temperature: 0.6,
        maxTokens: 1000
      });

      logger.info(`Generated interview questions for: ${role}`);
      return questions;
    } catch (parseError) {
      logger.warn('Failed to parse interview questions JSON from Ollama');
      return {
        error: 'Failed to parse questions structure',
        raw: 'Ollama JSON parsing failed'
      };
    }
  }

  async analyzeBiasInText(text, type = 'job_description') {
    const prompt = `Analyze the following ${type} for potential bias:

Text: ${text}

Check for these bias types:
1. Gender bias - gendered language or requirements
2. Age bias - age-discriminatory language
3. Cultural bias - cultural assumptions
4. Accessibility bias - exclusionary requirements
5. Socioeconomic bias - background assumptions

For each issue, provide type, severity (low/medium/high), description, and suggestion.

Return ONLY a JSON object with this format:
{
  "biasScore": 0-10,
  "issues": [
    {
      "type": "gender|age|cultural|accessibility|socioeconomic",
      "severity": "low|medium|high",
      "description": "specific issue",
      "suggestion": "improvement suggestion"
    }
  ],
  "overallSuggestions": ["suggestions"],
  "improvedText": "bias-free version"
}`;

    try {
      const analysis = await this.generateJSON(prompt, {
        temperature: 0.3,
        maxTokens: 1500
      });

      logger.info(`Bias analysis completed with score: ${analysis.biasScore}/10`);
      return analysis;
    } catch (parseError) {
      logger.warn('Failed to parse bias analysis JSON from Ollama');
      return {
        error: 'Failed to parse bias analysis',
        raw: 'Ollama JSON parsing failed'
      };
    }
  }

  getRateLimits() {
    return {
      requestsPerMinute: 120, // Local server, higher limits
      tokensPerMinute: 120000,
      maxConcurrent: 3 // Depends on local hardware
    };
  }

  getCostInfo() {
    return {
      inputTokenCost: 0, // Local inference is free
      outputTokenCost: 0,
      requestCost: 0,
      currency: 'USD'
    };
  }
}

module.exports = OllamaProvider;