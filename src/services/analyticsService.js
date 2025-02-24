import { supabase } from '../supabaseClient';

class AnalyticsService {
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

  async getBuilderData(filters = {}) {
    const {
      startDate,
      endDate,
      filterCompleted = false
    } = filters;

    try {
      // Query user inputs
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

      const { data: inputs, error } = await query;
      if (error) throw error;

      // Group by session
      const sessions = this.groupBySession(inputs);
      
      // Apply filters
      const filteredSessions = filterCompleted
        ? sessions.filter(s => s.progress.completed === s.progress.total)
        : sessions;

      // Calculate metrics
      const metrics = this.calculateMetrics(filteredSessions);

      return {
        sessions: filteredSessions,
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching builder data:', error);
      throw new Error('Failed to fetch builder data');
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

  calculateMetrics(sessions) {
    const metrics = {
      totalBuilders: sessions.length,
      completionRate: 0,
      averageTimePerSection: {},
      sectionCompletionRates: {},
      dropoffPoints: {},
      averageSessionDuration: 0
    };

    if (sessions.length === 0) {
      return metrics;
    }

    // Calculate completion rate
    const completedSessions = sessions.filter(
      s => s.progress.completed === s.progress.total
    );
    metrics.completionRate = completedSessions.length / sessions.length;

    // Calculate section metrics
    this.sectionOrder.forEach((section, index) => {
      const sessionsWithSection = sessions.filter(
        s => s.sections[section]
      );

      // Completion rate per section
      metrics.sectionCompletionRates[section] = 
        sessionsWithSection.length / sessions.length;

      // Calculate dropoff points
      if (index > 0) {
        const prevSection = this.sectionOrder[index - 1];
        const prevSessions = sessions.filter(
          s => s.sections[prevSection]
        );
        const dropoff = prevSessions.length - sessionsWithSection.length;
        if (dropoff > 0) {
          metrics.dropoffPoints[section] = dropoff / prevSessions.length;
        }
      }

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

    // Calculate average session duration
    const sessionDurations = sessions.map(session => {
      const times = session.timeline.map(t => new Date(t.timestamp).getTime());
      return Math.max(...times) - Math.min(...times);
    });

    metrics.averageSessionDuration = 
      sessionDurations.reduce((a, b) => a + b, 0) / sessions.length;

    return metrics;
  }

  getEngagementScore(session) {
    let score = 0;
    const maxScore = this.sectionOrder.length * 3; // 3 points per section

    this.sectionOrder.forEach(section => {
      const data = session.sections[section];
      if (data) {
        // 1 point for completing the section
        score += 1;

        // Additional points for detailed responses
        const responseLength = JSON.stringify(data).length;
        if (responseLength > 500) score += 2;
        else if (responseLength > 200) score += 1;
      }
    });

    return score / maxScore; // Normalize to 0-1
  }
}

export const analyticsService = new AnalyticsService();