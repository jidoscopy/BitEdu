import express from 'express';
import { StacksService } from '../services/stacksService.js';
import { requireStacksAddress } from '../middleware/auth.js';

const router = express.Router();
const stacksService = new StacksService();

router.get('/', requireStacksAddress, async (req, res) => {
  try {
    const certificates = await stacksService.getCertificate(
      req.user.stacksAddress,
      null // Get all certificates for user
    );

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:certificateId', requireStacksAddress, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await stacksService.getCertificate(
      req.user.stacksAddress,
      certificateId
    );

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const verification = await stacksService.verifyTransaction(certificateId);

    res.json({
      isValid: verification.status === 'confirmed',
      blockHeight: verification.blockHeight,
      txId: verification.txId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;