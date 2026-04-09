const accessForm = document.getElementById('accessForm');
const accessInput = document.getElementById('accessInput');

accessForm.addEventListener('submit', event => {
  event.preventDefault();
  const value = accessInput.value.trim().toUpperCase();

  if (value === 'ADMIN') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'user.html';
  }
});
