import * as tf from '@tensorflow/tfjs-node';

export class DifficultyPredictor {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.scaler = {
      mean: [0.5, 0.7, 0.6, 0.8, 0.4],
      std: [0.2, 0.15, 0.25, 0.1, 0.3]
    };
  }

  async loadModel() {
    if (this.isLoaded) return;

    try {
      this.model = await tf.loadLayersModel('file://./models/difficulty-model/model.json');
      this.isLoaded = true;
    } catch (error) {
      console.log('Pre-trained difficulty model not found, creating new model');
      await this.createModel();
    }
  }

  async createModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [5], // 5 performance metrics
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1, // Difficulty score (0-1)
          activation: 'sigmoid'
        })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['meanAbsoluteError']
    });

    this.isLoaded = true;
  }

  async predict(performanceMetrics) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    const normalizedFeatures = this.normalizePerformanceMetrics(performanceMetrics);
    const inputTensor = tf.tensor2d([normalizedFeatures]);
    const prediction = this.model.predict(inputTensor);
    const difficultyScore = await prediction.data();
    
    return {
      difficultyScore: difficultyScore[0],
      level: this.scoreToDifficultyLevel(difficultyScore[0]),
      confidence: this.calculateConfidence(performanceMetrics),
      adaptationRate: this.calculateAdaptationRate(performanceMetrics)
    };
  }

  normalizePerformanceMetrics(metrics) {
    const features = [
      metrics.averageScore / 100,
      metrics.completionRate,
      metrics.timeEfficiency,
      metrics.strugglingTopics.length / 10,
      metrics.strongTopics.length / 10
    ];

    return features.map((feature, index) => {
      return (feature - this.scaler.mean[index]) / this.scaler.std[index];
    });
  }

  scoreToDifficultyLevel(score) {
    if (score < 0.25) return 'beginner';
    if (score < 0.5) return 'intermediate';
    if (score < 0.75) return 'advanced';
    return 'expert';
  }

  calculateConfidence(metrics) {
    const dataPoints = [
      metrics.averageScore,
      metrics.completionRate * 100,
      metrics.timeEfficiency * 100
    ].filter(point => point !== undefined && point !== null);

    if (dataPoints.length < 2) return 0.3;

    const variance = this.calculateVariance(dataPoints);
    const confidence = Math.max(0.3, Math.min(0.95, 1 - (variance / 1000)));
    
    return confidence;
  }

  calculateVariance(dataPoints) {
    const mean = dataPoints.reduce((a, b) => a + b) / dataPoints.length;
    const squaredDiffs = dataPoints.map(point => Math.pow(point - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b) / dataPoints.length;
  }

  calculateAdaptationRate(metrics) {
    const baseRate = 0.1;
    const performanceMultiplier = metrics.averageScore / 100;
    const consistencyMultiplier = metrics.completionRate;
    
    return baseRate * performanceMultiplier * consistencyMultiplier;
  }

  async trainModel(trainingData) {
    if (!this.isLoaded) {
      await this.createModel();
    }

    const features = trainingData.map(data => this.normalizePerformanceMetrics(data.metrics));
    const labels = trainingData.map(data => data.optimalDifficulty / 100); // normalize to 0-1

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    const history = await this.model.fit(xs, ys, {
      epochs: 100,
      batchSize: 16,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss?.toFixed(4)}`);
          }
        }
      }
    });

    return history;
  }

  async evaluateModel(testData) {
    const features = testData.map(data => this.normalizePerformanceMetrics(data.metrics));
    const labels = testData.map(data => data.optimalDifficulty / 100);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    const evaluation = await this.model.evaluate(xs, ys);
    const loss = await evaluation[0].data();
    const mae = await evaluation[1].data();

    return {
      loss: loss[0],
      meanAbsoluteError: mae[0],
      accuracy: 1 - mae[0] // approximate accuracy
    };
  }

  async saveModel(path) {
    if (this.model) {
      await this.model.save(`file://${path}`);
      return true;
    }
    return false;
  }
}