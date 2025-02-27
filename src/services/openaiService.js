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

  /**
   * Generate enhanced interview questions based on user data
   * @param {Object} builderData - The builder's data from previous sections
   * @param {string} apiKey - OpenAI API key
   * @returns {Promise<Object>} - Object containing generated questions with metadata
   */
  async generateInterviewQuestions(builderData, apiKey) {
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
              content: `You are an expert AI interviewer specializing in product development.
              Your questions should be insightful, contextual, and designed to elicit detailed responses.
              Each question should have a clear purpose and be tailored to the specific project details provided.
              Include follow-up prompts with each question to encourage deeper reflection.`
            },
            {
              role: "user",
              content: `Generate 5 interview questions for a builder who has created an AI-powered product.
              
              Here's what we know about their project: ${JSON.stringify(builderData, null, 2)}
              
              For each question:
              1. Make it specific to their project context
              2. Design it to reveal insights about their development process, challenges, or decisions
              3. Include a follow-up prompt to encourage elaboration
              4. Assign a category (technical, user-focused, business, process, or reflection)
              5. Indicate the expected insight this question should reveal
              
              Format your response as a JSON object with the following structure:
              {
                "questions": [
                  {
                    "text": "Main question text here?",
                    "followup": "Follow-up prompt to encourage elaboration",
                    "category": "One of: technical, user-focused, business, process, reflection",
                    "expected_insight": "What this question aims to reveal",
                    "adaptability": 0.8 // A score from 0-1 indicating how much this question can be adapted based on previous answers
                  },
                  // ... more questions
                ]
              }`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: "json_object" } // Ensure JSON response
        });

        // Parse the response
        try {
          const result = JSON.parse(completion.choices[0].message.content);
          
          // Extract just the question text for backward compatibility
          if (result.questions && Array.isArray(result.questions)) {
            // Store the rich question data
            this.questionMetadata = result.questions;
            
            // Return simplified format for backward compatibility
            return {
              questions: result.questions.map(q => q.text),
              metadata: result.questions
            };
          }
          
          return result;
        } catch (parseError) {
          console.error('Error parsing questions response:', parseError);
          // Attempt to extract questions if JSON parsing fails
          const content = completion.choices[0].message.content;
          const questions = content.match(/["'].*?["']/g)
            ?.map(q => q.replace(/^["']|["']$/g, ''))
            ?.filter(q => q.length > 10 && q.includes('?'))
            ?.slice(0, 5);
          
          return { questions: questions || this.getDefaultQuestions() };
        }
      } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to generate interview questions');
      }
    });
  }

  /**
   * Get default interview questions as fallback
   * @returns {Array} - Array of default questions
   */
  getDefaultQuestions() {
    return [
      "Tell me about your project idea and what problem it solves.",
      "How does your solution use AI technology?",
      "What were the biggest challenges you faced during development?",
      "How did you incorporate feedback to improve your solution?",
      "What would you do differently if you were to start over?"
    ];
  }

  /**
   * Adapt a question based on previous answer and engagement level
   * @param {string} question - The original question
   * @param {string} previousAnswer - The previous answer
   * @param {string} apiKey - OpenAI API key
   * @returns {Promise<string>} - The adapted question
   */
  async adaptQuestion(question, previousAnswer, apiKey) {
    this.initializeOpenAI(apiKey);
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    // First analyze the sentiment and engagement level
    const sentiment = await this.analyzeSentiment(previousAnswer, apiKey);
    
    return this.queueRequest(async () => {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert interviewer with advanced conversational skills.
              Adapt the next question based on the previous answer, while maintaining the core intent.
              The user's engagement level is: ${sentiment.engagement_level} (${sentiment.engagement_score}/10)
              Their sentiment appears to be: ${sentiment.sentiment}
              Their answer shows: ${sentiment.characteristics.join(', ')}
              
              If engagement is low (below 5), make the question more interesting or personal.
              If sentiment is negative, be more supportive and encouraging.
              If the answer was detailed, acknowledge specific points they made.
              If the answer was brief, make the question more specific or provide a prompt.`
            },
            {
              role: "user",
              content: `Original question: "${question}"
              
              Previous answer: "${previousAnswer}"
              
              Adapt the question to make it more relevant based on their answer and engagement level.
              Keep your response concise and focused on the adapted question only.`
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        });

        return completion.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI API Error:', error);
        // Return the original question as fallback
        return question;
      }
    });
  }

  /**
   * Analyze sentiment and engagement level in a response
   * @param {string} text - The text to analyze
   * @param {string} apiKey - OpenAI API key
   * @returns {Promise<Object>} - Sentiment analysis results
   */
  async analyzeSentiment(text, apiKey) {
    this.initializeOpenAI(apiKey);
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    // For very short responses, return a default low engagement
    if (!text || text.length < 10) {
      return {
        sentiment: "neutral",
        engagement_level: "low",
        engagement_score: 3,
        characteristics: ["brief", "minimal"],
        recommendations: ["Ask more specific questions", "Provide more context"]
      };
    }

    return this.queueRequest(async () => {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert at analyzing sentiment and engagement in conversation.
              Analyze the following response for:
              1. Overall sentiment (positive, negative, neutral)
              2. Engagement level (high, medium, low)
              3. Engagement score (1-10)
              4. Key characteristics (detailed, enthusiastic, hesitant, etc.)
              5. Recommendations for improving engagement`
            },
            {
              role: "user",
              content: `Analyze this interview response for sentiment and engagement:
              
              "${text}"
              
              Provide your analysis in JSON format.`
            }
          ],
          temperature: 0.5,
          max_tokens: 500,
          response_format: { type: "json_object" }
        });

        try {
          return JSON.parse(completion.choices[0].message.content);
        } catch (parseError) {
          console.error('Error parsing sentiment analysis:', parseError);
          // Return default values if parsing fails
          return {
            sentiment: "neutral",
            engagement_level: "medium",
            engagement_score: 5,
            characteristics: ["unclear"],
            recommendations: ["Continue with standard questions"]
          };
        }
      } catch (error) {
        console.error('OpenAI API Error during sentiment analysis:', error);
        // Return default values if API call fails
        return {
          sentiment: "neutral",
          engagement_level: "medium",
          engagement_score: 5,
          characteristics: ["unknown"],
          recommendations: ["Proceed normally"]
        };
      }
    });
  }

  /**
   * Generate a comprehensive interview summary with analytics
   * @param {Array} interviewData - Array of question/answer pairs
   * @param {string} apiKey - OpenAI API key
   * @returns {Promise<Object>} - Enhanced summary object with analytics
   */
  async generateInterviewSummary(interviewData, apiKey) {
    this.initializeOpenAI(apiKey);
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    // First analyze the overall engagement across all answers
    const engagementPromises = interviewData.map(item =>
      this.analyzeSentiment(item.answer, apiKey)
    );
    
    let engagementAnalytics;
    try {
      const engagementResults = await Promise.all(engagementPromises);
      
      // Calculate average engagement
      const avgScore = engagementResults.reduce((sum, result) => sum + result.engagement_score, 0) / engagementResults.length;
      
      // Identify dominant sentiment
      const sentiments = engagementResults.map(r => r.sentiment);
      const dominantSentiment = sentiments.sort((a, b) =>
        sentiments.filter(s => s === a).length - sentiments.filter(s => s === b).length
      ).pop();
      
      engagementAnalytics = {
        average_engagement: avgScore.toFixed(1),
        dominant_sentiment: dominantSentiment,
        engagement_trend: avgScore > 7 ? "high" : avgScore > 4 ? "moderate" : "low",
        question_engagement: engagementResults.map((result, index) => ({
          question_number: index + 1,
          engagement: result.engagement_score,
          sentiment: result.sentiment
        }))
      };
    } catch (error) {
      console.error('Error analyzing engagement:', error);
      engagementAnalytics = {
        average_engagement: "5.0",
        dominant_sentiment: "neutral",
        engagement_trend: "moderate"
      };
    }

    return this.queueRequest(async () => {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert at analyzing interview responses and providing comprehensive summaries.
              Focus on key insights, strengths, areas for improvement, and actionable recommendations.
              Your analysis should be data-driven, insightful, and tailored to the specific project discussed.
              
              The interviewee's overall engagement metrics:
              - Average engagement score: ${engagementAnalytics.average_engagement}/10
              - Dominant sentiment: ${engagementAnalytics.dominant_sentiment}
              - Engagement trend: ${engagementAnalytics.engagement_trend}
              
              Use these metrics to inform your analysis.`
            },
            {
              role: "user",
              content: `Analyze these interview responses and provide a comprehensive summary with key insights:
              ${JSON.stringify(interviewData, null, 2)}
              
              Engagement analytics:
              ${JSON.stringify(engagementAnalytics, null, 2)}
              
              Format your response as a JSON object with the following structure:
              {
                "conclusion": "Overall summary of the interview",
                "key_points": ["Key point 1", "Key point 2", ...],
                "strengths": ["Strength 1", "Strength 2", ...],
                "areas_for_improvement": ["Area 1", "Area 2", ...],
                "technical_insights": ["Technical insight 1", "Technical insight 2", ...],
                "business_insights": ["Business insight 1", "Business insight 2", ...],
                "user_experience_insights": ["UX insight 1", "UX insight 2", ...],
                "development_process_insights": ["Process insight 1", "Process insight 2", ...],
                "next_steps": ["Step 1", "Step 2", ...],
                "engagement_analysis": {
                  "summary": "Summary of engagement during interview",
                  "highlights": ["Highlight 1", "Highlight 2", ...],
                  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
                }
              }`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: "json_object" }
        });

        // Parse the response
        try {
          return JSON.parse(completion.choices[0].message.content);
        } catch (parseError) {
          console.error('Error parsing summary response:', parseError);
          // Return a default summary if parsing fails
          return {
            conclusion: "Thank you for completing the interview. Your responses have been recorded and analyzed.",
            key_points: interviewData.map(item => item.answer.substring(0, 100) + "..."),
            strengths: ["Your project demonstrates creative problem-solving."],
            areas_for_improvement: ["Consider gathering more user feedback."],
            technical_insights: ["Your technical approach shows innovation."],
            business_insights: ["The business model has potential for growth."],
            user_experience_insights: ["The user experience design is thoughtful."],
            development_process_insights: ["Your development process is well-structured."],
            next_steps: ["Review your project goals", "Implement the feedback received"],
            engagement_analysis: {
              summary: `Your overall engagement score was ${engagementAnalytics.average_engagement}/10.`,
              highlights: ["You showed interest in discussing technical aspects."],
              recommendations: ["Consider exploring user feedback in more depth."]
            }
          };
        }
      } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Failed to generate interview summary');
      }
    });
  }
}

export const openaiService = new OpenAIService();