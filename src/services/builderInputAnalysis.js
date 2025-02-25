import { supabase } from '../supabaseClient';

class BuilderInputAnalysis {
  constructor() {
    this.sectionOrder = [
      'User Info',
      'Problem Definition',
      'MVP Planner',
      'Give & Get Feedback',
      'Refine Your MVP',
      'Start Build',
      'Presentations & Retro'
    ];
  }

  async analyzeSectionInputs() {
    try {
      // Fetch all user inputs
      const { data: inputs, error } = await supabase
        .from('user_inputs')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group inputs by section
      const sectionInputs = this.groupBySection(inputs);

      // Analyze each section
      const analysis = {
        problemDefinition: this.analyzeProblemDefinition(sectionInputs['Problem Definition'] || []),
        mvpPlanner: this.analyzeMVPPlanner(sectionInputs['MVP Planner'] || []),
        feedback: this.analyzeFeedback(sectionInputs['Give & Get Feedback'] || []),
        refinements: this.analyzeRefinements(sectionInputs['Refine Your MVP'] || []),
        build: this.analyzeBuild(sectionInputs['Start Build'] || []),
        presentations: this.analyzePresentations(sectionInputs['Presentations & Retro'] || []),
        overview: this.generateOverview(sectionInputs)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing builder inputs:', error);
      throw new Error('Failed to analyze builder inputs');
    }
  }

  groupBySection(inputs) {
    const sections = {};
    
    inputs.forEach(input => {
      if (!sections[input.section_name]) {
        sections[input.section_name] = [];
      }
      sections[input.section_name].push(input.input_data);
    });

    return sections;
  }

  analyzeProblemDefinition(inputs) {
    if (inputs.length === 0) return null;

    const analysis = {
      commonThemes: this.extractCommonThemes(inputs, ['summary', 'context']),
      impactAreas: this.extractCommonThemes(inputs, ['impact']),
      rootCauses: this.extractCommonThemes(inputs, ['rootCauses']),
      complexityLevels: this.assessComplexity(inputs)
    };

    return analysis;
  }

  analyzeMVPPlanner(inputs) {
    if (inputs.length === 0) return null;

    const analysis = {
      solutionTypes: this.extractCommonThemes(inputs, ['howItWorks']),
      userExperience: this.extractCommonThemes(inputs, ['userExperience'])
    };

    return analysis;
  }

  analyzeFeedback(inputs) {
    if (inputs.length === 0) return null;

    const analysis = {
      feedbackThemes: this.extractCommonThemes(inputs, ['requestFeedback', 'giveFeedback'])
    };

    return analysis;
  }

  analyzeRefinements(inputs) {
    if (inputs.length === 0) return null;

    const analysis = {
      refinementAreas: this.extractCommonThemes(inputs, ['feedbackIntegration']),
      aiEnhancements: this.extractCommonThemes(inputs, ['aiEnhancement']),
      productChanges: this.extractCommonThemes(inputs, ['productRefinement'])
    };

    return analysis;
  }

  analyzeBuild(inputs) {
    if (inputs.length === 0) return null;

    const analysis = {
      implementationApproaches: this.extractCommonThemes(inputs, ['whatBuilt']),
      aiUsage: this.extractCommonThemes(inputs, ['aiHelp']),
      futurePlans: this.extractCommonThemes(inputs, ['futureAdditions'])
    };

    return analysis;
  }

  analyzePresentations(inputs) {
    if (inputs.length === 0) return null;

    const analysis = {
      journeyInsights: this.extractCommonThemes(inputs, ['journey']),
      impactMeasurement: this.extractCommonThemes(inputs, ['impact'])
    };

    return analysis;
  }

  generateOverview(sectionInputs) {
    return {
      totalBuilders: this.countUniqueBuilders(sectionInputs),
      completionRates: this.calculateSectionCompletionRates(sectionInputs),
      commonPatterns: this.identifyCommonPatterns(sectionInputs),
      keyInsights: this.generateKeyInsights(sectionInputs),
      recommendations: this.generateRecommendations(sectionInputs)
    };
  }

  // Helper methods for pattern extraction and analysis
  extractCommonThemes(inputs, fields) {
    const themes = {};
    
    inputs.forEach(input => {
      fields.forEach(field => {
        const text = input[field]?.toLowerCase() || '';
        const words = text.split(/\W+/).filter(w => w.length > 3);
        
        words.forEach(word => {
          themes[word] = (themes[word] || 0) + 1;
        });
      });
    });

    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));
  }

  assessComplexity(inputs) {
    return inputs.map(input => {
      const textLength = JSON.stringify(input).length;
      const hasMultipleComponents = input.rootCauses?.includes(',') || false;
      const hasDetailedContext = (input.context?.length || 0) > 200;
      
      return {
        level: this.calculateComplexityLevel(textLength, hasMultipleComponents, hasDetailedContext),
        factors: { textLength, hasMultipleComponents, hasDetailedContext }
      };
    });
  }

  calculateComplexityLevel(textLength, hasMultipleComponents, hasDetailedContext) {
    let score = 0;
    if (textLength > 500) score += 2;
    else if (textLength > 200) score += 1;
    if (hasMultipleComponents) score += 1;
    if (hasDetailedContext) score += 1;
    return ['Low', 'Medium', 'High', 'Very High'][Math.min(score, 3)];
  }

  countUniqueBuilders(sectionInputs) {
    const uniqueBuilders = new Set();
    
    // Handle the case where inputs might not have session_id directly
    Object.values(sectionInputs).forEach(inputs => {
      if (inputs && inputs.length > 0) {
        // If we have session_id directly on the input
        if (inputs[0].session_id) {
          inputs.forEach(input => uniqueBuilders.add(input.session_id));
        } else {
          // Just count the number of unique entries
          uniqueBuilders.add(inputs.length);
        }
      }
    });
    
    // If we didn't find any session_ids, return the count of sections that have data
    return uniqueBuilders.size > 0 ? uniqueBuilders.size : Object.keys(sectionInputs).length;
  }

  calculateSectionCompletionRates(sectionInputs) {
    const totalSections = this.sectionOrder.length;
    const sectionCounts = {};
    
    this.sectionOrder.forEach(section => {
      sectionCounts[section] = (sectionInputs[section] || []).length;
    });
    
    const maxCount = Math.max(...Object.values(sectionCounts), 1);
    
    return Object.fromEntries(
      Object.entries(sectionCounts).map(([section, count]) => [
        section,
        count / maxCount
      ])
    );
  }

  identifyCommonPatterns(sectionInputs) {
    // Analyze patterns across sections
    const patterns = {};
    
    Object.entries(sectionInputs).forEach(([section, inputs]) => {
      if (inputs && inputs.length > 0) {
        const fields = Object.keys(inputs[0] || {}).filter(k => typeof inputs[0][k] === 'string');
        const themes = this.extractCommonThemes(inputs, fields);
        patterns[section] = themes.slice(0, 5); // Top 5 themes per section
      }
    });

    return patterns;
  }

  generateKeyInsights(sectionInputs) {
    const insights = [];
    
    // Calculate completion funnel
    const completionCounts = this.sectionOrder.map(section => ({
      section,
      count: (sectionInputs[section] || []).length
    }));
    
    const maxCount = Math.max(...completionCounts.map(item => item.count), 1);
    
    const funnel = completionCounts.map(item => ({
      ...item,
      rate: ((item.count / maxCount) * 100).toFixed(1)
    }));

    insights.push({
      type: 'completion_funnel',
      data: funnel,
      summary: `${funnel[funnel.length - 1].rate}% completion rate through all sections`
    });

    return insights;
  }

  generateRecommendations(sectionInputs) {
    const recommendations = [];
    const completionRates = this.calculateSectionCompletionRates(sectionInputs);

    // Find sections with low completion rates
    Object.entries(completionRates)
      .filter(([, rate]) => rate < 0.5)
      .forEach(([section]) => {
        recommendations.push({
          section,
          type: 'completion',
          suggestion: `Consider reviewing ${section} content and support materials`
        });
      });

    return recommendations;
  }

  async generateBuilderSummary(builder) {
    try {
      const sections = builder.sections;
      const summary = [];

      // What they did
      if (sections['Problem Definition'] && sections['MVP Planner']) {
        summary.push(`The builder tackled ${sections['Problem Definition'].summary} and developed a solution involving ${sections['MVP Planner'].howItWorks}.`);
      }

      // What they learned
      if (sections['Give & Get Feedback']) {
        summary.push(`Through feedback, they learned ${sections['Give & Get Feedback'].capture}.`);
      }

      // What they tried
      if (sections['Start Build']) {
        summary.push(`They experimented with ${sections['Start Build'].whatBuilt} and utilized AI to ${sections['Start Build'].aiHelp}.`);
      }

      // What they took away
      if (sections['Presentations & Retro']) {
        summary.push(`Their key takeaway was ${sections['Presentations & Retro'].impact}.`);
      }

      // If any section is missing, provide a generic summary
      while (summary.length < 4) {
        summary.push("This section was not completed.");
      }

      return {
        summary: summary.join(' '),
        isAIGenerated: this.detectAIGenerated(sections)
      };
    } catch (error) {
      console.error('Error generating builder summary:', error);
      return {
        summary: "Unable to generate summary due to an error.",
        isAIGenerated: false
      };
    }
  }

  detectAIGenerated(sections) {
    // Patterns that might indicate AI-generated content
    const aiPatterns = [
      /\b(furthermore|moreover|additionally|consequently)\b/gi,
      /\b(optimal|utilize|leverage|facilitate)\b/gi,
      /\b(in conclusion|to summarize|in summary)\b/gi,
      /\b(implementation|methodology|framework)\b/gi
    ];

    let aiScore = 0;
    let totalChecks = 0;

    // Check each section's text content
    Object.values(sections).forEach(section => {
      if (!section) return;

      const text = JSON.stringify(section).toLowerCase();
      
      // Check for AI patterns
      aiPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          aiScore++;
        }
        totalChecks++;
      });

      // Check for unusually perfect formatting
      if (text.includes('...') || text.includes('etc.')) {
        aiScore++;
        totalChecks++;
      }

      // Check for overly formal language
      if (/\b(shall|ought|whereby|thereof)\b/gi.test(text)) {
        aiScore++;
        totalChecks++;
      }
    });

    // Calculate the AI probability score (0-1)
    const aiProbability = totalChecks > 0 ? aiScore / totalChecks : 0;

    // Return true if the AI probability is above 0.6 (60%)
    return aiProbability > 0.6;
  }
}

export const builderInputAnalysis = new BuilderInputAnalysis();
