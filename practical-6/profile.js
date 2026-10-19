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

        showSaved();

    }

    return false;

}


function clearErrors(){

    document.getElementById("nameError").innerHTML = "";

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
    url: "students.json",
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