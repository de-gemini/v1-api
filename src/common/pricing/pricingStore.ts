import { Injectable } from '@nestjs/common';
import {
  PRICING_CONFIG,
  roomTypes,
  addOns,
  frequencyOptions,
  frequencyBackendValues,
  PricingCalculator,
  Frequency,
  DirtLevel,
  ServiceType,
  RoomType,
  AddOn,
  getOneOffDetail,
  pricingService
} from './checkoutData';

// Interface for booking calculation state
export interface BookingCalculationState {
  // Step 1: Service Type & Frequency
  selectedType: number;
  selectedFrequency: number;
  selectedDate: string;
  hour: number;
  minute: number;
  
  // Step 2: Rooms & Add-ons
  roomCounts: { [key: string]: number };
  selectedAddOns: { [key: string]: number };
  
  // Additional Services
  ecoFriendly: boolean;
  hooverMop: boolean;
  disinfection: boolean;
  outdoorCleaning: boolean;
  laundry: boolean;
  errandHours: number;
  checkJob: boolean;
  havePets: boolean;
  keyPickup: boolean;
  endOfTenancy: boolean;
  expressStudio: boolean;
  
  // Dirt Level
  dirtLevel: string;
  
  // Customer Details
  name: string;
  surname: string;
  address: string;
  phone: string;
  comments: string;
}

@Injectable()
export class PricingStoreService {
  
  /**
   * Calculate estimated hours based on room counts and add-ons
   */
  calculateEstimatedHours(roomCounts: { [key: string]: number }, selectedAddOns: { [key: string]: number }): number {
    // Ensure we have valid objects
    const safeRoomCounts = roomCounts || {};
    const safeSelectedAddOns = selectedAddOns || {};
    
    console.log('🔍 Calculating hours with:', { safeRoomCounts, safeSelectedAddOns });
    
    const totalMinutes = PricingCalculator.calculateTotalMinutes(
      safeRoomCounts,
      safeSelectedAddOns,
      roomTypes,
      addOns
    );
    
    return PricingCalculator.calculateTotalHours(totalMinutes);
  }

  /**
   * Convert booking data to calculation state format
   */
  convertBookingDataToCalculationState(bookingData: any): BookingCalculationState {
    console.log('🔍 Converting booking data:', JSON.stringify(bookingData, null, 2));
    console.log('🔍 Backend received additional services:', {
      endOfTenancy: bookingData.endOfTenancy,
      endOftenancy: bookingData.endOftenancy,
      laundry: bookingData.laundry,
      ecoFriendly: bookingData.ecofriendlyProduct,
      hooverMop: bookingData.hooverMop,
      disinfection: bookingData.disinfection,
      outdoorCleaning: bookingData.outdoorCleaning,
      checkJob: bookingData.checkJob,
      havePets: bookingData.havePets,
      keyPickup: bookingData.whereToPickKey,
      expressStudio: bookingData.expressStudio,
      errandHours: bookingData.errandHours
    });
    
    // Convert rooms array to roomCounts object
    const roomCounts: { [key: string]: number } = {};
    if (bookingData.rooms && Array.isArray(bookingData.rooms)) {
      bookingData.rooms.forEach((room: any) => {
        if (room.type && typeof room.quantity === 'number') {
          roomCounts[room.type] = room.quantity;
        }
      });
    }
    
    console.log('🔍 Converted roomCounts:', roomCounts);

    // Convert add-ons if they exist
    const selectedAddOns: { [key: string]: number } = {};
    if (bookingData.addOns && Array.isArray(bookingData.addOns)) {
      bookingData.addOns.forEach((addon: any) => {
        if (addon.key && typeof addon.quantity === 'number') {
          selectedAddOns[addon.key] = addon.quantity;
        }
      });
    }
    
    console.log('🔍 Backend received add-ons:', bookingData.addOns);
    console.log('🔍 Converted selectedAddOns:', selectedAddOns);
    
    console.log('🔍 Converted selectedAddOns:', selectedAddOns);

    // Convert service type from string to number
    let selectedType = 0; // default to REGULAR_ONE_OFF
    if (bookingData.serviceType === 'end_of_tenancy') {
      selectedType = 1;
    } else if (bookingData.serviceType === 'carpet_upholstery') {
      selectedType = 2;
    }

    // Convert frequency from string to number
    let selectedFrequency = 3; // default to ONE_OFF
    if (bookingData.frequency === 'weekly') {
      selectedFrequency = 0;
    } else if (bookingData.frequency === 'fortnight') {
      selectedFrequency = 1;
    } else if (bookingData.frequency === 'monthly') {
      selectedFrequency = 2;
    }

    const result = {
      // Step 1: Service Type & Frequency
      selectedType,
      selectedFrequency,
      selectedDate: bookingData.scheduledDate ? new Date(bookingData.scheduledDate).toISOString().split('T')[0] : '',
      hour: bookingData.scheduledTime ? parseInt(bookingData.scheduledTime.split(':')[0]) : 9,
      minute: bookingData.scheduledTime ? parseInt(bookingData.scheduledTime.split(':')[1]) : 0,
      
      // Step 2: Rooms & Add-ons
      roomCounts,
      selectedAddOns,
      
      // Additional Services
      ecoFriendly: bookingData.ecofriendlyProduct || false,
      hooverMop: bookingData.hooverMop || false,
      disinfection: bookingData.disinfection || false,
      outdoorCleaning: bookingData.outdoorCleaning || false,
      laundry: bookingData.laundry || false,
      errandHours: bookingData.errandHours || 0,
      checkJob: bookingData.checkJob || false,
      havePets: bookingData.havePets || false,
      keyPickup: !!bookingData.whereToPickKey,
      endOfTenancy: bookingData.endOfTenancy || bookingData.endOftenancy || false,
      expressStudio: bookingData.expressStudio || false,
      
      // Dirt Level
      dirtLevel: bookingData.dirtLevel || 'medium',
      
      // Customer Details
      name: bookingData.name || '',
      surname: bookingData.surname || '',
      address: bookingData.address || '',
      phone: bookingData.phone || '',
      comments: bookingData.notes || '',
    };
    
    console.log('🔍 Final calculation state:', result);
    return result;
  }

  /**
   * Calculate estimated price for a booking
   */
  calculateEstimatedPrice(bookingData: any): number {
    // Convert booking data to calculation state format
    const state = this.convertBookingDataToCalculationState(bookingData);
    
    const hours = this.calculateEstimatedHours(state.roomCounts, state.selectedAddOns);
    console.log('🔍 Calculated hours:', hours);
    
    const additionalServices = {
      endOfTenancy: state.endOfTenancy,
      expressStudio: state.expressStudio,
      ecoFriendly: state.ecoFriendly,
      hooverMop: state.hooverMop,
      disinfection: state.disinfection,
      outdoorCleaning: state.outdoorCleaning,
      laundry: state.laundry,
      errandHours: state.errandHours,
      checkJob: state.checkJob,
      havePets: state.havePets,
      keyPickup: state.keyPickup,
    };
    
    console.log('🔍 Additional services:', additionalServices);
    console.log('🔍 Dirt level:', state.dirtLevel);
    
    const totalPrice = PricingCalculator.calculateTotalPrice(
      state.selectedFrequency as Frequency,
      hours,
      additionalServices,
      state.dirtLevel as DirtLevel
    );
    
    console.log('🔍 Total calculated price:', totalPrice);
    return totalPrice;
  }

  /**
   * Get detailed pricing breakdown
   */
  getPricingBreakdown(bookingData: any) {
    // Convert booking data to calculation state format
    const state = this.convertBookingDataToCalculationState(bookingData);
    
    const hours = this.calculateEstimatedHours(state.roomCounts, state.selectedAddOns);
    
    return PricingCalculator.getDetailedBreakdown(
      state.selectedFrequency as Frequency,
      hours,
      {
        endOfTenancy: state.endOfTenancy,
        expressStudio: state.expressStudio,
        ecoFriendly: state.ecoFriendly,
        hooverMop: state.hooverMop,
        disinfection: state.disinfection,
        outdoorCleaning: state.outdoorCleaning,
        laundry: state.laundry,
        errandHours: state.errandHours,
        checkJob: state.checkJob,
        havePets: state.havePets,
        keyPickup: state.keyPickup,
      },
      state.dirtLevel as DirtLevel
    );
  }

  /**
   * Validate booking state
   */
  validateBookingState(state: BookingCalculationState): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (state.selectedType === undefined || state.selectedType < 0) {
      errors.push('Service type is required');
    }

    if (state.selectedFrequency === undefined || state.selectedFrequency < 0) {
      errors.push('Frequency is required');
    }

    if (!state.selectedDate) {
      errors.push('Date is required');
    }

    // Validate room counts
    const totalRooms = Object.values(state.roomCounts).reduce((sum, count) => sum + count, 0);
    if (totalRooms === 0) {
      errors.push('At least one room must be selected');
    }

    // Validate additional services
    if (state.errandHours && state.errandHours < 0) {
      errors.push('Errand hours cannot be negative');
    }

    // Validate customer details
    if (!state.name?.trim()) {
      errors.push('Name is required');
    }

    if (!state.surname?.trim()) {
      errors.push('Surname is required');
    }

    if (!state.address?.trim()) {
      errors.push('Address is required');
    }

    if (!state.phone?.trim()) {
      errors.push('Phone number is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get service type string for backend
   */
  getServiceTypeString(selectedType: number): string {
    switch (selectedType) {
      case ServiceType.REGULAR_ONE_OFF:
        return 'regular_oneoff';
      case ServiceType.END_OF_TENANCY:
        return 'end_of_tenancy';
      case ServiceType.CARPET_UPHOLSTERY:
        return 'carpet_upholstery';
      default:
        return 'regular_oneoff';
    }
  }

  /**
   * Get frequency string for backend
   */
  getFrequencyString(selectedFrequency: number): string {
    return frequencyBackendValues[selectedFrequency] || 'onetime';
  }

  /**
   * Format rooms data for backend submission
   */
  formatRoomsForBackend(roomCounts: { [key: string]: number }) {
    return roomTypes
      .map((room) => ({
        type: room.type,
        quantity: roomCounts[room.type] || 0,
        estimatedTime: room.estimatedTime,
      }))
      .filter((room) => room.quantity > 0);
  }

  /**
   * Format add-ons data for backend submission
   */
  formatAddOnsForBackend(selectedAddOns: { [key: string]: number }) {
    return addOns
      .map((addon) => ({
        key: addon.key,
        quantity: selectedAddOns[addon.key] || 0,
        estimatedTime: addon.estimatedTime,
        price: addon.price,
      }))
      .filter((addon) => addon.quantity > 0);
  }

  /**
   * Get one-off detail based on date and time
   */
  getOneOffDetailInfo(selectedDate: string, hour: number, minute: number) {
    const date = new Date(selectedDate);
    return getOneOffDetail(date, hour, minute);
  }

  /**
   * Calculate total estimated time in minutes
   */
  calculateTotalEstimatedTime(roomCounts: { [key: string]: number }, selectedAddOns: { [key: string]: number }): number {
    return PricingCalculator.calculateTotalMinutes(
      roomCounts,
      selectedAddOns,
      roomTypes,
      addOns
    );
  }

  /**
   * Get all available room types
   */
  getRoomTypes(): RoomType[] {
    return roomTypes;
  }

  /**
   * Get all available add-ons
   */
  getAddOns(): AddOn[] {
    return addOns;
  }

  /**
   * Get frequency options
   */
  getFrequencyOptions() {
    return frequencyOptions;
  }

  /**
   * Get pricing configuration
   */
  getPricingConfig() {
    return PRICING_CONFIG;
  }

  /**
   * Test pricing calculations
   */
  testPricingCalculations() {
    return PricingCalculator.testCalculations();
  }

  /**
   * Validate pricing configuration
   */
  validatePricingConfig(): string[] {
    return pricingService.validatePricing();
  }
} 