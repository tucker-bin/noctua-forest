import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('preorderForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Reserving...';
        
        const formData = new FormData(form);
        const preorderData = {
            email: formData.get('email'),
            timestamp: serverTimestamp(),
            status: 'pending'
        };
        
        try {
            // Add to Firestore
            await addDoc(collection(db, 'preorders'), preorderData);
            
            // Show success
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Optional: Track with analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'preorder_submit', {
                    event_category: 'engagement'
                });
            }
            
        } catch (error) {
            console.error('Error submitting preorder:', error);
            alert('Something went wrong. Please try again or email us directly at support@noctuaforest.com');
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reserve My Copy';
        }
    });
});
