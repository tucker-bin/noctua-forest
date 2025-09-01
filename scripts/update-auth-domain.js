// Auth Domain Migration Script
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize admin SDK
initializeApp({
  credential: cert('../firebase-service-account.json')
});

const auth = getAuth();
const db = getFirestore();

async function updateAuthDomain() {
  console.log('Starting auth domain migration...');

  try {
    // 1. Update OAuth settings
    console.log('Updating OAuth configuration...');
    const config = await auth.getOAuthIdpConfig('google.com');
    const redirectUris = config.redirectUri || [];
    
    // Add new auth domain redirect
    if (!redirectUris.includes('https://auth.noctuaforest.com/__/auth/handler')) {
      redirectUris.push('https://auth.noctuaforest.com/__/auth/handler');
      await auth.updateOAuthIdpConfig('google.com', {
        redirectUri: redirectUris
      });
      console.log('Added new auth domain to OAuth redirects');
    }

    // 2. Update authorized domains
    console.log('Updating authorized domains...');
    const settings = await auth.getProjectConfig();
    const domains = settings.authorizedDomains || [];
    
    // Add new domains if not present
    const newDomains = [
      'auth.noctuaforest.com',
      'noctuaforest.com',
      'www.noctuaforest.com'
    ];
    
    for (const domain of newDomains) {
      if (!domains.includes(domain)) {
        domains.push(domain);
      }
    }
    
    await auth.updateProjectConfig({
      authorizedDomains: domains
    });
    console.log('Updated authorized domains');

    // 3. Verify custom domain is ready
    console.log('Verifying custom domain status...');
    try {
      const response = await fetch('https://auth.noctuaforest.com/__/auth/handler');
      if (response.ok) {
        console.log('Custom domain is active and responding');
      } else {
        console.warn('Custom domain returned status:', response.status);
      }
    } catch (err) {
      console.warn('Custom domain not yet active:', err.message);
      console.log('This is normal if DNS has not propagated yet');
    }

    console.log('\nMigration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Replace firebase-config.js with firebase-config.new.js');
    console.log('2. Update OAuth consent screen branding in Firebase Console');
    console.log('3. Test authentication flows on all supported providers');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

updateAuthDomain().catch(console.error);
