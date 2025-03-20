document.getElementById("admin-login-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch("/api/auth/admin-login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("🔹 Full Login Response:", result); // Debugging

        if (response.ok) {
            if (!result.token) {  // ✅ FIXED: Use `result.token` instead of `accessToken`
                console.error("❌ No token received!");
                document.getElementById("message").innerHTML = `<p style="color:red;">Login failed: No token received</p>`;
                return;
            }

            // ✅ Store token & role in localStorage
            console.log("✅ Token:", result.token);
            localStorage.setItem("token", result.token);

            // ✅ Store user role if provided (avoid undefined)
            if (result.userRole) {
                localStorage.setItem("userRole", result.userRole);
                console.log("✅ Role:", result.userRole);
            }

            // Redirect to admin dashboard
            window.location.href = "dashboard.html";
        } else {
            document.getElementById("message").innerHTML = `<p style="color:red;">${result.message}</p>`;
        }
    } catch (error) {
        console.error("❌ Error during login:", error);
    }
});



// Theme toggle functionality
const toggleThemeButton = document.getElementById("toggle-theme");
toggleThemeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const sunIcon = toggleThemeButton.querySelector('.fa-sun');
    const moonIcon = toggleThemeButton.querySelector('.fa-moon');
    sunIcon.style.display = sunIcon.style.display === 'none' ? 'inline' : 'none';
    moonIcon.style.display = moonIcon.style.display === 'none' ? 'inline' : 'none';
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});
