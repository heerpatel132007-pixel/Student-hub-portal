/*
   datalist.js
   Small helper used by dashboard, profile, notices and contact pages.
   It loads a JSON file with fetch() and gives you:
   rendering, search, filter, sorting and pagination.
*/

function DataList(cfg){

    var items = [];
    var page = 1;
    var size = cfg.pageSize || 5;

    function get(id){
        return id ? document.getElementById(id) : null;
    }

    var list   = get(cfg.list);
    var search = get(cfg.search);
    var filter = get(cfg.filter);
    var sort   = get(cfg.sort);
    var pager  = get(cfg.pager);


    /* fill the filter dropdown from the data */

    function fillFilter(){

        var seen = {};

        items.forEach(function(item){
            seen[item[cfg.filterField]] = true;
        });

        Object.keys(seen).sort().forEach(function(value){

            var option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            filter.appendChild(option);

        });
    }


    /* apply filter + search + sort */

    function getView(){

        var q = search ? search.value.trim().toLowerCase() : "";
        var f = filter ? filter.value : "all";

        var result = items.filter(function(item){

            if(f !== "all" && String(item[cfg.filterField]) !== f){
                return false;
            }

            if(q === ""){
                return true;
            }

            return cfg.searchFields.some(function(key){
                return String(item[key] || "").toLowerCase().indexOf(q) !== -1;
            });

        });

        if(sort && sort.value){

            var parts = sort.value.split(":");
            var key = parts[0];
            var dir = parts[1] === "desc" ? -1 : 1;

            result.sort(function(a, b){

                var x = a[key];
                var y = b[key];

                if(typeof x === "number" && typeof y === "number"){
                    return (x - y) * dir;
                }

                return String(x).localeCompare(String(y)) * dir;

            });
        }

        return result;
    }


    /* draw the current page */

    function render(){

        var view = getView();
        var pages = Math.max(1, Math.ceil(view.length / size));

        if(page > pages){
            page = pages;
        }

        var start = (page - 1) * size;
        var visible = view.slice(start, start + size);

        if(view.length === 0){
            list.innerHTML = '<p class="dl-msg">No results found.</p>';
        }else{
            list.innerHTML = visible.map(cfg.render).join("");
        }

        drawPager(pages, view.length);
    }


    function drawPager(pages, total){

        if(!pager){
            return;
        }

        var html = "";

        if(pages > 1){

            html += '<button data-page="' + (page - 1) + '"' +
                    (page === 1 ? " disabled" : "") + '>« Prev</button>';

            for(var i = 1; i <= pages; i++){
                html += '<button data-page="' + i + '"' +
                        (i === page ? ' class="active"' : "") + '>' + i + '</button>';
            }

            html += '<button data-page="' + (page + 1) + '"' +
                    (page === pages ? " disabled" : "") + '>Next »</button>';
        }

        html += '<span class="dl-info">Showing ' + total + ' item(s) — page ' +
                page + ' of ' + pages + '</span>';

        pager.innerHTML = html;
    }


    /* events */

    if(pager){
        pager.addEventListener("click", function(e){

            var button = e.target.closest("button");

            if(!button || button.disabled){
                return;
            }

            page = parseInt(button.getAttribute("data-page"));
            render();

        });
    }

    [search, filter, sort].forEach(function(control){

        if(!control){
            return;
        }

        var type = (control === search) ? "input" : "change";

        control.addEventListener(type, function(){
            page = 1;
            render();
        });

    });


    /* load the JSON file */

    list.innerHTML = '<p class="dl-msg">Loading...</p>';

    fetch(cfg.url)

        .then(function(response){

            if(!response.ok){
                throw new Error("HTTP " + response.status);
            }

            return response.json();

        })

        .then(function(data){

            items = Array.isArray(data) ? data : data[cfg.key];

            if(filter && cfg.filterField){
                fillFilter();
            }

            render();

        })

        .catch(function(error){

            list.innerHTML = '<p class="dl-msg">Could not load ' + cfg.url +
                '. Open the site with a local server (for example VS Code Live Server).</p>';

            console.error(error);

        });
}


/* small helpers */

DataList.esc = function(text){

    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;

};

DataList.fmtDate = function(iso){

    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

};