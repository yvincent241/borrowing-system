const apiBase = '/api/items';
const borrowersBase = '/api/borrowers';
const itemsList = document.getElementById('itemsList');
const borrowersList = document.getElementById('borrowersList');
const refreshBtn = document.getElementById('refreshBtn');
const refreshBorrowersBtn = document.getElementById('refreshBorrowersBtn');
const itemForm = document.getElementById('itemForm');
const itemName = document.getElementById('itemName');
const itemDescription = document.getElementById('itemDescription');
const itemQuantity = document.getElementById('itemQuantity');
const message = document.getElementById('message');

// Edit modal elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editItemId = document.getElementById('editItemId');
const editItemName = document.getElementById('editItemName');
const editItemDescription = document.getElementById('editItemDescription');
const editItemQuantity = document.getElementById('editItemQuantity');

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
        <div class="item-actions">
          ${item.quantity > 0 ? `<button class="borrow-btn" onclick="openBorrowPortal(${item.id})">Borrow</button>` : ''}
          <button class="edit-btn" onclick="openEditModal(${item.id}, '${item.name.replace(/'/g, "\\'")}', '${(item.description || '').replace(/'/g, "\\'")}', ${item.quantity})">Edit</button>
          <button class="delete-btn" onclick="deleteItem(${item.id}, '${item.name.replace(/'/g, "\\'")}')">Delete</button>
        </div>
      </li>
    `).join('') : '<li>No items found.</li>';
  } catch (error) {
    itemsList.innerHTML = '<li class="error">Unable to load items.</li>';
    console.error(error);
  }
}

function openBorrowPortal(itemId) {
  window.location.href = `borrow.html?itemId=${itemId}`;
}

async function loadBorrowers() {
  if (!borrowersList) return;
  borrowersList.innerHTML = '<li>Loading borrowers...</li>';
  try {
    console.log('Loading borrowers from:', `${borrowersBase}?t=${Date.now()}`);
    const response = await fetch(`${borrowersBase}?t=${Date.now()}`);
    console.log('Borrowers API response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const borrowers = await response.json();
    console.log('Borrowers data:', borrowers);
    borrowersList.innerHTML = borrowers.length > 0 ? borrowers.map(borrower => {
      const idNumber = borrower.idNumber || borrower.IdNumber || '';
      const nameValue = borrower.name || borrower.Name || 'Unknown';
      const statusValue = borrower.status || borrower.Status || 'Unknown';
      const activeCount = borrower.activeBorrowCount ?? borrower.ActiveBorrowCount ?? 0;
      const borrowedItems = borrower.borrowedItems || borrower.BorrowedItems || [];
      const color = statusValue === 'Ineligible' ? '#dc3545' : statusValue === 'CurrentlyBorrowing' ? '#007bff' : '#28a745';
      const badge = `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${color};color:#fff;margin-right:8px;font-size:0.85rem;">${statusValue}</span>`;
      const items = borrowedItems.length > 0 ? `<p>Items: ${borrowedItems.join(', ')}</p>` : '<p>No active borrowed items.</p>';
      console.log('Rendering borrower:', idNumber, nameValue, statusValue);
      return `
        <li>
          <strong>ID: ${idNumber}</strong> ${badge}
          <p>Name: ${nameValue}</p>
          <p>Active borrows: ${activeCount}</p>
          ${items}
          <div class="item-actions">
            <button class="edit-btn" onclick="updateBorrowerStatus('${idNumber}', 'Good')">Green</button>
            <button class="borrow-btn" onclick="updateBorrowerStatus('${idNumber}', 'CurrentlyBorrowing')">Blue</button>
            <button class="delete-btn" onclick="updateBorrowerStatus('${idNumber}', 'Ineligible')">Red</button>
            <button class="edit-btn" onclick="editBorrowerRecords('${idNumber}')">Edit Records</button>
            <button class="delete-btn" onclick="cleanBorrowerRecords('${idNumber}')">Clean Records</button>
            <button class="delete-btn" onclick="deleteBorrowerAccount('${idNumber}')">Delete Account</button>
          </div>
        </li>
      `;
    }).join('') : '<li>No borrowers found.</li>';
  } catch (error) {
    console.error('Error loading borrowers:', error);
    borrowersList.innerHTML = '<li class="error">Unable to load borrowers.</li>';
  }
}

async function updateBorrowerStatus(idNumber, status) {
  try {
    const response = await fetch(`${borrowersBase}/${encodeURIComponent(idNumber)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Unable to update borrower status');
    }

    await loadBorrowers();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Could not update borrower status.');
  }
}

async function deleteBorrowerAccount(idNumber) {
  if (!confirm(`Are you sure you want to permanently delete user ${idNumber}?`)) {
    return;
  }

  try {
    const response = await fetch(`${borrowersBase}/${encodeURIComponent(idNumber)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Unable to delete borrower account');
    }

    await loadBorrowers();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Could not delete borrower account.');
  }
}

async function cleanBorrowerRecords(idNumber) {
  if (!confirm(`Are you sure you want to clean all borrow records for user ${idNumber}?`)) {
    return;
  }

  try {
    const response = await fetch(`${borrowersBase}/${encodeURIComponent(idNumber)}/records`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Unable to clean borrower records');
    }

    await loadBorrowers();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Could not clean borrower records.');
  }
}

async function manageBorrowerRecords(idNumber) {
  const modal = document.getElementById('recordModal');
  const modalTitle = document.getElementById('recordModalTitle');
  const recordList = document.getElementById('recordList');
  const recordForm = document.getElementById('recordForm');
  const recordUserId = document.getElementById('recordUserId');
  const recordItemSelect = document.getElementById('recordItemSelect');
  const recordDueDate = document.getElementById('recordDueDate');
  const recordMessage = document.getElementById('recordMessage');

  if (!modal || !recordList || !recordForm) return;
  recordUserId.value = idNumber;
  recordMessage.textContent = '';
  modalTitle.textContent = `Manage Records for ${idNumber}`;
  recordList.innerHTML = '<li>Loading borrower records...</li>';
  recordItemSelect.innerHTML = '<option value="">Loading items...</option>';

  try {
    const [recordsResponse, itemsResponse] = await Promise.all([
      fetch(`${borrowersBase}/${encodeURIComponent(idNumber)}/records?t=${Date.now()}`),
      fetch(`${apiBase}?t=${Date.now()}`)
    ]);

    if (!recordsResponse.ok || !itemsResponse.ok) {
      recordList.innerHTML = '<li class="error">Unable to load borrower records.</li>';
      recordItemSelect.innerHTML = '<option value="">Unable to load items</option>';
      modal.style.display = 'block';
      return;
    }

    const recordsData = await recordsResponse.json();
    const items = await itemsResponse.json();
    const records = recordsData.records || recordsData.Records || [];

    const optionsHtml = items.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
    recordItemSelect.innerHTML = `<option value="">Select item</option>${optionsHtml}`;

    recordList.innerHTML = records.length > 0 ? records.map(record => `
      <li id="record-${record.id}">
        <strong>${record.itemName}</strong>
        <p>Borrowed: ${new Date(record.borrowDate).toLocaleString()}</p>
        <p>Due: <input type="date" id="dueDate-${record.id}" value="${record.dueDate ? new Date(record.dueDate).toISOString().slice(0, 10) : ''}" /></p>
        <p>Returned: ${record.returnDate ? new Date(record.returnDate).toLocaleString() : 'Not returned'}</p>
        <p>Status: <input type="text" id="status-${record.id}" value="${record.status || ''}" /></p>
        <p>Item: <select id="itemSelect-${record.id}">${optionsHtml}</select></p>
        <div class="item-actions">
          <button class="edit-btn" onclick="updateBorrowerRecord(${record.id})">Save</button>
          <button class="delete-btn" onclick="deleteBorrowerRecord(${record.id})">Delete Record</button>
        </div>
      </li>
    `).join('') : '<li>No records found for this borrower.</li>';

    records.forEach(record => {
      const select = document.getElementById(`itemSelect-${record.id}`);
      if (select) select.value = record.itemId;
    });

    modal.style.display = 'block';
  } catch (error) {
    console.error(error);
    recordList.innerHTML = '<li class="error">Unable to load borrower records.</li>';
    recordItemSelect.innerHTML = '<option value="">Unable to load items</option>';
    modal.style.display = 'block';
  }
}

async function updateBorrowerRecord(recordId) {
  const statusInput = document.getElementById(`status-${recordId}`);
  const dueDateInput = document.getElementById(`dueDate-${recordId}`);
  const itemSelect = document.getElementById(`itemSelect-${recordId}`);

  if (!itemSelect || !statusInput || !dueDateInput) return;

  const payload = {
    itemId: parseInt(itemSelect.value),
    status: statusInput.value.trim(),
    dueDate: dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null
  };

  try {
    const response = await fetch(`${borrowersBase}/records/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Unable to update record');
    }

    alert('Record updated successfully.');
    const borrowerId = document.getElementById('recordUserId').value;
    await manageBorrowerRecords(borrowerId);
    await loadBorrowers();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Could not save borrower record.');
  }
}

async function deleteBorrowerRecord(recordId) {
  if (!confirm('Delete this borrow record? This may adjust inventory.')) {
    return;
  }

  try {
    const response = await fetch(`${borrowersBase}/records/${recordId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Unable to delete record');
    }

    alert('Record deleted successfully.');
    const borrowerId = document.getElementById('recordUserId').value;
    await manageBorrowerRecords(borrowerId);
    await loadBorrowers();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Could not delete borrower record.');
  }
}

async function handleAddBorrowRecord() {
  const borrowerId = document.getElementById('recordUserId').value;
  const itemSelect = document.getElementById('recordItemSelect');
  const dueDateInput = document.getElementById('recordDueDate');

  if (!itemSelect || !borrowerId) return;
  if (!itemSelect.value) {
    alert('Select an item to add.');
    return;
  }

  const payload = {
    itemId: parseInt(itemSelect.value),
    dueDate: dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null
  };

  try {
    const response = await fetch(`${borrowersBase}/${encodeURIComponent(borrowerId)}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Unable to add borrow record');
    }

    alert('Record added successfully.');
    await manageBorrowerRecords(borrowerId);
    await loadBorrowers();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Could not add borrower record.');
  }
}

function openEditModal(id, name, description, quantity) {
  editItemId.value = id;
  editItemName.value = name;
  editItemDescription.value = description;
  editItemQuantity.value = quantity;
  editModal.style.display = 'block';
}

function closeEditModal() {
  editModal.style.display = 'none';
}

async function deleteItem(itemId, itemName) {
  if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
    return;
  }

  try {
    const response = await fetch(`${apiBase}/${itemId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete item');
    }

    await loadItems();
  } catch (error) {
    console.error(error);
    alert('Could not delete this item.');
  }
}

itemForm.addEventListener('submit', async event => {
  event.preventDefault();
  const quantityValue = Number(itemQuantity.value);
  const newItem = {
    name: itemName.value.trim(),
    description: itemDescription.value.trim(),
    quantity: quantityValue,
    isAvailable: quantityValue > 0
  };

  try {
    const response = await fetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });

    if (!response.ok) {
      throw new Error('Failed to add item');
    }

    message.textContent = 'Item added successfully!';
    itemForm.reset();
    itemQuantity.value = '1';
    await loadItems();
  } catch (error) {
    message.textContent = 'Error adding item.';
    console.error(error);
  }
});

editForm.addEventListener('submit', async event => {
  event.preventDefault();
  const quantityValue = Number(editItemQuantity.value);
  const updatedItem = {
    name: editItemName.value.trim(),
    description: editItemDescription.value.trim(),
    quantity: quantityValue,
    isAvailable: quantityValue > 0
  };

  try {
    const response = await fetch(`${apiBase}/${editItemId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    });

    if (!response.ok) {
      throw new Error('Failed to update item');
    }

    closeEditModal();
    await loadItems();
  } catch (error) {
    console.error(error);
    alert('Could not update this item.');
  }
});

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target == editModal) {
    closeEditModal();
  }
}

refreshBtn.addEventListener('click', loadItems);
if (refreshBorrowersBtn) {
  refreshBorrowersBtn.addEventListener('click', loadBorrowers);
}

window.manageBorrowerRecords = manageBorrowerRecords;
window.editBorrowerRecords = manageBorrowerRecords;
window.handleAddBorrowRecord = handleAddBorrowRecord;
window.updateBorrowerRecord = updateBorrowerRecord;
window.deleteBorrowerRecord = deleteBorrowerRecord;
window.cleanBorrowerRecords = cleanBorrowerRecords;
window.deleteBorrowerAccount = deleteBorrowerAccount;

loadItems();
loadBorrowers();
