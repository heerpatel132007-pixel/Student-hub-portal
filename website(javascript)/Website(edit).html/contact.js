function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.getElementById("themeButton");

    if(document.body.classList.contains("dark")){

        button.innerHTML = "☀️";

    }else{

        button.innerHTML = "🌙";

    }

}


function toggleFaq(id){

    let answer = document.getElementById(id);

    if(answer.style.display === "block"){

        answer.style.display = "none";

    }else{

        answer.style.display = "block";

    }

}