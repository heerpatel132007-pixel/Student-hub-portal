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



/* ===== Statistics (admin only) -> php/admin_stats.php ===== */

function statCard(label, value, note, color){

    return '<div class="stat-card ' + color + '">' +
               '<span>' + label + '</span>' +
               '<b>' + value + '</b>' +
               '<small>' + note + '</small>' +
           '</div>';
}


function bars(rows, labelKey, valueKey, maxKey, suffix){

    let max = 1;

    rows.forEach(function(r){
        max = Math.max(max, maxKey ? r[maxKey] : r[valueKey]);
    });

    return rows.map(function(r){

        let width = Math.round(r[valueKey] / max * 100);

        return '<div class="bar-row">' +
                   '<span class="bar-label">' + DataList.esc(r[labelKey]) + '</span>' +
                   '<div class="bar-track"><div class="bar-fill" style="width:' + width + '%"></div></div>' +
                   '<span class="bar-value">' + r[valueKey] + (suffix ? suffix(r) : "") + '</span>' +
               '</div>';

    }).join("");
}


function loadStats(){

    fetch("../php/admin_stats.php")

    .then(function(response){
        return response.json();
    })

    .then(function(s){

        if(!s.success){

            if(s.expired){
                window.location.href = "login.html?expired=1";
            }

            document.getElementById("statGrid").innerHTML =
                '<div class="stat-card red"><span>' + DataList.esc(s.message) + '</span></div>';

            return;
        }

        document.getElementById("statGrid").innerHTML =
            statCard("Total Users", s.users.total, s.users.admins + " admin(s)", "") +
            statCard("Students", s.users.students, "role: student", "green") +
            statCard("New This Week", s.users.new_week, "signed up in the last 7 days", "orange") +
            statCard("Active Today", s.users.active_today, s.users.never_logged + " never logged in", "teal") +
            statCard("Events", s.events.total, s.events.upcoming + " upcoming, " + s.events.past + " past", "purple") +
            statCard("Registrations", s.registrations.total, s.registrations.today + " today", "red") +
            statCard("Seats Filled", s.seats.percent + "%", s.seats.filled + " of " + s.seats.total + " seats", "") +
            statCard("Courses", s.per_course.length, "with enrolled students", "green");

        document.getElementById("courseBars").innerHTML =
            bars(s.per_course, "course", "total", null, null);

        document.getElementById("eventBars").innerHTML =
            bars(s.top_events, "title", "registered", null, function(r){ return " / " + r.seats; });

        document.getElementById("latestRows").innerHTML = s.latest.length === 0
            ? '<tr><td colspan="6">No registrations yet.</td></tr>'
            : s.latest.map(function(r){

                return '<tr>' +
                           '<td>' + r.id + '</td>' +
                           '<td><b>' + DataList.esc(r.name) + '</b></td>' +
                           '<td>' + DataList.esc(r.student_id) + '</td>' +
                           '<td>' + DataList.esc(r.course) + '</td>' +
                           '<td>' + DataList.esc(r.title) + '</td>' +
                           '<td>' + DataList.esc(r.registered_at) + '</td>' +
                       '</tr>';

            }).join("");

        document.getElementById("statsTime").textContent = "Updated " + s.generated;

    })

    .catch(function(){

        document.getElementById("statGrid").innerHTML =
            '<div class="stat-card red"><span>Could not load the statistics. Please try again.</span></div>';

    });
}


loadStats();

setInterval(loadStats, 60000);
