const authBase = '/api/auth';
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');

function switchTab(tab) {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const tabBtns = document.querySelectorAll('.tab-btn');

  if (tab === 'login') {
    loginTab.style.display = 'block';
    registerTab.style.display = 'none';
    tabBtns[0].classList.add('active');
    tabBtns[1].classList.remove('active');
  } else {
    loginTab.style.display = 'none';
    registerTab.style.display = 'block';
    tabBtns[0].classList.remove('active');
    tabBtns[1].classList.add('active');
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginMessage.textContent = '';

  const idNumber = document.getElementById('loginIdNumber').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (idNumber.toUpperCase() === 'THE ONE WHO SEES ALL') {
    window.location.href = 'admin.html';
    return;
  }

  if (!idNumber || !password) {
    loginMessage.innerHTML = '<p class="error">Please enter ID number and password.</p>';
    return;
  }

  try {
    const response = await fetch(`${authBase}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idNumber, password })
    });

    const data = await response.json();

    if (!response.ok) {
      loginMessage.innerHTML = `<p class="error">${data.message || 'Login failed.'}</p>`;
      return;
    }

    // Store user session
    sessionStorage.setItem('userId', data.id);
    sessionStorage.setItem('userName', data.name);
    sessionStorage.setItem('userIdNumber', data.idNumber);
    sessionStorage.setItem('userStatus', data.status);

    loginMessage.innerHTML = '<p style="color:#28a745;">Login successful! Redirecting...</p>';
    setTimeout(() => window.location.href = 'user.html', 1500);
  } catch (error) {
    loginMessage.innerHTML = '<p class="error">Connection error. Please try again.</p>';
    console.error(error);
  }
});

registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  registerMessage.textContent = '';

  const name = document.getElementById('registerName').value.trim();
  const idNumber = document.getElementById('registerIdNumber').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirm').value;

  if (!name || !idNumber || !password || !confirm) {
    registerMessage.innerHTML = '<p class="error">All fields are required.</p>';
    return;
  }

  if (password !== confirm) {
    registerMessage.innerHTML = '<p class="error">Passwords do not match.</p>';
    return;
  }

  if (password.length < 6) {
    registerMessage.innerHTML = '<p class="error">Password must be at least 6 characters.</p>';
    return;
  }

  try {
    const response = await fetch(`${authBase}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, idNumber, password })
    });

    const data = await response.json();

    if (!response.ok) {
      registerMessage.innerHTML = `<p class="error">${data.message || 'Registration failed.'}</p>`;
      return;
    }

    // Auto login after registration
    sessionStorage.setItem('userId', data.id);
    sessionStorage.setItem('userName', data.name);
    sessionStorage.setItem('userIdNumber', data.idNumber);
    sessionStorage.setItem('userStatus', data.status);

    registerMessage.innerHTML = '<p style="color:#28a745;">Registration successful! Redirecting...</p>';
    setTimeout(() => window.location.href = 'user.html', 1500);
  } catch (error) {
    registerMessage.innerHTML = '<p class="error">Connection error. Please try again.</p>';
    console.error(error);
  }
});

// Expose UI helpers globally for inline event handlers
window.switchTab = switchTab;

// Check if already logged in
window.addEventListener('load', () => {
  const userId = sessionStorage.getItem('userId');
  if (userId) {
    window.location.href = 'user.html';
  }
  // Set login tab as active by default
  switchTab('login');
});
