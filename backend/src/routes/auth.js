import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register',
  [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name required'),
    body('lastName').notEmpty().withMessage('Last name required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, firstName, lastName, stacksAddress } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'User with this email or username already exists' 
        });
      }

      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        stacksAddress,
        isStacksConnected: !!stacksAddress
      });

      await user.save();

      const token = generateToken(user._id);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          stacksAddress: user.stacksAddress,
          isStacksConnected: user.isStacksConnected
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          stacksAddress: user.stacksAddress,
          isStacksConnected: user.isStacksConnected,
          totalPoints: user.totalPoints,
          currentLevel: user.currentLevel
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post('/connect-stacks',
  [
    body('stacksAddress').notEmpty().withMessage('Stacks address required'),
    body('publicKey').notEmpty().withMessage('Public key required'),
    body('signature').notEmpty().withMessage('Signature required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, stacksAddress, publicKey, signature } = req.body;

      // Verify signature here (implementation depends on your auth strategy)
      const isValidSignature = await verifyStacksSignature(signature, publicKey, email);
      if (!isValidSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const user = await User.findOneAndUpdate(
        { email },
        {
          stacksAddress,
          stacksPublicKey: publicKey,
          isStacksConnected: true
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const token = generateToken(user._id);

      res.json({
        message: 'Stacks wallet connected successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          stacksAddress: user.stacksAddress,
          isStacksConnected: user.isStacksConnected
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

async function verifyStacksSignature(signature, publicKey, message) {
  // Implementation would verify the Stacks signature
  // For now, return true (in production, implement proper verification)
  return true;
}

export default router;