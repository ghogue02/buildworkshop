import { supabase } from '../supabaseClient';
import { openaiService } from './openaiService';

class DataAggregationService {
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

  async aggregateBuilderData(options = {}) {
    const {
      startDate,
      endDate,
      filterCompleted = false,
      problemCategories = [],
      limit
    } = options;

    try {
      let query = supabase
        .from('user_inputs')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data: inputs, error } = await query;
      if (error) throw error;

      // Group by session_id
      const builderSessions = this.groupBySession(inputs);
      
      // Apply filters
      const filteredSessions = this.filterSessions(
        builderSessions,
        filterCompleted,
        problemCategories
      );

      // Calculate metrics
      const metrics = this.calculateMetrics(filteredSessions);

      return {
        sessions: filteredSessions,
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error aggregating builder data:', error);
      throw new Error('Failed to aggregate builder data');
    }
  }

  groupBySession(inputs) {
    const sessions = {};
    
    inputs.forEach(input => {
      if (!sessions[input.session_id]) {
        sessions[input.session_id] = {
          sessionId: input.session_id,
          sections: {},
          progress: {
            total: this.sectionOrder.length,
            completed: 0
          },
          timeline: [],
          lastUpdate: null
        };
      }

      const session = sessions[input.session_id];
      session.sections[input.section_name] = input.input_data;
      session.timeline.push({
        section: input.section_name,
        timestamp: input.created_at
      });
      
      // Update progress
      session.progress.completed = Object.keys(session.sections).length;
      
      // Update last activity
      const inputDate = new Date(input.created_at);
      if (!session.lastUpdate || inputDate > new Date(session.lastUpdate)) {
        session.lastUpdate = input.created_at;
      }
    });

    return Object.values(sessions);
  }

  filterSessions(sessions, filterCompleted, problemCategories) {
    return sessions.filter(session => {
      // Filter by completion status
      if (filterCompleted && session.progress.completed !== session.progress.total) {
        return false;
      }

      // Filter by problem categories if specified
      if (problemCategories.length > 0 && session.sections['Problem Definition']) {
        const problemData = session.sections['Problem Definition'];
        // Assume problem categories are tagged in the problem definition
        return problemCategories.some(category =>
          problemData.summary?.toLowerCase().includes(category.toLowerCase()) ||
          problemData.context?.toLowerCase().includes(category.toLowerCase())
        );
      }

      return true;
    });
  }

  calculateMetrics(sessions) {
    const metrics = {
      totalBuilders: sessions.length,
      completionRate: 0,
      averageTimePerSection: {},
      sectionCompletionRates: {},
      commonChallenges: {},
      successPatterns: {}
    };

    // Calculate completion rate
    const completedSessions = sessions.filter(
      s => s.progress.completed === s.progress.total
    );
    metrics.completionRate = sessions.length > 0
      ? completedSessions.length / sessions.length
      : 0;

    // Calculate section metrics
    this.sectionOrder.forEach(section => {
      const sessionsWithSection = sessions.filter(
        s => s.sections[section]
      );

      // Completion rate per section
      metrics.sectionCompletionRates[section] = sessions.length > 0
        ? sessionsWithSection.length / sessions.length
        : 0;

      // Average time calculation
      const times = [];
      sessions.forEach(session => {
        const sectionEvents = session.timeline.filter(
          t => t.section === section
        );
        if (sectionEvents.length > 0) {
          const start = new Date(sectionEvents[0].timestamp);
          const end = new Date(sectionEvents[sectionEvents.length - 1].timestamp);
          times.push(end - start);
        }
      });

      metrics.averageTimePerSection[section] = times.length > 0
        ? times.reduce((a, b) => a + b, 0) / times.length
        : 0;
    });

    return metrics;
  }

  async generateReport(options = {}) {
    try {
      // Check cache first
      const cacheKey = JSON.stringify(options);
      const { data: cachedReport } = await supabase
        .from('report_cache')
        .select('*')
        .eq('report_type', 'builder_analysis')
        .eq('parameters', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cachedReport) {
        return cachedReport.report_data;
      }

      // Aggregate fresh data
      const aggregatedData = await this.aggregateBuilderData(options);
      
      // Get AI analysis
      const analysis = await openaiService.analyzeBuilderData(aggregatedData);
      
      // Generate summary
      const summary = await openaiService.generateSummaryReport(analysis);
      
      // Get improvement suggestions
      const improvements = await openaiService.suggestImprovements(aggregatedData);

      // Compile full report
      const report = {
        metadata: {
          generated_at: new Date().toISOString(),
          options,
          data_points: aggregatedData.sessions.length
        },
        metrics: aggregatedData.metrics,
        analysis,
        summary,
        improvements
      };

      // Cache the report
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

      await supabase
        .from('report_cache')
        .insert({
          report_type: 'builder_analysis',
          parameters: cacheKey,
          report_data: report,
          expires_at: expiresAt.toISOString()
        });

      // Store analysis results
      await supabase
        .from('analysis_results')
        .insert({
          analysis_type: 'builder_progress',
          input_data: aggregatedData,
          insights: analysis,
          confidence_score: analysis.confidence_score,
          session_ids: aggregatedData.sessions.map(s => s.sessionId)
        });

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate builder analysis report');
    }
  }
}

export const dataAggregationService = new DataAggregationService();