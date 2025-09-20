import { OpenAI } from 'openai';

export class LearningPathRecommender {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.bitcoinCurriculum = {
      beginner: [
        'what-is-bitcoin',
        'digital-signatures',
        'transactions-basics',
        'wallets-and-keys',
        'bitcoin-network'
      ],
      intermediate: [
        'mining-and-consensus',
        'script-language',
        'lightning-network',
        'privacy-concepts',
        'economic-incentives'
      ],
      advanced: [
        'taproot-upgrade',
        'layer-2-solutions',
        'bitcoin-development',
        'security-analysis',
        'protocol-governance'
      ],
      expert: [
        'core-development',
        'research-frontiers',
        'cryptographic-proofs',
        'consensus-improvements',
        'scaling-solutions'
      ]
    };

    this.stacksCurriculum = {
      beginner: [
        'stacks-overview',
        'clarity-basics',
        'smart-contracts-intro',
        'wallet-integration',
        'simple-dapp'
      ],
      intermediate: [
        'advanced-clarity',
        'nft-development',
        'defi-protocols',
        'testing-contracts',
        'deployment-strategies'
      ],
      advanced: [
        'complex-defi',
        'cross-chain-interactions',
        'performance-optimization',
        'security-auditing',
        'governance-systems'
      ]
    };
  }

  async recommendNextContent(studentId, currentTopic, difficulty) {
    try {
      const studentProfile = await this.getStudentProfile(studentId);
      const contextualRecommendations = await this.generateContextualRecommendations(
        currentTopic, 
        difficulty, 
        studentProfile
      );

      return {
        nextTopics: this.getSequentialTopics(currentTopic, difficulty),
        contextualContent: contextualRecommendations,
        adaptiveExercises: await this.generateAdaptiveExercises(currentTopic, studentProfile),
        estimatedTime: this.estimateCompletionTime(currentTopic, studentProfile.learningSpeed)
      };
    } catch (error) {
      throw new Error(`Content recommendation failed: ${error.message}`);
    }
  }

  getSequentialTopics(currentTopic, difficulty) {
    const curriculum = this.bitcoinCurriculum[difficulty] || this.bitcoinCurriculum.beginner;
    const currentIndex = curriculum.indexOf(currentTopic);
    
    if (currentIndex === -1) return curriculum.slice(0, 3);
    
    return {
      current: currentTopic,
      next: curriculum[currentIndex + 1] || null,
      upcoming: curriculum.slice(currentIndex + 1, currentIndex + 4),
      prerequisites: curriculum.slice(Math.max(0, currentIndex - 2), currentIndex)
    };
  }

  async generateContextualRecommendations(topic, difficulty, profile) {
    const prompt = `
    Generate personalized learning recommendations for a ${difficulty} level student studying "${topic}" in blockchain/Bitcoin education.
    
    Student profile: ${JSON.stringify(profile)}
    
    Provide specific recommendations for:
    1. Supplementary readings
    2. Practical exercises 
    3. Real-world examples
    4. Interactive simulations
    5. Assessment questions
    
    Focus on Stacks ecosystem integration and hands-on Bitcoin concepts.
    Return as JSON with structured recommendations.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async generateAdaptiveExercises(topic, profile) {
    const exercises = [];
    const exerciseTypes = this.selectExerciseTypes(profile.learningStyle);
    
    for (const type of exerciseTypes) {
      const prompt = `
      Create a ${type} exercise for learning "${topic}" in blockchain education.
      Difficulty should match student's level: ${profile.currentLevel}
      Learning style preference: ${profile.learningStyle}
      
      Include: instructions, expected outcome, hints, assessment criteria.
      Make it practical and hands-on with Stacks/Bitcoin examples.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      exercises.push({
        type,
        content: response.choices[0].message.content,
        estimatedTime: this.getExerciseTime(type),
        difficulty: profile.currentLevel
      });
    }

    return exercises;
  }

  selectExerciseTypes(learningStyle) {
    const typeMap = {
      'visual': ['diagram-creation', 'flowchart-analysis', 'visual-simulation'],
      'auditory': ['podcast-analysis', 'discussion-questions', 'verbal-explanation'],
      'kinesthetic': ['hands-on-coding', 'interactive-demo', 'practical-project'],
      'reading-writing': ['technical-writing', 'code-review', 'documentation-analysis']
    };

    return typeMap[learningStyle] || typeMap['kinesthetic'];
  }

  async getStudentProfile(studentId) {
    return {
      learningStyle: 'kinesthetic',
      currentLevel: 'intermediate',
      learningSpeed: 1.2,
      preferredTopics: ['smart-contracts', 'defi'],
      weakAreas: ['cryptography', 'consensus'],
      strongAreas: ['programming', 'economics']
    };
  }

  estimateCompletionTime(topic, learningSpeed) {
    const baseTimes = {
      'bitcoin-basics': 120,
      'smart-contracts': 180,
      'defi-concepts': 150,
      'stacks-development': 240
    };

    const baseTime = baseTimes[topic] || 150;
    return Math.ceil(baseTime / learningSpeed);
  }

  getExerciseTime(type) {
    const times = {
      'hands-on-coding': 45,
      'diagram-creation': 30,
      'discussion-questions': 20,
      'technical-writing': 35,
      'interactive-demo': 25
    };

    return times[type] || 30;
  }
}