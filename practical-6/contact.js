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