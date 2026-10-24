/* menu.js - menu bar that changes with the logged-in user's role (items come from php/menu.php) */

function loadMenu(){

    let box = document.getElementById("roleMenu");

    if(!box){
        return;
    }

    fetch("../php/menu.php")

    .then(function(response){
        return response.json();
    })

    .then(function(data){

        if(!data.success){
            return;
        }

        let here = window.location.pathname.split("/").pop() + window.location.search;

        box.innerHTML = data.items.map(function(item){

            let page = item.url.split("/").pop();

            return '<a href="' + DataList.esc(item.url) + '"' + (page === here ? ' class="active"' : '') + '>' +
                       DataList.esc(item.icon) + ' ' + DataList.esc(item.label) +
                   '</a>';

        }).join("") +
        '<span class="menu-role">' + DataList.esc(data.role) + ' menu</span>';

    })

    .catch(function(){});
}

loadMenu();
