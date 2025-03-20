document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch("http://localhost:5000/api/buyer/login", { // ✅ Correct route
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log("Login Response:", data); // ✅ Log response to check

        if (data.success) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userRole", data.user?.role); // ✅ Fix here

            console.log("User role:", data.user?.role); // ✅ Fix here

            if (data.user?.role === "buyer") { // ✅ Fix condition
                console.log("Redirecting to index.html...");
                window.location.href = "index.html"; 
            } else if (data.user?.role === "seller") {
                window.location.href = "seller-dashboard.html";
            } else {
                alert("Unknown role. Please contact support.");
            }
        } else {
            alert(data.message || "Invalid credentials");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Please try again later.");
    }
});
