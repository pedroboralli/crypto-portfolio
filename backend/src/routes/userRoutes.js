import express from 'express';
import {
  getAddresses,
  addAddress,
  deleteAddress,
  updateAddressLabel,
  getPreferences,
  updatePreferences
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Address management
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:id', deleteAddress);
router.patch('/addresses/:id', updateAddressLabel);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;
