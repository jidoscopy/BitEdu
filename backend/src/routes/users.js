import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('enrolledCourses.courseId', 'title difficulty category');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Prevent password updates through this route
    delete updates.email; // Prevent email updates without verification
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/learning-profile', async (req, res) => {
  try {
    const { learningProfile } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { learningProfile },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Learning profile updated', learningProfile: user.learningProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/achievements', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('badges totalPoints currentLevel');
    
    res.json({
      badges: user.badges,
      totalPoints: user.totalPoints,
      currentLevel: user.currentLevel,
      nextLevelProgress: (user.totalPoints % 1000) / 10 // Progress to next level as percentage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/update-streak', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    await user.updateStreak();
    
    res.json({
      streakDays: user.streakDays,
      lastActivity: user.lastActivityDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;