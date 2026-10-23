function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.getElementById("themeButton");

    button.innerHTML = document.body.classList.contains("dark") ? "☀️" : "🌙";

}


/* ===== Session check -> php/session_check.php ===== */

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

        if(data.user.role !== "admin"){

            window.location.href = "dashboard.html";

            return;
        }

        document.getElementById("welcomeName").textContent = data.user.name;
        document.getElementById("welcomeId").textContent = data.user.studentId;
        document.getElementById("welcomeEmail").textContent = data.user.email;
        document.getElementById("welcomeRole").textContent = data.user.role;
        document.getElementById("welcomeLast").textContent = data.user.lastLogin || "First login";
        document.getElementById("timeoutText").textContent = (data.timeout / 60) + " Mins";

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

setInterval(loadSession, 60000);


/* ===== Users (admin only) loaded from php/admin_students.php ===== */

DataList({
    url: "../php/admin_students.php",
    list: "user-list",
    search: "user-search",
    filter: "user-filter",
    sort: "user-sort",
    pager: "user-pager",
    pageSize: 5,
    searchFields: ["name", "studentId", "email", "course"],
    filterField: "role",

    render: function(u){

        var esc = DataList.esc;

        return '<div class="user-row">' +
                   '<span><b>' + esc(u.name) + '</b> (' + esc(u.studentId) + ')</span>' +
                   '<span>' + esc(u.email) + '</span>' +
                   '<span>' + esc(u.course) + ' • ' + esc(u.role) + '</span>' +
                   '<span>Last login: ' + esc(u.lastLogin) + '</span>' +
               '</div>';
    }
});
