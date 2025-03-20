document.addEventListener("DOMContentLoaded", function () {
    console.log("Register page loaded");

    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        const name = document.getElementById("register-name").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const username = document.getElementById("register-username").value.trim();
        const password = document.getElementById("register-password").value.trim();
        const confirmPassword = document.getElementById("register-confirm-password").value.trim();
        const role = document.getElementById("register-role").value;

        // Check for empty fields
        if (!name || !email || !username || !password || !confirmPassword) {
            alert("All fields are required!");
            return;
        }

        // Validate email format
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            alert("Please enter a valid email address!");
            return;
        }

        // Ensure passwords match
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Restrict role selection to valid roles
        const validRoles = ["buyer", "seller"];
        if (!validRoles.includes(role)) {
            alert("Invalid role selected!");
            return;
        }

        const userData = { name, email, username, password, role };

        try {
            const response = await fetch("http://localhost:5000/api/buyer/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Registration successful! Redirecting to login...");
                window.location.href = "login.html"; // Redirect to login page
            } else {
                alert(data.message || "Registration failed!");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Server error! Please try again later.");
        }
    });
});
