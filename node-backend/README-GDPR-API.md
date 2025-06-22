# GDPR Privacy API Documentation

## Overview
This document describes the GDPR-compliant privacy API endpoints implemented in Noctua Forest backend.

## Base URL
All privacy endpoints are available under `/api/privacy`

## Endpoints

### Cookie Consent Management

#### GET /api/privacy/cookie-consent
Get current cookie consent preferences.

**Headers:**
- `x-session-id` (optional): Session identifier

**Response:**
```json
{
  "hasConsent": true,
  "consentVersion": "1.0",
  "preferences": {
    "necessary": true,
    "analytics": false,
    "marketing": false,
    "preferences": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/privacy/cookie-consent
Update cookie consent preferences.

**Body:**
```json
{
  "necessary": true,
  "analytics": true,
  "marketing": false,
  "preferences": true,
  "consentVersion": "1.0"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_1705315800000_abc123def"
}
```

### Privacy Settings (Authenticated)

#### GET /api/privacy/settings
Get user's privacy settings.

**Headers:**
- `Authorization: Bearer <firebase_token>`

**Response:**
```json
{
  "dataProcessing": true,
  "analytics": false,
  "marketing": false,
  "personalization": true,
  "thirdPartySharing": false,
  "profileVisibility": "private",
  "activityTracking": false,
  "emailNotifications": true,
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### PUT /api/privacy/settings
Update user's privacy settings.

**Headers:**
- `Authorization: Bearer <firebase_token>`

**Body:**
```json
{
  "analytics": true,
  "marketing": false,
  "profileVisibility": "public",
  "emailNotifications": false
}
```

**Response:**
```json
{
  "dataProcessing": true,
  "analytics": true,
  "marketing": false,
  "personalization": true,
  "thirdPartySharing": false,
  "profileVisibility": "public",
  "activityTracking": false,
  "emailNotifications": false,
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Data Summary

#### GET /api/privacy/data-summary
Get summary of user's stored data.

**Headers:**
- `Authorization: Bearer <firebase_token>`

**Response:**
```json
{
  "profile": {
    "accountCreated": "2024-01-01T00:00:00.000Z",
    "lastActive": "2024-01-15T10:30:00.000Z",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "dataTypes": {
    "observations": 25,
    "lessonProgress": 12,
    "feedback": 3,
    "privacySettings": 1
  },
  "storage": {
    "totalDocuments": 41,
    "estimatedSize": "2.5 KB"
  },
  "rights": {
    "dataExport": "Available",
    "dataDeletion": "Available",
    "dataCorrection": "Available via profile settings",
    "dataPortability": "JSON format available"
  }
}
```

### Data Export (GDPR Article 20)

#### POST /api/privacy/data-export
Export all user data in JSON format.

**Headers:**
- `Authorization: Bearer <firebase_token>`

**Rate Limit:** 3 requests per 15 minutes

**Response:**
```json
{
  "exportTimestamp": "2024-01-15T10:30:00.000Z",
  "userId": "firebase_user_id",
  "userEmail": "user@example.com",
  "data": {
    "profile": {
      "email": "user@example.com",
      "displayName": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastActive": "2024-01-15T10:30:00.000Z"
    },
    "observations": [
      {
        "id": "obs_123",
        "text": "sample text",
        "patterns": [...],
        "createdAt": "2024-01-10T15:20:00.000Z"
      }
    ],
    "learningProgress": [
      {
        "id": "lesson_progress_123",
        "lessonId": "first-light",
        "completed": true,
        "score": 85,
        "createdAt": "2024-01-05T12:00:00.000Z"
      }
    ],
    "feedback": [
      {
        "id": "feedback_123",
        "type": "feature_request",
        "content": "Great app!",
        "createdAt": "2024-01-12T09:30:00.000Z"
      }
    ],
    "privacySettings": {
      "dataProcessing": true,
      "analytics": false,
      "marketing": false,
      "personalization": true,
      "thirdPartySharing": false,
      "profileVisibility": "private",
      "activityTracking": false,
      "emailNotifications": true,
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "exportMetadata": {
      "totalRecords": 41,
      "exportedAt": "2024-01-15T10:30:00.000Z",
      "format": "JSON",
      "gdprCompliant": true
    }
  },
  "metadata": {
    "exportVersion": "1.0",
    "gdprCompliant": true,
    "requestedAt": "2024-01-15T10:30:00.000Z",
    "ipAddress": "192.168.1.100"
  }
}
```

### Data Deletion (GDPR Article 17)

#### DELETE /api/privacy/data-deletion
Request complete deletion of user account and data.

**Headers:**
- `Authorization: Bearer <firebase_token>`

**Rate Limit:** 1 request per hour

**Body:**
```json
{
  "reason": "No longer using the service",
  "confirmDeletion": true
}
```

**Response:**
```json
{
  "success": true,
  "deletionRequestId": "del_firebase_user_id_1705315800000",
  "message": "Data deletion request submitted successfully",
  "processingTimeframe": "30 days",
  "contactEmail": "privacy@noctuaforest.com",
  "requestedAt": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Deletion confirmation required"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to export user data"
}
```

## Data Collections

The API manages data across these Firebase collections:

- `cookieConsents` - Cookie consent preferences (session-based)
- `privacySettings` - User privacy preferences (user-based)
- `users` - User profile data
- `observations` - Pattern observation data
- `userProgress` - Learning progress data
- `feedback` - User feedback data
- `deletionRequests` - Data deletion requests
- `dataAccessLogs` - Audit logs for data access

## Compliance Features

### GDPR Article 20 - Right to Data Portability
- Complete data export in structured JSON format
- All user data included with metadata
- Rate limited to prevent abuse

### GDPR Article 17 - Right to Erasure
- Account deletion requests with 30-day processing
- Audit logging for compliance
- Confirmation required to prevent accidental deletion

### Cookie Consent (GDPR Article 7)
- Granular consent categories
- Consent versioning for policy updates
- Session-based tracking without authentication

### Privacy by Design
- Default privacy-friendly settings
- Minimal data collection
- Transparent data usage

## Security Measures

- Firebase Authentication for user endpoints
- Rate limiting on sensitive operations
- IP address logging for audit trails
- Secure cookie handling
- CORS protection
- Input validation and sanitization 