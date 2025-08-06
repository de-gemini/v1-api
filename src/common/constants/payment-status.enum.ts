/**
 * Unified Payment Status Enum
 * 
 * This enum defines the standard payment status values used throughout the application.
 * All payment status handling should use these constants to ensure consistency.
 */

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

/**
 * Payment Status Helper Functions
 */
export class PaymentStatusHelper {
  /**
   * Check if a payment status indicates a successful payment
   */
  static isSuccessful(status: string): boolean {
    return status === PaymentStatus.COMPLETED;
  }

  /**
   * Check if a payment status indicates a failed payment
   */
  static isFailed(status: string): boolean {
    return [PaymentStatus.FAILED, PaymentStatus.CANCELLED].includes(status as PaymentStatus);
  }

  /**
   * Check if a payment status indicates a pending payment
   */
  static isPending(status: string): boolean {
    return status === PaymentStatus.PENDING;
  }

  /**
   * Get the display text for a payment status
   */
  static getDisplayText(status: string): string {
    const statusMap: Record<string, string> = {
      [PaymentStatus.PENDING]: 'Pending',
      [PaymentStatus.COMPLETED]: 'Completed',
      [PaymentStatus.FAILED]: 'Failed',
      [PaymentStatus.CANCELLED]: 'Cancelled',
      [PaymentStatus.REFUNDED]: 'Refunded',
      [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
    };
    return statusMap[status] || 'Unknown';
  }

  /**
   * Get the CSS class for styling payment status
   */
  static getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      [PaymentStatus.PENDING]: 'text-yellow-600 bg-yellow-100',
      [PaymentStatus.COMPLETED]: 'text-green-600 bg-green-100',
      [PaymentStatus.FAILED]: 'text-red-600 bg-red-100',
      [PaymentStatus.CANCELLED]: 'text-gray-600 bg-gray-100',
      [PaymentStatus.REFUNDED]: 'text-blue-600 bg-blue-100',
      [PaymentStatus.PARTIALLY_REFUNDED]: 'text-orange-600 bg-orange-100',
    };
    return classMap[status] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Validate if a status is a valid payment status
   */
  static isValid(status: string): boolean {
    return Object.values(PaymentStatus).includes(status as PaymentStatus);
  }

  /**
   * Convert legacy status values to unified status
   */
  static normalizeStatus(status: string): PaymentStatus {
    const statusLower = status.toLowerCase();
    
    // Map legacy status values to unified status
    const statusMap: Record<string, PaymentStatus> = {
      'succeeded': PaymentStatus.COMPLETED,
      'paid': PaymentStatus.COMPLETED,
      'success': PaymentStatus.COMPLETED,
      'complete': PaymentStatus.COMPLETED,
      'failed': PaymentStatus.FAILED,
      'failure': PaymentStatus.FAILED,
      'error': PaymentStatus.FAILED,
      'pending': PaymentStatus.PENDING,
      'cancelled': PaymentStatus.CANCELLED,
      'canceled': PaymentStatus.CANCELLED,
      'refunded': PaymentStatus.REFUNDED,
      'partially_refunded': PaymentStatus.PARTIALLY_REFUNDED,
    };

    return statusMap[statusLower] || PaymentStatus.PENDING;
  }
} 