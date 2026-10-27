// routes/payments.js
// Handles Razorpay test mode payment orders, signature verification,
// automatic student course enrollments, and payment history.

const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Initialize Razorpay client with credentials from .env
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ============================================================
// POST /api/payments/create-order
// Generates a Razorpay order for a paid course and stores a
// pending transaction record in the `payments` table.
// ============================================================
router.post('/create-order', requireAuth, requireRole('student'), async (req, res) => {
  const { course_id } = req.body;

  if (!course_id) {
    return res.status(400).json({ error: 'course_id is required' });
  }

  if (!UUID_REGEX.test(course_id)) {
    return res.status(400).json({ error: 'Invalid course ID format' });
  }

  try {
    // 1. Fetch course details
    const courseRes = await db.query(
      `SELECT id, title, price, status, thumbnail_url
       FROM courses
       WHERE id = $1`,
      [course_id]
    );

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseRes.rows[0];

    // 2. Prevent purchasing draft courses
    if (course.status !== 'published') {
      return res.status(400).json({ error: 'This course is not currently available for enrollment' });
    }

    // 3. Ensure course has a valid positive price
    const priceNum = parseFloat(course.price);
    if (!priceNum || priceNum <= 0) {
      return res.status(400).json({
        error: 'This course is free. Please enroll directly without payment.',
      });
    }

    // 4. Check if student is already enrolled
    const enrolledRes = await db.query(
      `SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = $2`,
      [req.user.id, course.id]
    );

    if (enrolledRes.rows.length > 0) {
      return res.status(409).json({ error: 'You are already enrolled in this course' });
    }

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(priceNum * 100);

    let orderId = '';
    let orderAmount = amountInPaise;
    let orderCurrency = 'INR';

    if (razorpayInstance) {
      // 5. Create order with Razorpay Sandbox API
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}_${req.user.id.slice(0, 8)}`,
        notes: {
          course_id: course.id,
          student_id: req.user.id,
          student_email: req.user.email,
        },
      };

      const rzpOrder = await razorpayInstance.orders.create(options);
      orderId = rzpOrder.id;
      orderAmount = rzpOrder.amount;
      orderCurrency = rzpOrder.currency;
    } else {
      // Fallback mock order if credentials are not configured
      orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // 6. Record created order in payments table
    await db.query(
      `INSERT INTO payments (student_id, course_id, razorpay_order_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'created')`,
      [req.user.id, course.id, orderId, orderAmount, orderCurrency]
    );

    res.status(201).json({
      orderId,
      amount: orderAmount,
      currency: orderCurrency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      course: {
        id: course.id,
        title: course.title,
        price: course.price,
        thumbnail_url: course.thumbnail_url,
      },
    });
  } catch (err) {
    console.error('Failed to create payment order:', err);
    res.status(500).json({ error: 'Failed to initiate payment order' });
  }
});

// ============================================================
// POST /api/payments/verify
// Validates the Razorpay HMAC-SHA256 signature, updates payment status
// to 'paid', and automatically enrolls the student into the course.
// ============================================================
router.post('/verify', requireAuth, requireRole('student'), async (req, res) => {
  const {
    course_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!course_id || !razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({
      error: 'course_id, razorpay_order_id, and razorpay_payment_id are required',
    });
  }

  if (!UUID_REGEX.test(course_id)) {
    return res.status(400).json({ error: 'Invalid course ID format' });
  }

  try {
    // 1. Verify that order exists for this student
    const paymentRecordRes = await db.query(
      `SELECT id, status, amount FROM payments
       WHERE razorpay_order_id = $1 AND student_id = $2`,
      [razorpay_order_id, req.user.id]
    );

    if (paymentRecordRes.rows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found for this order' });
    }

    const paymentRecord = paymentRecordRes.rows[0];

    // If already verified and paid, return success idempotently
    if (paymentRecord.status === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already verified and enrollment confirmed',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    }

    // 2. Verify signature using HMAC SHA256
    let isAuthentic = false;

    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isAuthentic = generatedSignature === razorpay_signature;
    } else if (razorpay_order_id.startsWith('order_mock_')) {
      // Mock mode for local testing without internet/keys
      isAuthentic = true;
    }

    if (!isAuthentic) {
      await db.query(
        `UPDATE payments
         SET status = 'failed'
         WHERE razorpay_order_id = $1 AND student_id = $2`,
        [razorpay_order_id, req.user.id]
      );
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    // 3. Update payment status to 'paid'
    await db.query(
      `UPDATE payments
       SET status = 'paid',
           razorpay_payment_id = $1,
           razorpay_signature = $2,
           verified_at = NOW()
       WHERE razorpay_order_id = $3 AND student_id = $4`,
      [razorpay_payment_id, razorpay_signature || 'mock_signature', razorpay_order_id, req.user.id]
    );

    // 4. Automatically create enrollment
    await db.query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, course_id) DO NOTHING`,
      [req.user.id, course_id]
    );

    res.json({
      success: true,
      message: 'Payment verified and enrollment confirmed!',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Something went wrong verifying the payment' });
  }
});

// ============================================================
// GET /api/payments/history
// Returns all past payments and invoices for the logged-in student.
// ============================================================
router.get('/history', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id,
              p.razorpay_order_id,
              p.razorpay_payment_id,
              p.amount,
              p.currency,
              p.status,
              p.created_at,
              p.verified_at,
              c.id AS course_id,
              c.title AS course_title,
              c.thumbnail_url AS course_thumbnail,
              u.name AS instructor_name
       FROM payments p
       JOIN courses c ON c.id = p.course_id
       JOIN users u ON u.id = c.instructor_id
       WHERE p.student_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch payment history:', err);
    res.status(500).json({ error: 'Failed to retrieve billing history' });
  }
});

module.exports = router;
