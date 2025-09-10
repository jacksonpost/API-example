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
        document.getElementById(
          "objectsContainer"
        ).innerHTML = `<p>Could not retrieve location. Showing default results.</p>`;

        // Fallback: Use a general query if geolocation fails
        getData("https://api.collection.nfsa.gov.au/search?query=dog");
      }
    );
  } else {
    console.log("Geolocation not supported in this browser.");
    document.getElementById(
      "objectsContainer"
    ).innerHTML = `<p>Geolocation is not supported. Showing default results.</p>`;

    // Fetch default data
    getData("https://api.collection.nfsa.gov.au/search?query=dog");
  }
}

// Function to convert lat/lon into a city or suburb using OpenStreetMap's Nominatim API
function getCityFromCoordinates(lat, lon) {
  const geoApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  fetch(geoApiUrl)
    .then((response) => response.json())
    .then((data) => {
      console.log("Geocoding API Response:", data);

      // Extract city or suburb from response
      let locationName = data.address.suburb;

      if (locationName) {
        console.log(`Detected Location: ${locationName}`);
        searchByLocation(locationName);
      } else {
        console.log("No city/suburb found, using default search.");
        getData("https://api.collection.nfsa.gov.au/search?query=dog");
      }
    })
    .catch((error) => {
      console.error("Error retrieving location:", error);
      getData("https://api.collection.nfsa.gov.au/search?query=dog");
    });
}

// Function to search NFSA API using city/suburb name
function searchByLocation(location) {
  const queryUrl = `https://api.collection.nfsa.gov.au/search?query=${encodeURIComponent(
    location
  )}`;
  console.log(`Searching NFSA API for: ${location}`);

  getData(queryUrl);
}

// Search box listener
const searchButton = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");
if (searchButton && searchInput) {
  searchButton.addEventListener("click", (event) => {
    event.preventDefault(); // Prevent form submission if inside a form
    const query = searchInput.value;
    searchByText(query);
  });
  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission if inside a form
      const query = searchInput.value;
      searchByText(query);
    }
  });
}

// Receive a text string and fetch data from NFSA API
// receive string from a search box in response to a button click or enter key
function searchByText(query) {
  if (!query || query.trim() === "") {
    // > replace with colour change of search box and small error text underneath
    alert("Please enter a search term.");
    return;
  }

  query = encodeURIComponent(query); // encode special characters in the query string

  // read filters from form
  const form = document.querySelector("form");
  const formData = new FormData(form);
  const filters = {};
  formData.forEach((value, key) => {
    if (key === "searchInput") return;
    filters[key] = value;
  });

  // add filters to query
  const filterKeys = Object.keys(filters);
  if (filterKeys.length > 0) {
    query += "&" + filterKeys.map((key) => `${key}=${filters[key]}`).join("&");
  }
  console.log("filters: ", filters);
  console.log("query: ", query);

  const queryUrl = `https://api.collection.nfsa.gov.au/search?query=${query}`;
  console.log(`Searching NFSA API for: ${query}`);
  getData(queryUrl);
}

// Function to fetch data from NFSA API
async function getData(url) {
  console.log(url);
  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log("Full API Response:", data);

    displayResults(data.results);
    createImageMosaic(extractMediaUrls(data.results));
  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById(
      "objectsContainer"
    ).innerHTML = `<p>Error fetching data. Please try again later.</p>`;
  }
}

function fileTypeFromExtension(filename) {
  const extensionTypes = {
    image: ["jpg", "jpeg", "png", "gif"],
    video: ["mp4", "mov", "avi"],
    audio: ["mp3", "wav", "aac"],
  };
  const extension = filename.split(".").pop().toLowerCase();
  return (
    Object.keys(extensionTypes).find((type) =>
      extensionTypes[type].includes(extension)
    ) || "other"
  );
}

function displayResults(results) {
  const objectsContainer = document.getElementById("objectsContainer");
  objectsContainer.innerHTML = ""; // Clear previous results

  results.forEach((item) => {
    //console.log("Item:", item); // Step to log each item

    // Extract the preview array
    const imgArr = item.preview || []; // Default to empty array

    // Initialize empty image URL
    let imgurl = "";
    // Initialize file type
    let fType = "other";

    // Loop through the preview array to find an image
    const baseurl = "https://media.nfsacollection.net/";
    for (let i = 0; i < imgArr.length; i++) {
      //console.log("Preview object:", imgArr[i]); // Log preview object

      if (imgArr[i].hasOwnProperty("filePath")) {
        // Check if the file is an image, video, or audio
        fType = fileTypeFromExtension(imgArr[i].filePath);
        imgurl = baseurl + imgArr[i].filePath;
        break; // Use the first valid file
      }
    }

    // 1. Create a container for the item
    const itemContainer = document.createElement("div");
    itemContainer.className = "card shadow-sm mb-4"; // Bootstrap card styling

    // if file is image, use image element
    // if file is video, use video element
    // if file is audio, use audio element
    if (fType === "video") {
      mediaElement = `<video controls class=""><source src="${imgurl}" type="video/mp4">Your browser does not support the video tag.</video>`;
    } else if (fType === "audio") {
      mediaElement = `<audio controls class=""><source src="${imgurl}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
    } else if (fType === "image") {
      mediaElement = `<img class="" src="${imgurl}" alt="${item.title}" >`;
    } else if (fType === "other") {
      mediaElement = "";
    }

    // 2. Use template literals to embed the item details in HTML
    itemContainer.innerHTML = `
          <div class="card-body">
                <h2 class="card-title h4">${item.title}</h2>
                ${imgurl ? `<div class="media">${mediaElement}</div>` : ""}
                <p class="card-text text-muted">${item.name}</p>
            </div>
      `;

    // 3. Append the item container to the objects container
    objectsContainer.appendChild(itemContainer);
  });
}

function extractMediaUrls(results) {
  const mediaUrls = [];
  results.forEach((item) => {
    const imgArr = item.preview || [];
    const baseurl = "https://media.nfsacollection.net/";
    for (let i = 0; i < imgArr.length; i++) {
      if (imgArr[i].hasOwnProperty("filePath")) {
        mediaUrls.push(baseurl + imgArr[i].filePath);
      }
    }
  });
  return mediaUrls;
}

// build a fullscreen mosaic of images to use as a background
function createImageMosaic(urls) {
  let mosaicContainer = document.getElementById("mosaicContainer");
  // create container if it doesn't exist
  if (!mosaicContainer) {
    mosaicContainer = document.createElement("div");
    mosaicContainer.id = "mosaicContainer";
    document.body.appendChild(mosaicContainer);
  }
  mosaicContainer.innerHTML = ""; // Clear previous results

  const images = urls;
  // create an image element for each image
  images.forEach((imgurl) => {
    const imgElement = document.createElement("img");
    imgElement.src = imgurl;
    imgElement.alt = "Mosaic Image";
    mosaicContainer.appendChild(imgElement);
  });
  // make sure there are at least two images in the mosaic
  if (mosaicContainer.children.length > 1 && images.length > 1) {
    // randomise the order of images
    for (let i = mosaicContainer.children.length; i >= 0; i--) {
      mosaicContainer.appendChild(
        mosaicContainer.children[(Math.random() * i) | 0]
      );
    }
  }
  console.log("Mosaic created with images:", images);
}

// ===== REDUNDANT CODE =====

// Function to display API results with Bootstrap styling
function displayResultsBootstrap(results) {
  const objectsContainer = document.getElementById("objectsContainer");
  objectsContainer.innerHTML = ""; // Clear previous results

  results.forEach((item) => {
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
    itemContainer.className = "card shadow-sm mb-4"; // Bootstrap card styling

    // 2. Use template literals to embed the item details in HTML
    itemContainer.innerHTML = `
          <div class="card-body">
                <h2 class="card-title h4">${item.title}</h2>
                <p class="card-text text-muted">${item.name}</p>
                ${
                  imgurl
                    ? `<div class="mt-3"><img src="${imgurl}" alt="${item.title}" class="img-fluid rounded"></div>`
                    : ""
                }
            </div>
      `;

    // 3. Append the item container to the objects container
    objectsContainer.appendChild(itemContainer);
  });
}

// Function to display API results with Tailwind CSS styling
function displayResultsTailwind(results) {
  const objectsContainer = document.getElementById("objectsContainer");
  objectsContainer.innerHTML = ""; // Clear previous results

  results.forEach((item) => {
    console.log("Item:", item);

    // Extract preview image
    const imgArr = item.preview || [];
    let imgurl = "";

    const baseurl = "https://media.nfsacollection.net/";
    for (let i = 0; i < imgArr.length; i++) {
      console.log("Preview object:", imgArr[i]);
      if (imgArr[i].hasOwnProperty("filePath")) {
        imgurl = baseurl + imgArr[i].filePath;
        break;
      }
    }

    // 1. Create a container for the item with Tailwind classes
    const itemContainer = document.createElement("div");
    itemContainer.className =
      "border p-4 rounded-lg shadow-md bg-white mb-4 max-w-lg mx-auto";

    // 2. Use template literals to embed the item details in HTML
    itemContainer.innerHTML = `
            <h2 class="text-2xl font-semibold text-gray-800">${item.title}</h2>
            <p class="text-gray-600">${item.name}</p>
            ${
              imgurl
                ? `<div class="mt-3"><img src="${imgurl}" alt="${item.title}" class="w-full rounded-md shadow-sm"></div>`
                : ""
            }
        `;

    // 3. Append the item container to the objects container
    objectsContainer.appendChild(itemContainer);
  });
}

// Call function to get user location and fetch API data
// getLocationAndFetchData();

// Hardcoded fetch for testing
//getData("https://api.collection.nfsa.gov.au/search?query=dog");

