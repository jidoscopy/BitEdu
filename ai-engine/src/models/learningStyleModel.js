import * as tf from '@tensorflow/tfjs-node';

export class LearningStyleClassifier {
  constructor() {
    this.model = null;
    this.isLoaded = false;
  }

  async loadModel() {
    if (this.isLoaded) return;

    try {
      this.model = await tf.loadLayersModel('file://./models/learning-style-model/model.json');
      this.isLoaded = true;
    } catch (error) {
      console.log('Pre-trained model not found, creating new model');
      await this.createModel();
    }
  }

  async createModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [10], // 10 learning behavior features
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 4, // 4 learning styles
          activation: 'softmax'
        })
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.isLoaded = true;
  }

  async predict(features) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    const inputTensor = tf.tensor2d([this.normalizeFeatures(features)]);
    const prediction = this.model.predict(inputTensor);
    const probabilities = await prediction.data();
    
    const styles = ['visual', 'auditory', 'kinesthetic', 'reading-writing'];
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    
    return {
      primary: styles[maxIndex],
      confidence: probabilities[maxIndex],
      allScores: styles.map((style, index) => ({
        style,
        score: probabilities[index]
      }))
    };
  }

  normalizeFeatures(features) {
    return [
      Math.min(1, features.completionRates?.length / 10 || 0),
      Math.min(1, features.timeSpent?.reduce((a, b) => a + b, 0) / 1000 || 0),
      Math.min(1, features.interactionPatterns?.length / 20 || 0),
      features.preferredContentTypes?.includes('video') ? 1 : 0,
      features.preferredContentTypes?.includes('text') ? 1 : 0,
      features.preferredContentTypes?.includes('interactive') ? 1 : 0,
      Math.min(1, features.assessmentScores?.reduce((a, b) => a + b, 0) / 100 || 0),
      features.timeSpent?.some(time => time > 120) ? 1 : 0, // long study sessions
      features.timeSpent?.some(time => time < 30) ? 1 : 0,  // short study sessions
      features.completionRates?.reduce((a, b) => a + b, 0) / features.completionRates?.length || 0
    ];
  }

  async trainModel(trainingData) {
    if (!this.isLoaded) {
      await this.createModel();
    }

    const features = trainingData.map(data => this.normalizeFeatures(data.features));
    const labels = trainingData.map(data => this.encodeLabel(data.learningStyle));

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
        }
      }
    });

    return true;
  }

  encodeLabel(learningStyle) {
    const mapping = {
      'visual': [1, 0, 0, 0],
      'auditory': [0, 1, 0, 0],
      'kinesthetic': [0, 0, 1, 0],
      'reading-writing': [0, 0, 0, 1]
    };
    return mapping[learningStyle] || [0, 0, 1, 0];
  }

  async saveModel(path) {
    if (this.model) {
      await this.model.save(`file://${path}`);
      return true;
    }
    return false;
  }
}