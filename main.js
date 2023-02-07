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
        fetch("/query", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: this.innerText })
        })
          .then(response => response.json())
          .then(data => {
            const result_tab = this.parentNode.nextElementSibling;
            result_tab.innerHTML = "";

            for (let row of data) {
              let row_html = "<tr>";
              for (let col in row) {
                row_html += `<td>${row[col]}</td>`;
              }
              row_html += "</tr>";
              result_tab.innerHTML += row_html;
            }
          });
      }
    });
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

