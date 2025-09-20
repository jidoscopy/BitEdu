export class ProgressAnalyzer {
  constructor() {
    this.analyticsThresholds = {
      excellentProgress: 0.9,
      goodProgress: 0.7,
      averageProgress: 0.5,
      needsImprovement: 0.3
    };
  }

  async analyzeProgress(studentId, courseId, activityData) {
    try {
      const progressMetrics = this.calculateProgressMetrics(activityData);
      const learningPatterns = this.identifyLearningPatterns(activityData);
      const recommendations = await this.generateProgressRecommendations(progressMetrics, learningPatterns);
      const predictions = this.predictFuturePerformance(progressMetrics, learningPatterns);

      return {
        studentId,
        courseId,
        currentProgress: progressMetrics,
        learningPatterns,
        recommendations,
        predictions,
        riskFactors: this.identifyRiskFactors(progressMetrics, learningPatterns),
        interventions: this.suggestInterventions(progressMetrics)
      };
    } catch (error) {
      throw new Error(`Progress analysis failed: ${error.message}`);
    }
  }

  calculateProgressMetrics(activityData) {
    const totalModules = activityData.totalModules || 1;
    const completedModules = activityData.completedModules || 0;
    const totalTime = activityData.totalTimeSpent || 0;
    const assessmentScores = activityData.assessmentScores || [];

    const completionRate = completedModules / totalModules;
    const averageScore = assessmentScores.length > 0 
      ? assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length 
      : 0;

    const timeEfficiency = this.calculateTimeEfficiency(totalTime, completedModules);
    const consistencyScore = this.calculateConsistency(activityData.dailyActivity || []);

    return {
      completionRate,
      averageScore,
      timeEfficiency,
      consistencyScore,
      engagementLevel: this.calculateEngagement(activityData),
      difficultyAdaptation: this.analyzeDifficultyProgression(assessmentScores)
    };
  }

  identifyLearningPatterns(activityData) {
    const patterns = {
      peakPerformanceTimes: this.findPeakTimes(activityData.timeBasedPerformance || []),
      learningVelocity: this.calculateLearningVelocity(activityData),
      contentPreferences: this.analyzeContentPreferences(activityData.contentInteractions || []),
      strugglePoints: this.identifyStrugglePoints(activityData),
      breakthroughMoments: this.identifyBreakthroughs(activityData)
    };

    return patterns;
  }

  async generateProgressRecommendations(metrics, patterns) {
    const recommendations = [];

    if (metrics.completionRate < this.analyticsThresholds.averageProgress) {
      recommendations.push({
        type: 'pacing',
        message: 'Consider reducing daily study load and focusing on consistency',
        priority: 'high'
      });
    }

    if (metrics.averageScore < 70) {
      recommendations.push({
        type: 'content',
        message: 'Review fundamental concepts before advancing',
        priority: 'high'
      });
    }

    if (metrics.consistencyScore < 0.6) {
      recommendations.push({
        type: 'schedule',
        message: 'Establish a regular study schedule for better retention',
        priority: 'medium'
      });
    }

    if (patterns.peakPerformanceTimes.length > 0) {
      recommendations.push({
        type: 'timing',
        message: `Schedule challenging content during peak hours: ${patterns.peakPerformanceTimes.join(', ')}`,
        priority: 'low'
      });
    }

    return recommendations;
  }

  predictFuturePerformance(metrics, patterns) {
    const trend = this.calculateTrend(metrics);
    const velocity = patterns.learningVelocity;

    return {
      expectedCompletionDate: this.projectCompletionDate(metrics.completionRate, velocity),
      riskOfDropout: this.calculateDropoutRisk(metrics, patterns),
      projectedFinalScore: this.projectFinalScore(metrics.averageScore, trend),
      confidenceInterval: this.calculateConfidenceInterval(metrics)
    };
  }

  identifyRiskFactors(metrics, patterns) {
    const risks = [];

    if (metrics.completionRate < 0.3) {
      risks.push({ factor: 'low-completion', severity: 'high' });
    }

    if (metrics.consistencyScore < 0.4) {
      risks.push({ factor: 'inconsistent-study', severity: 'medium' });
    }

    if (patterns.strugglePoints.length > 3) {
      risks.push({ factor: 'multiple-struggle-points', severity: 'medium' });
    }

    return risks;
  }

  suggestInterventions(metrics) {
    const interventions = [];

    if (metrics.completionRate < 0.5) {
      interventions.push({
        type: 'content-simplification',
        description: 'Provide additional foundational content',
        urgency: 'immediate'
      });
    }

    if (metrics.engagementLevel < 0.6) {
      interventions.push({
        type: 'gamification',
        description: 'Increase interactive elements and rewards',
        urgency: 'soon'
      });
    }

    return interventions;
  }

  calculateTimeEfficiency(totalTime, completedModules) {
    if (completedModules === 0) return 0;
    const averageTimePerModule = totalTime / completedModules;
    const expectedTime = 120; // minutes per module
    return Math.min(1, expectedTime / averageTimePerModule);
  }

  calculateConsistency(dailyActivity) {
    if (dailyActivity.length === 0) return 0;
    const activeDays = dailyActivity.filter(day => day > 0).length;
    return activeDays / dailyActivity.length;
  }

  calculateEngagement(activityData) {
    const interactions = activityData.totalInteractions || 0;
    const timeSpent = activityData.totalTimeSpent || 1;
    const engagementRate = interactions / (timeSpent / 60); // interactions per hour
    return Math.min(1, engagementRate / 50); // normalize to 50 interactions/hour
  }

  analyzeDifficultyProgression(scores) {
    if (scores.length < 3) return 'insufficient-data';
    
    const recentScores = scores.slice(-5);
    const trend = this.calculateTrend({ averageScore: recentScores.reduce((a, b) => a + b) / recentScores.length });
    
    if (trend > 0.1) return 'improving';
    if (trend < -0.1) return 'declining';
    return 'stable';
  }

  findPeakTimes(timeBasedPerformance) {
    return timeBasedPerformance
      .filter(slot => slot.performance > 0.8)
      .map(slot => slot.timeSlot)
      .slice(0, 3);
  }

  calculateLearningVelocity(activityData) {
    const timeSpent = activityData.totalTimeSpent || 1;
    const conceptsMastered = activityData.conceptsMastered || 0;
    return conceptsMastered / (timeSpent / 60); // concepts per hour
  }

  analyzeContentPreferences(interactions) {
    const preferences = {};
    interactions.forEach(interaction => {
      preferences[interaction.contentType] = (preferences[interaction.contentType] || 0) + interaction.engagementScore;
    });

    return Object.entries(preferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  identifyStrugglePoints(activityData) {
    const struggles = activityData.topicScores || {};
    return Object.entries(struggles)
      .filter(([, score]) => score < 0.6)
      .map(([topic]) => topic);
  }

  identifyBreakthroughs(activityData) {
    const improvements = activityData.scoreImprovements || {};
    return Object.entries(improvements)
      .filter(([, improvement]) => improvement > 0.3)
      .map(([topic, improvement]) => ({ topic, improvement }));
  }

  calculateTrend(metrics) {
    return (metrics.averageScore - 50) / 50; // normalized trend
  }

  projectCompletionDate(currentProgress, velocity) {
    const remainingProgress = 1 - currentProgress;
    const daysRemaining = remainingProgress / (velocity * 0.1); // velocity per day estimate
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.ceil(daysRemaining));
    return completionDate.toISOString().split('T')[0];
  }

  calculateDropoutRisk(metrics, patterns) {
    let riskScore = 0;
    
    if (metrics.completionRate < 0.3) riskScore += 0.4;
    if (metrics.consistencyScore < 0.5) riskScore += 0.3;
    if (patterns.strugglePoints.length > 2) riskScore += 0.2;
    if (metrics.engagementLevel < 0.4) riskScore += 0.1;

    return Math.min(1, riskScore);
  }

  projectFinalScore(currentAverage, trend) {
    return Math.max(0, Math.min(100, currentAverage + (trend * 20)));
  }

  calculateConfidenceInterval(metrics) {
    const sampleSize = metrics.assessmentCount || 1;
    const variance = metrics.scoreVariance || 100;
    const margin = 1.96 * Math.sqrt(variance / sampleSize);
    
    return {
      lower: Math.max(0, metrics.averageScore - margin),
      upper: Math.min(100, metrics.averageScore + margin)
    };
  }
}