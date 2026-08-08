// const express = require('express');
// const router = express.Router();
// const nocoService = require('../services/nocoService');

// // GET /api/scan
// router.get('/scan', async (req, res) => {
//   try {
//     const data = await nocoService.getRecords();
//     res.json({ success: true, data });
//   } catch (err) {
//     console.error('SCAN ROUTE ERROR:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: err.message,
//     });
//   }
// });

// // POST /api/scan
// router.post('/scan', async (req, res) => {
//   const { user_id, user_location_id, order_id } = req.body;
//   const payload = {
//     user_id,
//     user_location_id,
//     order_id,
//   };
//   try {
//     const data = await nocoService.scanRecord(payload);
//     res.json({ success: true, data });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: err.message,
//     });
//   }
// });
// module.exports = router;

const express = require('express');
const router = express.Router();
const nocoService = require('../services/nocoService');

// GET /api/scan
// Query Parameters:
//   - date: (optional) Single date filter (YYYY-MM-DD)
//   - startDate: (optional) Start date for range filter (YYYY-MM-DD)
//   - endDate: (optional) End date for range filter (YYYY-MM-DD)
//
// Examples:
//   GET /api/scan                           -> Today's records (default)
//   GET /api/scan?date=2026-08-08           -> Specific date
//   GET /api/scan?startDate=2026-08-01&endDate=2026-08-10 -> Date range
//   GET /api/scan?startDate=2026-08-01      -> From a date onwards
//   GET /api/scan?endDate=2026-08-10        -> Upto a date
router.get('/scan', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;

    let data;
    let filterType = 'today'; // default

    // Case 1: Date range (startDate and endDate both provided)
    if (startDate && endDate) {
      data = await nocoService.getRecords(startDate, endDate);
      filterType = 'range';
    }
    // Case 2: Single date (only date provided)
    else if (date) {
      data = await nocoService.getRecords(date);
      filterType = 'single_date';
    }
    // Case 3: Start date only (from a date onwards)
    else if (startDate) {
      data = await nocoService.getRecords(startDate, null);
      filterType = 'from_date';
    }
    // Case 4: End date only (upto a date)
    else if (endDate) {
      // For "upto a date", we need to get all records from beginning till endDate
      // Using a very old date as start (e.g., 1970-01-01)
      data = await nocoService.getRecords('1970-01-01', endDate);
      filterType = 'upto_date';
    }
    // Case 5: Default - today's date (backward compatible)
    else {
      data = await nocoService.getRecords();
      filterType = 'today';
    }

    res.json({
      success: true,
      data,
      meta: {
        filterType,
        filters: {
          date: date || null,
          startDate: startDate || null,
          endDate: endDate || null,
        },
        totalRecords: data.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('SCAN ROUTE ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message,
    });
  }
});

// POST /api/scan
router.post('/scan', async (req, res) => {
  const { user_id, user_location_id, order_id } = req.body;

  // Validate required fields
  if (!user_id || !user_location_id || !order_id) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      error: 'user_id, user_location_id, and order_id are required',
    });
  }

  const payload = {
    user_id,
    user_location_id,
    order_id,
  };

  try {
    const data = await nocoService.scanRecord(payload);
    res.json({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('POST SCAN ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message || 'Internal Server Error',
    });
  }
});

module.exports = router;
