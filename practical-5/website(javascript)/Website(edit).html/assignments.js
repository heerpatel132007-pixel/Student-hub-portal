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


function toggleDetails(id){

    let details = document.getElementById(id);

    if(details.style.display === "block"){
        details.style.display = "none";
    }else{
        details.style.display = "block";
    }

}