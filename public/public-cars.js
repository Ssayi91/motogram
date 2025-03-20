let cars = []; // Store cars globally to access them in modal functions
let currentModalIndex = 0; // Track the current image in modal

async function fetchPublicCars() {
    console.log("🚗 Fetching Approved Cars...");

    try {
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
                </div>
            `;

            // ✅ Assign the car to the correct container
            if (car.category === "imported" && importContainer) {
                importContainer.appendChild(carElement);
            } else if (car.category === "motorgram-stock" && inhouseContainer) {
                inhouseContainer.appendChild(carElement);
            } else if (indexContainer) {
                indexContainer.appendChild(carElement);
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