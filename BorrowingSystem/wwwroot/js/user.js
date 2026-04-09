const apiBase = '/api/items';
const borrowerBase = '/api/borrowers';
const itemsList = document.getElementById('itemsList');
const refreshBtn = document.getElementById('refreshBtn');
const borrowedList = document.getElementById('borrowedList');
const historyList = document.getElementById('historyList');

// Check if user is logged in
function checkAuth() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function displayUserInfo() {
  const userName = sessionStorage.getItem('userName') || 'User';
  const userIdNumber = sessionStorage.getItem('userIdNumber') || '-';
  const userStatus = sessionStorage.getItem('userStatus') || '-';

  document.getElementById('userName').textContent = userName;
  document.getElementById('userIdNumber').textContent = userIdNumber;
  document.getElementById('userStatus').textContent = userStatus;
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

function goToBorrow(itemId) {
  window.location.href = `borrow.html?itemId=${itemId}`;
}

async function loadItems() {
  itemsList.innerHTML = '<li>Loading...</li>';
  try {
    const response = await fetch(`${apiBase}?t=${Date.now()}`);
    const items = await response.json();
    itemsList.innerHTML = items.length > 0 ? items.map(item => `
      <li>
        <strong>${item.name}</strong>
        <p>${item.description || 'No description'}</p>
        <p>Quantity left: ${item.quantity}</p>
        <p>Status: ${item.quantity > 0 ? 'Available' : 'Out of stock'}</p>
        ${item.quantity > 0 ? `<button onclick="goToBorrow(${item.id})">Borrow</button>` : ''}
      </li>
    `).join('') : '<li>No items found.</li>';
  } catch (error) {
    itemsList.innerHTML = '<li class="error">Unable to load items.</li>';
    console.error(error);
  }
}

async function loadBorrowerDashboard() {
  const userId = parseInt(sessionStorage.getItem('userId'));
  if (!userId) return;

  borrowedList.innerHTML = '<li>Loading your borrow history...</li>';
  historyList.innerHTML = '<li>Loading all your records...</li>';

  try {
    // Try the API first
    const response = await fetch(`${borrowerBase}/history/${userId}?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      const records = data.borrowHistory || data.BorrowHistory || [];
      const activeItems = records.filter(record => record.returnDate === null);
      const returnedItems = records.filter(record => record.returnDate !== null);

      borrowedList.innerHTML = activeItems.length > 0 ? activeItems.map(record => `
        <li>
          <strong>${record.itemName}</strong>
          <p>Borrowed on: ${new Date(record.borrowDate).toLocaleString()}</p>
          <p>Due on: ${new Date(record.dueDate).toLocaleDateString()}</p>
          <button onclick="returnBorrow(${record.id})">Return</button>
        </li>
      `).join('') : '<li>No active borrowed items.</li>';

      historyList.innerHTML = returnedItems.length > 0 ? returnedItems.map(record => `
        <li>
          <strong>${record.itemName}</strong>
          <p>Borrowed on: ${new Date(record.borrowDate).toLocaleString()}</p>
          <p>Returned on: ${new Date(record.returnDate).toLocaleString()}</p>
          <p>Status: ${record.status}</p>
        </li>
      `).join('') : '<li>No returned items yet.</li>';
    } else {
      // Fallback: Show message that history will be available after borrowing
      borrowedList.innerHTML = '<li>Borrow some items first to see your active borrows here.</li>';
      historyList.innerHTML = '<li>Your returned item history will appear here.</li>';
    }
  } catch (error) {
    console.error('Error loading borrower history:', error);
    // Fallback: Show helpful message
    borrowedList.innerHTML = '<li>Unable to load active borrows. Try refreshing the page.</li>';
    historyList.innerHTML = '<li>Unable to load return history. Try refreshing the page.</li>';
  }
}

async function returnBorrow(recordId) {
  try {
    const response = await fetch(`${borrowerBase}/return/${recordId}`, {
      method: 'PUT'
    });

    if (!response.ok) {
      const text = await response.text();
      alert(text || 'Unable to return item.');
      return;
    }

    // Refresh the dashboard after successful return
    await loadBorrowerDashboard();
    await loadItems();
    alert('Item returned successfully!');
  } catch (error) {
    console.error(error);
    alert('Could not return the item.');
  }
}

if (checkAuth()) {
  displayUserInfo();
  refreshBtn.addEventListener('click', () => {
    loadItems();
    loadBorrowerDashboard();
  });
  loadItems();
  loadBorrowerDashboard();
}

window.logout = logout;
window.goToBorrow = goToBorrow;
window.returnBorrow = returnBorrow;
