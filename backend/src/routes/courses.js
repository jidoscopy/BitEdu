import express from 'express';
import { body, validationResult } from 'express-validator';
import Course from '../models/Course.js';
import { authenticateToken } from '../middleware/auth.js';
import { StacksService } from '../services/stacksService.js';

const router = express.Router();
const stacksService = new StacksService();

router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search, page = 1, limit = 10 } = req.query;
    
    const filter = { isPublished: true, isActive: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$text = { $search: search };
    }

    const courses = await Course.find(filter)
      .select('-modules.content -assessments')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Course.countDocuments(filter);

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', 
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(['bitcoin-fundamentals', 'blockchain-tech', 'stacks-development', 'defi', 'nft', 'security']),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced', 'expert'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const courseData = {
        ...req.body,
        createdBy: req.user.id,
        instructor: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          stacksAddress: req.user.stacksAddress
        }
      };

      const course = new Course(courseData);
      await course.save();

      // Create course on Stacks blockchain
      try {
        const onChainResult = await stacksService.createCourse(
          course._id.toString(),
          course.title,
          course.description
        );
        
        course.contractAddress = onChainResult.contractAddress;
        course.onChainCourseId = onChainResult.courseId;
        await course.save();
      } catch (blockchainError) {
        console.error('Blockchain integration failed:', blockchainError);
      }

      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this course' });
    }

    Object.assign(course, req.body);
    await course.save();

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Enroll on blockchain
    const enrollmentResult = await stacksService.enrollInCourse(
      req.user.stacksAddress,
      course.onChainCourseId
    );

    // Update local database
    course.enrollmentCount += 1;
    await course.save();

    res.json({ 
      message: 'Successfully enrolled',
      transactionId: enrollmentResult.txId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/modules/:moduleIndex', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const moduleIndex = parseInt(req.params.moduleIndex);
    const module = course.modules[moduleIndex];
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(module);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { finalScore, completionData } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Issue certificate on blockchain
    const certResult = await stacksService.issueCertificate(
      req.user.stacksAddress,
      course.onChainCourseId,
      finalScore,
      completionData.ipfsHash
    );

    res.json({
      message: 'Course completed successfully',
      certificateId: certResult.certificateId,
      transactionId: certResult.txId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/categories', (req, res) => {
  const categories = [
    { id: 'bitcoin-fundamentals', name: 'Bitcoin Fundamentals', description: 'Core Bitcoin concepts and principles' },
    { id: 'blockchain-tech', name: 'Blockchain Technology', description: 'Distributed ledger technology and consensus' },
    { id: 'stacks-development', name: 'Stacks Development', description: 'Smart contracts with Clarity language' },
    { id: 'defi', name: 'Decentralized Finance', description: 'DeFi protocols and applications' },
    { id: 'nft', name: 'NFTs & Digital Assets', description: 'Non-fungible tokens and digital ownership' },
    { id: 'security', name: 'Blockchain Security', description: 'Security best practices and auditing' }
  ];
  
  res.json(categories);
});

export default router;