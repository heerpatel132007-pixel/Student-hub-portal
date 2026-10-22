function toggleTheme() {
    document.body.classList.toggle("dark");

    let themeButton = document.getElementById("themeButton");

    if (document.body.classList.contains("dark")) {
        themeButton.innerHTML = "☀️";
    } else {
        themeButton.innerHTML = "🌙";
    }
}


function toggleMenu() {
    document.getElementById("nav").classList.toggle("show");
}


var slides = document.getElementsByClassName("slide");
var slideIndex = 0;

function showSlide(n) {
    for (var i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    slideIndex = (n + slides.length) % slides.length;
    slides[slideIndex].style.display = "block";
}


function nextSlide() {
    showSlide(slideIndex + 1);
}


function prevSlide() {
    showSlide(slideIndex - 1);
}


showSlide(0);

setInterval(nextSlide, 4000);


function closeModal() {
    document.getElementById("welcomeModal").style.display = "none";
}


window.onload = function () {
    document.getElementById("welcomeModal").style.display = "block";
};