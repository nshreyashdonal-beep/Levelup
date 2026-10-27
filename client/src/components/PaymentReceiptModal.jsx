import { useEffect } from 'react';
import './PaymentReceiptModal.css';

export default function PaymentReceiptModal({ payment, student, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (payment) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [payment, onClose]);

  if (!payment) return null;

  const formattedAmount = (Number(payment.amount) / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

  const paymentDate = new Date(payment.verified_at || payment.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  function handlePrint() {
    window.print();
  }

  return (
    <div className="receipt-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="receipt-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Printable Invoice Card */}
        <div className="receipt-card" id="printable-invoice">
          <div className="receipt-header">
            <div>
              <span className="receipt-brand-badge">LEVELUP EDTECH</span>
              <h1 className="receipt-title">Payment Receipt</h1>
              <p className="receipt-number">Receipt No: #{payment.id ? payment.id.slice(0, 8).toUpperCase() : 'INV-001'}</p>
            </div>
            <div className="receipt-status-wrap">
              <span className={`receipt-status-badge receipt-status-badge--${payment.status}`}>
                {payment.status.toUpperCase()}
              </span>
              <span className="receipt-date">{paymentDate}</span>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-details-grid">
            <div className="receipt-detail-block">
              <span className="receipt-detail-label">Billed To</span>
              <strong className="receipt-detail-val">{student?.name || 'Student'}</strong>
              <span className="receipt-detail-sub">{student?.email || 'student@levelup.com'}</span>
            </div>
            <div className="receipt-detail-block">
              <span className="receipt-detail-label">Payment Gateway</span>
              <strong className="receipt-detail-val">Razorpay (Test Sandbox)</strong>
              <span className="receipt-detail-sub">Transaction Reference</span>
            </div>
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th className="receipt-th">Description</th>
                <th className="receipt-th receipt-th--right">Rate</th>
                <th className="receipt-th receipt-th--right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="receipt-td">
                  <div className="receipt-item-title">{payment.course_title}</div>
                  <div className="receipt-item-meta">
                    Instructor: {payment.instructor_name || 'LevelUp Verified Educator'}
                  </div>
                </td>
                <td className="receipt-td receipt-td--right">{formattedAmount}</td>
                <td className="receipt-td receipt-td--right receipt-td--bold">{formattedAmount}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="receipt-tf receipt-tf--label">Total Paid (Inclusive of Taxes)</td>
                <td className="receipt-tf receipt-tf--total">{formattedAmount}</td>
              </tr>
            </tfoot>
          </table>

          <div className="receipt-metadata-box">
            <div className="receipt-meta-item">
              <span className="receipt-meta-label">Payment ID:</span>
              <span className="receipt-meta-code">{payment.razorpay_payment_id || 'N/A'}</span>
            </div>
            <div className="receipt-meta-item">
              <span className="receipt-meta-label">Order ID:</span>
              <span className="receipt-meta-code">{payment.razorpay_order_id}</span>
            </div>
          </div>

          <div className="receipt-footer-note">
            <p>This is a computer-generated receipt for major capstone project demonstration on LevelUp platform.</p>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden during printing) */}
        <div className="receipt-modal-actions no-print">
          <button type="button" className="receipt-action-btn receipt-action-btn--print" onClick={handlePrint}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Receipt
          </button>
          <button type="button" className="receipt-action-btn receipt-action-btn--close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
