const { OpenAI } = require('openai');
const logger = require('../utils/logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting tracker (simple in-memory for now)
const rateLimitTracker = {
  requests: [],
  maxPerMinute: 60,
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

// Helper function to check rate limits
const checkRateLimit = () => {
  if (!rateLimitTracker.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  rateLimitTracker.addRequest();
};

// Generate job description using AI
const generateJobDescription = async (role, company, requirements = {}) => {
  try {
    checkRateLimit();
    
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

Please include:
1. Job Title
2. Job Summary (2-3 sentences)
3. Key Responsibilities (5-7 bullet points)
4. Required Qualifications (education, experience, skills)
5. Preferred Qualifications
6. Benefits and Perks
7. Application Instructions

Make the language engaging but professional, and ensure it's bias-free and inclusive.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR professional specializing in creating compelling, bias-free job descriptions that attract diverse candidates.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const jobDescription = response.choices[0].message.content;
    
    logger.info(`Generated job description for: ${role.title || role}`);
    
    return {
      jobDescription,
      metadata: {
        model: 'gpt-4',
        tokens: response.usage.total_tokens,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error('Error generating job description:', error);
    throw error;
  }
};

// Extract skills from text using AI
const extractSkillsFromText = async (text, context = 'resume') => {
  try {
    checkRateLimit();
    
    const prompt = `Analyze the following ${context} text and extract all relevant professional skills. 
    
Text: ${text}

Please extract skills in the following categories:
1. Technical Skills (programming languages, tools, platforms)
2. Soft Skills (communication, leadership, etc.)
3. Business Skills (project management, analytics, etc.)
4. Industry-Specific Skills

Return the result as a JSON object with this structure:
{
  "technical": ["skill1", "skill2"],
  "soft": ["skill1", "skill2"],
  "business": ["skill1", "skill2"],
  "industry": ["skill1", "skill2"]
}

Only include skills that are clearly mentioned or strongly implied. Be conservative but thorough.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying and categorizing professional skills from text. You provide accurate, structured responses in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const skillsText = response.choices[0].message.content;
    
    try {
      const skills = JSON.parse(skillsText);
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

  } catch (error) {
    logger.error('Error extracting skills from text:', error);
    throw error;
  }
};

// Enhance CV parsing with AI
const enhanceCVParsing = async (rawText) => {
  try {
    checkRateLimit();
    
    const prompt = `Parse and structure the following CV/resume text. Extract all relevant information and return as JSON.

CV Text: ${rawText}

Please extract and structure:
1. Personal Information (name, email, phone, location)
2. Professional Summary
3. Work Experience (with dates, companies, positions, descriptions)
4. Education (degrees, institutions, dates)
5. Skills (categorized)
6. Certifications
7. Languages
8. Projects (if mentioned)

Return as JSON with this structure:
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

Be thorough but only include information that is clearly present in the text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert CV parser. You extract structured information from resumes and return it in clean JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.2
    });

    const cvText = response.choices[0].message.content;
    
    try {
      const parsedCV = JSON.parse(cvText);
      logger.info(`Enhanced CV parsing completed for: ${parsedCV.personalInfo?.name || 'Unknown'}`);
      return parsedCV;
    } catch (parseError) {
      logger.warn('Failed to parse CV JSON, returning raw response');
      return {
        error: 'Failed to parse CV structure',
        raw: cvText
      };
    }

  } catch (error) {
    logger.error('Error enhancing CV parsing:', error);
    throw error;
  }
};

// Generate interview questions for a role and skills
const generateInterviewQuestions = async (role, skills = [], experienceLevel = 'mid') => {
  try {
    checkRateLimit();
    
    const prompt = `Generate interview questions for the following position:

Role: ${role}
Required Skills: ${skills.join(', ')}
Experience Level: ${experienceLevel}

Please generate:
1. 3-4 General/Behavioral questions
2. 3-4 Technical questions based on required skills
3. 2-3 Situational questions
4. 1-2 Questions about career goals/motivation

Format as JSON:
{
  "behavioral": ["question1", "question2"],
  "technical": ["question1", "question2"],
  "situational": ["question1", "question2"],
  "motivation": ["question1", "question2"]
}

Make questions relevant to the ${experienceLevel} level and avoid biased or inappropriate questions.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter who creates fair, effective interview questions that help assess candidate skills and cultural fit.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.6
    });

    const questionsText = response.choices[0].message.content;
    
    try {
      const questions = JSON.parse(questionsText);
      logger.info(`Generated interview questions for: ${role}`);
      return questions;
    } catch (parseError) {
      logger.warn('Failed to parse interview questions JSON');
      return {
        error: 'Failed to parse questions structure',
        raw: questionsText
      };
    }

  } catch (error) {
    logger.error('Error generating interview questions:', error);
    throw error;
  }
};

// Analyze text for bias and suggest improvements
const analyzeBiasInText = async (text, type = 'job_description') => {
  try {
    checkRateLimit();
    
    const prompt = `Analyze the following ${type} for potential bias and suggest improvements:

Text: ${text}

Check for:
1. Gender bias (gendered language, requirements that may favor one gender)
2. Age bias (requirements or language that may discriminate by age)
3. Cultural bias (assumptions about background, culture, or education)
4. Accessibility bias (requirements that may exclude people with disabilities)
5. Socioeconomic bias (assumptions about background or resources)

Return as JSON:
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in diversity, equity, and inclusion who helps identify and eliminate bias in HR-related text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const biasAnalysis = response.choices[0].message.content;
    
    try {
      const analysis = JSON.parse(biasAnalysis);
      logger.info(`Bias analysis completed with score: ${analysis.biasScore}/10`);
      return analysis;
    } catch (parseError) {
      logger.warn('Failed to parse bias analysis JSON');
      return {
        error: 'Failed to parse bias analysis',
        raw: biasAnalysis
      };
    }

  } catch (error) {
    logger.error('Error analyzing bias in text:', error);
    throw error;
  }
};

module.exports = {
  generateJobDescription,
  extractSkillsFromText,
  enhanceCVParsing,
  generateInterviewQuestions,
  analyzeBiasInText
};