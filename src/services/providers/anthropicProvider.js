const Anthropic = require('@anthropic-ai/sdk');
const AIProviderInterface = require('../aiProviderInterface');
const logger = require('../../utils/logger');

class AnthropicProvider extends AIProviderInterface {
  constructor(config = {}) {
    super(config);
    this.name = 'Anthropic';
    this.client = null;
    this.rateLimitTracker = {
      requests: [],
      maxPerMinute: 50, // Anthropic's rate limits
      cleanup() {
        const oneMinuteAgo = Date.now() - 60000;
        this.requests = this.requests.filter(time => time > oneMinuteAgo);
      },
      canMakeRequest() {
        this.cleanup();
        return this.requests.length < this.maxPerMinute;
      },
      addRequest() {
        this.requests.push(Date.now());
      }
    };
  }

  async initialize() {
    const apiKey = this.config.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      throw new Error('Anthropic API key not configured');
    }

    this.client = new Anthropic({ apiKey });
    logger.info('Anthropic provider initialized');
    return true;
  }

  async isAvailable() {
    if (!this.client) {
      try {
        await this.initialize();
      } catch (error) {
        return false;
      }
    }

    try {
      // Test with a minimal request
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch (error) {
      logger.error('Anthropic availability check failed:', error);
      return false;
    }
  }

  checkRateLimit() {
    if (!this.rateLimitTracker.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    this.rateLimitTracker.addRequest();
  }

  async generateJobDescription(role, company, requirements = {}) {
    this.checkRateLimit();

    const prompt = `I need you to generate a comprehensive job description. Here are the details:

<role>
Title: ${role.title || role}
</role>

<company>
Name: ${company.name || 'Company'}
Industry: ${company.industry || 'Technology'}
Size: ${company.size || 'Medium'}
</company>

<requirements>
Experience Level: ${requirements.experienceLevel || 'Mid-level'}
Required Skills: ${requirements.skills ? requirements.skills.join(', ') : 'To be determined'}
Remote Work: ${requirements.remote ? 'Yes' : 'No'}
Location: ${requirements.location || 'Various'}
</requirements>

Please create a professional, engaging, and bias-free job description that includes:

1. Job Title
2. Job Summary (2-3 sentences)
3. Key Responsibilities (5-7 bullet points)
4. Required Qualifications (education, experience, skills)
5. Preferred Qualifications
6. Benefits and Perks
7. Application Instructions

Ensure the language is inclusive and avoids any gender, age, or cultural bias. Make it compelling to attract diverse candidates.`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      system: "You are an expert HR professional specializing in creating compelling, bias-free job descriptions that attract diverse candidates. You follow best practices for inclusive hiring and write clear, professional content.",
      messages: [{ role: 'user', content: prompt }]
    });

    const jobDescription = response.content[0].text;

    logger.info(`Generated job description for: ${role.title || role}`);

    return {
      jobDescription,
      metadata: {
        provider: this.name,
        model: 'claude-3-5-sonnet',
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        generatedAt: new Date().toISOString()
      }
    };
  }

  async extractSkillsFromText(text, context = 'resume') {
    this.checkRateLimit();

    const prompt = `Please analyze the following ${context} text and extract all relevant professional skills.

<text_to_analyze>
${text}
</text_to_analyze>

I need you to categorize the skills into these specific categories:
1. Technical Skills (programming languages, tools, platforms, software)
2. Soft Skills (communication, leadership, teamwork, etc.)
3. Business Skills (project management, analytics, strategy, etc.)
4. Industry-Specific Skills (domain expertise, certifications)

Requirements:
- Only include skills that are clearly mentioned or strongly implied
- Be conservative but thorough
- Return the result as valid JSON

Please respond with a JSON object in this exact format:
{
  "technical": ["skill1", "skill2"],
  "soft": ["skill1", "skill2"],
  "business": ["skill1", "skill2"],
  "industry": ["skill1", "skill2"]
}`;

    const response = await this.client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.2,
      system: "You are an expert at identifying and categorizing professional skills from text. You provide accurate, structured responses in valid JSON format only.",
      messages: [{ role: 'user', content: prompt }]
    });

    const skillsText = response.content[0].text;

    try {
      // Extract JSON from response (Claude sometimes adds explanatory text)
      const jsonMatch = skillsText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : skillsText;
      const skills = JSON.parse(jsonText);

      logger.info(`Extracted skills from ${context}: ${Object.values(skills).flat().length} total skills`);
      return skills;
    } catch (parseError) {
      logger.warn('Failed to parse skills JSON, falling back to text analysis');
      return {
        technical: [],
        soft: [],
        business: [],
        industry: [],
        raw: skillsText
      };
    }
  }

  async enhanceCVParsing(rawText) {
    this.checkRateLimit();

    const prompt = `Please parse and structure the following CV/resume text into a comprehensive JSON format.

<cv_text>
${rawText}
</cv_text>

Extract and organize all available information into these categories:
1. Personal Information (name, email, phone, location)
2. Professional Summary
3. Work Experience (with dates, companies, positions, descriptions, achievements)
4. Education (degrees, institutions, dates, fields of study)
5. Skills (categorized by type)
6. Certifications and Licenses
7. Languages spoken
8. Projects or notable achievements

Please return a valid JSON object with this exact structure:
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

Only include information that is clearly present in the text. Use "N/A" for missing information.`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.1,
      system: "You are an expert CV parser that extracts structured information from resumes and returns it in clean, valid JSON format. Be thorough but only include information that is clearly present.",
      messages: [{ role: 'user', content: prompt }]
    });

    const cvText = response.content[0].text;

    try {
      // Extract JSON from response
      const jsonMatch = cvText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : cvText;
      const parsedCV = JSON.parse(jsonText);

      logger.info(`Enhanced CV parsing completed for: ${parsedCV.personalInfo?.name || 'Unknown'}`);
      return parsedCV;
    } catch (parseError) {
      logger.warn('Failed to parse CV JSON, returning raw response');
      return {
        error: 'Failed to parse CV structure',
        raw: cvText
      };
    }
  }

  async generateInterviewQuestions(role, skills = [], experienceLevel = 'mid') {
    this.checkRateLimit();

    const prompt = `Generate comprehensive interview questions for the following position:

<position_details>
Role: ${role}
Required Skills: ${skills.join(', ')}
Experience Level: ${experienceLevel}
</position_details>

Please create questions in these categories:
1. Behavioral questions (3-4 questions) - assess soft skills and cultural fit
2. Technical questions (3-4 questions) - based on required skills and role
3. Situational questions (2-3 questions) - problem-solving scenarios
4. Motivation questions (1-2 questions) - career goals and interests

Requirements:
- Questions should be appropriate for ${experienceLevel} level candidates
- Avoid biased or inappropriate questions
- Focus on job-relevant competencies
- Include follow-up question suggestions where appropriate

Please respond with a valid JSON object in this format:
{
  "behavioral": ["question1", "question2"],
  "technical": ["question1", "question2"],
  "situational": ["question1", "question2"],
  "motivation": ["question1", "question2"]
}`;

    const response = await this.client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      temperature: 0.6,
      system: "You are an expert recruiter who creates fair, effective interview questions that help assess candidate skills and cultural fit while avoiding bias.",
      messages: [{ role: 'user', content: prompt }]
    });

    const questionsText = response.content[0].text;

    try {
      const jsonMatch = questionsText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : questionsText;
      const questions = JSON.parse(jsonText);

      logger.info(`Generated interview questions for: ${role}`);
      return questions;
    } catch (parseError) {
      logger.warn('Failed to parse interview questions JSON');
      return {
        error: 'Failed to parse questions structure',
        raw: questionsText
      };
    }
  }

  async analyzeBiasInText(text, type = 'job_description') {
    this.checkRateLimit();

    const prompt = `Please analyze the following ${type} for potential bias and provide suggestions for improvement.

<text_to_analyze>
${text}
</text_to_analyze>

Examine the text for these types of bias:
1. Gender bias - gendered language or requirements that may favor one gender
2. Age bias - language or requirements that may discriminate by age
3. Cultural bias - assumptions about background, culture, or education
4. Accessibility bias - requirements that may exclude people with disabilities
5. Socioeconomic bias - assumptions about background or resources

For each issue found, provide:
- The type of bias
- Severity level (low/medium/high)
- Specific description of the issue
- Concrete suggestion for improvement

Also provide:
- An overall bias score (0-10, where 0 is bias-free)
- General suggestions for improvement
- A revised, bias-free version of the text

Please respond with a valid JSON object in this format:
{
  "biasScore": 0-10,
  "issues": [
    {
      "type": "gender|age|cultural|accessibility|socioeconomic",
      "severity": "low|medium|high",
      "description": "specific issue found",
      "suggestion": "how to improve this"
    }
  ],
  "overallSuggestions": ["general improvement suggestions"],
  "improvedText": "bias-free version of the text"
}`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.2,
      system: "You are an expert in diversity, equity, and inclusion who helps identify and eliminate bias in HR-related text. You provide thorough analysis and practical suggestions for improvement.",
      messages: [{ role: 'user', content: prompt }]
    });

    const biasAnalysis = response.content[0].text;

    try {
      const jsonMatch = biasAnalysis.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : biasAnalysis;
      const analysis = JSON.parse(jsonText);

      logger.info(`Bias analysis completed with score: ${analysis.biasScore}/10`);
      return analysis;
    } catch (parseError) {
      logger.warn('Failed to parse bias analysis JSON');
      return {
        error: 'Failed to parse bias analysis',
        raw: biasAnalysis
      };
    }
  }

  async generateText(prompt, options = {}) {
    this.checkRateLimit();

    const response = await this.client.messages.create({
      model: options.model || 'claude-3-haiku-20240307',
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  }

  async generateJSON(prompt, options = {}) {
    const enhancedPrompt = `${prompt}\n\nPlease respond with valid JSON only.`;
    const text = await this.generateText(enhancedPrompt, options);

    try {
      // Extract JSON from response (Claude sometimes adds explanatory text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      return JSON.parse(jsonText);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }

  getRateLimits() {
    return {
      requestsPerMinute: 50,
      tokensPerMinute: 40000,
      maxConcurrent: 5
    };
  }

  getCostInfo() {
    return {
      inputTokenCost: 0.003, // Claude-3.5-Sonnet pricing per 1K tokens
      outputTokenCost: 0.015,
      requestCost: 0,
      currency: 'USD'
    };
  }
}

module.exports = AnthropicProvider;