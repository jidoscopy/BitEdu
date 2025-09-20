import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('enrolledCourses.courseId');

    const dashboardData = {
      user: {
        level: user.currentLevel,
        totalPoints: user.totalPoints,
        streakDays: user.streakDays,
        totalStudyTime: user.totalStudyTime,
        badgesEarned: user.badges.length
      },
      progress: {
        coursesEnrolled: user.enrolledCourses.length,
        coursesCompleted: user.completedCourses.length,
        averageProgress: calculateAverageProgress(user.enrolledCourses),
        currentStreak: user.streakDays,
        weeklyProgress: await getWeeklyProgress(userId)
      },
      recommendations: await getPersonalizedRecommendations(userId),
      achievements: {
        recent: user.badges.slice(-5),
        available: await getAvailableAchievements(userId)
      },
      leaderboard: await getLeaderboardPosition(userId)
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/progress/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const courseProgress = user.enrolledCourses.find(
      course => course.courseId.toString() === courseId
    );

    if (!courseProgress) {
      return res.status(404).json({ error: 'Course enrollment not found' });
    }

    const detailedProgress = {
      course: await Course.findById(courseId).select('title modules'),
      progress: courseProgress,
      analytics: {
        timeSpentPerModule: calculateModuleTime(courseProgress),
        performanceTrend: calculatePerformanceTrend(courseProgress.assessmentScores),
        predictedCompletion: predictCompletionDate(courseProgress),
        strugglingAreas: identifyStrugglingAreas(courseProgress),
        recommendations: generateProgressRecommendations(courseProgress)
      }
    };

    res.json(detailedProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const { category = 'overall', timeframe = 'all-time' } = req.query;

    let query = { isActive: true };
    let sortField = 'totalPoints';

    if (timeframe === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      // Would need to implement weekly points tracking
    }

    const leaderboard = await User.find(query)
      .select('username firstName lastName totalPoints currentLevel badges streakDays')
      .sort({ [sortField]: -1 })
      .limit(50);

    const userRank = await User.countDocuments({
      ...query,
      [sortField]: { $gt: req.user[sortField] }
    }) + 1;

    res.json({
      leaderboard: leaderboard.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`,
        points: user.totalPoints,
        level: user.currentLevel,
        badges: user.badges.length,
        streak: user.streakDays
      })),
      userRank,
      totalUsers: await User.countDocuments(query)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/course-analytics/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const enrolledUsers = await User.find({
      'enrolledCourses.courseId': courseId
    });

    const analytics = {
      enrollment: {
        total: course.enrollmentCount,
        completionRate: course.completionRate,
        averageRating: course.averageRating,
        dropoutRate: calculateDropoutRate(enrolledUsers, courseId)
      },
      performance: {
        averageScore: calculateAverageScore(enrolledUsers, courseId),
        averageCompletionTime: calculateAverageCompletionTime(enrolledUsers, courseId),
        modulePopularity: calculateModulePopularity(enrolledUsers, courseId),
        commonStruggles: identifyCommonStruggles(enrolledUsers, courseId)
      },
      engagement: {
        averageSessionLength: calculateAverageSessionLength(enrolledUsers, courseId),
        peakStudyTimes: identifyPeakStudyTimes(enrolledUsers, courseId),
        contentTypePreferences: analyzeContentPreferences(enrolledUsers, courseId)
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function calculateAverageProgress(enrolledCourses) {
  if (enrolledCourses.length === 0) return 0;
  const totalProgress = enrolledCourses.reduce((sum, course) => sum + course.completionPercentage, 0);
  return totalProgress / enrolledCourses.length;
}

async function getWeeklyProgress(userId) {
  // Implementation would track daily progress over the week
  return Array.from({ length: 7 }, (_, i) => ({
    day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: Math.random() * 100 // Mock data
  }));
}

async function getPersonalizedRecommendations(userId) {
  // Integration with AI engine would go here
  return [
    { type: 'course', title: 'Advanced Bitcoin Scripting', reason: 'Based on your progress in Bitcoin Fundamentals' },
    { type: 'module', title: 'Lightning Network Deep Dive', reason: 'Matches your learning style preferences' }
  ];
}

async function getAvailableAchievements(userId) {
  // Mock achievements - would integrate with achievement system
  return [
    { id: 1, title: 'Bitcoin Scholar', description: 'Complete 5 Bitcoin courses', progress: 60 },
    { id: 2, title: 'Stacks Developer', description: 'Deploy your first smart contract', progress: 0 }
  ];
}

async function getLeaderboardPosition(userId) {
  const user = await User.findById(userId);
  const rank = await User.countDocuments({
    totalPoints: { $gt: user.totalPoints },
    isActive: true
  }) + 1;

  return { rank, totalPoints: user.totalPoints };
}

function calculateDropoutRate(users, courseId) {
  const enrolledInCourse = users.filter(user => 
    user.enrolledCourses.some(course => course.courseId.toString() === courseId)
  );
  
  const droppedOut = enrolledInCourse.filter(user => {
    const courseProgress = user.enrolledCourses.find(course => course.courseId.toString() === courseId);
    return courseProgress.status === 'dropped';
  });

  return enrolledInCourse.length > 0 ? (droppedOut.length / enrolledInCourse.length) * 100 : 0;
}

function calculateAverageScore(users, courseId) {
  let totalScore = 0;
  let scoreCount = 0;

  users.forEach(user => {
    const courseProgress = user.enrolledCourses.find(course => course.courseId.toString() === courseId);
    if (courseProgress && courseProgress.assessmentScores.length > 0) {
      const avgScore = courseProgress.assessmentScores.reduce((sum, assessment) => sum + assessment.score, 0) / courseProgress.assessmentScores.length;
      totalScore += avgScore;
      scoreCount++;
    }
  });

  return scoreCount > 0 ? totalScore / scoreCount : 0;
}

function calculateAverageCompletionTime(users, courseId) {
  const completedUsers = users.filter(user => {
    const courseProgress = user.enrolledCourses.find(course => course.courseId.toString() === courseId);
    return courseProgress && courseProgress.status === 'completed';
  });

  if (completedUsers.length === 0) return 0;

  const totalTime = completedUsers.reduce((sum, user) => {
    const courseProgress = user.enrolledCourses.find(course => course.courseId.toString() === courseId);
    return sum + courseProgress.totalTimeSpent;
  }, 0);

  return totalTime / completedUsers.length;
}

function calculateModulePopularity(users, courseId) {
  // Implementation would analyze which modules are accessed most
  return {};
}

function identifyCommonStruggles(users, courseId) {
  // Implementation would analyze where students commonly struggle
  return [];
}

function calculateAverageSessionLength(users, courseId) {
  // Implementation would calculate average study session length
  return 0;
}

function identifyPeakStudyTimes(users, courseId) {
  // Implementation would identify when students are most active
  return [];
}

function analyzeContentPreferences(users, courseId) {
  // Implementation would analyze preferred content types
  return {};
}

function calculateModuleTime(courseProgress) {
  // Implementation would break down time spent per module
  return {};
}

function calculatePerformanceTrend(assessmentScores) {
  if (assessmentScores.length < 2) return 'insufficient-data';
  
  const recentScores = assessmentScores.slice(-5).map(a => a.score);
  const earlyAvg = recentScores.slice(0, Math.ceil(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(recentScores.length / 2);
  const lateAvg = recentScores.slice(Math.floor(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(recentScores.length / 2);
  
  if (lateAvg > earlyAvg + 5) return 'improving';
  if (lateAvg < earlyAvg - 5) return 'declining';
  return 'stable';
}

function predictCompletionDate(courseProgress) {
  const daysEnrolled = Math.floor((Date.now() - courseProgress.enrolledAt) / (1000 * 60 * 60 * 24));
  const progressRate = courseProgress.completionPercentage / Math.max(daysEnrolled, 1);
  const remainingDays = (100 - courseProgress.completionPercentage) / Math.max(progressRate, 0.1);
  
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + Math.ceil(remainingDays));
  
  return completionDate.toISOString().split('T')[0];
}

function identifyStrugglingAreas(courseProgress) {
  return courseProgress.assessmentScores
    .filter(assessment => assessment.score < 70)
    .map(assessment => assessment.assessmentId);
}

function generateProgressRecommendations(courseProgress) {
  const recommendations = [];
  
  if (courseProgress.completionPercentage < 25 && Date.now() - courseProgress.lastAccessed > 7 * 24 * 60 * 60 * 1000) {
    recommendations.push('Consider setting up a regular study schedule');
  }
  
  if (courseProgress.assessmentScores.some(score => score.score < 60)) {
    recommendations.push('Review fundamental concepts before advancing');
  }
  
  return recommendations;
}

export default router;