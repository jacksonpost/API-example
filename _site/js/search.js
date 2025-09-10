const form = document.getElementById("searchForm");
const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");

// REST API endpoint
// https://api.collection.nfsa.gov.au/search?query=
const API_URL = "https://api.collection.nfsa.gov.au/search?query=";

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // stop page reload
  const query = searchBox.value.trim();
  if (!query) return;

  resultsDiv.textContent = "Searching...";

  try {
    const response = await fetch(API_URL + encodeURIComponent(query));
    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();

    resultsDiv.innerHTML = "";

    // Adapt this loop based on your API’s JSON format
    if (data.results && data.results.length > 0) {
      data.results.forEach((item) => {
        const div = document.createElement("div");
        div.className = "result";
        div.textContent = item.title || JSON.stringify(item);
        resultsDiv.appendChild(div);
      });
    } else {
      resultsDiv.textContent = "No results found.";
    }
  } catch (err) {
    resultsDiv.textContent = "Error: " + err.message;
  }
});

// Optional: Trigger search on Enter key press
searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    form.dispatchEvent(new Event("submit"));
  }
});
