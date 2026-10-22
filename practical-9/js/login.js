function toggleTheme() {

    document.body.classList.toggle("dark");

    let button = document.getElementById("themeButton");

    if (document.body.classList.contains("dark")) {

        button.innerHTML = "☀️";

    } else {

        button.innerHTML = "🌙";

    }
}