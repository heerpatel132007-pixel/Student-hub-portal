function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.getElementById("themeButton");

    if(document.body.classList.contains("dark")){
        button.innerHTML = "☀️";
    }else{
        button.innerHTML = "🌙";
    }
}


function toggleMenu(){

    document.getElementById("nav").classList.toggle("show");

}


function closeBanner(){

    document.getElementById("banner").style.display = "none";

}