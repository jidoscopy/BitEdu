import { OpenAI } from 'openai';
import * as tf from '@tensorflow/tfjs-node';
import { LearningStyleClassifier } from '../models/learningStyleModel.js';
import { DifficultyPredictor } from '../models/difficultyModel.js';

export class PersonalizationEngine {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.learningStyleClassifier = new LearningStyleClassifier();
    this.difficultyPredictor = new DifficultyPredictor();
  }

  async generatePersonalizedPath(studentId, learningHistory, preferences) {
    try {
      const learningStyle = await this.classifyLearningStyle(learningHistory);
      const recommendedDifficulty = await this.predictOptimalDifficulty(studentId, learningHistory);
      const knowledgeGaps = await this.identifyKnowledgeGaps(learningHistory);
      
      const personalizedPath = {
        studentId,
        learningStyle,
        recommendedDifficulty,
        knowledgeGaps,
        customizedModules: await this.generateCustomModules(learningStyle, knowledgeGaps),
        estimatedCompletionTime: this.calculateEstimatedTime(recommendedDifficulty, preferences.availableTime),
        adaptiveSchedule: this.createAdaptiveSchedule(preferences.availableTime, learningStyle)
      };

      return personalizedPath;
    } catch (error) {
      throw new Error(`Personalization failed: ${error.message}`);
    }
  }

  async classifyLearningStyle(learningHistory) {
    const features = this.extractLearningFeatures(learningHistory);
    const prediction = await this.learningStyleClassifier.predict(features);
    
    return {
      primary: this.mapToLearningStyle(prediction[0]),
      secondary: this.mapToLearningStyle(prediction[1]),
      confidence: prediction[2]
    };
  }

  async predictOptimalDifficulty(studentId, learningHistory) {
    const performanceMetrics = this.extractPerformanceMetrics(learningHistory);
    const difficultyScore = await this.difficultyPredictor.predict(performanceMetrics);
    
    return {
      level: this.mapToDifficultyLevel(difficultyScore),
      confidence: difficultyScore.confidence,
      adaptationRate: this.calculateAdaptationRate(performanceMetrics)
    };
  }

  async identifyKnowledgeGaps(learningHistory) {
    const prompt = `
    Analyze the following learning history for blockchain/Bitcoin education and identify knowledge gaps:
    ${JSON.stringify(learningHistory)}
    
    Identify specific areas where the student needs improvement and suggest targeted learning modules.
    Focus on: Bitcoin fundamentals, blockchain technology, cryptography, consensus mechanisms, 
    smart contracts, DeFi concepts, and Stacks ecosystem.
    
    Return response as JSON with: gaps (array), recommendations (array), priority (high/medium/low)
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async generateCustomModules(learningStyle, knowledgeGaps) {
    const modules = [];
    
    for (const gap of knowledgeGaps.gaps) {
      const modulePrompt = `
      Create a learning module for "${gap}" targeting ${learningStyle.primary} learning style.
      Include: content outline, interactive elements, practical exercises, assessment methods.
      Focus on blockchain/Bitcoin education with hands-on Stacks examples.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: modulePrompt }],
        temperature: 0.7
      });

      modules.push({
        topic: gap,
        content: response.choices[0].message.content,
        learningStyle: learningStyle.primary,
        estimatedTime: this.estimateModuleTime(gap)
      });
    }

    return modules;
  }

  async adaptDifficulty(studentId, currentPerformance) {
    const adaptationDecision = {
      currentLevel: currentPerformance.difficulty,
      recommendedChange: 'maintain',
      confidence: 0.8,
      reasoning: ''
    };

    if (currentPerformance.accuracy < 0.6) {
      adaptationDecision.recommendedChange = 'decrease';
      adaptationDecision.reasoning = 'Low accuracy suggests content is too difficult';
    } else if (currentPerformance.accuracy > 0.9 && currentPerformance.completionTime < 0.7) {
      adaptationDecision.recommendedChange = 'increase';
      adaptationDecision.reasoning = 'High accuracy and fast completion suggests ready for harder content';
    }

    return adaptationDecision;
  }

  extractLearningFeatures(history) {
    return {
      completionRates: history.completionRates || [],
      timeSpent: history.timeSpent || [],
      interactionPatterns: history.interactionPatterns || [],
      preferredContentTypes: history.preferredContentTypes || [],
      assessmentScores: history.assessmentScores || []
    };
  }

  extractPerformanceMetrics(history) {
    return {
      averageScore: history.averageScore || 0,
      completionRate: history.completionRate || 0,
      timeEfficiency: history.timeEfficiency || 0,
      strugglingTopics: history.strugglingTopics || [],
      strongTopics: history.strongTopics || []
    };
  }

  mapToLearningStyle(styleCode) {
    const styles = {
      0: 'visual',
      1: 'auditory', 
      2: 'kinesthetic',
      3: 'reading-writing'
    };
    return styles[styleCode] || 'mixed';
  }

  mapToDifficultyLevel(score) {
    if (score < 0.3) return 'beginner';
    if (score < 0.6) return 'intermediate';
    if (score < 0.8) return 'advanced';
    return 'expert';
  }

  calculateAdaptationRate(metrics) {
    return Math.min(0.2, Math.max(0.05, metrics.completionRate * 0.15));
  }

  calculateEstimatedTime(difficulty, availableTime) {
    const baseHours = {
      'beginner': 40,
      'intermediate': 60,
      'advanced': 80,
      'expert': 100
    };
    
    const hoursNeeded = baseHours[difficulty.level] || 60;
    const weeksNeeded = Math.ceil(hoursNeeded / availableTime);
    
    return {
      totalHours: hoursNeeded,
      estimatedWeeks: weeksNeeded,
      dailyCommitment: availableTime
    };
  }

  createAdaptiveSchedule(availableTime, learningStyle) {
    const schedule = {
      sessionsPerWeek: Math.min(7, Math.ceil(availableTime / 2)),
      sessionDuration: Math.min(120, availableTime * 60),
      breakFrequency: learningStyle.primary === 'kinesthetic' ? 15 : 30,
      reviewSessions: 2
    };

    return schedule;
  }

  estimateModuleTime(topic) {
    const timeMap = {
      'bitcoin-basics': 180,
      'blockchain-fundamentals': 240,
      'cryptography': 300,
      'smart-contracts': 360,
      'stacks-ecosystem': 240,
      'defi-concepts': 300
    };
    
    return timeMap[topic] || 240;
  }
}