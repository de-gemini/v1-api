# Booking Status Management

## Overview

The `status` and `paymentStatus` fields from the Booking document are now **completely eliminated** from all API responses. The Schedule document is the **only source of truth** for status information.

## What Changed

### 1. Schema Level Exclusion
In `booking.schema.ts`, the `status` and `paymentStatus` fields now have `select: false`:

```typescript
@Prop({ default: 'pending', select: false }) // Exclude from queries by default
status: string;

@Prop({ default: 'pending', select: false }) // Exclude from queries by default
paymentStatus: string;
```

### 2. Complete Elimination
- Removed all utility methods that included booking status
- Removed `.select('+status +paymentStatus')` from all service methods
- Booking status is **never** sent to the frontend

### 3. Single Source of Truth
Only the Schedule document provides status information:
- `schedule.status` - Current schedule status
- `schedule.paymentStatus` - Current schedule payment status

## Benefits

✅ **Complete Consistency**: Frontend only receives status from Schedule document  
✅ **Performance**: Less data transferred  
✅ **Maintainability**: Single source of truth for status  
✅ **No Confusion**: No ambiguity about which status to use  

## Frontend Impact

The frontend will **only** receive:
- `schedule.status` - Current schedule status
- `schedule.paymentStatus` - Current schedule payment status

The booking's status and paymentStatus are **never** sent to the frontend, completely eliminating any confusion about which status to use.

## Internal Operations

Booking status is still maintained in the database for internal business logic, but it's completely hidden from the frontend API responses. 