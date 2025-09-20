import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  contentType: { 
    type: String, 
    enum: ['video', 'text', 'interactive', 'quiz', 'coding'], 
    required: true 
  },
  content: mongoose.Schema.Types.Mixed,
  duration: Number, // in minutes
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  prerequisites: [String],
  learningObjectives: [String],
  resources: [{
    type: { type: String, enum: ['link', 'file', 'code'] },
    url: String,
    title: String,
    description: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const assessmentSchema = new mongoose.Schema({
  title: String,
  type: { type: String, enum: ['quiz', 'coding', 'project', 'essay'] },
  questions: [{
    question: String,
    type: { type: String, enum: ['multiple-choice', 'coding', 'essay', 'true-false'] },
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    points: { type: Number, default: 1 }
  }],
  passingScore: { type: Number, default: 70 },
  timeLimit: Number, // in minutes
  attempts: { type: Number, default: 3 }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: {
    name: String,
    email: String,
    bio: String,
    stacksAddress: String
  },
  category: { 
    type: String, 
    enum: ['bitcoin-fundamentals', 'blockchain-tech', 'stacks-development', 'defi', 'nft', 'security'],
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true 
  },
  modules: [moduleSchema],
  assessments: [assessmentSchema],
  prerequisites: [String],
  learningObjectives: [String],
  estimatedDuration: Number, // in hours
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'STX' },
  
  // Blockchain integration
  contractAddress: String,
  onChainCourseId: Number,
  
  // Analytics
  enrollmentCount: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  reviews: [{
    student: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Metadata
  tags: [String],
  language: { type: String, default: 'en' },
  isPublished: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, difficulty: 1 });
courseSchema.index({ createdBy: 1 });

courseSchema.methods.calculateCompletionRate = function() {
  if (this.enrollmentCount === 0) return 0;
  return (this.completionCount || 0) / this.enrollmentCount;
};

courseSchema.methods.addReview = function(studentId, rating, comment) {
  this.reviews.push({
    student: studentId,
    rating,
    comment
  });
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = totalRating / this.reviews.length;
  
  return this.save();
};

courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Course', courseSchema);