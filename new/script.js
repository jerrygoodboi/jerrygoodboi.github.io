const form = document.querySelector('form');
const searchInput = document.querySelector('#search');
const searchResults = document.querySelector('#searchResults');

form.addEventListener('submit', (event) => {
  event.preventDefault(); // prevent the form from submitting

  const searchTerm = searchInput.value; // get the value of the input box

  // fetch the data from the file
  fetch(`data.json`)
    .then(response => response.json())
    .then(data => {
      // filter the data based on the search term
      const filteredData = data.filter(item => item.name.includes(searchTerm));

      // display the filtered data on the webpage
      searchResults.innerHTML = '';
      filteredData.forEach(item => {
        const div = document.createElement('div');
        div.textContent = item.name;
        searchResults.appendChild(div);
      });
    })
    .catch(error => console.error(error));
});

