let currentCarFilter = null;

async function loadMessages(filter = 'all') {
  try {
    const res = await fetch('/api/messages', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });
    const messages = await res.json();

    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-comment-slash"></i>
          <p>No messages yet</p>
        </div>
      `;
      return;
    }

    // Group messages by car/seller
    const threads = messages.reduce((acc, msg) => {
      const threadId = msg.car._id;
      if (!acc[threadId]) {
        acc[threadId] = {
          car: msg.car,
          seller: msg.receiver,
          messages: []
        };
      }
      acc[threadId].messages.push(msg);
      return acc;
    }, {});

    // Render threads
    Object.values(threads).forEach(thread => {
      const threadHtml = `
        <div class="message-thread" data-car-id="${thread.car._id}">
          <div class="thread-header">
            <img src="${thread.car.images[0]}" alt="${thread.car.brand}">
            <div>
              <h3>${thread.car.brand} ${thread.car.model}</h3>
              <p>Seller: ${thread.seller.firstName} ${thread.seller.lastName}</p>
            </div>
          </div>
          <div class="message-history">
            ${thread.messages.map(msg => `
              <div class="message ${msg.sender._id === localStorage.getItem('userId') ? 'sent' : 'received'}">
                <p>${msg.content}</p>
                <span class="timestamp">
                  ${new Date(msg.createdAt).toLocaleString()}
                  ${msg.read ? '<i class="fas fa-check-double read-indicator"></i>' : ''}
                </span>
              </div>
            `).join('')}
          </div>
          <div class="reply-box">
            <textarea placeholder="Type your reply..."></textarea>
            <button class="send-reply">Send</button>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', threadHtml);
    });

  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

document.getElementById('composeBtn').addEventListener('click', async () => {
  const modal = document.getElementById('composeModal');
  const recipientSelect = document.getElementById('recipient');
  
  // Fetch potential recipients (sellers of saved cars)
  const res = await fetch('/api/cars/saved/mycars', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
  });
  const savedCars = await res.json();

  // Populate recipients
  recipientSelect.innerHTML = savedCars
    .map(car => `
      <option value="${car.seller._id}">
        ${car.seller.firstName} ${car.seller.lastName} - ${car.brand} ${car.model}
      </option>
    `).join('');

  modal.style.display = 'block';
});

// Handle message sending
document.getElementById('messageForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const message = {
    carId: document.getElementById('recipient').value.split('-')[1],
    content: document.getElementById('messageText').value
  };

  try {
    await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    loadMessages();
    document.getElementById('composeModal').style.display = 'none';
  } catch (error) {
    console.error('Error sending message:', error);
  }
});

// Real-time message updates
const eventSource = new EventSource('/api/messages/events');

eventSource.addEventListener('new-message', (e) => {
  const message = JSON.parse(e.data);
  if (message.receiver === localStorage.getItem('userId')) {
    loadMessages();
    showNotification(`New message from ${message.senderName}`);
  }
});

// Notification function
function showNotification(text) {
  if (Notification.permission === 'granted') {
    new Notification('New Message', { body: text });
  }
}

// Dark Mode Toggle Functionality
const darkModeToggle = document.getElementById('darkModeSwitch');
const htmlElement = document.documentElement;

// Check for saved user preference
const currentTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', currentTheme);

if (currentTheme === 'dark') {
  darkModeToggle.checked = true;
}

// Toggle dark/light mode
darkModeToggle.addEventListener('change', function() {
  if (this.checked) {
    htmlElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    htmlElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
});

