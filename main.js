function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}
const on = (e) => document.querySelector(e);
const all = (e) =>  document.querySelectorAll(e);
function runSelectStatements(){
  const sql_blocks = all("code[class*='language-sql']");

  for (let i = 0; i < sql_blocks.length; i++) {
    sql_blocks[i].addEventListener("click", function() {
      if (this.innerText.trim().toLowerCase().startsWith("select")) {
        fetchQuery(this);
      }
    });
  }
}

function fetchQuery(element) {
  query = element.innerText;
  fetch("/query", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
    .then(response => response.json())
    .then(data => renderResult(data, element));
}

function plot(data, element){
  let layout = {};
  if (!Array.isArray(data[0].x)) {
    let x, y;
    x = data.map(row => row.x);
    y = data.map(row => row.y);
    type = data.type || data[0].type || "scatter";
    data = [{x, y, type }]
    title = data.title || data[0].title;
    layout = {title}
  }
  div = document.createElement("div");
  element.appendChild(div);
  Plotly.newPlot(div, data, layout);
}

function table(data, element){
  // Render the result as a table
  let table = document.createElement("table");
  let thead = document.createElement("thead");
  let tbody = document.createElement("tbody");
  let headerRow = document.createElement("tr");

  table.style.border =
    thead.style.border =
      tbody.style.border = "0.4px dotted";

  Object.keys(data[0]).forEach(key => {
    let headerCell = document.createElement("th");
    headerCell.textContent = key;
    headerRow.appendChild(headerCell);
  });

  thead.appendChild(headerRow);

  data.forEach(serie=> {
    if (!Array.isArray(serie)){
      serie = [serie];
    }
    serie.forEach(row => {
      let dataRow = document.createElement("tr");
      Object.values(row).forEach(value => {
        let dataCell = document.createElement("td");
        dataCell.textContent = value;
        dataRow.appendChild(dataCell);
      });
      tbody.appendChild(dataRow);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
  });

  element.parentNode.nextElementSibling.appendChild(table);
}

function renderResult(res, element) {
  let data = Array.isArray(res) ? res : [res];
  if (data[0].hasOwnProperty("x")){
    plot(data, element);
  } else {
    table(data, element);
  }
}

function bindPresentationMode(){
  let sections = all("h1, h2");
  for (let i = 0; i < sections.length; i++) {
    let currentSection = sections[i];
    let slide = document.createElement("div");
    slide.className = "slide";
    let nextSection = sections[i + 1] || null;
    let nextSectionParent = nextSection ? nextSection.parentNode : null;
    let currentSectionParent = currentSection.parentNode;
    let nextSibling = currentSection.nextSibling;
    while (nextSibling !== nextSection && nextSibling !== null) {
      slide.appendChild(nextSibling);
      nextSibling = currentSection.nextSibling;
    }
    currentSectionParent.replaceChild(slide, currentSection);
    slide.insertBefore(currentSection, slide.firstChild);
  }

  let currentSlide = 0;
  const slides = all(".slide");

  const showCurrentSlide = function() {
    slides[currentSlide].style.display = "block";
  };

  showCurrentSlide();
  on("#start-presentation").addEventListener("click", function() {
    slides.forEach(function(slide) {
      slide.style.display = "none";
    });
    showCurrentSlide();

    document.body.classList.add("presentation-mode");
    on("#start-presentation").style.display = "none";
    on("#stop-presentation").style.display = "inline";
  });
  on("#stop-presentation").addEventListener("click", function() {

    slides.forEach(function(slide) {
      slide.style.display = "block";
    });

    document.body.classList.remove("presentation-mode");
    on("#start-presentation").style.display = "inline";
    on("#stop-presentation").style.display = "none";
  });

  // Add event listener for next slide button
  on("#next-slide").addEventListener("click", function() {
    slides[currentSlide].style.display = "none";
    currentSlide = (currentSlide + 1) % slides.length;
    showCurrentSlide();
  });

  // Add event listener for previous slide button
  on("#previous-slide").addEventListener("click", function() {
    slides[currentSlide].style.display = "none";
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showCurrentSlide();
  });

  // Add event listener for first slide button
  document.querySelector("#first-slide").addEventListener("click", function() {
    slides[currentSlide].style.display = "none";
    currentSlide = 0;
    showCurrentSlide();
  });

  // Add event listener for last slide button
  document.querySelector("#last-slide").addEventListener("click", function() {
    slides[currentSlide].style.display = "none";
    currentSlide = slides.length - 1;
    showCurrentSlide();
  });

  // Add event listener for escape key to exit presentation mode
  document.addEventListener("keydown", function(event) {
    if (event.code === "Escape") {
      document.body.classList.remove("presentation-mode");
    }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  runSelectStatements();
  bindPresentationMode();
});

