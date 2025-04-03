document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus();
    setupEventSource();
    setupThemeToggle();
    setupSidebarToggle();
    loadAdminMessages();
    fetchCars();
});

// =====================
// 🔐 AUTHENTICATION
// =====================

// Check Admin Authentication
function checkAuthStatus() {
    const token = localStorage.getItem("adminToken"); // Use the correct key here
    if (!token) {
        window.location.href = "/pages/admin-login.html"; 
    }
}

// Admin Login
document.getElementById("admin-login-form")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    try {
        const response = await fetch("/api/auth/admin-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("adminToken", data.token);  // Store token with the correct key
            localStorage.setItem("userRole", data.userRole || "admin");
            window.location.href = "/admin-panel/pages/dashboard.html";
        } else {
            showError(data.message);
        }
    } catch (error) {
        showError("Server error. Try again later.");
    }
});

// Admin Logout
document.getElementById("logout-button")?.addEventListener("click", () => {
    clearAuthData();
    window.location.href = "/pages/admin-login.html";
});

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem("adminToken");  // Use correct key
    localStorage.removeItem("userRole");
}

// =====================
// 💬 ADMIN MESSAGES
// =====================

// Load Messages for Admin
async function loadAdminMessages() {
    try {
        const token = localStorage.getItem("adminToken");  // Ensure we're using the right key here
        if (!token) return window.location.href = '/pages/admin-login.html';

        const res = await fetch('/api/messages/admin', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error("Failed to fetch messages");

        const messages = await res.json();
        console.log("🔍 Admin Messages Fetched:", messages);
        renderMessages(messages);
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

// Render messages dynamically
function renderMessages(messages) {
    const container = document.getElementById('adminMessagesContainer');
    container.innerHTML = '';

    if (!messages.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-comment-slash"></i><p>No messages yet</p></div>`;
        return;
    }

    messages.forEach(msg => {
        console.log("📩 Rendering Message:", msg);

        const messageHtml = `
            <div class="admin-message ${msg.read ? 'read' : 'unread'}" data-id="${msg._id}">
                <div class="message-header">
                    <img src="${msg.car?.images?.[0] || 'default-car.jpg'}" alt="${msg.car?.brand || 'Car'}">
                    <div>
                        <h4>${msg.car?.brand || 'Unknown'} ${msg.car?.model || ''}</h4>
                        <p><strong>From:</strong> ${msg.sender?.firstName || 'Unknown'} ${msg.sender?.lastName || ''}</p>
                        <p><strong>To:</strong> ${msg.receiver?.firstName || 'Unknown'} ${msg.receiver?.lastName || ''}</p>
                        <p><strong>Email:</strong> ${msg.sender?.email || 'No email'}</p>
                    </div>
                </div>
                <div class="message-content">
                    <p>${msg.content}</p>
                    <span class="timestamp">${new Date(msg.createdAt).toLocaleString()} ${msg.read ? '' : '<span class="unread-badge">NEW</span>'}</span>
                </div>
                <button class="mark-read-btn" onclick="markMessageAsRead('${msg._id}')">Mark as Read</button>
            </div>`;
        container.insertAdjacentHTML('beforeend', messageHtml);
    });
}

// Mark Message as Read
async function markMessageAsRead(messageId) {
    try {
        const token = localStorage.getItem("adminToken");  // Ensure token is used correctly
        if (!token) return window.location.href = "/pages/admin-login.html";

        const response = await fetch(`/api/messages/admin/${messageId}/read`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to mark message as read");
        loadAdminMessages();
    } catch (error) {
        console.error("Error marking message as read:", error);
    }
}

// =====================
// 🚘 CAR MANAGEMENT
// =====================

// Fetch and Display Cars
async function fetchCars() {
    try {
        const response = await fetch("/api/cars");
        const cars = await response.json();
        renderCars(cars);
    } catch (error) {
        console.error("Error fetching cars:", error);
    }
}

// Render Cars
function renderCars(cars) {
    const carContainer = document.getElementById("car-list");
    carContainer.innerHTML = "";

    cars.forEach(car => {
        const carElement = document.createElement("div");
        carElement.classList.add("car-item");
        carElement.innerHTML = `
            <h3>${car.brand} ${car.model} (${car.year})</h3>
            <p>Price: Ksh ${car.price}</p>
            <p>Status: <strong>${car.status}</strong></p>
            <button onclick="editCar('${car._id}')">Edit</button>
            <button onclick="deleteCar('${car._id}')">Delete</button>
            ${car.status === "pending" ? `<button onclick="approveCar('${car._id}')">Approve</button>` : ""}`;
        carContainer.appendChild(carElement);
    });
}

// =====================
// 🎨 UI CONTROLS
// =====================

// Theme Toggle
function setupThemeToggle() {
    const toggleThemeButton = document.getElementById("toggle-theme");
    toggleThemeButton?.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
    });

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
}

// Sidebar Toggle
function setupSidebarToggle() {
    document.querySelector(".toggle-sidebar")?.addEventListener("click", () => {
        document.querySelector(".sidebar").classList.toggle("open");
    });
}

// =====================
// 📩 MESSAGE NOTIFICATIONS (SSE)
// =====================

// Listen for new messages
function setupEventSource() {
    const eventSource = new EventSource('/api/messages/events');

    eventSource.addEventListener('new-message', (e) => {
        try {
            const message = JSON.parse(e.data);
            if (message.receiver === localStorage.getItem('userId')) {
                loadAdminMessages();
            }
        } catch (error) {
            console.error("Error handling SSE message:", error);
        }
    });

    eventSource.onerror = () => {
        console.error("SSE connection error, retrying...");
        setTimeout(setupEventSource, 5000);
    };
}

// =====================
// 🛠️ HELPER FUNCTIONS
// =====================

function showError(message) { 
    document.getElementById("message")?.innerHTML = `<p class="error-message">${message}</p>`;
}
