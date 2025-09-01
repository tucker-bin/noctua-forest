# Custom Auth Domain Setup for Noctua Forest

This guide explains how to set up the custom authentication domain (`auth.noctuaforest.com`) for Firebase Authentication.

## Prerequisites

1. Domain ownership of `noctuaforest.com`
2. Access to domain DNS settings
3. Firebase Console access

## Steps

### 1. Firebase Console Configuration

1. Go to the Firebase Console
2. Select the "my-rhyme-app" project
3. Navigate to Authentication > Settings
4. Under "Authorized Domains", add:
   - `auth.noctuaforest.com`
   - `noctuaforest.com`
   - `www.noctuaforest.com`

### 2. DNS Configuration

Add the following DNS records to your domain:

```txt
Type: A
Name: auth
Value: 151.101.1.195
TTL: 3600

Type: A
Name: auth
Value: 151.101.65.195
TTL: 3600
```

### 3. SSL Certificate

Firebase will automatically provision and manage SSL certificates for the auth domain.

### 4. OAuth Configuration

1. Go to Firebase Console > Authentication > Sign-in method
2. For each enabled provider (Google, etc.):
   - Update authorized domains to include `auth.noctuaforest.com`
   - Update OAuth redirect URIs to include:
     ```
     https://auth.noctuaforest.com/__/auth/handler
     ```

### 5. Application Updates

1. Update `firebase-config.js` to use the new auth domain:
   ```js
   authDomain: "auth.noctuaforest.com"
   ```

2. Update OAuth consent screen branding:
   - Display name: "Noctua Forest"
   - Logo: Upload the Noctua Forest logo
   - Support email: Set to support@noctuaforest.com
   - Application homepage: https://noctuaforest.com
   - Privacy policy: https://noctuaforest.com/privacy.html
   - Terms of service: https://noctuaforest.com/terms.html

### 6. Testing

1. Clear browser cache and cookies
2. Test sign-in flow on:
   - Production site
   - Local development
   - All supported OAuth providers
   - Email/password authentication
   - Password reset flow

### 7. Monitoring

Monitor auth-related events in Firebase Console:
- Authentication > Events
- Authentication > Usage

## Troubleshooting

### Common Issues

1. DNS propagation delays
   - Can take up to 48 hours
   - Use `dig auth.noctuaforest.com` to check propagation

2. OAuth redirect errors
   - Verify all redirect URIs are properly configured
   - Check browser console for specific error messages

3. SSL certificate issues
   - Wait for automatic provisioning (up to 24 hours)
   - Verify DNS records are correct

### Support Resources

- [Firebase Custom Domain Documentation](https://firebase.google.com/docs/auth/custom-domain)
- [Firebase Authentication Troubleshooting](https://firebase.google.com/docs/auth/troubleshooting)
