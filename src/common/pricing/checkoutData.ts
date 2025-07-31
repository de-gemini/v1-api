// Centralized pricing configuration
export enum DirtLevel {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy'
}


export const PRICING_CONFIG = {
// Base hourly rates - Updated to Gemini pricing
baseHourlyRate: 17.99, // Changed from 19 to 17.99

// Minimum hours for booking (easily configurable)
minimumHours: 1,

// Minimum prices for each service type - Updated to Gemini pricing
minimumPrices: {
  regularCleaning: 50,      // Regular/One-off cleaning minimum - Changed from 87 to 50
  endOfTenancy: 130,        // End of Tenancy minimum - Changed from 145 to 130
  carpetUpholstery: 80,     // Carpet & Upholstery minimum - Changed from 96 to 80
},

// Frequency discounts (as percentages) - Updated to reflect new base rate
frequencyDiscounts: {
  weekly: 0.111,      // 11.1% discount (17.99 -> 15.99)
  fortnightly: 0.056, // 5.6% discount (17.99 -> 16.99)  
  monthly: 0.0,       // 0% discount (17.99 -> 17.99)
},

// Additional service costs
additionalServices: {
  endOfTenancy: 39,
  expressStudio: 25, // fixed
  ecoFriendly: 15,
  hooverMop: 10,
  disinfection: 20,
  outdoorCleaning: 30, // fixed
  laundry: 9, // fixed service
  errandHours: 25, // per hour
  checkJob: 15,
  havePets: 10,
  keyPickup: 5,
},

// Dirt level multipliers
dirtLevelMultipliers: {
  light: 1.0,
  medium: 1.25,
  heavy: 1.8,
},




// Plan durations and colors
plans: [
  { months: '1', cashback: '£50', color: 'bg-green-100 text-green-800' },
  { months: '3', cashback: '£100', color: 'bg-blue-100 text-blue-800' },
  { months: '6', cashback: '£150', color: 'bg-purple-100 text-purple-800' },
],
} as const;

// Type-safe enums to replace magic numbers
export enum Frequency {
WEEKLY = 0,
FORTNIGHTLY = 1,
MONTHLY = 2,
ONE_OFF = 3
}

export enum ServiceType {
REGULAR_ONE_OFF = 0,
END_OF_TENANCY = 1,
CARPET_UPHOLSTERY = 2
}



// Type definitions for better type safety
export interface RoomType {
type: string;
label: string;
estimatedTime: number;
icon: string;
}

export interface AddOn {
key: string;
label: string;
estimatedTime: number;
price?: number;
yesNo?: boolean;
icon: string;
}

export interface PricingState {
frequency: Frequency;
hours: number;
endOfTenancy?: boolean;
expressStudio?: boolean;
ecoFriendly?: boolean;
hooverMop?: boolean;
disinfection?: boolean;
outdoorCleaning?: boolean;
errandHours?: number;
checkJob?: boolean;
havePets?: boolean;
keyPickup?: boolean;
dirtLevel?: DirtLevel;
}

// Helper functions for calculations
export const calculatePrice = {
// Calculate base price for frequency
getBasePrice: (frequency: Frequency, hours: number = 2) => {
  const basePrice = PRICING_CONFIG.baseHourlyRate * hours;
  
  switch (frequency) {
    case Frequency.WEEKLY:
      return basePrice * (1 - PRICING_CONFIG.frequencyDiscounts.weekly);
    case Frequency.FORTNIGHTLY:
      return basePrice * (1 - PRICING_CONFIG.frequencyDiscounts.fortnightly);
    case Frequency.MONTHLY:
      return basePrice * (1 - PRICING_CONFIG.frequencyDiscounts.monthly);
    case Frequency.ONE_OFF:
      return basePrice;
    default:
      return basePrice;
  }
},

// Calculate additional services cost
getAdditionalServicesCost: (services: {
  endOfTenancy?: boolean;
  expressStudio?: boolean;
  ecoFriendly?: boolean;
  hooverMop?: boolean;
  disinfection?: boolean;
  outdoorCleaning?: boolean;
  laundry?: boolean;
  errandHours?: number;
  checkJob?: boolean;
  havePets?: boolean;
  keyPickup?: boolean;
}) => {
  let total = 0;
  
  if (services.endOfTenancy) total += PRICING_CONFIG.additionalServices.endOfTenancy;
  if (services.expressStudio) total += PRICING_CONFIG.additionalServices.expressStudio;
  if (services.ecoFriendly) total += PRICING_CONFIG.additionalServices.ecoFriendly;
  if (services.hooverMop) total += PRICING_CONFIG.additionalServices.hooverMop;
  if (services.disinfection) total += PRICING_CONFIG.additionalServices.disinfection;
  if (services.outdoorCleaning) total += PRICING_CONFIG.additionalServices.outdoorCleaning;
  if (services.laundry) total += PRICING_CONFIG.additionalServices.laundry;
  if (services.errandHours) total += PRICING_CONFIG.additionalServices.errandHours * services.errandHours;
  if (services.checkJob) total += PRICING_CONFIG.additionalServices.checkJob;
  if (services.havePets) total += PRICING_CONFIG.additionalServices.havePets;
  if (services.keyPickup) total += PRICING_CONFIG.additionalServices.keyPickup;
  
  return total;
},

// Apply dirt level multiplier
applyDirtLevelMultiplier: (basePrice: number, dirtLevel: DirtLevel) => {
  return basePrice * PRICING_CONFIG.dirtLevelMultipliers[dirtLevel];
},

// Get formatted price string
formatPrice: (price: number) => {
  return `£${price.toFixed(2)}`;
},

// Get hourly rate display
getHourlyRateDisplay: (frequency: Frequency) => {
  const baseRate = PRICING_CONFIG.baseHourlyRate;
  
  switch (frequency) {
    case Frequency.WEEKLY:
      return calculatePrice.formatPrice(baseRate * (1 - PRICING_CONFIG.frequencyDiscounts.weekly));
    case Frequency.FORTNIGHTLY:
      return calculatePrice.formatPrice(baseRate * (1 - PRICING_CONFIG.frequencyDiscounts.fortnightly));
    case Frequency.MONTHLY:
      return calculatePrice.formatPrice(baseRate * (1 - PRICING_CONFIG.frequencyDiscounts.monthly));
    case Frequency.ONE_OFF:
      return `from £${baseRate}/h`;
    default:
      return `from £${baseRate}/h`;
  }
},

// Calculate minimum price based on configuration
getMinimumPrice: (frequency: Frequency = Frequency.ONE_OFF) => {
  const baseRate = PRICING_CONFIG.baseHourlyRate;
  const minimumHours = PRICING_CONFIG.minimumHours;
  
  switch (frequency) {
    case Frequency.WEEKLY:
      return Math.round(baseRate * minimumHours * (1 - PRICING_CONFIG.frequencyDiscounts.weekly));
    case Frequency.FORTNIGHTLY:
      return Math.round(baseRate * minimumHours * (1 - PRICING_CONFIG.frequencyDiscounts.fortnightly));
    case Frequency.MONTHLY:
      return Math.round(baseRate * minimumHours * (1 - PRICING_CONFIG.frequencyDiscounts.monthly));
    case Frequency.ONE_OFF:
      return Math.round(baseRate * minimumHours);
    default:
      return Math.round(baseRate * minimumHours);
  }
},
};

// Comprehensive pricing service for total calculations
export const pricingService = {
// Calculate total price for a booking
calculateTotalPrice: (options: {
  frequency: Frequency;
  hours?: number;
  endOfTenancy?: boolean;
  expressStudio?: boolean;
  ecoFriendly?: boolean;
  hooverMop?: boolean;
  disinfection?: boolean;
  outdoorCleaning?: boolean;
  laundry?: boolean;
  errandHours?: number;
  checkJob?: boolean;
  havePets?: boolean;
  keyPickup?: boolean;
  dirtLevel?: DirtLevel;
}) => {
  // Get base price
  let totalPrice = calculatePrice.getBasePrice(options.frequency, options.hours || 2);
  
  // Add additional services
  const additionalServicesCost = calculatePrice.getAdditionalServicesCost({
    endOfTenancy: options.endOfTenancy,
    expressStudio: options.expressStudio,
    ecoFriendly: options.ecoFriendly,
    hooverMop: options.hooverMop,
    disinfection: options.disinfection,
    outdoorCleaning: options.outdoorCleaning,
    laundry: options.laundry,
    errandHours: options.errandHours,
    checkJob: options.checkJob,
    havePets: options.havePets,
    keyPickup: options.keyPickup,
  });
  
  totalPrice += additionalServicesCost;
  
  // Apply dirt level multiplier
  if (options.dirtLevel) {
    totalPrice = calculatePrice.applyDirtLevelMultiplier(totalPrice, options.dirtLevel);
  }
  
  return totalPrice;
},

// Get breakdown of all costs
getPriceBreakdown: (options: {
  frequency: Frequency;
  hours?: number;
  endOfTenancy?: boolean;
  expressStudio?: boolean;
  ecoFriendly?: boolean;
  hooverMop?: boolean;
  disinfection?: boolean;
  outdoorCleaning?: boolean;
  laundry?: boolean;
  errandHours?: number;
  checkJob?: boolean;
  havePets?: boolean;
  keyPickup?: boolean;
  dirtLevel?: DirtLevel;
}) => {
  const basePrice = calculatePrice.getBasePrice(options.frequency, options.hours || 2);
  const additionalServicesCost = calculatePrice.getAdditionalServicesCost({
    endOfTenancy: options.endOfTenancy,
    expressStudio: options.expressStudio,
    ecoFriendly: options.ecoFriendly,
    hooverMop: options.hooverMop,
    disinfection: options.disinfection,
    outdoorCleaning: options.outdoorCleaning,
    laundry: options.laundry,
    errandHours: options.errandHours,
    checkJob: options.checkJob,
    havePets: options.havePets,
    keyPickup: options.keyPickup,
  });
  
  let finalPrice = basePrice + additionalServicesCost;
  
  if (options.dirtLevel) {
    finalPrice = calculatePrice.applyDirtLevelMultiplier(finalPrice, options.dirtLevel);
  }
  
  return {
    basePrice: calculatePrice.formatPrice(basePrice),
    additionalServices: calculatePrice.formatPrice(additionalServicesCost),
    dirtLevelMultiplier: options.dirtLevel ? `${((PRICING_CONFIG.dirtLevelMultipliers[options.dirtLevel] - 1) * 100).toFixed(0)}%` : '0%',
    totalPrice: calculatePrice.formatPrice(finalPrice),
    breakdown: {
      basePrice,
      additionalServicesCost,
      dirtLevelMultiplier: options.dirtLevel ? PRICING_CONFIG.dirtLevelMultipliers[options.dirtLevel] : 1,
      finalPrice
    }
  };
},


// Validate pricing configuration
validatePricing: () => {
  const errors: string[] = [];
  
  if (PRICING_CONFIG.baseHourlyRate <= 0) {
    errors.push('Base hourly rate must be greater than 0');
  }
  
  Object.entries(PRICING_CONFIG.frequencyDiscounts).forEach(([key, value]) => {
    if (value < 0 || value > 1) {
      errors.push(`${key} discount must be between 0 and 1`);
    }
  });
  
  Object.entries(PRICING_CONFIG.additionalServices).forEach(([key, value]) => {
    if (value < 0) {
      errors.push(`${key} service cost cannot be negative`);
    }
  });
  
  return errors;
}
};

// Dedicated Pricing Calculator Class
export class PricingCalculator {
/**
 * Calculate total minutes from rooms and add-ons only
 */
static calculateTotalMinutes(
  roomCounts: { [key: string]: number },
  selectedAddOns: { [key: string]: number },
  roomTypes: RoomType[],
  addOnsList: AddOn[]
): number {
  const roomMinutes = Object.entries(roomCounts).reduce((sum, [type, count]) => {
    const room = roomTypes.find(r => r.type === type);
    return sum + count * (room?.estimatedTime || 0);
  }, 0);
  
  const addOnMinutes = Object.entries(selectedAddOns).reduce((sum, [key, count]) => {
    // Skip outdoor cleaning as it's now handled as a boolean
    if (key === 'outdoor') return sum;
    const addOn = addOnsList.find(a => a.key === key);
    return sum + count * (addOn?.estimatedTime || 0);
  }, 0);
  
  return roomMinutes + addOnMinutes;
}

/**
 * Calculate total hours from minutes
 */
static calculateTotalHours(totalMinutes: number): number {
  return Math.round(totalMinutes / 60 * 10) / 10;
}

/**
 * Calculate base price for given frequency and hours
 */
static calculateBasePrice(frequency: Frequency, hours: number): number {
  return calculatePrice.getBasePrice(frequency, hours);
}

/**
 * Calculate additional services cost
 */
static calculateAdditionalServicesCost(services: {
  endOfTenancy?: boolean;
  expressStudio?: boolean;
  ecoFriendly?: boolean;
  hooverMop?: boolean;
  disinfection?: boolean;
  outdoorCleaning?: boolean;
  laundry?: boolean;
  errandHours?: number;
  checkJob?: boolean;
  havePets?: boolean;
  keyPickup?: boolean;
}): number {
  return calculatePrice.getAdditionalServicesCost(services);
}

/**
 * Calculate total price with all components
 */
static calculateTotalPrice(
  frequency: Frequency,
  hours: number,
  additionalServices: {
    endOfTenancy?: boolean;
    expressStudio?: boolean;
    ecoFriendly?: boolean;
    hooverMop?: boolean;
    disinfection?: boolean;
    outdoorCleaning?: boolean;
    laundry?: boolean;
    errandHours?: number;
    checkJob?: boolean;
    havePets?: boolean;
    keyPickup?: boolean;
  },
  dirtLevel?: DirtLevel
): number {
  let totalPrice = this.calculateBasePrice(frequency, hours);
  totalPrice += this.calculateAdditionalServicesCost(additionalServices);
  
  if (dirtLevel) {
    totalPrice = calculatePrice.applyDirtLevelMultiplier(totalPrice, dirtLevel);
  }
  
  return totalPrice;
}

/**
 * Get detailed pricing breakdown
 */
static getDetailedBreakdown(
  frequency: Frequency,
  hours: number,
  additionalServices: {
    endOfTenancy?: boolean;
    expressStudio?: boolean;
    ecoFriendly?: boolean;
    hooverMop?: boolean;
    disinfection?: boolean;
    outdoorCleaning?: boolean;
    laundry?: boolean;
    errandHours?: number;
    checkJob?: boolean;
    havePets?: boolean;
    keyPickup?: boolean;
  },
  dirtLevel?: DirtLevel
) {
  const basePrice = this.calculateBasePrice(frequency, hours);
  const additionalServicesCost = this.calculateAdditionalServicesCost(additionalServices);
  
  let finalPrice = basePrice + additionalServicesCost;
  
  if (dirtLevel) {
    finalPrice = calculatePrice.applyDirtLevelMultiplier(finalPrice, dirtLevel);
  }
  
  return {
    basePrice: calculatePrice.formatPrice(basePrice),
    additionalServicesCost: calculatePrice.formatPrice(additionalServicesCost),
    dirtLevelAdjustment: dirtLevel ? calculatePrice.formatPrice(finalPrice - basePrice - additionalServicesCost) : '£0.00',
    finalPrice: calculatePrice.formatPrice(finalPrice),
    breakdown: {
      basePrice,
      additionalServicesCost,
      dirtLevelMultiplier: dirtLevel ? PRICING_CONFIG.dirtLevelMultipliers[dirtLevel] : 1,
      finalPrice
    }
  };
}

/**
 * Validate pricing state
 */
static validatePricingState(state: PricingState): string[] {
  const errors: string[] = [];
  
  if (state.hours <= 0) {
    errors.push('Hours must be greater than 0');
  }
  
  if (state.errandHours && state.errandHours < 0) {
    errors.push('Errand hours cannot be negative');
  }
  
  return errors;
}

/**
 * Test function to verify calculations work correctly
 */
static testCalculations() {
  const testRoomCounts = { bedroom: 2, bathroom: 1 };
  const testAddOns = { deep_cleaning: 1 };
  
  const totalMinutes = this.calculateTotalMinutes(
    testRoomCounts,
    testAddOns,
    roomTypes,
    addOns
  );
  
  const totalHours = this.calculateTotalHours(totalMinutes);
  const totalPrice = this.calculateTotalPrice(
    Frequency.ONE_OFF,
    totalHours,
    { ecoFriendly: true, disinfection: true },
    DirtLevel.MEDIUM
  );
  
  console.log('🧪 PricingCalculator Test Results:', {
    totalMinutes,
    totalHours,
    totalPrice,
    breakdown: this.getDetailedBreakdown(
      Frequency.ONE_OFF,
      totalHours,
      { ecoFriendly: true, disinfection: true },
      DirtLevel.MEDIUM
    )
  });
  
  return { totalMinutes, totalHours, totalPrice };
}
}

export const cleaningTypes = [
  "One-Off / Regular / Carpet&Upholstery",
  "End of Tenancy",
  "Carpet&Upholstery only",
];

export interface DayAvailabilityResponse {
  statusCode: number;
  message: string;
  payload: string[] | null;
}

export const frequencyOptions = [
  {
    label: "Weekly",
    price: 15.99, // Changed from 17 to 15.99
    cashback: true,
    features: [
      "Background-checked professionals",
      "Replacement of the cleaner if you are not happy",
      "Helpful customer service",
      "Free rescheduling up to 24 hours prior the service",
    ],
  },
  {
    label: "Fortnightly",
    price: 16.99, // Changed from 18 to 16.99
    cashback: true,
    best: true,
    features: [
      "Background-checked professionals",
      "Replacement of the cleaner if you are not happy",
      "Helpful customer service",
      "Free rescheduling up to 24 hours prior the service",
    ],
  },
  {
    label: "Monthly",
    price: 17.99, // Changed from 19 to 17.99
    cashback: true,
    features: [
      "Background-checked professionals",
      "Replacement of the cleaner if you are not happy",
      "Helpful customer service",
      "Free rescheduling up to 24 hours prior the service",
    ],
  },
  {
    label: "One – Off",
    price: 17.99, // Changed from 19 to 17.99
    oneOffDetails: [
      { label: "Next day", price: 17.99, desc: "Any day from tomorrow (8 am - 9 pm)" }, // Changed from 19 to 17.99
      { label: "Same day", price: 25.99, desc: "Today, in 4h minimum (8 am - 9 pm)" }, // Changed from 29 to 25.99
      { label: "Peak", price: 18.99, desc: "High demand" }, // Changed from 20 to 18.99
      { label: "Night", price: 25.99, desc: "Any day (9 pm - 8 am)" }, // Changed from 29 to 25.99
    ],
  },
];

export const frequencyBackendValues = ["weekly", "fortnight", "monthly", "onetime"];

export const roomTypes = [
  { type: "bedroom", label: "Bedroom", estimatedTime: 25, icon: "https://www.emop.co.uk/static/images/steps_booking/bedroom.svg" },
  { type: "living_room", label: "Living/Dining room", estimatedTime: 30, icon: "https://www.emop.co.uk/static/images/steps_booking/living_dining.svg" },
  { type: "bathroom", label: "Bathroom", estimatedTime: 45, icon: "https://www.emop.co.uk/static/images/steps_booking/bathroom.svg" },
  { type: "hall", label: "Hall", estimatedTime: 10, icon: "https://www.emop.co.uk/static/images/steps_booking/hall.svg" },
  { type: "staircase", label: "Staircase", estimatedTime: 15, icon: "https://www.emop.co.uk/static/images/steps_booking/stairs.svg" },
  { type: "toilet", label: "Toilet", estimatedTime: 15, icon: "https://www.emop.co.uk/static/images/steps_booking/toilet.svg" },
  { type: "kitchen", label: "Kitchen", estimatedTime: 45, icon: "https://www.emop.co.uk/static/images/steps_booking/kitchen.svg" },
  { type: "office", label: "Office room", estimatedTime: 20, icon: "https://www.emop.co.uk/static/images/steps_booking/office.svg" },
  { type: "conservatory", label: "Conservatory", estimatedTime: 25, icon: "https://www.emop.co.uk/static/images/steps_booking/conservatory.svg" },
  { type: "garage", label: "Garage", estimatedTime: 30, icon: "https://www.emop.co.uk/static/images/bookAgain/Garage.svg" },
];

export const addOns = [
  { key: "fridge", label: "Fridge (inside)", estimatedTime: 30, icon: "https://www.emop.co.uk/static/images/steps_booking/fridge_inside.svg" },
  { key: "windows", label: "Windows (inside)", estimatedTime: 20, icon: "https://www.emop.co.uk/static/images/steps_booking/windows.svg" },
  { key: "ironing", label: "Ironing", estimatedTime: 60, icon: "https://www.emop.co.uk/static/images/steps_booking/Ironing.svg" },
  { key: "laundry", label: "Laundry", estimatedTime: 0, icon: "https://www.emop.co.uk/static/images/steps_booking/Laundry.svg", yesNo: true },
  { key: "microwave", label: "Microwave (inside)", estimatedTime: 10, icon: "https://www.emop.co.uk/static/images/steps_booking/microwave.svg" },
  { key: "kitchen_inside", label: "Kitchen (inside)", estimatedTime: 60, icon: "https://www.emop.co.uk/static/images/steps_booking/kitchen_inside.svg" },
  { key: "bed_making", label: "Bed making", estimatedTime: 10, icon: "https://www.emop.co.uk/static/images/steps_booking/bed_making.svg" },
  { key: "bookcase", label: "Bookcase", estimatedTime: 25, icon: "https://www.emop.co.uk/static/images/steps_booking/bookcase.svg" },
  { key: "oven", label: "Oven", estimatedTime: 30, icon: "https://www.emop.co.uk/static/images/steps_booking/Oven.svg", price: 25, yesNo: true },
  { key: "oven_grill", label: "Oven & Grill", estimatedTime: 45, icon: "https://www.emop.co.uk/static/images/steps_booking/Ovenandgrill.svg", price: 35, yesNo: true },
  { key: "outdoor", label: "Outdoor cleaning", estimatedTime: 0, icon: "https://www.emop.co.uk/static/images/bookAgain/Outdoor_cleaning.svg", yesNo: true },
];

/**
* Determines the correct one-off detail based on selected date/time.
* @param selectedDate Date object for the booking
* @param hour Hour (0-23)
* @param minute Minute (0-59)
* @returns The matching oneOffDetail object
*/
export function getOneOffDetail(selectedDate: Date, hour: number, minute: number) {
const now = new Date();
const bookingDate = new Date(selectedDate);
bookingDate.setHours(hour, minute, 0, 0);

// Calculate time difference in ms
const diffMs = bookingDate.getTime() - now.getTime();
const diffHours = diffMs / (1000 * 60 * 60);

// Night cleaning: 20:00 - 06:00
const isNight = hour >= 20 || hour < 6;

const details = frequencyOptions[3].oneOffDetails;
const fallback = details?.[0] || { label: 'Standard', price: 17.99, desc: 'Standard one-off cleaning' }; // Updated from 19 to 17.99

// Helper to safely find a detail
const safeFind = (label: string) => details?.find((d: any) => d.label === label) || fallback;

// Same day
if (
  bookingDate.toDateString() === now.toDateString() &&
  diffHours > 0
) {
  if (isNight) {
    return safeFind("Night");
  }
  return safeFind("Same day");
}

// Next day
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
if (
  bookingDate.toDateString() === tomorrow.toDateString()
) {
  if (isNight) {
    return safeFind("Night");
  }
  return safeFind("Next day");
}

// Night cleaning (for any other day)
if (isNight) {
  return safeFind("Night");
}

// Peak (weekends)
const isWeekend = bookingDate.getDay() === 0 || bookingDate.getDay() === 6;
if (isWeekend) {
  return safeFind("Peak");
}

// Default: Standard
return safeFind("Next day");
}
