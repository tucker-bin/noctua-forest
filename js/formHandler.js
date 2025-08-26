// formHandler.js
const handleFormSubmission = (formId, formType) => {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if user is authenticated
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
      // Save form data to session storage
      const formData = new FormData(form);
      const formDataObj = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      sessionStorage.setItem('savedFormData', JSON.stringify({
        type: formType,
        data: formDataObj
      }));

      // Redirect to signup
      window.location.href = '/signup.html';
      return;
    }

    // If authenticated, proceed with form submission
    submitForm(form, formType);
  });
};

const checkAuthStatus = async () => {
  try {
    const auth = firebase.auth();
    return auth.currentUser !== null;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

const submitForm = async (form, formType) => {
  try {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Add user ID to submission
    const userId = firebase.auth().currentUser.uid;
    data.userId = userId;
    data.submittedAt = new Date().toISOString();

    // Save to appropriate Firestore collection
    const collection = formType === 'book' ? 'bookSubmissions' : 'contributorApplications';
    await firebase.firestore().collection(collection).add(data);

    // Show success message
    const successMsg = document.getElementById(`${formType}Success`);
    if (successMsg) {
      successMsg.classList.remove('hidden');
    }

    // Clear form
    form.reset();

    // Redirect to appropriate page after success
    setTimeout(() => {
      window.location.href = formType === 'book' ? '/forest.html' : '/contributor-dashboard.html';
    }, 2000);

  } catch (error) {
    console.error('Error submitting form:', error);
    alert('There was an error submitting your form. Please try again.');
  }
};

export { handleFormSubmission };
