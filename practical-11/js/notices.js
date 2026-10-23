function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.querySelector("#nav > button:first-of-type");

    if(document.body.classList.contains("dark")){

        button.innerHTML = "☀️";

    }else{

        button.innerHTML = "🌙";

    }

}


function toggleMenu(){

    document.getElementById("nav").classList.toggle("show");

}