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


/* ===== Session check (who is logged in) -> php/session_check.php ===== */

function loadSession(){

    fetch("../php/session_check.php")

    .then(function(response){
        return response.json();
    })

    .then(function(data){

        if(!data.loggedIn){

            window.location.href = "login.html" + (data.expired ? "?expired=1" : "");

            return;
        }

        let welcomeName = document.getElementById("welcomeName");

        if(welcomeName){

            welcomeName.textContent = data.user.name;

            document.getElementById("welcomeId").textContent = data.user.studentId;
            document.getElementById("welcomeEmail").textContent = data.user.email;
            document.getElementById("welcomeRole").textContent = data.user.role;
            document.getElementById("welcomeLast").textContent = data.user.lastLogin || "First login";

            document.getElementById("timeoutText").textContent = (data.timeout / 60) + " Mins";
        }

    })

    .catch(function(){});
}


function logout(){

    fetch("../php/logout.php", { method: "POST" })

    .then(function(){

        window.location.href = "login.html?loggedout=1";

    })

    .catch(function(){

        window.location.href = "login.html";

    });
}


loadSession();

setInterval(loadSession, 60000);      // also catches the timeout while the page stays open
