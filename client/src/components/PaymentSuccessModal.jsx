import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentSuccessModal.css';

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  courseTitle,
  courseId,
  amount,
  paymentId,
  orderId,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedAmount = (Number(amount) / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

  const nowFormatted = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  function handleGoToClassroom() {
    onClose();
    navigate(`/courses/${courseId}?tab=classroom`);
  }

  return (
    <div className="payment-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <div className="payment-modal-icon-badge" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="payment-modal-title">Payment Confirmed</h2>
          <p className="payment-modal-subtitle">
            Your transaction has been securely verified and your course enrollment is active.
          </p>
        </div>

        <div className="payment-receipt-summary">
          <div className="payment-receipt-row">
            <span className="payment-receipt-label">Course</span>
            <span className="payment-receipt-value payment-receipt-value--bold">{courseTitle}</span>
          </div>
          <div className="payment-receipt-row">
            <span className="payment-receipt-label">Amount Paid</span>
            <span className="payment-receipt-value payment-receipt-amount">{formattedAmount}</span>
          </div>
          <div className="payment-receipt-row">
            <span className="payment-receipt-label">Transaction ID</span>
            <span className="payment-receipt-value payment-receipt-code">{paymentId}</span>
          </div>
          <div className="payment-receipt-row">
            <span className="payment-receipt-label">Order Reference</span>
            <span className="payment-receipt-value payment-receipt-code">{orderId}</span>
          </div>
          <div className="payment-receipt-row">
            <span className="payment-receipt-label">Timestamp</span>
            <span className="payment-receipt-value">{nowFormatted}</span>
          </div>
        </div>

        <div className="payment-modal-actions">
          <button
            type="button"
            className="payment-modal-btn payment-modal-btn--primary"
            onClick={handleGoToClassroom}
          >
            Go to Classroom
          </button>
          <button
            type="button"
            className="payment-modal-btn payment-modal-btn--secondary"
            onClick={onClose}
          >
            Stay on Course Page
          </button>
        </div>
      </div>
    </div>
  );
}
