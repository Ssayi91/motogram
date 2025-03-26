let cars = []; // Store cars globally to access them in modal functions
let currentModalIndex = 0; // Track the current image in modal

async function fetchPublicCars() {
    console.log("🚗 Fetching Approved Cars...");

    try {
        const loggedIn = isLoggedIn();
        if (loggedIn) {
            console.log("🔄 Syncing saved cars...");
            const savedRes = await fetch('/api/users/me/saved', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            savedCars = await savedRes.json();
            localStorage.setItem('savedCars', JSON.stringify(savedCars));
        }
        
        const response = await fetch("/api/cars?status=approved"); // Fetch only approved cars
        cars = await response.json();
        console.log("✅ Approved Cars:", cars);

        // Get the containers for different pages
        const indexContainer = document.getElementById("car-container"); // For index.html & motorgram-stock.html
        const inhouseContainer = document.getElementById("motorgram-car-list"); // For motorgram-stock.html
        const importContainer = document.getElementById("import-car-list"); // For import.html

        // Clear containers before adding new cars
        if (indexContainer) indexContainer.innerHTML = "";
        if (inhouseContainer) inhouseContainer.innerHTML = "";
        if (importContainer) importContainer.innerHTML = "";

        if (cars.length === 0) {
            if (indexContainer) indexContainer.innerHTML = `<p class="no-cars">No approved cars available.</p>`;
            if (importContainer) importContainer.innerHTML = `<p class="no-cars">No imported cars available.</p>`;
            return;
        }

        cars.forEach((car, index) => {
            const carElement = document.createElement("div");
            carElement.classList.add("car-card");

            carElement.innerHTML = `
                <div class="car-image-container">
                    <img src="${car.images[0]}" alt="${car.brand} ${car.model}" class="car-image" onclick="openImageModal(${index}, 0)">
                      ${isLoggedIn ? `
            <button class="save-btn" onclick="toggleSave('${car._id}', this)">
                <i class="${savedCars.includes(car._id) ? 'fas' : 'far'} fa-heart"></i>
            </button>
        ` : ''}
                </div>
                <div class="car-details">
                    <h3>${car.brand} ${car.model} (${car.year})</h3>
                    <p><i class="fas fa-money-bill-wave"></i> Price: Ksh ${car.price}</p>
                    <p><i class="fas fa-tachometer-alt"></i> Mileage: ${car.mileage} KM</p>
                    <p><i class="fas fa-cogs"></i> Transmission: ${car.transmission}</p>
                    <p><i class="fas fa-gas-pump"></i> Fuel Type: ${car.fuelType}</p>
                    <p><i class="fas fa-car"></i> Engine: ${car.engineCapacity}</p>
                    <p class="description">
                        ${car.description.slice(0, 100)}
                        <span class="dots">...</span>
                        <span class="more-text">${car.description.slice(100)}</span>
                    </p>
                    <button class="show-more-btn" onclick="toggleDescription(this)">Show More</button>

                        ${isLoggedIn ? `
            <div class="car-actions">
                <button class="message-btn" onclick="openMessageModal('${car._id}', '${car.brand} ${car.model}')">
                    <i class="fas fa-envelope"></i> Message Seller
                </button>
            </div>
        ` : ''}
                </div>
            `;

            // ✅ Assign the car to the correct container
            const currentPage = document.body.dataset.page || 'index';
            let targetContainer;

            switch(true) {
                case currentPage === 'imports' && car.category === 'imported':
                    targetContainer = document.getElementById('import-car-list');
                    break;
                case currentPage === 'motorgram-stock' && car.category === 'motorgram-stock':
                    targetContainer = document.getElementById('motorgram-car-list');
                    break;
                default:
                    if (car.category === 'imported') {
                        targetContainer = document.getElementById('import-car-list') || 
                                       document.getElementById('car-container');
                    } else if (car.category === 'motorgram-stock') {
                        targetContainer = document.getElementById('motorgram-car-list') || 
                                       document.getElementById('car-container');
                    } else {
                        targetContainer = document.getElementById('car-container');
                    }
            }

            if (targetContainer) {
                console.log(`📦 Appending ${car.brand} to ${targetContainer.id}`);
                targetContainer.appendChild(carElement);
            } else {
                console.warn('🚨 No container found for:', car._id);
            }
        });

    } catch (error) {
        console.error("❌ Error fetching public cars:", error);
    }
}


// ✅ Expand / Collapse Description
function toggleDescription(button) {
    const desc = button.previousElementSibling;
    const dots = desc.querySelector(".dots");
    const moreText = desc.querySelector(".more-text");

    if (dots.style.display === "none") {
        dots.style.display = "inline";
        moreText.style.display = "none";
        button.textContent = "Show More";
    } else {
        dots.style.display = "none";
        moreText.style.display = "inline";
        button.textContent = "Show Less";
    }
}

// ✅ Open Image Modal & Allow Scrolling
function openImageModal(carIndex, imgIndex) {
    currentModalIndex = imgIndex;

    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");

    modal.style.display = "block";
    modalImg.src = cars[carIndex].images[imgIndex];

    document.getElementById("prev-modal").onclick = function () {
        navigateModalImage(carIndex, -1);
    };

    document.getElementById("next-modal").onclick = function () {
        navigateModalImage(carIndex, 1);
    };

    document.getElementById("close-modal").onclick = function () {
        modal.style.display = "none";
    };
}

// ✅ Navigate Images in Modal
function navigateModalImage(carIndex, step) {
    let images = cars[carIndex].images;
    currentModalIndex = (currentModalIndex + step + images.length) % images.length;
    document.getElementById("modal-image").src = images[currentModalIndex];
}

// ✅ Call function on page load
document.addEventListener("DOMContentLoaded", fetchPublicCars);


// search function
document.getElementById("search-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent page reload

    // Get user input values
    const brand = document.getElementById("brand").value.toLowerCase().trim();
    const model = document.getElementById("model").value.toLowerCase().trim();
    const fuelType = document.getElementById("fuelType").value;
    const transmission = document.getElementById("transmission").value;
    const minPrice = document.getElementById("minPrice").value.trim();
    const maxPrice = document.getElementById("maxPrice").value.trim();
    const minMileage = document.getElementById("minMileage").value.trim();
    const maxMileage = document.getElementById("maxMileage").value.trim();
    const category = document.getElementById("category").value;
    const year = document.getElementById("year").value.trim();

    // Select dynamically loaded cars
    const cars = document.querySelectorAll(".car-card");

    let found = false;

    cars.forEach(car => {
        // Extract data from each car element
        const carBrand = car.querySelector("h3")?.textContent.toLowerCase() || "";
        const carPrice = parseFloat(car.querySelector("p:nth-of-type(1)")?.textContent.replace(/[^\d]/g, "") || 0);
        const carMileage = parseFloat(car.querySelector("p:nth-of-type(2)")?.textContent.replace(/[^\d]/g, "") || 0);
        const carTransmission = car.querySelector("p:nth-of-type(3)")?.textContent.split(": ")[1] || "";
        const carFuel = car.querySelector("p:nth-of-type(4)")?.textContent.split(": ")[1] || "";
        const carYear = carBrand.match(/\((\d{4})\)/)?.[1] || ""; // Extract year from title
        const carCategory = car.parentElement.id === "import-car-list" ? "imported" : "normal";

        // Check search conditions
        let match = true;
        if (brand && !carBrand.includes(brand)) match = false;
        if (model && !carBrand.includes(model)) match = false;
        if (fuelType && carFuel !== fuelType) match = false;
        if (transmission && carTransmission !== transmission) match = false;
        if (minPrice && carPrice < parseInt(minPrice)) match = false;
        if (maxPrice && carPrice > parseInt(maxPrice)) match = false;
        if (minMileage && carMileage < parseInt(minMileage)) match = false;
        if (maxMileage && carMileage > parseInt(maxMileage)) match = false;
        if (category && carCategory !== category) match = false;
        if (year && carYear !== year) match = false;

        // Show or hide the car based on search results
        if (match) {
            car.style.display = "block";
            found = true;
        } else {
            car.style.display = "none";
        }
    });

    // Handle 'No cars found' message
    let noResultsMessage = document.getElementById("no-results");
    if (!found) {
        if (!noResultsMessage) {
            noResultsMessage = document.createElement("p");
            noResultsMessage.id = "no-results";
            noResultsMessage.textContent = "No cars found.";
            document.getElementById("car-container").appendChild(noResultsMessage);
        }
    } else {
        if (noResultsMessage) noResultsMessage.remove();

        // Scroll to results
        document.getElementById("car-container").scrollIntoView({ behavior: "smooth" });
    }
});



// Clear Search Button Functionality
document.getElementById("clear-search").addEventListener("click", function () {
    document.getElementById("search-form").reset(); // Reset form fields
    document.querySelectorAll(".car-card").forEach(car => car.style.display = "block"); // Show all cars

    let noResultsMessage = document.getElementById("no-results");
    if (noResultsMessage) noResultsMessage.remove();
});

document.querySelector('.menu-toggle').addEventListener('click', function() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
});

// Function to open the modal and display the selected image
function openImageModal(carIndex, imageIndex) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const car = window.carData[carIndex];

    // Set the modal image source
    modalImage.src = car.images[imageIndex];
    modal.style.display = 'block';

    // Store the current car and image index globally
    window.currentCarIndex = carIndex;
    window.currentImageIndex = imageIndex;
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
}

// Function to navigate to the previous image
function prevImage() {
    const car = window.carData[window.currentCarIndex];
    window.currentImageIndex = (window.currentImageIndex - 1 + car.images.length) % car.images.length;
    document.getElementById('modal-image').src = car.images[window.currentImageIndex];
}

// Function to navigate to the next image
function nextImage() {
    const car = window.carData[window.currentCarIndex];
    window.currentImageIndex = (window.currentImageIndex + 1) % car.images.length;
    document.getElementById('modal-image').src = car.images[window.currentImageIndex];
}

// Event Listeners
document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('prev-modal').addEventListener('click', prevImage);
document.getElementById('next-modal').addEventListener('click', nextImage);

// Close modal when clicking outside the image
window.addEventListener('click', (event) => {
    const modal = document.getElementById('image-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('authToken') !== null;
}

// Get saved cars from localStorage or API
let savedCars = JSON.parse(localStorage.getItem('savedCars')) || [];

// Toggle save car
async function toggleSave(carId, btn) {
    try {
        const res = await fetch(`/api/cars/${carId}/save`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await res.json();
        
        if (data.saved) {
            btn.innerHTML = '<i class="fas fa-heart" style="color:red"></i>';
            savedCars.push(carId);
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
            savedCars = savedCars.filter(id => id !== carId);
        }
        
        localStorage.setItem('savedCars', JSON.stringify(savedCars));
    } catch (error) {
        console.error('Error saving car:', error);
    }
}

// Message modal
function openMessageModal(carId, carTitle) {
    const modal = document.createElement('div');
    modal.className = 'message-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Message Seller About ${carTitle}</h3>
            <textarea id="message-text" placeholder="Type your message..."></textarea>
            <button onclick="sendMessage('${carId}')">Send Message</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Send message
async function sendMessage(carId) {
    const text = document.getElementById('message-text').value;
    try {
        await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                carId,
                content: text
            })
        });
        alert('Message sent!');
        document.querySelector('.message-modal').remove();
    } catch (error) {
        console.error('Error sending message:', error);
    }
}