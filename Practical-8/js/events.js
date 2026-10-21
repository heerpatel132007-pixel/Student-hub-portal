function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.getElementById("themeButton");

    button.innerHTML = document.body.classList.contains("dark") ? "☀️" : "🌙";

}


function showEventMessage(type, text){

    let box = document.getElementById("eventMessage");

    box.className = "form-msg " + type;
    box.textContent = text;

}


/* ===== Events (loaded from MySQL through php/events.php) ===== */

DataList({
    url: "../php/events.php",
    list: "event-list",
    search: "event-search",
    filter: "event-filter",
    sort: "event-sort",
    pager: "event-pager",
    pageSize: 3,
    searchFields: ["title", "description", "location"],
    filterField: "location",

    render: function(e){

        var esc = DataList.esc;

        return '<div class="event-card">' +
                   '<h3>' + esc(e.title) + '</h3>' +
                   '<p>' + esc(e.description) + '</p>' +
                   '<p>📅 ' + DataList.fmtDate(e.event_date) + ' &nbsp; 📍 ' + esc(e.location) + '</p>' +
                   '<p>Seats left: <b>' + e.seats_left + '</b> / ' + e.seats + '</p>' +
                   '<button onclick="registerEvent(' + e.id + ')"' +
                       (e.seats_left <= 0 ? ' disabled' : '') + '>Register</button>' +
               '</div>';
    }
});


/* ===== Register for an event -> php/register_event.php ===== */

function registerEvent(eventId){

    let studentId = document.getElementById("studentCode").value.trim();

    if(studentId === ""){

        showEventMessage("error", "Please enter your Student ID first.");

        return;
    }

    let data = new FormData();

    data.append("student_id", studentId);
    data.append("event_id", eventId);

    fetch("../php/register_event.php", {
        method: "POST",
        body: data
    })

    .then(function(response){
        return response.json();
    })

    .then(function(result){

        showEventMessage(result.success ? "success" : "error", result.message);

        if(result.success){
            location.reload();
        }

    })

    .catch(function(){

        showEventMessage("error", "Could not reach the server. Please try again.");

    });
}
