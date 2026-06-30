// Simple form handling
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      alert(`Email: ${email}\\nPassword: ${password}`);
      // Replace with real backend call
    });
