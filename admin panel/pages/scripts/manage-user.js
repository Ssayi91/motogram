document.addEventListener("DOMContentLoaded", async () => {
    const userList = document.getElementById("user-list");
    const searchInput = document.getElementById("search-user");
    const filterRole = document.getElementById("filter-role");
    const paginationContainer = document.getElementById("pagination");

    const usersPerPage = 5;
    let currentPage = 1;
    let allUsers = [];
    const token = localStorage.getItem("token"); // ✅ Retrieve token
    console.log("🔹 Retrieved Token:", token);

    if (!token) {
        console.error("❌ No token found! Redirecting to login...");
        alert("Session expired. Please log in again.");
        window.location.href = "/admin/login.html"; // Redirect to login
        return;
    }

    // ✅ Fetch Users Function
    async function fetchUsers() {
        try {
            const response = await fetch("/api/admin/users", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            console.log("🔍 API Response:", data);

            // ✅ Ensure correct data format
            if (Array.isArray(data)) {
                allUsers = data;
            } else if (Array.isArray(data.users)) {
                allUsers = data.users;
            } else {
                console.error("❌ Unexpected API response format:", data);
                return;
            }

            console.log("✅ Users Loaded:", allUsers);
            renderUsers(); // ✅ Ensure rendering happens

        } catch (error) {
            console.error("❌ Error fetching users:", error);
        }
    }

    // ✅ Render Users with Pagination
    function renderUsers() {
        userList.innerHTML = ""; // Clear table

        let filteredUsers = allUsers.filter(user =>
            user.name.toLowerCase().includes(searchInput.value.toLowerCase())
        );

        if (filterRole.value) {
            filteredUsers = filteredUsers.filter(user => user.role === filterRole.value);
        }

        console.log("🎯 Filtered Users:", filteredUsers);

        // ✅ Pagination logic
        const start = (currentPage - 1) * usersPerPage;
        const paginatedUsers = filteredUsers.slice(start, start + usersPerPage);

        paginatedUsers.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.username}</td>
                <td>
                    <select class="role-select" data-id="${user._id}">
                        <option value="buyer" ${user.role === "buyer" ? "selected" : ""}>Buyer</option>
                        <option value="seller" ${user.role === "seller" ? "selected" : ""}>Seller</option>
                        <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                </td>
                <td>
                    <button class="delete-btn" data-id="${user._id}">Delete</button>
                </td>
            `;
            userList.appendChild(row);
        });

        // ✅ Add event listeners for role updates
        document.querySelectorAll(".role-select").forEach(select => {
            select.addEventListener("change", async (e) => {
                const userId = e.target.dataset.id;
                const newRole = e.target.value;
                await updateUserRole(userId, newRole);
            });
        });

        // ✅ Add event listeners for deleting users
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const userId = e.target.dataset.id;
                await deleteUser(userId);
            });
        });

        renderPagination(filteredUsers.length);
    }

    // ✅ Render Pagination Buttons
    function renderPagination(totalUsers) {
        paginationContainer.innerHTML = "";
        const totalPages = Math.ceil(totalUsers / usersPerPage);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.classList.add("pagination-btn");
            if (i === currentPage) btn.classList.add("active");

            btn.addEventListener("click", () => {
                currentPage = i;
                renderUsers();
            });

            paginationContainer.appendChild(btn);
        }
    }

    // ✅ Function to update user role
    async function updateUserRole(userId, newRole) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            alert(data.message);
        } catch (error) {
            console.error("❌ Error updating user role:", error);
        }
    }

    // ✅ Function to delete a user
    async function deleteUser(userId) {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                credentials: "include"
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            alert(data.message);
            allUsers = allUsers.filter(user => user._id !== userId); // Remove deleted user from list
            renderUsers();
        } catch (error) {
            console.error("❌ Error deleting user:", error);
        }
    }

    // ✅ Search Users (Triggers Render)
    searchInput.addEventListener("input", () => {
        currentPage = 1;
        renderUsers();
    });

    // ✅ Filter Users by Role (Triggers Render)
    filterRole.addEventListener("change", () => {
        currentPage = 1;
        renderUsers();
    });

    // ✅ Theme Switch Logic
    const themeSwitch = document.getElementById("theme-switch");
    const body = document.body;

    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
        themeSwitch.checked = true;
    }

    themeSwitch.addEventListener("change", () => {
        if (themeSwitch.checked) {
            body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    });

    // ✅ Fetch users on load
    await fetchUsers();
});
