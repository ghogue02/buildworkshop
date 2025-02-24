import OpenAI from 'openai';

class OpenAIService {
  constructor() {
    // Don't initialize OpenAI in constructor to avoid exposing API key in build
    this.openai = null;
    
    // Rate limiting parameters
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimit = 10; // requests per minute
    this.rateLimitInterval = 60000; // 1 minute in milliseconds
  }

  initializeOpenAI(apiKey) {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    const request = this.requestQueue.shift();
    
    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.isProcessing = false;
      setTimeout(() => this.processQueue(), this.rateLimitInterval / this.rateLimit);
    }
  }

  async queueRequest(execute) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ execute, resolve, reject });
      this.processQueue();
    });
  }

  async analyzeBuilderData(builderData, apiKey) {
    this.initializeOpenAI(apiKey);
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    const prompt = this.createAnalysisPrompt(builderData);
    
    return this.queueRequest(async () => {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are an expert data analyst specializing in analyzing builder progress and identifying patterns in software development projects. Your insights should be clear, actionable, and focused on helping improve the builder experience."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });

        return this.parseAnalysisResponse(completion.choices[0].message.content);
      } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to analyze builder data');
      }
    });
  }

  createAnalysisPrompt(builderData) {
    return `Analyze the following builder data and provide insights in JSON format:

Data:
${JSON.stringify(builderData, null, 2)}

Please analyze:
1. Common patterns in problem definitions
2. Trends in MVP approaches
3. Frequent challenges faced
4. Success patterns
5. Areas needing improvement
6. Time distribution across sections
7. Completion rate patterns

Format the response as a JSON object with the following structure:
{
  "patterns": {
    "problems": [],
    "solutions": [],
    "challenges": []
  },
  "trends": {
    "mvp_approaches": [],
    "time_distribution": {},
    "completion_rates": {}
  },
  "recommendations": {
    "immediate_actions": [],
    "long_term_improvements": []
  },
  "success_indicators": [],
  "risk_factors": [],
  "confidence_score": 0.0
}`;
  }

  parseAnalysisResponse(response) {
    try {
      // Extract JSON from the response
      const jsonStr = response.match(/\{[\s\S]*\}/)[0];
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse analysis response');
    }
  }

  async generateSummaryReport(analysisResults, apiKey) {
    this.initializeOpenAI(apiKey);
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    return this.queueRequest(async () => {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are an expert at creating clear, actionable summary reports from complex data analysis. Focus on key insights and recommendations that can improve the builder experience."
            },
            {
              role: "user",
              content: `Create a summary report from the following analysis results:
                ${JSON.stringify(analysisResults, null, 2)}
                
                Format the response as a JSON object with:
                1. Executive summary
                2. Key findings
                3. Action items
                4. Risk areas
                5. Opportunities`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        });

        return JSON.parse(completion.choices[0].message.content);
      } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to generate summary report');
      }
    });
  }

  async suggestImprovements(builderData, apiKey) {
    this.initializeOpenAI(apiKey);
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    return this.queueRequest(async () => {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are an expert at identifying opportunities for improvement in software development processes and builder experiences."
            },
            {
              role: "user",
              content: `Based on this builder data, suggest specific improvements:
                ${JSON.stringify(builderData, null, 2)}
                
                Focus on:
                1. Process optimizations
                2. Common pain points
                3. Resource gaps
                4. Support opportunities
                5. Tool recommendations`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        });

        return JSON.parse(completion.choices[0].message.content);
      } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to generate improvement suggestions');
      }
    });
  }
}

export const openaiService = new OpenAIService();