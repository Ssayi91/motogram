document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Unauthorized! Please log in.");
        window.location.href = "login.html"; 
        return;
    }

    const editBtn = document.getElementById("editProfileBtn");
    const saveBtn = document.getElementById("saveProfileBtn");
    const cancelBtn = document.getElementById("cancelProfileBtn");

    const nameField = document.getElementById("profileName");
    const emailField = document.getElementById("profileEmail");
    const phoneField = document.getElementById("profilePhone");
    const profilePic = document.getElementById("profilePic");

    const nameInput = document.getElementById("editName");
    const emailInput = document.getElementById("editEmail");
    const phoneInput = document.getElementById("editPhone");
    const profilePicInput = document.getElementById("editProfilePic");

    const passwordSection = document.querySelector(".password-change");
    const currentPassword = document.getElementById("currentPassword");
    const newPassword = document.getElementById("newPassword");

    // Load Buyer Profile from API or LocalStorage
    async function loadProfile() {
        try {
            const response = await fetch("http://localhost:5000/api/buyer/profile", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`Failed to fetch profile: ${response.statusText}`);

            const buyer = await response.json();
            console.log("Buyer Profile:", buyer);

            if (!buyer || buyer.role !== "buyer") {
                alert("Access denied. You are not a buyer.");
                return;
            }

            updateProfileUI(buyer);
            localStorage.setItem("buyerProfile", JSON.stringify(buyer)); // Cache profile in local storage

        } catch (error) {
            console.error(error);
            alert("Error loading profile. Using cached data.");
            
            // Load from localStorage if API fails
            const cachedProfile = JSON.parse(localStorage.getItem("buyerProfile"));
            if (cachedProfile) updateProfileUI(cachedProfile);
        }
    }

    function updateProfileUI(buyer) {
        nameField.innerText = buyer.name;
        emailField.innerText = buyer.email;
        phoneField.innerText = buyer.phone || "N/A";
        profilePic.src = buyer.profilePic || "default-profile.jpg"; 
    }

    loadProfile();

    // Enable Edit Mode
    editBtn.addEventListener("click", () => {
        nameField.contentEditable = "true";
        emailField.contentEditable = "true";
        phoneField.contentEditable = "true";
        passwordSection.style.display = "block";

        editBtn.style.display = "none";
        saveBtn.style.display = "inline-block";
        cancelBtn.style.display = "inline-block";
    });

    // Cancel Edit
    cancelBtn.addEventListener("click", () => {
        loadProfile();
        nameField.contentEditable = "false";
        emailField.contentEditable = "false";
        phoneField.contentEditable = "false";
        passwordSection.style.display = "none";

        editBtn.style.display = "inline-block";
        saveBtn.style.display = "none";
        cancelBtn.style.display = "none";
    });

    // Preview Profile Picture
    profilePicInput.addEventListener("change", () => {
        if (profilePicInput.files.length > 0) {
            profilePic.src = URL.createObjectURL(profilePicInput.files[0]);
        }
    });

    // Save Profile Update
    saveBtn.addEventListener("click", async () => {
        const updatedName = nameField.innerText;
        const updatedEmail = emailField.innerText;
        const updatedPhone = phoneField.innerText;

        const formData = new FormData();
        formData.append("name", updatedName);
        formData.append("email", updatedEmail);
        formData.append("phone", updatedPhone);

        if (profilePicInput.files.length > 0) {
            formData.append("profilePic", profilePicInput.files[0]);
        }

        try {
            const response = await fetch("http://localhost:5000/api/buyer/update-profile", {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Profile update failed");

            alert("Profile updated successfully!");
            localStorage.setItem("buyerProfile", JSON.stringify({ name: updatedName, email: updatedEmail, phone: updatedPhone, profilePic: profilePic.src }));

            // Disable Editing Mode
            nameField.contentEditable = "false";
            emailField.contentEditable = "false";
            phoneField.contentEditable = "false";
            passwordSection.style.display = "none";

            editBtn.style.display = "inline-block";
            saveBtn.style.display = "none";
            cancelBtn.style.display = "none";

        } catch (error) {
            console.error(error);
            alert(`Error updating profile: ${error.message}`);
        }
    });

    // Change Password
    newPassword.addEventListener("keyup", () => {
        if (newPassword.value.length < 6) {
            newPassword.style.border = "2px solid red";
        } else {
            newPassword.style.border = "2px solid green";
        }
    });

    document.querySelector(".password-change").addEventListener("submit", async (e) => {
        e.preventDefault();
        const passwordData = {
            currentPassword: currentPassword.value,
            newPassword: newPassword.value,
        };

        try {
            const response = await fetch("http://localhost:5000/api/buyer/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(passwordData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Password update failed");

            alert("Password updated successfully!");
            currentPassword.value = "";
            newPassword.value = "";

        } catch (error) {
            console.error(error);
            alert(`Error updating password: ${error.message}`);
        }
    });

    // Logout Function
    document.querySelector(".fa-sign-out-alt").addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("buyerProfile");
        window.location.href = "login.html"; 
    });

    // Dark Mode Toggle
    const darkModeSwitch = document.getElementById("darkModeSwitch");
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        darkModeSwitch.checked = true;
    }

    darkModeSwitch.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
    });
});
