function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.querySelector(".menu > button:first-of-type");

    if(document.body.classList.contains("dark")){

        button.innerHTML = "☀️";

    }else{

        button.innerHTML = "🌙";

    }

}


function toggleMenu(){

    document.getElementById("nav").classList.toggle("show");

}


function showSaved(){

    document.getElementById("savedModal").style.display = "block";

}


function closeModal(){

    document.getElementById("savedModal").style.display = "none";

}