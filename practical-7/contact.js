function toggleTheme(){

    document.body.classList.toggle("dark");

    let button = document.getElementById("themeButton");

    if(document.body.classList.contains("dark")){

        button.innerHTML = "☀️";

    }else{

        button.innerHTML = "🌙";

    }

}


function toggleFaq(id){

    let answer = document.getElementById(id);

    if(answer.style.display === "block"){

        answer.style.display = "none";

    }else{

        answer.style.display = "block";

    }

}


/* ===== FAQ (loaded from faq.json) ===== */

DataList({
    url: "faq.json",
    list: "faq-list",
    search: "faq-search",
    filter: "faq-filter",
    sort: "faq-sort",
    pager: "faq-pager",
    pageSize: 4,
    searchFields: ["question", "answer", "category"],
    filterField: "category",

    render: function(f){

        var esc = DataList.esc;

        return '<div class="faq-q" onclick="toggleFaq(\'faq-' + f.id + '\')">' +
                   esc(f.question) +
               '</div>' +
               '<div class="faq-a" id="faq-' + f.id + '">' +
                   esc(f.answer) +
               '</div>';
    }
});


/* ===== Contact form -> process.php ===== */

function showFormMessage(type, lines){

    let box = document.getElementById("formMessage");

    box.className = "form-msg " + type;

    box.innerHTML = "";

    lines.forEach(function(line){

        let p = document.createElement("div");
        p.textContent = line;
        box.appendChild(p);

    });
}


document.getElementById("contactForm").addEventListener("submit", function(e){

    e.preventDefault();

    let form = this;
    let name = form.elements["name"].value.trim();
    let email = form.elements["email"].value.trim();
    let message = form.elements["message"].value.trim();

    /* quick check in the browser (the server checks again) */

    if(name === "" || email === "" || message === ""){

        showFormMessage("error", ["Please fill in all the fields."]);

        return;
    }

    let button = form.querySelector("button[type='submit']");

    button.disabled = true;

    fetch("process.php", {
        method: "POST",
        body: new FormData(form)
    })

    .then(function(response){
        return response.json();
    })

    .then(function(result){

        if(result.success){

            showFormMessage("success", [result.message]);

            form.reset();

        }else{

            let lines = Object.values(result.errors || {});

            if(lines.length === 0){
                lines = [result.message];
            }

            showFormMessage("error", lines);
        }

    })

    .catch(function(){

        showFormMessage("error", ["Could not reach the server. Please try again."]);

    })

    .then(function(){

        button.disabled = false;

    });

});