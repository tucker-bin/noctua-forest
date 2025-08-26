import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

(function () {
  const form = document.getElementById('contributorForm');
  const success = document.getElementById('contributorSuccess');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(form);
    const data = {
      email: formData.get('email'),
      name: formData.get('name'),
      expertise: formData.get('expertise'),
      experience: formData.get('experience'),
      bio: formData.get('bio'),
      website: formData.get('website') || null,
      medium: formData.get('medium') || null,
      articleTopics: formData.get('articleTopics'),
      sampleUrl: formData.get('sampleUrl') || null,
      availability: formData.get('availability'),
      createdAt: serverTimestamp(),
      status: 'pending'
    };

    // Handle file upload (note: for a real implementation, you'd want to upload to Firebase Storage)
    const fileInput = document.getElementById('articleUpload');
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      data.articleFileName = file.name;
      data.articleFileSize = file.size;
      data.articleFileType = file.type;
      // In a real implementation, upload to Firebase Storage and store the download URL
      data.hasArticleFile = true;
    } else {
      data.hasArticleFile = false;
    }

    try {
      await addDoc(collection(db, 'contributor_applications'), data);
      success.style.display = 'block';
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Contributor application failed', error);
      alert('Something went wrong. Please try again or email support@noctuaforest.com');
    }
  });
})();
