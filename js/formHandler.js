// formHandler.js (modular SDK)
import { app, db } from '../firebase-config.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { 
  collection, addDoc, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const auth = getAuth(app);
const storage = getStorage(app);

const handleFormSubmission = (formId, formType) => {
  const form = document.getElementById(formId);
  if (!form) return;

  // Lightweight inline error styles (once per page)
  (function ensureErrorStyles(){
    if (document.getElementById('nf-inline-error-style')) return;
    const style = document.createElement('style');
    style.id = 'nf-inline-error-style';
    style.textContent = `
      .nf-error-text{font-size:12px;line-height:1.25;margin-top:6px;color:#ef4444}
      .nf-error-field{border-color:#ef4444 !important; outline: none}
      .nf-error-label{color:#ef4444}
    `;
    document.head.appendChild(style);
  })();

  function clearErrors(targetForm){
    targetForm.querySelectorAll('.nf-error-text').forEach(el => el.remove());
    targetForm.querySelectorAll('.nf-error-field').forEach(el => el.classList.remove('nf-error-field'));
    targetForm.querySelectorAll('.nf-error-label').forEach(el => el.classList.remove('nf-error-label'));
  }

  function showFieldError(field, message){
    field.classList.add('nf-error-field');
    const label = field.id ? targetForm.querySelector(`label[for="${field.id}"]`) : null;
    if (label) label.classList.add('nf-error-label');
    const help = document.createElement('div');
    help.className = 'nf-error-text';
    help.textContent = message;
    field.insertAdjacentElement('afterend', help);
  }

  function validateRequiredFields(targetForm){
    clearErrors(targetForm);
    const required = [...targetForm.querySelectorAll('[required]')];
    let firstInvalid = null;
    required.forEach((field) => {
      // Use HTML5 validity with simple messages
      const value = (field.value || '').trim();
      let error = '';
      if (!value) {
        error = 'This field is required.';
      } else if (field.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
        error = 'Enter a valid email address.';
      }
      if (error) {
        if (!firstInvalid) firstInvalid = field;
        showFieldError(field, error);
      }
    });
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  // Clear error on input
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t && t.classList.contains('nf-error-field')) {
      t.classList.remove('nf-error-field');
      const next = t.nextElementSibling;
      if (next && next.classList.contains('nf-error-text')) next.remove();
      const label = t.id ? form.querySelector(`label[for="${t.id}"]`) : null;
      if (label) label.classList.remove('nf-error-label');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    // Client-side required validation (inline)
    if (!validateRequiredFields(form)) return;

    if (!user) {
      const formData = new FormData(form);
      const formDataObj = {};
      formData.forEach((value, key) => { formDataObj[key] = value; });
      sessionStorage.setItem('savedFormData', JSON.stringify({ type: formType, data: formDataObj }));
      alert('Please sign in to submit. Your form has been saved.');
      window.location.href = 'account.html';
      return;
    }

    try {
      const formData = new FormData(form);
      const premium = formData.get('premiumReview') === 'on' || form.querySelector('#premiumReview')?.checked === true;

      // Handle cover upload if a file is provided
      let coverUrl = formData.get('coverUrl');
      const coverFile = form.querySelector('#coverFile')?.files?.[0];
      if (coverFile) {
        const path = `covers/${user.uid}/${Date.now()}-${coverFile.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, coverFile);
        coverUrl = await getDownloadURL(fileRef);
      }

      const payload = {
        email: formData.get('email') || user.email || '',
        author: formData.get('author') || '',
        title: formData.get('title') || '',
        publisher: formData.get('publisher') || '',
        blurb: formData.get('blurb') || '',
        wordCount: formData.get('wordCount') ? Number(formData.get('wordCount')) : null,
        purchaseLink: formData.get('purchaseLink') || '',
        purchaseLink2: formData.get('purchaseLink2') || '',
        primaryLanguage: formData.get('primaryLanguage') || '',
        originalLanguage: formData.get('originalLanguage') || '',
        authorRegion: formData.get('authorRegion') || '',
        publicationYear: formData.get('publicationYear') ? Number(formData.get('publicationYear')) : null,
        culturalThemes: formData.get('culturalThemes') || '',
        authorTags: formData.get('authorTags') || '',
        targetAudience: formData.get('targetAudience') || '',
        bookLength: formData.get('bookLength') || '',
        coverUrl: coverUrl || '',
        pdfUrl: formData.get('pdfUrl') || '',
        contentWarnings: formData.get('contentWarnings') || '',
        amazonUrl: formData.get('amazonUrl') || '',
        isbn: formData.get('isbn') || '',
        asin: formData.get('asin') || '',
        premium,
        userId: user.uid,
        approved: false,
        createdAt: serverTimestamp(),
      };

      const col = formType === 'book' ? 'submissions' : 'applications';
      // Ensure fresh auth token to avoid transient permission errors
      try { await auth.currentUser?.getIdToken(true); } catch (_) {}
      await addDoc(collection(db, col), payload);

      // Fire-and-forget auto-reply (do not block UX)
      try {
        const replyPayload = {
          to: payload.email,
          type: formType,
          title: payload.title,
          author: payload.author
        };
        fetch('/api/email/auto-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(replyPayload)
        }).catch(()=>{});
      } catch (_) {}

      // Show custom modal if available; otherwise fallback confirm
      if (typeof window.showSubmissionModal === 'function') {
        try {
          window.showSubmissionModal({
            premium,
            stripeLink: window.__STRIPE_PREMIUM_REVIEW_LINK__,
            title: payload.title || ''
          });
        } catch (_) {}
      } else {
        // Fallback: simple confirm
        const goPremium = premium && window.confirm('Submission received. Proceed to Noctua Forest + Staff Book Review payment?');
        const success = document.getElementById('submissionSuccess');
        if (success) success.classList.remove('hidden');
        if (goPremium && window.__STRIPE_PREMIUM_REVIEW_LINK__) {
          window.open(window.__STRIPE_PREMIUM_REVIEW_LINK__, '_blank', 'noopener');
        }
        setTimeout(() => { window.location.href = 'forest.html'; }, 1200);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      const msg = (err && err.code === 'permission-denied') ?
        'You must be signed in to submit. Please sign in and try again.' :
        'There was an error submitting your form. Please try again.';
      alert(msg);
    }
  });
};

export { handleFormSubmission };
