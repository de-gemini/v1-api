# Money Field Rounding Implementation

## Overview

All money fields in the database are now automatically rounded to 2 decimal places when fetched from the database. This is implemented at the schema level using Mongoose getters and setters.

## What Changed

### 1. Booking Schema (`booking.schema.ts`)
Updated the following fields to automatically round to 2 decimal places:

```typescript
@Prop({ 
  required: true,
  get: (val: number) => val ? Math.round(val * 100) / 100 : val,
  set: (val: number) => val ? Math.round(val * 100) / 100 : val
})
estimatedPrice: number;

@Prop({ 
  get: (val: number) => val ? Math.round(val * 100) / 100 : val,
  set: (val: number) => val ? Math.round(val * 100) / 100 : val
})
actualPrice: number;

@Prop({ 
  required: false,
  get: (val: number) => val ? Math.round(val * 100) / 100 : val,
  set: (val: number) => val ? Math.round(val * 100) / 100 : val
})
serverPrice?: number;

@Prop({ 
  required: false,
  get: (val: number) => val ? Math.round(val * 100) / 100 : val,
  set: (val: number) => val ? Math.round(val * 100) / 100 : val
})
clientPrice?: number;
```

### 2. Payment Schema (`payment.schema.ts`)
Updated the amount field:

```typescript
@Prop({ 
  required: true,
  get: (val: number) => val ? Math.round(val * 100) / 100 : val,
  set: (val: number) => val ? Math.round(val * 100) / 100 : val
})
amount: number;
```

### 3. Schema Configuration
Added getter configuration to both schemas:

```typescript
// Enable getters so money fields are automatically rounded to 2dp when fetched
BookingSchema.set('toJSON', { getters: true });
BookingSchema.set('toObject', { getters: true });
```

## How It Works

### Getter Function
```typescript
get: (val: number) => val ? Math.round(val * 100) / 100 : val
```
- Multiplies by 100 to shift decimal places
- Uses `Math.round()` to round to nearest integer
- Divides by 100 to restore decimal places
- Handles null/undefined values safely

### Setter Function
```typescript
set: (val: number) => val ? Math.round(val * 100) / 100 : val
```
- Same logic as getter
- Ensures data is rounded when saved to database

## Benefits

✅ **Automatic**: No need to remember to round money values  
✅ **Consistent**: All money fields follow the same 2dp rule  
✅ **Performance**: No middleware overhead  
✅ **Reliable**: Works for all database operations (find, save, update)  
✅ **Safe**: Handles null/undefined values gracefully  

## Examples

### Before (floating point precision issues)
```javascript
// Database: 25.999999999999999
// API Response: 25.999999999999999
```

### After (automatically rounded)
```javascript
// Database: 25.999999999999999
// API Response: 26.00
```

## Affected Fields

### Booking Schema
- `estimatedPrice`
- `actualPrice` 
- `serverPrice`
- `clientPrice`

### Payment Schema
- `amount`

## Frontend Impact

The frontend will now receive all money values properly rounded to 2 decimal places without any additional processing needed. 