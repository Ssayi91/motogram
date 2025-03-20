document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const body = document.body;
    const sidebarToggle = document.querySelector(".toggle-sidebar");
    const sidebar = document.querySelector(".sidebar");

    // Load Dark Mode Preference
    if (localStorage.getItem("dark-mode") === "enabled") {
        body.classList.add("dark-mode");
        darkModeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
    }

    // Dark Mode Toggle
    darkModeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("dark-mode", "enabled");
            darkModeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
        } else {
            localStorage.setItem("dark-mode", "disabled");
            darkModeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
        }
    });

    // Sidebar Toggle (Mobile)
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    // Logout Functionality
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "admin-login.html";
        });
    }

    // Fetch and display cars
    fetchCars();
});

// // Fetch cars from API and display them
// async function fetchCars() {
//     console.log("Fetching cars...");

//     try {
//         const response = await fetch("/api/cars");
//         const cars = await response.json();
//         console.log("Fetched cars:", cars);

//         const carContainer = document.getElementById("car-list");
//         carContainer.innerHTML = ""; // Clear previous content

//         cars.forEach((car) => {
//             const carElement = document.createElement("div");
//             carElement.classList.add("car-item");
//             carElement.innerHTML = `
//                 <div class="image-slider">
//                     <div class="carousel">
//                         ${car.images.length > 0
//                             ? car.images.map((image, index) => 
//                                 `<img src="${image}" alt="${car.brand} ${car.model}" 
//                                 width="150" class="car-image ${index === 0 ? 'active' : ''}" 
//                                 data-index="${index}">`).join('')
//                             : `<img src="default-car.jpg" alt="Default Car" width="150" class="car-image active">`
//                         }
//                     </div>
//                     <button class="prev">&#10094;</button>
//                     <button class="next">&#10095;</button>
//                 </div>

//                 <div class="car-details">
//                     <h3>${car.brand} ${car.model} (${car.year})</h3>
//                     <p>Price: Ksh ${car.price}</p>
//                     <p>Category: ${car.category}</p>
//                     <p>Status: <strong>${car.status}</strong></p>
//                 </div>

//                 <button onclick="editCar('${car._id}')">Edit</button>
//                 <button onclick="deleteCar('${car._id}')">Delete</button>
//                 ${car.status === "pending" ? `<button onclick="approveCar('${car._id}')">Approve</button>` : ""}
//             `;

//             carContainer.appendChild(carElement);
//             setupImageSlider(carElement);
//         });
//     } catch (error) {
//         console.error("Error fetching cars:", error);
//     }
// }

// Setup image slider for each car
function setupImageSlider(carElement) {
    const images = carElement.querySelectorAll(".car-image");
    let currentIndex = 0;

    function showImage(index) {
        images.forEach((img, i) => {
            img.style.display = i === index ? "block" : "none";
        });
    }

    carElement.querySelector(".next").addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    });

    carElement.querySelector(".prev").addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
    });

    showImage(currentIndex);
}

// Handle car form submission
document.getElementById("car-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    try {
        const response = await fetch("/api/cars/add", {
            method: "POST",
            body: formData,
            headers: { 
                "Authorization": `Bearer ${localStorage.getItem("token")}` 
            }
        });

        const data = await response.json();
        if (response.ok) {
            alert("Car added successfully!");
            fetchCars(); // Refresh list
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error adding car:", error);
    }
});

// Edit car
async function editCar(carId) {
    const newPrice = prompt("Enter new price:");
    if (!newPrice) return;

    try {
        const response = await fetch(`/api/cars/edit/${carId}`, {
            method: "PUT",
            body: JSON.stringify({ price: newPrice }),
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        if (response.ok) {
            alert("Car updated successfully!");
            fetchCars();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error editing car:", error);
    }
}

// Delete car
async function deleteCar(carId) {
    if (!confirm("Are you sure you want to delete this car?")) return;

    try {
        const response = await fetch(`/api/cars/delete/${carId}`, { method: "DELETE" });

        if (response.ok) {
            alert("Car deleted successfully!");
            fetchCars();
        } else {
            alert("Failed to delete car.");
        }
    } catch (error) {
        console.error("Error deleting car:", error);
    }
}

// Approve car
async function approveCar(carId) {
    try {
        const response = await fetch(`/api/cars/edit/${carId}`, {
            method: "PUT",
            body: JSON.stringify({ status: "approved" }),
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            alert("Car approved!");
            fetchCars();
        } else {
            alert("Failed to approve car.");
        }
    } catch (error) {
        console.error("Error approving car:", error);
    }
}
