const queryParams = new URLSearchParams(window.location.search);
const itemId = queryParams.get('itemId');
const itemDetails = document.getElementById('itemDetails');
const resultMessage = document.getElementById('resultMessage');
const borrowBtn = document.getElementById('borrowBtn');
const apiBase = '/api/items';

// Check authentication
function checkAuth() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return null;
  }
  return userId;
}

if (!itemId) {
  itemDetails.innerHTML = '<p class="error">No item selected for borrowing.</p>';
  borrowBtn.style.display = 'none';
} else {
  loadItem();
}

async function loadItem() {
  itemDetails.innerHTML = '<p>Loading item details...</p>';
  try {
    const response = await fetch(`${apiBase}/${itemId}?t=${Date.now()}`);
    if (!response.ok) {
      itemDetails.innerHTML = '<p class="error">Item not found.</p>';
      borrowBtn.style.display = 'none';
      return;
    }

    const item = await response.json();
    itemDetails.innerHTML = `
      <h2>${item.name}</h2>
      <p>${item.description || 'No description'}</p>
      <p>Quantity left: ${item.quantity}</p>
      <p>Status: ${item.quantity > 0 ? 'Available' : 'Out of stock'}</p>
    `;
    if (item.quantity <= 0) {
      borrowBtn.style.display = 'none';
      resultMessage.innerHTML = '<p class="error">This item is currently out of stock.</p>';
    }
  } catch (error) {
    itemDetails.innerHTML = '<p class="error">Unable to load item details.</p>';
    borrowBtn.style.display = 'none';
    console.error(error);
  }
}

async function confirmBorrow() {
  const userId = checkAuth();
  if (!userId) return;

  resultMessage.textContent = '';
  borrowBtn.disabled = true;

  try {
    const response = await fetch(`${apiBase}/${itemId}/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: parseInt(userId) })
    });

    if (!response.ok) {
      const errorText = await response.text();
      resultMessage.innerHTML = `<p class="error">${errorText || 'Unable to borrow this item.'}</p>`;
      borrowBtn.disabled = false;
      return;
    }

    resultMessage.innerHTML = '<p style="color:#28a745;">Item borrowed successfully! Redirecting to your items...</p>';
    setTimeout(() => window.location.href = 'user.html', 2000);
  } catch (error) {
    resultMessage.innerHTML = '<p class="error">Could not complete the borrow request.</p>';
    borrowBtn.disabled = false;
    console.error(error);
  }
}

window.confirmBorrow = confirmBorrow;

window.confirmBorrow = confirmBorrow;
