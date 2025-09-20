import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PersonalizationEngine } from './services/personalizationEngine.js';
import { LearningPathRecommender } from './services/learningPathRecommender.js';
import { ProgressAnalyzer } from './services/progressAnalyzer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const personalizationEngine = new PersonalizationEngine();
const pathRecommender = new LearningPathRecommender();
const progressAnalyzer = new ProgressAnalyzer();

app.post('/api/personalize-path', async (req, res) => {
  try {
    const { studentId, learningHistory, preferences } = req.body;
    const personalizedPath = await personalizationEngine.generatePersonalizedPath(
      studentId, 
      learningHistory, 
      preferences
    );
    res.json(personalizedPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recommend-content', async (req, res) => {
  try {
    const { studentId, currentTopic, difficulty } = req.body;
    const recommendations = await pathRecommender.recommendNextContent(
      studentId, 
      currentTopic, 
      difficulty
    );
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-progress', async (req, res) => {
  try {
    const { studentId, courseId, activityData } = req.body;
    const analysis = await progressAnalyzer.analyzeProgress(
      studentId, 
      courseId, 
      activityData
    );
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/adaptive-difficulty', async (req, res) => {
  try {
    const { studentId, currentPerformance } = req.body;
    const adaptedDifficulty = await personalizationEngine.adaptDifficulty(
      studentId, 
      currentPerformance
    );
    res.json(adaptedDifficulty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'BitEdu AI Engine' });
});

app.listen(PORT, () => {
  console.log(`BitEdu AI Engine running on port ${PORT}`);
});