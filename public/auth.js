document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            
            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            try {
                const response = await fetch("/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem("token", data.accessToken);
                    localStorage.setItem("userRole", data.user.role);
                    window.location.href = data.user.role === "buyer" ? "buyer-dashboard.html" : "seller-dashboard.html";
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Login Error:", error);
            }
        });
    } else {
        console.warn("Login form not found. Skipping login event listener.");
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = document.getElementById("register-name").value;
            const email = document.getElementById("register-email").value;
            const password = document.getElementById("register-password").value;
            const role = document.getElementById("register-user-type").value;

            try {
                const response = await fetch("/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password, role }),
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Registration successful! Please login.");
                    window.location.href = "login.html";
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Registration Error:", error);
            }
        });
    } else {
        console.warn("Register form not found. Skipping register event listener.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const authButton = document.getElementById("authButton"); // The login/profile button
    const logoutButton = document.getElementById("logoutButton");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (token && authButton) {
        // Change "Login" button to "My Account" and keep it visible
        authButton.innerHTML = '<i class="fa-solid fa-user"></i> My Account';
        authButton.href = role === "buyer" ? "dashboard-buyer.html" : "seller-dashboard.html";

        // Show logout button
        if (logoutButton) logoutButton.style.display = "block";
    } else {
        // Show login button if user is NOT logged in
        authButton.innerHTML = '<i class="fa-solid fa-user"></i> Login';
        authButton.href = "login.html";
    }

    // Logout functionality
    if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            window.location.href = "index.html"; // Redirect to home after logout
        });
    }
});
