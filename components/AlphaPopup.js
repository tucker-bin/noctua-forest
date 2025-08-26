// AlphaPopup.js
const showAlphaPopup = () => {
  // Check if user has seen the popup
  if (localStorage.getItem('alphaPopupSeen')) return;

  const popup = document.createElement('div');
  popup.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  popup.innerHTML = `
    <div class="bg-[#4A5450] text-white p-8 rounded-xl max-w-lg mx-4 relative">
      <!-- Close button -->
      <button id="closePopupBtn" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <!-- Main content -->
      <h2 class="text-3xl font-bold mb-4" style="font-family: 'Poppins', sans-serif;">Shape the Future of Storytelling</h2>
      <p class="text-gray-300 mb-6">You're invited to be a founding member of Noctua Forest, a new community for authors and readers. As an early Alpha member, your voice and submissions will directly influence the platform's growth.</p>
      
      <!-- Benefits list -->
      <div class="bg-[#3A4440] rounded-lg p-6 mb-6">
        <p class="font-medium mb-4">Join now to be the first to:</p>
        <ul class="space-y-3">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-[#F58220] mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Get early feedback on your manuscripts</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-[#F58220] mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Connect directly with early readers</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-[#F58220] mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Influence the tools we build for authors</span>
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-[#F58220] mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Be part of our core community</span>
          </li>
        </ul>
      </div>

      <!-- Social proof -->
      <p class="text-sm text-gray-300 mb-6 text-center">Join the first 150+ other night owls shaping our community.</p>

      <!-- Email capture form -->
      <div class="space-y-4">
        <div class="relative">
          <input type="email" placeholder="Enter your email" required
            class="w-full px-4 h-12 rounded bg-[#5A6560] border border-[#7A8580] text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent text-base">
        </div>

        <button id="signupBtn" 
          class="w-full bg-[#F58220] hover:bg-[#E67615] text-white font-medium h-12 rounded transition duration-300">
          Become a Founding Member
        </button>

        <!-- Social sign-in -->
        <button id="googleSignInBtn" 
          class="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium h-12 rounded transition duration-300 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Event listeners
  document.getElementById('closePopupBtn').addEventListener('click', () => {
    localStorage.setItem('alphaPopupSeen', 'true');
    popup.remove();
  });

  document.getElementById('signupBtn').addEventListener('click', () => {
    const email = document.querySelector('input[type="email"]').value;
    if (!email) {
      alert('Please enter your email address');
      return;
    }
    // Save email for the signup process
    sessionStorage.setItem('pendingSignupEmail', email);
    window.location.href = '/signup.html';
  });

  document.getElementById('googleSignInBtn').addEventListener('click', () => {
    localStorage.setItem('alphaPopupSeen', 'true');
    // Implement Google Sign-in
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((result) => {
        // Check if there's a saved form to return to
        const savedFormData = sessionStorage.getItem('savedFormData');
        if (savedFormData) {
          const { type } = JSON.parse(savedFormData);
          window.location.href = type === 'book' ? '/submit.html' : '/contributor.html';
        } else {
          window.location.href = '/forest.html';
        }
      })
      .catch((error) => {
        console.error('Error with Google sign-in:', error);
        alert('There was an error signing in with Google. Please try again or use email signup.');
      });
  });

  // Close on background click
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      localStorage.setItem('alphaPopupSeen', 'true');
      popup.remove();
    }
  });
};

export default showAlphaPopup;
