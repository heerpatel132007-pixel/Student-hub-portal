function toggleTheme() {

    document.body.classList.toggle("dark");

    let button = document.getElementById("themeButton");

    if (document.body.classList.contains("dark")) {

        button.innerHTML = "☀️";

    } else {

        button.innerHTML = "🌙";

    }
}


function showLoginMessage(type, text){

    let box = document.getElementById("loginMessage");

    box.className = "login-msg " + type;

    box.textContent = text;

}


function clearLogin(){

    document.getElementById("loginForm").reset();

    document.getElementById("loginMessage").className = "login-msg";

}


/* message after redirects (session timeout / logout) */

let params = new URLSearchParams(window.location.search);

if(params.get("expired") === "1"){

    showLoginMessage("warning",
        "Session Expired: Your session has expired due to inactivity (900 seconds). Please log in again.");

}

if(params.get("loggedout") === "1"){

    showLoginMessage("success", "You have been logged out.");

}


/* ===== Login -> php/login.php ===== */

document.getElementById("loginForm").addEventListener("submit", function(e){

    e.preventDefault();

    let identifier = document.getElementById("identifier").value.trim();
    let password   = document.getElementById("password").value;

    /* quick check in the browser (the server checks again) */

    let emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    let idPattern    = /^[A-Za-z0-9]{3,20}$/;

    if(identifier === "" || password === ""){

        showLoginMessage("error", "Please enter your email or student number and your password.");

        return;
    }

    if(!emailPattern.test(identifier) && !idPattern.test(identifier)){

        showLoginMessage("error", "Enter a valid email address or student number.");

        return;
    }

    let button = this.querySelector("button[type='submit']");

    button.disabled = true;

    fetch("../php/login.php", {
        method: "POST",
        body: new FormData(this)
    })

    .then(function(response){
        return response.json();
    })

    .then(function(result){

        if(result.success){

            showLoginMessage("success", result.message);

            window.location.href = result.redirect;

        }else{

            showLoginMessage("error", "Login Error: " + result.message);

            button.disabled = false;
        }

    })

    .catch(function(){

        showLoginMessage("error", "Could not reach the server. Please try again.");

        button.disabled = false;

    });

});
