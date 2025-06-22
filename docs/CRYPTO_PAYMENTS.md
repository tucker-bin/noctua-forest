# Cryptocurrency Payment System

Noctua Forest now supports cryptocurrency payments for subscriptions! Users can pay for their Rhyme Enthusiast or Pro Poet plans using Bitcoin, Ethereum, Litecoin, XRP, Cardano, Polkadot, and Polygon.

## Features

- **Multi-Currency Support**: Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), XRP, Cardano (ADA), Polkadot (DOT), and Polygon (MATIC)
- **Real-time Pricing**: Fetches current exchange rates from CoinGecko API
- **Payment Expiry**: 30-minute payment window to ensure accurate pricing
- **Transaction Tracking**: Users can submit transaction hashes for confirmation
- **Payment History**: Complete history of all cryptocurrency payments
- **Secure**: No private keys stored, only wallet addresses for receiving payments

## Backend Implementation

### Services

#### CryptoPaymentService (`node-backend/src/services/cryptoPaymentService.ts`)
- Handles payment creation, confirmation, and tracking
- Integrates with CoinGecko API for real-time pricing
- Manages payment expiry and status updates

#### Controllers (`node-backend/src/controllers/cryptoPaymentController.ts`)
- API endpoints for crypto payment operations
- Input validation and error handling
- User authentication and authorization

#### Routes (`node-backend/src/routes/cryptoPaymentRoutes.ts`)
- RESTful API routes for cryptocurrency payments
- All routes require authentication

### API Endpoints

- `GET /api/crypto-payments/currencies` - Get supported cryptocurrencies
- `GET /api/crypto-payments/prices` - Get current crypto prices
- `POST /api/crypto-payments/create` - Create a new payment
- `POST /api/crypto-payments/confirm` - Confirm payment with transaction hash
- `GET /api/crypto-payments/:paymentId` - Get specific payment details
- `GET /api/crypto-payments/history/all` - Get user's payment history

### Environment Variables

Add these to your `.env` file:

```bash
# Cryptocurrency Wallet Addresses (Required)
CRYPTO_BTC_ADDRESS=your_bitcoin_address
CRYPTO_ETH_ADDRESS=your_ethereum_address
CRYPTO_LTC_ADDRESS=your_litecoin_address
CRYPTO_XRP_ADDRESS=your_ripple_address
CRYPTO_ADA_ADDRESS=your_cardano_address
CRYPTO_DOT_ADDRESS=your_polkadot_address
CRYPTO_MATIC_ADDRESS=your_polygon_address
```

## Frontend Implementation

### Components

#### CryptoPaymentModal (`src/components/modals/CryptoPaymentModal.tsx`)
- User interface for cryptocurrency payments
- Currency selection and payment creation
- Real-time countdown for payment expiry
- Transaction hash submission and confirmation

#### PlanComparison (`src/components/PlanComparison.tsx`)
- Updated to include "Pay with Crypto" buttons
- Integrates with CryptoPaymentModal

#### CryptoPaymentHistory (`src/components/profile/CryptoPaymentHistory.tsx`)
- Displays user's payment history
- Shows payment status and transaction details
- Links to blockchain explorers

### Services

#### CryptoPaymentService (`src/services/cryptoPaymentService.ts`)
- Frontend service for API communication
- Utility functions for formatting and calculations
- Blockchain explorer URL generation

## Payment Flow

1. **Plan Selection**: User selects a plan and clicks "Pay with Crypto"
2. **Currency Selection**: User chooses preferred cryptocurrency
3. **Payment Creation**: System creates payment with current exchange rate
4. **Payment Instructions**: User receives payment address and amount
5. **Transaction Submission**: User sends payment and submits transaction hash
6. **Confirmation**: System confirms payment and activates subscription

## Security Considerations

- Private keys are never stored or transmitted
- Only wallet addresses for receiving payments are configured
- Payments expire after 30 minutes to prevent price manipulation
- All API endpoints require authentication
- Transaction hashes are validated before confirmation

## Testing

### Test with Testnet

For testing, use testnet addresses:

```bash
# Bitcoin Testnet
CRYPTO_BTC_ADDRESS=tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4

# Ethereum Testnet (Goerli)
CRYPTO_ETH_ADDRESS=0x742d35Cc7Eb259b4E503bf16CAf6D0a0f5b9F2b0
```

### Mock Payments

The system includes mock confirmation for testing:
- Any transaction hash will be accepted in development
- Payments are immediately marked as confirmed
- No actual blockchain verification is performed

## Production Deployment

### Required Setup

1. **Wallet Addresses**: Generate secure wallet addresses for each supported cryptocurrency
2. **Environment Variables**: Configure all crypto wallet addresses
3. **Monitoring**: Set up alerts for payment confirmations
4. **Backup**: Ensure wallet private keys are securely backed up

### Recommended Practices

- Use hardware wallets for storing private keys
- Set up multi-signature wallets for additional security
- Monitor payment addresses regularly
- Implement proper key rotation policies
- Use dedicated addresses for each environment (dev, staging, prod)

## Troubleshooting

### Common Issues

1. **Payment Creation Fails**
   - Check CoinGecko API connectivity
   - Verify wallet addresses are configured
   - Ensure user is authenticated

2. **Payment Confirmation Issues**
   - Verify transaction hash format
   - Check if payment has expired
   - Ensure payment is in pending status

3. **Price Fetching Errors**
   - CoinGecko API rate limits
   - Network connectivity issues
   - Invalid currency codes

### Logging

All payment operations are logged with appropriate levels:
- Payment creation and confirmation
- API errors and failures
- Price fetching issues
- Payment expiry events

## Future Enhancements

- **Blockchain Verification**: Integrate with blockchain APIs for automatic transaction verification
- **Additional Cryptocurrencies**: Support for more coins (SOL, AVAX, etc.)
- **Recurring Payments**: Support for subscription renewals
- **Exchange Integration**: Direct integration with cryptocurrency exchanges
- **Multi-chain Support**: Support for multiple blockchain networks
- **DeFi Integration**: Integration with decentralized finance protocols

## Support

For support with cryptocurrency payments:
1. Check payment status in user dashboard
2. Verify transaction on blockchain explorer
3. Contact support with transaction hash and payment ID
4. Allow up to 1 hour for blockchain confirmations 