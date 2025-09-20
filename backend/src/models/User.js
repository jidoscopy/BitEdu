import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const learningProfileSchema = new mongoose.Schema({
  learningStyle: { 
    type: String, 
    enum: ['visual', 'auditory', 'kinesthetic', 'reading-writing', 'mixed'],
    default: 'mixed'
  },
  preferredPace: { 
    type: String, 
    enum: ['slow', 'moderate', 'fast'],
    default: 'moderate'
  },
  availableHoursPerWeek: { type: Number, default: 5 },
  timeZone: String,
  preferredStudyTimes: [String],
  goals: [String],
  interests: [String],
  experienceLevel: {
    bitcoin: { type: String, enum: ['none', 'basic', 'intermediate', 'advanced'], default: 'none' },
    blockchain: { type: String, enum: ['none', 'basic', 'intermediate', 'advanced'], default: 'none' },
    programming: { type: String, enum: ['none', 'basic', 'intermediate', 'advanced'], default: 'none' },
    trading: { type: String, enum: ['none', 'basic', 'intermediate', 'advanced'], default: 'none' }
  }
});

const progressSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: { type: Date, default: Date.now },
  lastAccessed: Date,
  completionPercentage: { type: Number, default: 0 },
  currentModule: Number,
  completedModules: [Number],
  assessmentScores: [{
    assessmentId: String,
    score: Number,
    completedAt: Date,
    timeSpent: Number // in minutes
  }],
  totalTimeSpent: { type: Number, default: 0 }, // in minutes
  status: { 
    type: String, 
    enum: ['enrolled', 'in-progress', 'completed', 'dropped'],
    default: 'enrolled'
  }
});

const achievementSchema = new mongoose.Schema({
  achievementId: String,
  title: String,
  description: String,
  earnedAt: { type: Date, default: Date.now },
  onChainTxId: String,
  verified: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  // Basic Info
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  avatar: String,
  
  // Stacks Integration
  stacksAddress: String,
  stacksPublicKey: String,
  isStacksConnected: { type: Boolean, default: false },
  
  // Learning Profile
  learningProfile: learningProfileSchema,
  
  // Progress Tracking
  enrolledCourses: [progressSchema],
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  
  // Gamification
  totalPoints: { type: Number, default: 0 },
  currentLevel: { type: Number, default: 1 },
  badges: [achievementSchema],
  streakDays: { type: Number, default: 0 },
  lastActivityDate: Date,
  
  // Analytics
  totalStudyTime: { type: Number, default: 0 }, // in minutes
  averageSessionLength: { type: Number, default: 0 },
  preferredStudyTimes: [String],
  strongTopics: [String],
  weakTopics: [String],
  
  // Preferences
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    studyReminders: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true }
  },
  privacy: {
    profileVisible: { type: Boolean, default: true },
    progressVisible: { type: Boolean, default: true },
    leaderboardVisible: { type: Boolean, default: true }
  },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ stacksAddress: 1 });
userSchema.index({ totalPoints: -1 });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = new Date();
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateProgress = function(courseId, moduleProgress) {
  const courseProgress = this.enrolledCourses.find(
    course => course.courseId.toString() === courseId.toString()
  );
  
  if (courseProgress) {
    courseProgress.completionPercentage = moduleProgress.percentage;
    courseProgress.currentModule = moduleProgress.currentModule;
    courseProgress.completedModules = moduleProgress.completedModules;
    courseProgress.lastAccessed = new Date();
    courseProgress.totalTimeSpent += moduleProgress.timeSpent;
    
    if (moduleProgress.percentage >= 100) {
      courseProgress.status = 'completed';
      this.completedCourses.push(courseId);
    } else if (moduleProgress.percentage > 0) {
      courseProgress.status = 'in-progress';
    }
  }
  
  this.totalStudyTime += moduleProgress.timeSpent;
  this.lastActivityDate = new Date();
  
  return this.save();
};

userSchema.methods.addAchievement = function(achievement) {
  this.badges.push(achievement);
  this.totalPoints += achievement.points || 0;
  this.currentLevel = Math.floor(this.totalPoints / 1000) + 1;
  
  return this.save();
};

userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActivity = this.lastActivityDate || new Date(0);
  const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    this.streakDays += 1;
  } else if (daysDiff > 1) {
    this.streakDays = 1;
  }
  
  this.lastActivityDate = today;
  return this.save();
};

export default mongoose.model('User', userSchema);