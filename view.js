// ---- Define your dialogs and panels here ----
let effective_permissions_panel = define_new_effective_permissions(
    'effective_permissions_panel',
    true
);
$('#sidepanel').append(effective_permissions_panel);

let user_selector = define_new_user_select_field(
    'user_select',
    'Select the user',
    function(selected_user) {
        $('#effective_permissions_panel').attr('username', selected_user);
    }
);
$('#sidepanel').append(user_selector);

let new_dialog = define_new_dialog('info_dialog', 'Information/Details');
$('.perm_info').click(
    function() {
        let name = $('#effective-permissions-panel').attr('username');
        let path = $('#effective-permissions-panel').attr('filepath');
        let permission = $(this).attr('permission_name');
        console.log('Username:', name, 'Filepath:', path, 'Permission Type:', permission);

        if (!name || !path) {
            new_dialog.html('Select a user and file first.').dialog('Open');
            return;
        }
  
        let file_obj = path_to_file[path];
        let user_obj = all_users[name];
        console.log('File Object:', file_obj, 'User Object:', user_obj);
  
        let explanation_obj = allow_user_action(file_obj, user_obj, permission, true);
        console.log('Explanation Object:', explanation_obj);
  
        let text = get_explanation_text(explanation_obj);
        console.log('Explanation Text:', text);

        new_dialog.html(text).dialog('Open');
    }
);

// ---- Display file structure ----

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
    let file_hash = get_full_path(file_obj)

    if(file_obj.is_folder) {
        let folder_elem = $(`<div class='folder' id="${file_hash}_div">
            <h3 id="${file_hash}_header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> ${file_obj.filename} 
                <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                    <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
                </button>
            </h3>
        </div>`)

        // append children, if any:
        if( file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>")
            folder_elem.append(container_elem)
            for(child_file of parent_to_children[file_hash]) {
                let child_elem = make_file_element(child_file)
                container_elem.append(child_elem)
            }
        }
        return folder_elem
    }
    else {
        return $(`<div class='file'  id="${file_hash}_div">
            <span class="oi oi-file" id="${file_hash}_icon"/> ${file_obj.filename}
            <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
            </button>
        </div>`)
    }
}

for(let root_file of root_files) {
    let file_elem = make_file_element(root_file)
    $( "#filestructure" ).append( file_elem);    
}



// make folder hierarchy into an accordion structure
$('.folder').accordion({
    collapsible: true,
    heightStyle: 'content'
}) // TODO: start collapsed and check whether read permission exists before expanding?


// -- Connect File Structure lock buttons to the permission dialog --

// open permissions dialog when a permission button is clicked
$('.permbutton').click( function( e ) {
    // Set the path and open dialog:
    let path = e.currentTarget.getAttribute('path');
    perm_dialog.attr('filepath', path)
    perm_dialog.dialog('open')
    //open_permissions_dialog(path)

    // Deal with the fact that folders try to collapse/expand when you click on their permissions button:
    e.stopPropagation() // don't propagate button click to element underneath it (e.g. folder accordion)
    // Emit a click for logging purposes:
    emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), e.target.id,new Date().getTime()) }))
});


// ---- Assign unique ids to everything that doesn't have an ID ----
$('#html-loc').find('*').uniqueId() 