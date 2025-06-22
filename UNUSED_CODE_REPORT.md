# Unused Code Report - Noctua Forest

## Backend Routes (Not Mounted in api.ts)
The following route files exist but are not mounted in the main API router:

### Payment & Commerce
- `paymentRoutes.ts` - Stripe payment routes
- `stripeRoutes.ts` - Additional Stripe functionality 
- `cryptoPaymentRoutes.ts` - ✅ **ACTIVE** - Cryptocurrency payments

### Admin & Metrics
- `adminRoutes.ts` - Admin functionality
- `metricsRoutes.ts` - Analytics endpoints
- `admin.ts` - Additional admin routes

### Content & Learning
- `lessonRoutes.ts` - Learning system routes
- `analysisRoutes.ts` - Analysis functionality
- `userRoutes.ts` - User management
- `privacyRoutes.ts` - Privacy/GDPR functionality

### Utilities
- `help.ts` - Help system
- `batchRoutes.ts` - Batch processing

## Status Assessment

### Keep (Core Functionality)
- `observeRoutes.ts` - ✅ Observatory core
- `musicRoutes.ts` - ✅ Scriptorium core  
- `modelRoutes.ts` - ✅ AI model management
- `usageRoutes.ts` - ✅ Usage tracking
- `cryptoPaymentRoutes.ts` - ✅ Crypto payments

### Evaluate for Removal
Routes that appear to be incomplete or unused:
- `help.ts` - Only 17 lines, minimal functionality
- `batchRoutes.ts` - Batch processing (might be for future use)
- `adminMetricsController.ts` - Only 34 lines

### Keep for Production
Important for production launch:
- `privacyRoutes.ts` - GDPR compliance
- `lessonRoutes.ts` - Learning system
- `adminRoutes.ts` - Admin panel
- `paymentRoutes.ts` / `stripeRoutes.ts` - Payment processing

## Recommendations

1. **Short-term**: Document and leave existing code
2. **Medium-term**: Gradually implement missing route mounts
3. **Long-term**: Remove genuinely unused code after confirming

## Frontend Cleanup Completed ✅
- Merged Community + StarGazing → CommunityForest
- Removed broken `/community` navigation
- Deleted redundant components
- Fixed TODOs in ScriptoriumControls
- Removed empty directories 