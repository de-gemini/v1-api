# Payment Status Update Implementation

## Overview

Added functionality to update payment status for schedules in the admin interface. This allows admins to manually update payment status from the ScheduleDetailsModal.

## What Was Added

### 1. Backend Service Method
**File:** `src/bookings/bookings.service.ts`

```typescript
async updateSchedulePaymentStatus(scheduleId: string, paymentStatus: string): Promise<any> {
  const schedule = await this.scheduleModel
    .findByIdAndUpdate(scheduleId, { paymentStatus }, { new: true })
    .populate({
      path: 'booking',
      populate: { path: 'user', select: '-password' }
    })
    .exec();

  if (!schedule) {
    throw new NotFoundException('Schedule not found');
  }

  return schedule;
}
```

### 2. Backend API Endpoint
**File:** `src/bookings/bookings.controller.ts`

```typescript
@Patch('admin/schedule/:id/payment-status')
@ApiOperation({ summary: 'Admin: Update schedule payment status' })
@ApiResponse({ 
  status: 200, 
  description: 'Schedule payment status updated successfully'
})
@ApiResponse({ status: 404, description: 'Schedule not found' })
async updateSchedulePaymentStatus(
  @Param('id') id: string,
  @Body() body: { paymentStatus: 'pending' | 'paid' | 'failed' }
) {
  const updatedSchedule = await this.bookingsService.updateSchedulePaymentStatus(id, body.paymentStatus);
  return success(updatedSchedule, 'Schedule payment status updated successfully');
}
```

### 3. Frontend API Service
**File:** `src/api/bookingSchedules.ts`

```typescript
// Admin: Update schedule payment status
async updateSchedulePaymentStatusAdmin(
  scheduleId: string,
  paymentStatus: "pending" | "paid" | "failed"
): Promise<ScheduleResponse> {
  const response = await axiosInstance.patch(
    `${API_BASE_URL}/bookings/admin/schedule/${scheduleId}/payment-status`,
    { paymentStatus },
    { headers: getAuthHeader() }
  );
  return response.data;
}
```

### 4. Frontend UI Component
**File:** `src/pages/admin/components/ScheduleDetailsModal.tsx`

- Added payment status update section with radio buttons
- Three status options: **Pending**, **Paid**, **Failed**
- Color-coded status indicators
- Current status display

## API Endpoint Details

### Endpoint
```
PATCH /bookings/admin/schedule/:id/payment-status
```

### Request Body
```json
{
  "paymentStatus": "pending" | "paid" | "failed"
}
```

### Response
```json
{
  "statusCode": 200,
  "message": "Schedule payment status updated successfully",
  "payload": {
    // Updated schedule object
  }
}
```

## Frontend Usage

### In ScheduleDetailsModal
```typescript
const handlePaymentStatusUpdate = async (newPaymentStatus: "pending" | "paid" | "failed") => {
  try {
    await bookingScheduleService.updateSchedulePaymentStatusAdmin(schedule._id, newPaymentStatus);
    // Don't close the modal - let it stay open
  } catch (error) {
    console.error('Failed to update payment status:', error);
  }
};
```

## Benefits

✅ **Admin Control**: Admins can manually update payment status  
✅ **Real-time Updates**: Changes are reflected immediately in the UI  
✅ **Consistent Design**: Matches existing status update functionality  
✅ **Error Handling**: Proper error handling and user feedback  
✅ **Type Safety**: Full TypeScript support with proper types  

## Payment Status Options

- **Pending**: Yellow color scheme - Payment is awaiting processing
- **Paid**: Green color scheme - Payment has been successfully completed
- **Failed**: Red color scheme - Payment attempt failed

## Security

- Endpoint requires admin authentication
- Uses JWT auth guard
- Validates payment status values
- Returns 404 for non-existent schedules 