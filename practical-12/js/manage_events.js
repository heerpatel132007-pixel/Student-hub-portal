/* manage_events.js - add, view, update, delete events and upload posters */

var currentPage = 1;
var deleteId = 0;
var searchTimer = null;
var currentPoster = "";
var rules = { maxPosterMB: 2, allowedTypes: ["image/jpeg", "image/png", "image/webp"], allowedExtensions: ["jpg", "jpeg", "png", "webp"] };


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

    window.scrollTo(0, 0);

}


/* ===== call events_api.php ===== */

function api(url, options){

    return fetch(url, options)

    .then(function(response){

        if(response.status === 401){
            window.location.href = "login.html?expired=1";
        }

        return response.json();
    });
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


/* ===== options from json/event_options.json ===== */

function fillSelect(id, items, valueKey, textKey){

    let select = document.getElementById(id);

    items.forEach(function(item){

        let option = document.createElement("option");

        option.value = valueKey ? item[valueKey] : item;
        option.textContent = textKey ? item[textKey] : item;

        select.appendChild(option);

    });
}


fetch("../json/event_options.json")

.then(function(response){
    return response.json();
})

.then(function(options){

    rules = options;

    fillSelect("whenFilter", options.when, "value", "label");
    fillSelect("sortBy", options.sorts, "value", "label");

    document.getElementById("posterHint").textContent =
        "JPG, PNG or WEBP, maximum " + options.maxPosterMB + " MB.";

    loadEvents(1);

})

.catch(function(){

    showMessage("error", "Could not load the page options. Open the site through XAMPP (http://localhost).");

});


/* keep the location filter and the form suggestions up to date */

function updateLocations(list){

    let filter = document.getElementById("locationFilter");
    let chosen = filter.value;

    filter.innerHTML = '<option value="">All Locations</option>';

    document.getElementById("locationList").innerHTML = "";

    list.forEach(function(name){

        let option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        filter.appendChild(option);

        let suggestion = document.createElement("option");
        suggestion.value = name;
        document.getElementById("locationList").appendChild(suggestion);

    });

    filter.value = chosen;
}


/* ===== VIEW + SEARCH + FILTER ===== */

function loadEvents(page){

    currentPage = page || 1;

    let params = new URLSearchParams({
        action:   "list",
        page:     currentPage,
        q:        document.getElementById("searchBox").value.trim(),
        location: document.getElementById("locationFilter").value,
        when:     document.getElementById("whenFilter").value,
        sort:     document.getElementById("sortBy").value
    });

    api("../php/events_api.php?" + params.toString())

    .then(function(result){

        if(!result.success){

            showMessage("error", result.message);

            return;
        }

        currentPage = result.page;

        updateLocations(result.locations);
        drawRows(result.rows);
        drawPager(result.page, result.pages, result.total);

    })

    .catch(function(){

        showMessage("error", "Could not reach the server. Please try again.");

    });
}


function posterCell(file){

    if(!file){
        return '<div class="noposter">No poster</div>';
    }

    return '<img class="thumb" src="../uploads/posters/' + esc(file) + '" alt="Poster">';
}


function drawRows(rows){

    let body = document.getElementById("eventRows");

    if(rows.length === 0){

        body.innerHTML = '<tr><td colspan="7" class="empty">No events found.</td></tr>';

        return;
    }

    let today = new Date().toISOString().slice(0, 10);

    body.innerHTML = rows.map(function(e){

        let past = e.event_date < today;

        return '<tr>' +
                   '<td>' + e.id + '</td>' +
                   '<td>' + posterCell(e.poster) + '</td>' +
                   '<td><b>' + esc(e.title) + '</b><br><span class="hint">' + esc(e.description) + '</span></td>' +
                   '<td>' + esc(e.event_date) + '<br><span class="badge ' + (past ? 'past' : 'soon') + '">' + (past ? 'Past' : 'Upcoming') + '</span></td>' +
                   '<td>' + esc(e.location) + '</td>' +
                   '<td>' + e.registered + ' / ' + e.seats + '</td>' +
                   '<td class="actions">' +
                       '<button class="edit" onclick="openEdit(' + e.id + ')">Edit</button>' +
                       '<button class="del" onclick="openDelete(' + e.id + ', \'' + esc(e.title).replace(/'/g, "") + '\')">Delete</button>' +
                   '</td>' +
               '</tr>';

    }).join("");
}


function drawPager(page, pages, total){

    let html = "";

    if(pages > 1){

        html += '<button ' + (page === 1 ? "disabled" : "") + ' onclick="loadEvents(' + (page - 1) + ')">« Prev</button>';

        for(let i = 1; i <= pages; i++){
            html += '<button ' + (i === page ? 'class="active"' : "") + ' onclick="loadEvents(' + i + ')">' + i + '</button>';
        }

        html += '<button ' + (page === pages ? "disabled" : "") + ' onclick="loadEvents(' + (page + 1) + ')">Next »</button>';
    }

    html += '<span class="info">Showing ' + total + ' event(s) — page ' + page + ' of ' + pages + '</span>';

    document.getElementById("pager").innerHTML = html;
}


document.getElementById("searchBox").addEventListener("input", function(){

    clearTimeout(searchTimer);

    searchTimer = setTimeout(function(){
        loadEvents(1);
    }, 300);

});

["locationFilter", "whenFilter", "sortBy"].forEach(function(id){

    document.getElementById(id).addEventListener("change", function(){
        loadEvents(1);
    });

});


function resetFilters(){

    document.getElementById("searchBox").value = "";
    document.getElementById("locationFilter").value = "";
    document.getElementById("whenFilter").value = "";
    document.getElementById("sortBy").selectedIndex = 0;

    loadEvents(1);
}


/* ===== ADD / EDIT form ===== */

var fields = ["title", "event_date", "seats", "location", "description"];


function clearFormErrors(){

    fields.concat(["poster"]).forEach(function(f){

        let slot = document.getElementById("e_" + f);

        if(slot){
            slot.textContent = "";
        }
    });

    document.getElementById("formMessage").className = "msg";
}


function resetPosterInput(){

    document.getElementById("f_poster").value = "";
    document.getElementById("posterPreview").style.display = "none";
    document.getElementById("f_remove_poster").checked = false;

}


function showCurrentPoster(file){

    currentPoster = file || "";

    let preview = document.getElementById("posterPreview");

    if(file){
        preview.src = "../uploads/posters/" + file;
        preview.style.display = "block";
        document.getElementById("removeBox").style.display = "block";
    }else{
        preview.style.display = "none";
        document.getElementById("removeBox").style.display = "none";
    }
}


function openAdd(){

    clearFormErrors();
    resetPosterInput();

    document.getElementById("formTitle").textContent = "Add Event";

    document.getElementById("f_id").value = "";

    fields.forEach(function(f){
        document.getElementById("f_" + f).value = "";
    });

    showCurrentPoster("");

    document.getElementById("formModal").style.display = "block";
}


function openEdit(id){

    clearFormErrors();
    resetPosterInput();

    api("../php/events_api.php?action=get&id=" + id)

    .then(function(result){

        if(!result.success){

            showMessage("error", result.message);

            return;
        }

        let e = result.event;

        document.getElementById("formTitle").textContent = "Edit Event";

        document.getElementById("f_id").value = e.id;
        document.getElementById("f_title").value = e.title;
        document.getElementById("f_event_date").value = e.event_date;
        document.getElementById("f_seats").value = e.seats;
        document.getElementById("f_location").value = e.location;
        document.getElementById("f_description").value = e.description || "";

        showCurrentPoster(e.poster);

        document.getElementById("formModal").style.display = "block";

    })

    .catch(function(){

        showMessage("error", "Could not reach the server. Please try again.");

    });
}


function closeForm(){

    document.getElementById("formModal").style.display = "none";

}


/* ===== poster check in the browser (the server checks again) ===== */

function posterProblem(file){

    let ext = file.name.split(".").pop().toLowerCase();

    if(rules.allowedExtensions.indexOf(ext) === -1 || rules.allowedTypes.indexOf(file.type) === -1){
        return "Poster must be a JPG, PNG or WEBP image.";
    }

    if(file.size > rules.maxPosterMB * 1024 * 1024){
        return "Poster is too large. Maximum size is " + rules.maxPosterMB + " MB.";
    }

    return "";
}


document.getElementById("f_poster").addEventListener("change", function(){

    let slot = document.getElementById("e_poster");
    let preview = document.getElementById("posterPreview");

    slot.textContent = "";

    if(this.files.length === 0){

        showCurrentPoster(currentPoster);

        return;
    }

    let problem = posterProblem(this.files[0]);

    if(problem){

        slot.textContent = problem;

        this.value = "";

        showCurrentPoster(currentPoster);

        return;
    }

    preview.src = URL.createObjectURL(this.files[0]);
    preview.style.display = "block";
});


function validateEventForm(){

    let errors = {};

    let title = document.getElementById("f_title").value.trim();
    let date = document.getElementById("f_event_date").value;
    let seats = document.getElementById("f_seats").value.trim();
    let location = document.getElementById("f_location").value.trim();

    if(title.length < 3){
        errors.title = "Title must be at least 3 characters.";
    }

    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
        errors.event_date = "Enter a valid event date.";
    }

    if(!/^\d+$/.test(seats) || +seats < 1 || +seats > 5000){
        errors.seats = "Seats must be a number from 1 to 5000.";
    }

    if(location.length < 2){
        errors.location = "Enter the event location.";
    }

    return errors;
}


function showFormErrors(errors){

    Object.keys(errors).forEach(function(key){

        let slot = document.getElementById("e_" + key);

        if(slot){
            slot.textContent = errors[key];
        }
    });
}


/* ===== SAVE (add or update) ===== */

function saveEvent(){

    clearFormErrors();

    let errors = validateEventForm();

    if(Object.keys(errors).length > 0){

        showFormErrors(errors);

        return;
    }

    let id = document.getElementById("f_id").value;
    let isNew = (id === "");

    let data = new FormData();

    data.append("action", isNew ? "add" : "update");

    if(!isNew){
        data.append("id", id);
    }

    fields.forEach(function(f){
        data.append(f, document.getElementById("f_" + f).value);
    });

    let file = document.getElementById("f_poster").files[0];

    if(file){
        data.append("poster", file);
    }

    if(document.getElementById("f_remove_poster").checked){
        data.append("remove_poster", "yes");
    }

    let button = document.getElementById("saveBtn");

    button.disabled = true;

    api("../php/events_api.php", { method: "POST", body: data })

    .then(function(result){

        button.disabled = false;

        if(result.success){

            closeForm();

            showMessage("success", result.message);

            loadEvents(currentPage);

        }else{

            showFormErrors(result.errors || {});

            if(!result.errors || Object.keys(result.errors).length === 0){

                let box = document.getElementById("formMessage");

                box.className = "msg error";
                box.textContent = result.message;
            }
        }

    })

    .catch(function(){

        button.disabled = false;

        let box = document.getElementById("formMessage");

        box.className = "msg error";
        box.textContent = "Could not reach the server. Please try again.";

    });
}


/* ===== DELETE ===== */

function openDelete(id, title){

    deleteId = id;

    document.getElementById("deleteText").textContent =
        "Do you really want to delete " + title + "?";

    document.getElementById("deleteModal").style.display = "block";
}


function closeDelete(){

    document.getElementById("deleteModal").style.display = "none";

}


function doDelete(){

    let data = new FormData();

    data.append("action", "delete");
    data.append("id", deleteId);

    api("../php/events_api.php", { method: "POST", body: data })

    .then(function(result){

        closeDelete();

        showMessage(result.success ? "success" : "error", result.message);

        if(result.success){
            loadEvents(currentPage);
        }

    })

    .catch(function(){

        closeDelete();

        showMessage("error", "Could not reach the server. Please try again.");

    });
}
