#!/bin/bash

echo "🧪 Running Booking API Tests..."

# Run the e2e tests
npm run test:e2e -- --testPathPattern=booking-api.spec.ts

echo "✅ Tests completed!" 