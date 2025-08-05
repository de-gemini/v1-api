/**
 * Payment Status Service
 * 
 * This service provides unified payment status handling across the application.
 * It ensures consistent payment status management and provides helper methods
 * for status validation, normalization, and business logic.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentStatus, PaymentStatusHelper } from '../constants/payment-status.enum';
import { Schedule, ScheduleDocument } from '../../bookings/schemas/schedule.schema';
import { Payment, PaymentDocument } from '../../payments/schemas/payment.schema';

@Injectable()
export class PaymentStatusService {
  private readonly logger = new Logger(PaymentStatusService.name);

  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  /**
   * Update payment status for a schedule
   */
  async updateSchedulePaymentStatus(
    scheduleId: string, 
    status: string, 
    metadata?: Record<string, any>
  ): Promise<ScheduleDocument> {
    const normalizedStatus = PaymentStatusHelper.normalizeStatus(status);
    
    this.logger.log(`Updating schedule ${scheduleId} payment status to: ${normalizedStatus}`);
    
    const updatedSchedule = await this.scheduleModel.findByIdAndUpdate(
      scheduleId,
      { 
        paymentStatus: normalizedStatus,
        ...(metadata && { paymentMetadata: metadata })
      },
      { new: true }
    ).populate({
      path: 'booking',
      populate: { path: 'user', select: '-password' }
    });

    if (!updatedSchedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    this.logger.log(`Successfully updated schedule ${scheduleId} payment status to: ${normalizedStatus}`);
    return updatedSchedule;
  }

  /**
   * Update payment status for all schedules of a booking
   */
  async updateBookingSchedulesPaymentStatus(
    bookingId: string, 
    status: string, 
    metadata?: Record<string, any>
  ): Promise<{ modifiedCount: number }> {
    const normalizedStatus = PaymentStatusHelper.normalizeStatus(status);
    
    this.logger.log(`Updating all schedules for booking ${bookingId} payment status to: ${normalizedStatus}`);
    
    const result = await this.scheduleModel.updateMany(
      { booking: bookingId },
      { 
        paymentStatus: normalizedStatus,
        ...(metadata && { paymentMetadata: metadata })
      }
    );

    this.logger.log(`Successfully updated ${result.modifiedCount} schedules for booking ${bookingId}`);
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Create a payment record with unified status
   */
  async createPaymentRecord(data: {
    bookingId: string;
    userId: string;
    amount: number;
    status: string;
    type: string;
    scheduleId?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentDocument> {
    const normalizedStatus = PaymentStatusHelper.normalizeStatus(data.status);
    
    this.logger.log(`Creating payment record for booking ${data.bookingId} with status: ${normalizedStatus}`);
    
    const payment = await this.paymentModel.create({
      booking: data.bookingId,
      user: data.userId,
      amount: data.amount,
      status: normalizedStatus,
      type: data.type,
      schedule: data.scheduleId,
      ...(data.metadata && { metadata: data.metadata })
    });

    this.logger.log(`Successfully created payment record ${payment._id} with status: ${normalizedStatus}`);
    return payment;
  }

  /**
   * Get payment status summary for a booking
   */
  async getBookingPaymentSummary(bookingId: string): Promise<{
    totalSchedules: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
    overallStatus: PaymentStatus;
  }> {
    const schedules = await this.scheduleModel.find({ booking: bookingId });
    
    const summary = {
      totalSchedules: schedules.length,
      completedPayments: schedules.filter(s => s.paymentStatus === PaymentStatus.COMPLETED).length,
      pendingPayments: schedules.filter(s => s.paymentStatus === PaymentStatus.PENDING).length,
      failedPayments: schedules.filter(s => PaymentStatusHelper.isFailed(s.paymentStatus)).length,
      overallStatus: PaymentStatus.PENDING
    };

    // Determine overall status
    if (summary.completedPayments === summary.totalSchedules) {
      summary.overallStatus = PaymentStatus.COMPLETED;
    } else if (summary.failedPayments > 0) {
      summary.overallStatus = PaymentStatus.FAILED;
    }

    return summary;
  }

  /**
   * Validate if a payment status transition is allowed
   */
  validateStatusTransition(
    currentStatus: string, 
    newStatus: string
  ): { isValid: boolean; reason?: string } {
    const normalizedCurrent = PaymentStatusHelper.normalizeStatus(currentStatus);
    const normalizedNew = PaymentStatusHelper.normalizeStatus(newStatus);

    // Define allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      [PaymentStatus.PENDING]: [PaymentStatus.COMPLETED, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
      [PaymentStatus.COMPLETED]: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED],
      [PaymentStatus.FAILED]: [PaymentStatus.PENDING], // Allow retry
      [PaymentStatus.CANCELLED]: [PaymentStatus.PENDING], // Allow reactivation
      [PaymentStatus.REFUNDED]: [], // No further transitions
      [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.REFUNDED],
    };

    const allowed = allowedTransitions[normalizedCurrent] || [];
    const isValid = allowed.includes(normalizedNew);

    return {
      isValid,
      reason: isValid ? undefined : `Invalid transition from ${normalizedCurrent} to ${normalizedNew}`
    };
  }

  /**
   * Get display information for a payment status
   */
  getStatusDisplayInfo(status: string): {
    displayText: string;
    cssClass: string;
    isSuccessful: boolean;
    isFailed: boolean;
    isPending: boolean;
  } {
    const normalizedStatus = PaymentStatusHelper.normalizeStatus(status);
    
    return {
      displayText: PaymentStatusHelper.getDisplayText(normalizedStatus),
      cssClass: PaymentStatusHelper.getStatusClass(normalizedStatus),
      isSuccessful: PaymentStatusHelper.isSuccessful(normalizedStatus),
      isFailed: PaymentStatusHelper.isFailed(normalizedStatus),
      isPending: PaymentStatusHelper.isPending(normalizedStatus),
    };
  }

  /**
   * Check if a payment status indicates a successful payment
   */
  isPaymentSuccessful(status: string): boolean {
    return PaymentStatusHelper.isSuccessful(status);
  }

  /**
   * Check if a payment status indicates a failed payment
   */
  isPaymentFailed(status: string): boolean {
    return PaymentStatusHelper.isFailed(status);
  }

  /**
   * Check if a payment status indicates a pending payment
   */
  isPaymentPending(status: string): boolean {
    return PaymentStatusHelper.isPending(status);
  }

  /**
   * Normalize a payment status to the unified format
   */
  normalizeStatus(status: string): PaymentStatus {
    return PaymentStatusHelper.normalizeStatus(status);
  }
} 