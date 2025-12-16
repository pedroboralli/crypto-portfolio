import pool from '../database/connection.js';
import { addressSchema } from '../utils/validation.js';

// Get user's addresses
export async function getAddresses(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, label, address, type, created_at FROM addresses WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ addresses: result.rows });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to get addresses' });
  }
}

// Add address
export async function addAddress(req, res) {
  try {
    const { error } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { label, address, type } = req.body;

    // Check for duplicates
    const existing = await pool.query(
      'SELECT id FROM addresses WHERE user_id = $1 AND LOWER(address) = LOWER($2)',
      [req.user.userId, address]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Address already added' });
    }

    const result = await pool.query(
      'INSERT INTO addresses (user_id, label, address, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, label, address, type]
    );

    res.status(201).json({ address: result.rows[0] });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
}

// Delete address
export async function deleteAddress(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
}

// Update address label
export async function updateAddressLabel(req, res) {
  try {
    const { id } = req.params;
    const { label } = req.body;

    if (!label || label.trim().length === 0) {
      return res.status(400).json({ error: 'Label is required' });
    }

    const result = await pool.query(
      'UPDATE addresses SET label = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [label, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ address: result.rows[0] });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
}

// Get user preferences
export async function getPreferences(req, res) {
  try {
    const result = await pool.query(
      'SELECT default_currency FROM user_preferences WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ preferences: { default_currency: 'BRL' } });
    }

    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
}

// Update user preferences
export async function updatePreferences(req, res) {
  try {
    const { default_currency } = req.body;

    if (!['BRL', 'USD', 'BTC'].includes(default_currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, default_currency)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET default_currency = $2, updated_at = NOW()
       RETURNING *`,
      [req.user.userId, default_currency]
    );

    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}
