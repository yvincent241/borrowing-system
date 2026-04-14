const apiBase = '/api/items';
const itemsList = document.getElementById('itemsList');
const refreshBtn = document.getElementById('refreshBtn');
const itemForm = document.getElementById('itemForm');
const itemName = document.getElementById('itemName');
const itemDescription = document.getElementById('itemDescription');
const message = document.getElementById('message');

async function loadItems() {
itemsList.innerHTML = '<li>Loading...</li>';
try{const response = await fetch(apiBase);const items = await response.json();itemsList.innerHTML = items.map(item => `<li><strong>${item.name}</strong><p>${item.description || 'No description'}</p><p>Status: ${item.isAvailable ? 'Available' : 'Not available'}</p></li>`).join('');}catch (error){itemsList.innerHTML = '<li class="error">Unable to load items.</li>';console.error(error);}}

itemForm.addEventListener('submit', async event => {
event.preventDefault();const newItem = {name: itemName.value.trim(),description: itemDescription.value.trim(),isAvailable: true};
try{const response = await fetch(apiBase, {method: 'POST',headers: { 'Content-Type': 'application/json' },body: JSON.stringify(newItem)});
if (!response.ok) {throw new Error('Failed to add item');}
message.textContent = 'Item added successfully!';itemForm.reset();await loadItems();}catch (error){message.textContent = 'Error adding item.';console.error(error);}});

refreshBtn.addEventListener('click', loadItems);loadItems();

