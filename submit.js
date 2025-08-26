import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

(function () {
  const form = document.getElementById('submissionForm');
  const success = document.getElementById('submissionSuccess');

  function getCheckedGenres() {
    const boxContainer = document.getElementById('genres');
    const boxes = Array.from(boxContainer.querySelectorAll('input[type="checkbox"]'));
    return boxes.filter(b => b.checked).map(b => b.value).slice(0, 3);
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      email: document.getElementById('email').value.trim(),
      author: document.getElementById('author').value.trim(),
      title: document.getElementById('title').value.trim(),
      publisher: document.getElementById('publisher').value.trim(),
      blurb: document.getElementById('blurb').value.trim(),
      wordCount: document.getElementById('wordCount').value.trim(),
      purchaseLink: document.getElementById('purchaseLink').value.trim(),
      genres: getCheckedGenres(),
      coverUrl: document.getElementById('coverUrl').value.trim(),
      pdfUrl: document.getElementById('pdfUrl').value.trim(),
      contentWarnings: document.getElementById('contentWarnings').value.trim(),
      premiumReview: document.getElementById('premiumReview').checked,
      status: 'new',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'submissions'), data);

      success.style.display = 'block';
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (data.premiumReview && window.__STRIPE_PREMIUM_REVIEW_LINK__) {
        window.open(window.__STRIPE_PREMIUM_REVIEW_LINK__, '_blank', 'noopener');
      }
    } catch (err) {
      console.error('Submission failed', err);
      alert('Something went wrong. Please try again or email support@noctuaforest.com');
    }
  });
})();


