/* manage_students.js - add, view, edit, delete, search and filter students */

var currentPage = 1;
var myId = 0;
var deleteId = 0;
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


/* ===== messages ===== */

function showMessage(type, text){

    let box = document.getElementById("pageMessage");

    box.className = "msg " + type;
    box.textContent = text;

    window.scrollTo(0, 0);

}


/* ===== call students_api.php ===== */

function api(url, options){

    return fetch(url, options)

    .then(function(response){

        if(response.status === 401){
            window.location.href = "login.html?expired=1";
        }

        return response.json();
    });
}


/* ===== logout ===== */

function logout(){

    fetch("../php/logout.php", { method: "POST" })

    .then(function(){
        window.location.href = "login.html?loggedout=1";
    })

    .catch(function(){
        window.location.href = "login.html";
    });
}


/* ===== dropdowns from json/student_options.json ===== */

function fillSelect(id, items, valueKey, textKey){

    let select = document.getElementById(id);

    items.forEach(function(item){

        let option = document.createElement("option");

        option.value = valueKey ? item[valueKey] : item;
        option.textContent = textKey ? item[textKey] : item;

        select.appendChild(option);

    });
}


fetch("../json/student_options.json")

.then(function(response){
    return response.json();
})

.then(function(options){

    fillSelect("courseFilter", options.courses, "code", "code");
    fillSelect("yearFilter", options.years);
    fillSelect("roleFilter", options.roles);
    fillSelect("sortBy", options.sorts, "value", "label");

    fillSelect("f_course", options.courses, "code", "name");
    fillSelect("f_year", options.years);
    fillSelect("f_gender", options.genders);
    fillSelect("f_role", options.roles);

    loadStudents(1);

})

.catch(function(){

    showMessage("error", "Could not load the form options. Open the site through XAMPP (http://localhost).");

});


/* ===== VIEW + SEARCH + FILTER ===== */

function loadStudents(page){

    currentPage = page || 1;

    let params = new URLSearchParams({
        action: "list",
        page:   currentPage,
        q:      document.getElementById("searchBox").value.trim(),
        course: document.getElementById("courseFilter").value,
        year:   document.getElementById("yearFilter").value,
        role:   document.getElementById("roleFilter").value,
        sort:   document.getElementById("sortBy").value
    });

    api("../php/students_api.php?" + params.toString())

    .then(function(result){

        if(!result.success){

            showMessage("error", result.message);

            return;
        }

        myId = result.me;
        currentPage = result.page;

        drawRows(result.rows);
        drawPager(result.page, result.pages, result.total);

    })

    .catch(function(){

        showMessage("error", "Could not reach the server. Please try again.");

    });
}


function drawRows(rows){

    let body = document.getElementById("studentRows");

    if(rows.length === 0){

        body.innerHTML = '<tr><td colspan="8" class="empty">No students found.</td></tr>';

        return;
    }

    body.innerHTML = rows.map(function(s){

        return '<tr>' +
                   '<td>' + s.id + '</td>' +
                   '<td>' + esc(s.student_id) + '</td>' +
                   '<td>' + esc(s.name) + '</td>' +
                   '<td>' + esc(s.course) + '</td>' +
                   '<td>' + s.year + '</td>' +
                   '<td>' + esc(s.email) + '</td>' +
                   '<td><span class="badge ' + esc(s.role) + '">' + esc(s.role) + '</span></td>' +
                   '<td class="actions">' +
                       '<button class="edit" onclick="openEdit(' + s.id + ')">Edit</button>' +
                       '<button class="del" onclick="openDelete(' + s.id + ', \'' + esc(s.name).replace(/'/g, "") + '\')">Delete</button>' +
                   '</td>' +
               '</tr>';

    }).join("");
}


function drawPager(page, pages, total){

    let html = "";

    if(pages > 1){

        html += '<button ' + (page === 1 ? "disabled" : "") + ' onclick="loadStudents(' + (page - 1) + ')">« Prev</button>';

        for(let i = 1; i <= pages; i++){
            html += '<button ' + (i === page ? 'class="active"' : "") + ' onclick="loadStudents(' + i + ')">' + i + '</button>';
        }

        html += '<button ' + (page === pages ? "disabled" : "") + ' onclick="loadStudents(' + (page + 1) + ')">Next »</button>';
    }

    html += '<span class="info">Showing ' + total + ' student(s) — page ' + page + ' of ' + pages + '</span>';

    document.getElementById("pager").innerHTML = html;
}


/* search while typing (waits a little) */

document.getElementById("searchBox").addEventListener("input", function(){

    clearTimeout(searchTimer);

    searchTimer = setTimeout(function(){
        loadStudents(1);
    }, 300);

});

["courseFilter", "yearFilter", "roleFilter", "sortBy"].forEach(function(id){

    document.getElementById(id).addEventListener("change", function(){
        loadStudents(1);
    });

});


function resetFilters(){

    document.getElementById("searchBox").value = "";
    document.getElementById("courseFilter").value = "";
    document.getElementById("yearFilter").value = "";
    document.getElementById("roleFilter").value = "";
    document.getElementById("sortBy").selectedIndex = 0;

    loadStudents(1);
}


/* ===== ADD / EDIT form ===== */

var fields = ["studentId", "name", "course", "year", "semester", "email", "mobile", "gender", "role", "address", "password"];


function clearFormErrors(){

    fields.forEach(function(f){

        let slot = document.getElementById("e_" + f);

        if(slot){
            slot.textContent = "";
        }
    });

    document.getElementById("formMessage").className = "msg";
}


function openAdd(){

    clearFormErrors();

    document.getElementById("formTitle").textContent = "Add Student";

    document.getElementById("f_id").value = "";

    fields.forEach(function(f){
        document.getElementById("f_" + f).value = "";
    });

    document.getElementById("f_role").value = "student";

    document.getElementById("passwordHint").textContent = "Required: 8+ characters with letter, number and special character.";

    document.getElementById("formModal").style.display = "block";
}


function openEdit(id){

    clearFormErrors();

    api("../php/students_api.php?action=get&id=" + id)

    .then(function(result){

        if(!result.success){

            showMessage("error", result.message);

            return;
        }

        let s = result.student;

        document.getElementById("formTitle").textContent = "Edit Student";

        document.getElementById("f_id").value = s.id;
        document.getElementById("f_studentId").value = s.student_id;
        document.getElementById("f_name").value = s.name;
        document.getElementById("f_course").value = s.course;
        document.getElementById("f_year").value = s.year;
        document.getElementById("f_semester").value = s.semester || "";
        document.getElementById("f_email").value = s.email;
        document.getElementById("f_mobile").value = s.mobile || "";
        document.getElementById("f_gender").value = s.gender || "";
        document.getElementById("f_role").value = s.role;
        document.getElementById("f_address").value = s.address || "";
        document.getElementById("f_password").value = "";

        document.getElementById("passwordHint").textContent = "Leave empty to keep the current password.";

        document.getElementById("formModal").style.display = "block";

    })

    .catch(function(){

        showMessage("error", "Could not reach the server. Please try again.");

    });
}


function closeForm(){

    document.getElementById("formModal").style.display = "none";

}


/* check in the browser first (the server checks again) */

function validateStudentForm(isNew){

    let errors = {};

    let v = {};

    fields.forEach(function(f){
        v[f] = document.getElementById("f_" + f).value.trim();
    });

    v.password = document.getElementById("f_password").value;

    if(!/^[A-Za-z0-9]{3,20}$/.test(v.studentId)){
        errors.studentId = "Student ID must be 3-20 letters or numbers.";
    }

    if(!/^[A-Za-z ]{2,50}$/.test(v.name)){
        errors.name = "Enter a valid name using only letters.";
    }

    if(v.course === ""){
        errors.course = "Please select a valid course.";
    }

    if(!/^[1-4]$/.test(v.year)){
        errors.year = "Please select a valid year.";
    }

    if(v.semester !== "" && !/^[1-8]$/.test(v.semester)){
        errors.semester = "Semester must be a number from 1 to 8.";
    }

    if(!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v.email)){
        errors.email = "Enter a valid email address.";
    }

    if(!/^[6-9][0-9]{9}$/.test(v.mobile)){
        errors.mobile = "Enter a valid 10-digit mobile number.";
    }

    if(v.gender === ""){
        errors.gender = "Please select the gender.";
    }

    if((isNew || v.password !== "") && !/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*?&]).{8,}$/.test(v.password)){
        errors.password = "Password must be 8+ characters with letter, number and special character.";
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

function saveStudent(){

    clearFormErrors();

    let id = document.getElementById("f_id").value;
    let isNew = (id === "");

    let errors = validateStudentForm(isNew);

    if(Object.keys(errors).length > 0){

        showFormErrors(errors);

        return;
    }

    let data = new FormData();

    data.append("action", isNew ? "add" : "update");

    if(!isNew){
        data.append("id", id);
    }

    fields.forEach(function(f){
        data.append(f, document.getElementById("f_" + f).value);
    });

    let button = document.getElementById("saveBtn");

    button.disabled = true;

    api("../php/students_api.php", { method: "POST", body: data })

    .then(function(result){

        button.disabled = false;

        if(result.success){

            closeForm();

            showMessage("success", result.message);

            loadStudents(currentPage);

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

function openDelete(id, name){

    deleteId = id;

    document.getElementById("deleteText").textContent =
        "Do you really want to delete " + name + "?";

    document.getElementById("deleteModal").style.display = "block";
}


function closeDelete(){

    document.getElementById("deleteModal").style.display = "none";

}


function doDelete(){

    let data = new FormData();

    data.append("action", "delete");
    data.append("id", deleteId);

    api("../php/students_api.php", { method: "POST", body: data })

    .then(function(result){

        closeDelete();

        showMessage(result.success ? "success" : "error", result.message);

        if(result.success){
            loadStudents(currentPage);
        }

    })

    .catch(function(){

        closeDelete();

        showMessage("error", "Could not reach the server. Please try again.");

    });
}
