import express from 'express';
import { StacksService } from '../services/stacksService.js';

const router = express.Router();
const stacksService = new StacksService();

router.get('/contract-info', (req, res) => {
  res.json({
    network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
    contractAddress: process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contracts: {
      certifications: 'course-certifications',
      learningPaths: 'learning-paths',
      achievements: 'achievement-system'
    }
  });
});

router.get('/transaction/:txId', async (req, res) => {
  try {
    const { txId } = req.params;
    const verification = await stacksService.verifyTransaction(txId);
    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;