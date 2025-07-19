import { MCPPrompt } from '../types/index.js';

/**
 * Data analysis and insight prompts for Live Conditions MCP integration
 */
export const dataPrompts = {
  list(): MCPPrompt[] {
    return [
      {
        name: 'analyze_conditions',
        description: 'Analyze current conditions for a location and provide insights',
        arguments: [
          {
            name: 'location',
            description: 'Location name or coordinates to analyze',
            required: true,
          },
          {
            name: 'focus',
            description: 'Analysis focus area',
            required: false,
          },
          {
            name: 'timeframe',
            description: 'Timeframe for analysis (current, short-term, long-term)',
            required: false,
          },
        ],
      },
      {
        name: 'safety_assessment',
        description: 'Assess safety conditions for outdoor activities',
        arguments: [
          {
            name: 'activity',
            description: 'Type of outdoor activity (surfing, hiking, sailing, etc.)',
            required: true,
          },
          {
            name: 'location',
            description: 'Location for the activity',
            required: true,
          },
          {
            name: 'experience_level',
            description: 'User experience level (beginner, intermediate, advanced)',
            required: false,
          },
        ],
      },
      {
        name: 'travel_planning',
        description: 'Generate travel recommendations based on weather and conditions',
        arguments: [
          {
            name: 'origin',
            description: 'Starting location',
            required: true,
          },
          {
            name: 'destination',
            description: 'Destination location',
            required: true,
          },
          {
            name: 'travel_date',
            description: 'Planned travel date',
            required: false,
          },
          {
            name: 'transport_mode',
            description: 'Mode of transport (driving, flying, ferry)',
            required: false,
          },
        ],
      },
      {
        name: 'emergency_brief',
        description: 'Generate emergency situation briefing and recommendations',
        arguments: [
          {
            name: 'alert_type',
            description: 'Type of emergency alert',
            required: true,
          },
          {
            name: 'location',
            description: 'Affected location or region',
            required: true,
          },
          {
            name: 'user_type',
            description: 'User type (resident, visitor, emergency_responder)',
            required: false,
          },
        ],
      },
      {
        name: 'marine_forecast',
        description: 'Generate detailed marine forecast and surf recommendations',
        arguments: [
          {
            name: 'beach_location',
            description: 'Beach or coastal location',
            required: true,
          },
          {
            name: 'activity_type',
            description: 'Marine activity (surfing, swimming, boating, fishing)',
            required: true,
          },
          {
            name: 'forecast_period',
            description: 'Forecast period (today, tomorrow, weekend, week)',
            required: false,
          },
        ],
      },
      {
        name: 'data_summary',
        description: 'Create executive summary of conditions across multiple locations',
        arguments: [
          {
            name: 'regions',
            description: 'Comma-separated list of regions to include',
            required: true,
          },
          {
            name: 'summary_type',
            description: 'Type of summary (executive, technical, public)',
            required: false,
          },
          {
            name: 'highlight_alerts',
            description: 'Whether to highlight emergency alerts',
            required: false,
          },
        ],
      },
    ];
  },

  async get(name: string, args?: { [key: string]: string }): Promise<{ description?: string; messages: Array<{ role: string; content: { type: string; text: string } }> }> {
    switch (name) {
      case 'analyze_conditions':
        return this.getAnalyzeConditionsPrompt(args);
      case 'safety_assessment':
        return this.getSafetyAssessmentPrompt(args);
      case 'travel_planning':
        return this.getTravelPlanningPrompt(args);
      case 'emergency_brief':
        return this.getEmergencyBriefPrompt(args);
      case 'marine_forecast':
        return this.getMarineForecastPrompt(args);
      case 'data_summary':
        return this.getDataSummaryPrompt(args);
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  },

  async getAnalyzeConditionsPrompt(args?: { [key: string]: string }) {
    const location = args?.location || 'specified location';
    const focus = args?.focus || 'general conditions';
    const timeframe = args?.timeframe || 'current';

    return {
      description: `Analyze ${timeframe} conditions for ${location} with focus on ${focus}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze the ${timeframe} conditions for ${location}. 

Focus areas: ${focus}

Provide a comprehensive analysis including:
1. Current weather conditions and trends
2. Marine conditions (if coastal location)
3. Traffic and accessibility considerations
4. Any active alerts or warnings
5. Recommendations for activities and precautions
6. Short-term outlook and expected changes

Use data from the Live Conditions API to provide accurate, real-time information. Consider both current conditions and any developing weather patterns or emergency situations.

Format the response in a clear, actionable manner suitable for both general public and professional use.`,
          },
        },
      ],
    };
  },

  async getSafetyAssessmentPrompt(args?: { [key: string]: string }) {
    const activity = args?.activity || 'outdoor activity';
    const location = args?.location || 'specified location';
    const experienceLevel = args?.experience_level || 'intermediate';

    return {
      description: `Safety assessment for ${activity} at ${location} (${experienceLevel} level)`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Conduct a comprehensive safety assessment for ${activity} at ${location} for a ${experienceLevel} level participant.

Assessment requirements:
1. Current weather conditions and suitability for the activity
2. Marine conditions (if water-based activity)
3. Terrain and environmental hazards
4. Equipment recommendations based on conditions
5. Emergency preparedness considerations
6. Alternative locations or timing if conditions are unsuitable
7. Risk level rating (Low/Moderate/High/Extreme)

Consider the participant's ${experienceLevel} experience level when providing recommendations. Include specific safety protocols and decision-making guidelines.

Use real-time data from weather, marine, and alert systems to ensure accuracy. Prioritize safety while providing practical, actionable advice.`,
          },
        },
      ],
    };
  },

  async getTravelPlanningPrompt(args?: { [key: string]: string }) {
    const origin = args?.origin || 'origin location';
    const destination = args?.destination || 'destination location';
    const travelDate = args?.travel_date || 'planned date';
    const transportMode = args?.transport_mode || 'driving';

    return {
      description: `Travel planning from ${origin} to ${destination} via ${transportMode}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create comprehensive travel recommendations for a journey from ${origin} to ${destination} on ${travelDate} using ${transportMode}.

Travel analysis should include:
1. Route conditions and traffic assessments
2. Weather conditions along the route and at destination
3. Any road closures, incidents, or construction delays
4. Optimal departure times to avoid traffic/weather issues
5. Alternative routes and contingency planning
6. Destination conditions upon arrival
7. Any active alerts affecting travel

For maritime travel, include:
- Marine forecasts and sea conditions
- Port conditions and accessibility
- Weather windows for safe crossing

For air travel, include:
- Airport weather conditions
- Potential delays due to weather
- Ground transportation considerations

Provide practical recommendations including suggested departure times, alternative routes, and what to expect at the destination. Consider both the journey and arrival conditions.`,
          },
        },
      ],
    };
  },

  async getEmergencyBriefPrompt(args?: { [key: string]: string }) {
    const alertType = args?.alert_type || 'emergency alert';
    const location = args?.location || 'affected area';
    const userType = args?.user_type || 'resident';

    return {
      description: `Emergency briefing for ${alertType} in ${location} (${userType} perspective)`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate an emergency situation briefing for the ${alertType} affecting ${location}, tailored for a ${userType}.

Emergency briefing should include:
1. Current situation summary and severity assessment
2. Immediate safety recommendations and actions
3. Evacuation procedures and routes (if applicable)
4. Areas to avoid and safe zones
5. Essential supplies and preparation requirements
6. Communication channels and official information sources
7. Expected duration and progression of the emergency
8. Recovery and post-emergency considerations

For ${userType} perspective, consider:
- Local knowledge requirements vs. visitor guidance
- Access to local resources and support networks
- Familiarity with emergency procedures
- Special considerations (families, elderly, pets, etc.)

Use real-time alert data, weather conditions, and traffic information to provide the most current and actionable guidance. Prioritize life safety while providing clear, step-by-step instructions.

Include official contact numbers and reliable information sources for ongoing updates.`,
          },
        },
      ],
    };
  },

  async getMarineForecastPrompt(args?: { [key: string]: string }) {
    const beachLocation = args?.beach_location || 'coastal location';
    const activityType = args?.activity_type || 'marine activity';
    const forecastPeriod = args?.forecast_period || 'today';

    return {
      description: `Marine forecast for ${activityType} at ${beachLocation} (${forecastPeriod})`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Provide a detailed marine forecast and recommendations for ${activityType} at ${beachLocation} for ${forecastPeriod}.

Marine forecast should include:
1. Wave conditions (height, period, direction)
2. Tide times and levels
3. Water temperature and comfort factors
4. Wind conditions and their impact on activities
5. Visibility and weather conditions
6. Marine warnings or hazards
7. Optimal timing for the activity
8. Equipment and safety recommendations

Activity-specific considerations for ${activityType}:
- Skill level requirements for current conditions
- Best times during the forecast period
- Alternative locations if conditions are poor
- Specific hazards or cautions for this activity

Include surf quality ratings for surfing, sea state assessments for boating, and safety zones for swimming. Consider both current conditions and evolving forecasts throughout the period.

Use real-time marine data, weather forecasts, and local knowledge to provide accurate, practical advice for marine activity planning.`,
          },
        },
      ],
    };
  },

  async getDataSummaryPrompt(args?: { [key: string]: string }) {
    const regions = args?.regions || 'Australia and New Zealand';
    const summaryType = args?.summary_type || 'executive';
    const highlightAlerts = args?.highlight_alerts || 'true';

    return {
      description: `${summaryType} conditions summary for ${regions}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a comprehensive ${summaryType} summary of current conditions across ${regions}.

Summary requirements:
1. Overview of weather patterns and significant conditions
2. Marine conditions summary for coastal areas
3. Traffic and transportation status
4. Active emergency alerts and warnings (if ${highlightAlerts} = true)
5. Regional variations and notable differences
6. Trending conditions and short-term outlook
7. Key impacts on activities and operations

For ${summaryType} format:
- Executive: High-level overview with key decision points
- Technical: Detailed data with specific measurements
- Public: Accessible language suitable for general audience

Structure the summary to highlight:
- Most significant current conditions
- Areas requiring attention or caution
- Opportunities for favorable conditions
- Recommended actions or preparations

Include regional breakdowns for major population centers and highlight any cross-regional patterns or systems affecting multiple areas.

Use current data from all available sources to ensure accuracy and relevance. Present information in a format suitable for briefings, reports, or public communications.`,
          },
        },
      ],
    };
  },
};