function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.querySelector(".menu button:first-of-type");

    if(document.body.classList.contains("dark")){

        button.innerHTML = "☀️";

    }else{

        button.innerHTML = "🌙";

    }

}


function toggleMenu(){

    document.getElementById("nav").classList.toggle("show");

}


function showCourse(title, text){

    document.getElementById("courseTitle").innerHTML = title;

    document.getElementById("courseText").innerHTML = text;

    document.getElementById("courseModal").style.display = "block";

}


function closeModal(){

    document.getElementById("courseModal").style.display = "none";

}