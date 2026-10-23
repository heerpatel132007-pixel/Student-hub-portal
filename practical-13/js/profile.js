function toggleTheme(){

    document.body.classList.toggle("dark");

    let button =
        document.querySelector(".menu > button:first-of-type");

    if(document.body.classList.contains("dark")){

        button.innerHTML = "☀️";

    }else{

        button.innerHTML = "🌙";

    }
}


function toggleMenu(){

    document.getElementById("nav").classList.toggle("show");

}


function validateForm(){

    let valid = true;


    /* REGULAR EXPRESSIONS */

    let namePattern =
        /^[A-Za-z ]{2,50}$/;

    let emailPattern =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    let mobilePattern =
        /^[6-9][0-9]{9}$/;

    let passwordPattern =
        /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*?&]).{8,}$/;

    let yearPattern =
        /^[1-4]$/;


    /* GET VALUES */

    let name =
        document.getElementById("name").value.trim();

    let email =
        document.getElementById("email").value.trim();

    let mobile =
        document.getElementById("mobile").value.trim();

    let password =
        document.getElementById("password").value;

    let confirmPassword =
        document.getElementById("confirmPassword").value;

    let course =
        document.getElementById("course").value;

    let year =
        document.getElementById("year").value;

    let gender =
        document.querySelector(
            'input[name="gender"]:checked'
        );

    let terms =
        document.getElementById("terms").checked;


    clearErrors();


    /* NAME */

    if(!namePattern.test(name)){

        document.getElementById("nameError").innerHTML =
            "Enter a valid name using only letters.";

        valid = false;

    }


    /* STUDENT ID (username) */

    let studentId =
        document.getElementById("studentId").value.trim();

    if(studentId !== "" && !/^[A-Za-z0-9]{3,20}$/.test(studentId)){

        document.getElementById("studentIdError").innerHTML =
            "Student ID must be 3-20 letters or numbers.";

        valid = false;

    }


    /* SEMESTER */

    let semester =
        document.getElementById("semester").value.trim();

    if(semester !== "" && !/^[1-8]$/.test(semester)){

        document.getElementById("semesterError").innerHTML =
            "Semester must be a number from 1 to 8.";

        valid = false;

    }


    /* EMAIL */

    if(!emailPattern.test(email)){

        document.getElementById("emailError").innerHTML =
            "Enter a valid email address.";

        valid = false;

    }


    /* MOBILE */

    if(!mobilePattern.test(mobile)){

        document.getElementById("mobileError").innerHTML =
            "Enter a valid 10-digit mobile number.";

        valid = false;

    }


    /* PASSWORD */

    if(!passwordPattern.test(password)){

        document.getElementById("passwordError").innerHTML =
            "Password must be 8+ characters with letter, number and special character.";

        valid = false;

    }


    /* CONFIRM PASSWORD */

    if(password !== confirmPassword){

        document.getElementById("confirmPasswordError").innerHTML =
            "Passwords do not match.";

        valid = false;

    }


    /* COURSE */

    if(course === ""){

        document.getElementById("courseError").innerHTML =
            "Please select a course.";

        valid = false;

    }


    /* YEAR */

    if(!yearPattern.test(year)){

        document.getElementById("yearError").innerHTML =
            "Please select a valid year.";

        valid = false;

    }


    /* GENDER */

    if(!gender){

        document.getElementById("genderError").innerHTML =
            "Please select your gender.";

        valid = false;

    }


    /* TERMS */

    if(!terms){

        document.getElementById("termsError").innerHTML =
            "Please accept the terms and conditions.";

        valid = false;

    }


    /* SUCCESS */

    if(valid){

        sendRegistration();

    }

    return false;

}


function clearErrors(){

    document.getElementById("nameError").innerHTML = "";

    document.getElementById("studentIdError").innerHTML = "";

    document.getElementById("semesterError").innerHTML = "";

    document.getElementById("emailError").innerHTML = "";

    document.getElementById("mobileError").innerHTML = "";

    document.getElementById("passwordError").innerHTML = "";

    document.getElementById("confirmPasswordError").innerHTML = "";

    document.getElementById("courseError").innerHTML = "";

    document.getElementById("yearError").innerHTML = "";

    document.getElementById("genderError").innerHTML = "";

    document.getElementById("termsError").innerHTML = "";

}


function showSaved(){

    document.getElementById("savedModal").style.display = "block";

}


function closeModal(){

    document.getElementById("savedModal").style.display = "none";

}


/* ===== Student profiles (loaded from students.json) ===== */

DataList({
    url: "../json/students.json",
    list: "student-list",
    search: "student-search",
    filter: "student-filter",
    sort: "student-sort",
    pager: "student-pager",
    pageSize: 4,
    searchFields: ["name", "studentId", "email", "course"],
    filterField: "course",

    render: function(s){

        var esc = DataList.esc;

        return '<div class="student-card">' +
                   '<div class="student-avatar">' + esc(s.name.charAt(0)) + '</div>' +
                   '<h3>' + esc(s.name) + '</h3>' +
                   '<p>ID: ' + esc(s.studentId) + '</p>' +
                   '<p>' + esc(s.course) + ' • Year ' + s.year + '</p>' +
                   '<p>' + esc(s.email) + '</p>' +
               '</div>';
    }
});


/* ===== Registration -> process.php ===== */

function sendRegistration(){

    let data = new FormData();

    data.append("form_type", "register");

    ["name", "studentId", "course", "year", "semester",
     "email", "mobile", "password", "confirmPassword", "address"]

    .forEach(function(id){
        data.append(id, document.getElementById(id).value);
    });

    let gender = document.querySelector('input[name="gender"]:checked');

    data.append("gender", gender ? gender.value : "");

    if(document.getElementById("terms").checked){
        data.append("terms", "yes");
    }

    fetch("../php/process.php", {
        method: "POST",
        body: data
    })

    .then(function(response){
        return response.json();
    })

    .then(function(result){

        if(result.success){

            showResult("Saved!", [result.message]);

            document.querySelector(".profile-box form").reset();

        }else{

            let fields = result.errors || {};
            let shown = false;

            /* show server errors under the matching field */

            Object.keys(fields).forEach(function(key){

                let slot = document.getElementById(key + "Error");

                if(slot){
                    slot.textContent = fields[key];
                    shown = true;
                }
            });

            if(!shown){
                showResult("Error", [result.message]);
            }
        }

    })

    .catch(function(){

        showResult("Error", ["Could not reach the server. Please try again."]);

    });
}


function showResult(title, lines){

    document.getElementById("savedTitle").textContent = title;

    let text = document.getElementById("savedText");

    text.innerHTML = "";

    lines.forEach(function(line){

        let div = document.createElement("div");
        div.textContent = line;
        text.appendChild(div);

    });

    showSaved();
}


/* ===== Live duplicate check (email / Student ID) -> check_user.php ===== */

function checkAvailable(field, inputId, errorId){

    let value = document.getElementById(inputId).value.trim();

    if(value === ""){
        return;
    }

    fetch("../php/check_user.php?field=" + field + "&value=" + encodeURIComponent(value))

    .then(function(response){
        return response.json();
    })

    .then(function(result){

        if(!result.available && result.message){
            document.getElementById(errorId).textContent = result.message;
        }

    })

    .catch(function(){});
}

document.getElementById("email").addEventListener("blur", function(){
    checkAvailable("email", "email", "emailError");
});

document.getElementById("studentId").addEventListener("blur", function(){
    checkAvailable("studentId", "studentId", "studentIdError");
});
