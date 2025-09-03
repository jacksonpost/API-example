//globals
let cachedResults = [];
let currentPage = 1;
let currentQueryUrl = "";
let limit = 25;


// Function to get user's location and fetch data based on city or suburb
function getLocationAndFetchData() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log(`user: ${lat}, ${lon}`);

        // Call function to convert lat/lon to city/suburb
        getCityFromCoordinates(lat, lon);
      },
      (error) => {
        console.error("Geolocation error:", error);
        document.getElementById("objectsContainer").innerHTML = `<p>Could not retrieve location. Showing default results.</p>`;

        // Fallback: Use a general query if geolocation fails
        currentPage = 1;
        currentQueryUrl = "https://api.collection.nfsa.gov.au/search?query=dog";
        getData(`${currentQueryUrl}&page=${currentPage}&limit=${limit}`);
      }
    );
  } else {
    console.log("Geolocation not supported in this browser.");
    document.getElementById("objectsContainer").innerHTML = `<p>Geolocation is not supported. Showing default results.</p>`;

    // Fetch default data
    currentPage = 1;
    currentQueryUrl = "https://api.collection.nfsa.gov.au/search?query=dog";
    getData(`${currentQueryUrl}&page=${currentPage}&limit=${limit}`);
  }
}

// Function to convert lat/lon into a city or suburb using OpenStreetMap's Nominatim API
function getCityFromCoordinates(lat, lon) {
  const geoApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  fetch(geoApiUrl)
    .then(response => response.json())
    .then(data => {
      console.log("Geocoding API Response:", data);

      // Extract city or suburb from response
      let locationName = data.address.suburb;

      if (locationName) {
        console.log(`Detected Location: ${locationName}`);
        searchByLocation(locationName);
      } else {
        console.log("No city/suburb found, using default search.");
        currentPage = 1;
        currentQueryUrl = "https://api.collection.nfsa.gov.au/search?query=dog";
        getData(`${currentQueryUrl}&page=${currentPage}&limit=${limit}`);
      }
    })
    .catch(error => {
      console.error("Error retrieving location:", error);
      currentPage = 1;
      currentQueryUrl = "https://api.collection.nfsa.gov.au/search?query=dog";
      getData(`${currentQueryUrl}&page=${currentPage}&limit=${limit}`);
    });
}

// Function to search NFSA API using city/suburb name
function searchByLocation(location) {
  currentPage = 1;
  currentQueryUrl = `https://api.collection.nfsa.gov.au/search?query=${encodeURIComponent(location)}`;
  getData(`${currentQueryUrl}&page=${currentPage}&limit=${limit}`);
}


// Function to fetch data from NFSA API
function getData(url, callback, append = false) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then(data => {
      if (callback) {
        callback(data);
      } else {
        displayResults(data.results, append);
      }
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      const outputDiv = document.getElementById("objectsContainer");
      outputDiv.innerHTML = "<p>Error fetching data. Please try again later.</p>";
    });
}


// Function to display API results
function displayResults(results, append = false) {
  if (!append) {
    cachedResults = results;
    document.getElementById("objectsContainer").innerHTML = ""; // Clear if not appending
  } else {
    cachedResults = cachedResults.concat(results); // Add to cache
  }

  const objectsContainer = document.getElementById("objectsContainer");

  results.forEach(item => {
    console.log("Item:", item); // Step to log each item

    // Extract the preview array
    const imgArr = item.preview || []; // Default to empty array

    // Initialize empty image URL
    let imgurl = "";

    // Loop through the preview array to find an image
    const baseurl = "https://media.nfsacollection.net/";
    for (let i = 0; i < imgArr.length; i++) {
      console.log("Preview object:", imgArr[i]); // Log preview object
      if (imgArr[i].hasOwnProperty("filePath")) {
        imgurl = baseurl + imgArr[i].filePath;
        break; // Use the first valid image
      }
    }

    // 1. Create a container for the item
    const itemContainer = document.createElement("div");

    // 2. Use template literals to embed the item details in HTML
    itemContainer.innerHTML = `
      <h2>${item.title}</h2>
      <p>${item.name}</p>
      ${imgurl ? `<div class="imgContainer"><img src="${imgurl}" alt="${item.title}"></div>` : ""}
      <button class="viewBtn" data-id="${item.id}">View Details</button>
    `;

    // 3. Append the item container to the objects container
    objectsContainer.appendChild(itemContainer);
  });

  document.querySelectorAll(".viewBtn").forEach(button => {
    button.addEventListener("click", function () {
      const itemId = this.getAttribute("data-id");
      loadItemDetails(itemId);
    });
  });

  // Show the More button (only for search results)
  showMoreButton();
}


// Function to show a single item when clicked
function loadItemDetails(id) {
  console.log('load item: ' + id);
  const apiUrl = `https://api.collection.nfsa.gov.au/title/${id}`;

  const outputDiv = document.getElementById("objectsContainer");
  outputDiv.innerHTML = "<p>Loading item details...</p>";

  getData(apiUrl, item => {
    const title = item.title || "Untitled";
    const name = item.name || "";
    const preview = Array.isArray(item.preview) ? item.preview : [];
    const imgurl = preview.length > 0 && preview[0].filePath
      ? `https://media.nfsacollection.net/${preview[0].filePath}`
      : "";

    outputDiv.innerHTML = `<div class="detailsContainer">
      <button id="backBtn">Back</button>
      <h2>${title}</h2>
      <p>${name}</p>
      ${imgurl ? `<img src="${imgurl}" alt="${title}">` : ""}
      </div>
    `;

    document.getElementById("moreBtn").style.display = "none"; // Hide More button on detail view

    document.getElementById("backBtn").addEventListener("click", () => {
      displayResults(cachedResults); // Just re-render the stored results
    });

  });
}


// Function to show the "More" button
function showMoreButton() {
  document.getElementById("moreBtn").style.display = "inline-block";
}


// Click handler for the "More" button
document.getElementById("moreBtn").addEventListener("click", () => {
  currentPage += 1;
  const nextUrl = `${currentQueryUrl}&page=${currentPage}&limit=${limit}`;
  getData(nextUrl, null, true); // append=true
});


// Call function to get user location and fetch API data
// getLocationAndFetchData();

// Initial default query
currentPage = 1;
limit = 25;
currentQueryUrl = "https://api.collection.nfsa.gov.au/search?query=dog";
getData(`${currentQueryUrl}&page=${currentPage}&limit=${limit}`);