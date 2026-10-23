/* api_demo.js - list, add, update and delete events with fetch(), without reloading the page */

var API = "../php/api/events.php";
var events = [];
var editingId = 0;
var confirmId = 0;
var searchTimer = null;


function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.getElementById("themeButton");

    button.innerHTML = document.body.classList.contains("dark") ? "☀️" : "🌙";

}


function esc(text){

    var div = document.createElement("div");
    div.textContent = (text === null || text === undefined) ? "" : text;
    return div.innerHTML;

}


function showMessage(type, text){

    let box = document.getElementById("pageMessage");

    box.className = "msg " + type;
    box.textContent = text;

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


/* ===== one function for every API call (also writes the request log) ===== */

var logItems = [];

function callApi(method, url, body){

    let options = { method: method, headers: {} };

    if(body !== undefined){
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    return fetch(url, options)

    .then(function(response){

        return response.json().then(function(json){

            addLog(method, url, body, response.status, response.statusText, json);

            if(response.status === 401){
                showMessage("error", json.message + " (log in again)");
            }

            return { status: response.status, ok: response.ok, json: json };
        });
    });
}


function addLog(method, url, body, status, statusText, json){

    logItems.unshift({
        method: method,
        url: url.replace("../php/api/", ""),
        body: body,
        status: status,
        statusText: statusText,
        json: json
    });

    logItems = logItems.slice(0, 4);

    drawLog();
}


function drawLog(){

    let box = document.getElementById("apiLog");

    if(logItems.length === 0){

        box.innerHTML = '<span class="hint">Every fetch() call appears here.</span>';

        return;
    }

    box.innerHTML = logItems.map(function(item){

        let ok = item.status >= 200 && item.status < 300;

        let text = (item.body !== undefined ? "Request:  " + JSON.stringify(item.body) + "\n" : "") +
                   "Response: " + JSON.stringify(item.json);

        return '<div class="logitem ' + (ok ? "ok" : "bad") + '">' +
                   '<span class="method m-' + item.method + '">' + item.method + '</span> ' +
                   esc(item.url) + ' → <b>' + item.status + ' ' + esc(item.statusText) + '</b>' +
                   '<pre>' + esc(text) + '</pre>' +
               '</div>';

    }).join("");
}


function clearLog(){

    logItems = [];

    drawLog();
}


/* ===== API endpoints table (from json/api_docs.json) ===== */

fetch("../json/api_docs.json")

.then(function(response){
    return response.json();
})

.then(function(docs){

    document.getElementById("docRows").innerHTML = docs.endpoints.map(function(e){

        return '<tr>' +
                   '<td><span class="method m-' + e.method + '">' + e.method + '</span></td>' +
                   '<td>' + esc(e.url) + '</td>' +
                   '<td>' + esc(e.success) + '</td>' +
                   '<td>' + esc(e.access) + '</td>' +
               '</tr>';

    }).join("");

})

.catch(function(){});


/* ===== LIST (GET) ===== */

function loadEvents(){

    let q = document.getElementById("searchBox").value.trim();

    let url = API + (q !== "" ? "?q=" + encodeURIComponent(q) : "");

    callApi("GET", url)

    .then(function(res){

        if(!res.json.success){

            showMessage("error", res.json.message);

            return;
        }

        events = res.json.data;

        drawRows();

    })

    .catch(function(){

        showMessage("error", "Could not reach the server. Please try again.");

    });
}


function drawRows(){

    let body = document.getElementById("eventRows");

    document.getElementById("countInfo").textContent = events.length + " event(s)";

    if(events.length === 0){

        body.innerHTML = '<tr><td colspan="7" class="empty">No events found.</td></tr>';

        return;
    }

    body.innerHTML = events.map(function(e){

        if(e.id === editingId){
            return editRow(e);
        }

        let buttons;

        if(e.id === confirmId){

            buttons = '<span class="sure">Sure?</span>' +
                      '<button class="del" onclick="deleteEvent(' + e.id + ')">Yes</button>' +
                      '<button class="edit" style="background:#6c757d" onclick="confirmDelete(0)">No</button>';

        }else{

            buttons = '<button class="edit" onclick="startEdit(' + e.id + ')">Edit</button>' +
                      '<button class="del" onclick="confirmDelete(' + e.id + ')">Delete</button>';
        }

        return '<tr>' +
                   '<td>' + e.id + '</td>' +
                   '<td><b>' + esc(e.title) + '</b><br><span class="hint">' + esc(e.description) + '</span></td>' +
                   '<td>' + esc(e.event_date) + '</td>' +
                   '<td>' + esc(e.location) + '</td>' +
                   '<td>' + e.seats + '</td>' +
                   '<td>' + e.registered + '</td>' +
                   '<td class="actions">' + buttons + '</td>' +
               '</tr>';

    }).join("");
}


function editRow(e){

    return '<tr>' +
               '<td>' + e.id + '</td>' +
               '<td><input class="cell-input" id="u_title" value="' + esc(e.title).replace(/"/g, "&quot;") + '">' +
                   '<input class="cell-input" id="u_description" style="margin-top:4px" value="' + esc(e.description).replace(/"/g, "&quot;") + '">' +
                   '<div class="err" id="eu_title"></div></td>' +
               '<td><input class="cell-input" type="date" id="u_event_date" value="' + esc(e.event_date) + '"><div class="err" id="eu_event_date"></div></td>' +
               '<td><input class="cell-input" id="u_location" value="' + esc(e.location).replace(/"/g, "&quot;") + '"><div class="err" id="eu_location"></div></td>' +
               '<td><input class="cell-input" type="number" id="u_seats" value="' + e.seats + '"><div class="err" id="eu_seats"></div></td>' +
               '<td>' + e.registered + '</td>' +
               '<td class="actions">' +
                   '<button class="edit" onclick="saveEdit(' + e.id + ')">Save</button>' +
                   '<button class="edit" style="background:#6c757d" onclick="startEdit(0)">Cancel</button>' +
               '</td>' +
           '</tr>';
}


function startEdit(id){

    editingId = id;
    confirmId = 0;

    drawRows();
}


function confirmDelete(id){

    confirmId = id;
    editingId = 0;

    drawRows();
}


function showFieldErrors(prefix, errors){

    Object.keys(errors || {}).forEach(function(key){

        let slot = document.getElementById(prefix + key);

        if(slot){
            slot.textContent = errors[key];
        }
    });
}


/* ===== ADD (POST) ===== */

function addEvent(){

    ["title", "event_date", "location", "seats"].forEach(function(f){
        document.getElementById("ea_" + f).textContent = "";
    });

    let data = {
        title:       document.getElementById("a_title").value,
        event_date:  document.getElementById("a_event_date").value,
        location:    document.getElementById("a_location").value,
        seats:       document.getElementById("a_seats").value,
        description: document.getElementById("a_description").value
    };

    callApi("POST", API, data)

    .then(function(res){

        if(res.ok){

            events.push(res.json.data);

            events.sort(function(a, b){
                return a.event_date.localeCompare(b.event_date) || a.id - b.id;
            });

            drawRows();

            showMessage("success", res.json.message);

            ["title", "event_date", "location", "seats", "description"].forEach(function(f){
                document.getElementById("a_" + f).value = "";
            });

        }else{

            showMessage("error", res.json.message);

            showFieldErrors("ea_", res.json.errors);
        }

    })

    .catch(function(){

        showMessage("error", "Could not reach the server. Please try again.");

    });
}


/* ===== UPDATE (PUT) ===== */

function saveEdit(id){

    let data = {
        title:       document.getElementById("u_title").value,
        description: document.getElementById("u_description").value,
        event_date:  document.getElementById("u_event_date").value,
        location:    document.getElementById("u_location").value,
        seats:       document.getElementById("u_seats").value
    };

    callApi("PUT", API + "?id=" + id, data)

    .then(function(res){

        if(res.ok){

            events = events.map(function(e){
                return e.id === id ? res.json.data : e;
            });

            editingId = 0;

            drawRows();

            showMessage("success", res.json.message);

        }else{

            showMessage("error", res.json.message);

            showFieldErrors("eu_", res.json.errors);
        }

    })

    .catch(function(){

        showMessage("error", "Could not reach the server. Please try again.");

    });
}


/* ===== DELETE ===== */

function deleteEvent(id){

    callApi("DELETE", API + "?id=" + id)

    .then(function(res){

        confirmId = 0;

        if(res.ok){

            events = events.filter(function(e){
                return e.id !== id;
            });

            drawRows();

            showMessage("success", res.json.message);

        }else{

            drawRows();

            showMessage("error", res.json.message);
        }

    })

    .catch(function(){

        showMessage("error", "Could not reach the server. Please try again.");

    });
}


/* search while typing: a new GET after a short pause */

document.getElementById("searchBox").addEventListener("input", function(){

    clearTimeout(searchTimer);

    searchTimer = setTimeout(loadEvents, 300);

});


loadEvents();
