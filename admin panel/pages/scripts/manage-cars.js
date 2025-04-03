// Check authentication on page load
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    // console.log("🔹 Token on Page Load:", token); // Debugging

    if (!token) {
        alert("Please login to access the admin panel");
        window.location.href = "admin-login.html";
        return;
    }

    fetchCars();
    setupDarkMode();
    setupSearch();
    setupSidebar();
    setupCarForm();
});

// Global variable to track current images
let currentImages = [];
let currentIndex = 0;

// Open Modal Function
function openModal(carId, imageIndex) {
    console.log("Opening Modal for Car:", carId);

    // Find the car in the fetched list
    fetch(`/api/cars/${carId}`)
        .then(response => response.json())
        .then(car => {
            currentImages = car.images;
            currentIndex = imageIndex;

            // Set modal image source
            document.getElementById("modal-image").src = currentImages[currentIndex];

            // Display modal
            document.getElementById("car-modal").style.display = "flex";
        })
        .catch(error => console.error("❌ Error opening modal:", error));
}

// Close Modal Function
function closeModal() {
    document.getElementById("car-modal").style.display = "none";
}

// Show Previous Image
function prevImage() {
    if (currentImages.length === 0) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    document.getElementById("modal-image").src = currentImages[currentIndex];
}

// Show Next Image
function nextImage() {
    if (currentImages.length === 0) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    document.getElementById("modal-image").src = currentImages[currentIndex];
}


// ✅ Setup Sidebar Toggle
function setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.menu-btn');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

// ✅ Setup Dark Mode Toggle
function setupDarkMode() {
    const darkModeBtn = document.getElementById("dark-mode-toggle");

    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }

    if (darkModeBtn) {
        darkModeBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
        });
    }
}

// ✅ Setup Search Functionality
function setupSearch() {
    const searchInput = document.getElementById("search");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.toLowerCase();
            document.querySelectorAll(".car-card").forEach(car => {
                const text = car.textContent.toLowerCase();
                car.style.display = text.includes(searchTerm) ? "block": "none";
            });
        });
    }
}


// ✅ Setup Car Form
function setupCarForm() {
    const form = document.getElementById("car-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem("token");

            if (!token) {
                alert("Session expired. Please login again.");
                window.location.href = "admin-login.html";
                return;
            }

            console.log("🔹 Token before submission:", token); // Debugging

            const submitButton = form.querySelector("button[type='submit']");
            const originalButtonText = submitButton.innerHTML;
            
            try {
                submitButton.disabled = true;
                submitButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

                const formData = new FormData(form);
                console.log("📜 Form data before submission:", Array.from(formData.entries())); // Debugging

                let apiUrl = "/api/cars/add";
                let method = "POST";

                if (form.dataset.editing) {
                    apiUrl = `/api/cars/edit/${form.dataset.carId}`;
                    method = "PUT";
                }

                const response = await fetch(apiUrl, {
                    method: method,
                    body: formData,
                    headers: { "Authorization": `Bearer ${token}` }
                });

                console.log("🔹 Response Status:", response.status);

                const data = await response.json();
                console.log("🔹 Response Data:", data);
                
                if (!response.ok) {
                    throw new Error(data.message || "Failed to save car");
                }

                alert(form.dataset.editing ? "Car updated successfully!" : "Car added successfully!");
                form.reset();
                delete form.dataset.editing;
                delete form.dataset.carId;
                fetchCars(); // Refresh the car list
            } catch (error) {
                console.error("❌ Error:", error);
                alert(error.message || "An error occurred while saving the car");
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
}

// ✅ Fetch cars and populate the list
async function fetchCars() {
    console.log("🔹 Fetching all cars (Pending & Approved)...");

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Session expired. Please login again.");
            window.location.href = "admin-login.html";
            return;
        }

        const response = await fetch("/api/cars", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const cars = await response.json();
        console.log("✅ Fetched Cars:", cars);

        const carContainer = document.getElementById("car-list");
        carContainer.innerHTML = "";

        if (cars.length === 0) {
            carContainer.innerHTML = `<p class="no-cars">No cars found</p>`;
            return;
        }

        cars.forEach(car => {
            const carElement = document.createElement("div");
            carElement.classList.add("car-card");
            carElement.innerHTML = `
            <div class="card-content">
                <div class="image-slider">
                    <div class="carousel">
                        ${car.images.map((image, index) => `
                            <img src="${image}" alt="${car.brand} ${car.model}" 
                                 class="car-image ${index === 0 ? 'active' : ''}"
                                 onclick="openModal('${car._id}', ${index})"> 
                        `).join('')}
                    </div>
                </div>
                <div class="car-details">
                    <h3 class="car-title">${car.brand} ${car.model} (${car.year})</h3>
                    <p class="car-price">Price: Ksh ${car.price}</p>
                    <p class="car-mileage"><i class="fa-solid fa-road"></i> Mileage: ${car.mileage} KM</p>
                    <p class="car-transmission"><i class="fa-solid fa-cogs"></i> Transmission: ${car.transmission}</p>
                    <p class="car-fuel-type"><i class="fa-solid fa-gas-pump"></i> Fuel Type: ${car.fuelType}</p>
                    <p class="car-category"><i class="fa-solid fa-list"></i> ${car.category}</p>
                    <p class="car-status"><i class="fa-solid fa-check-circle"></i> Status: <strong>${car.status}</strong></p>
                </div>
                <div class="car-actions">
                    <button onclick="editCar('${car._id}')" class="edit-button">Edit</button>
                    <button onclick="deleteCar('${car._id}')" class="delete-button">Delete</button>
                    ${car.status === "pending" ? `<button onclick="approveCar('${car._id}')" class="approve-button">Approve</button>` : ""}
                </div>
            </div>
        `;
        carContainer.appendChild(carElement);
        });
    } catch (error) {
        console.error("❌ Error fetching cars:", error);
        document.getElementById("car-list").innerHTML = `<p class="error">Error loading cars. Please try again later.</p>`;
    }
}

// ✅ Edit Car Function
function editCar(carId) {
    console.log("📝 Editing Car:", carId);

    const form = document.getElementById("car-form");

    // ✅ Check if form exists
    if (!form) {
        console.error("❌ Error: Car form not found!");
        return;
    }

    fetch(`/api/cars/car/${carId}`, {  // Ensure backend route matches this
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(car => {
        // ✅ Check if car object exists before setting values
        if (!car) {
            console.error("❌ Error: Car data is undefined!");
            return;
        }

        form.dataset.editing = "true";
        form.dataset.carId = carId;

        // ✅ Check each field before setting values
        if (form.brand) form.brand.value = car.brand || "";
        if (form.model) form.model.value = car.model || "";
        if (form.year) form.year.value = car.year || "";
        if (form.price) form.price.value = car.price || "";
        if (form.drivetrain) form.drivetrain.value = car.drivetrain || "";
        if (form.fuelType) form.fuelType.value = car.fuelType || "";
        if (form.transmission) form.transmission.value = car.transmission || "";
        if (form.mileage) form.mileage.value = car.mileage || "";
        if (form.description) form.description.value = car.description || "";

        window.scrollTo({ top: form.offsetTop, behavior: "smooth" });
    })
    .catch(error => console.error("❌ Error fetching car details:", error));
}

// ✅ Delete Car Function
async function deleteCar(carId) {
    if (!confirm("Are you sure you want to delete this car?")) return;

    try {
        const response = await fetch(`/api/cars/delete/${carId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        if (!response.ok) throw new Error("Failed to delete car");

        alert("Car deleted successfully!");
        fetchCars();
    } catch (error) {
        console.error("❌ Error deleting car:", error);
        alert("An error occurred while deleting the car");
    }
}

// ✅ Approve Car Function
async function approveCar(carId) {
    console.log("✅ Approving Car:", carId);

    try {
        const response = await fetch(`/api/cars/approve/${carId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        if (!response.ok) {
            throw new Error("Failed to approve car");
        }

        const data = await response.json();
        console.log("✅ Car Approved:", data);

        // ✅ Remove from pending list and update UI
        fetchCars(); // Refresh the list after approval
    } catch (error) {
        console.error("❌ Error approving car:", error);
    }
}
