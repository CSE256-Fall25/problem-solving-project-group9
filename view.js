

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
                <span class="oi oi-folder" id="${file_hash}_icon"></span> ${file_obj.filename} 
                <button
                    class="ui-button ui-widget ui-corner-all permbutton permbutton-folder"
                    path="${file_hash}"
                    id="${file_hash}_permbutton"
                    aria-label="Change folder permissions"
                    title="Change folder permissions"
                    style="margin-left: 10px;"
                >
                    <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"></span>
                    <span class="perm-label">Folder Permissions</span>
                </button>
            </h3>
        </div>`)

        // append children, if any:
        if( file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>")
            folder_elem.append(container_elem)
            
            // Check if this folder contains any files (not just folders)
            let hasFiles = false
            for(let child_file of parent_to_children[file_hash]) {
                if (!child_file.is_folder) {
                    hasFiles = true
                    break
                }
            }
            
            // Add header before files if there are any files in this folder
            if (hasFiles) {
                let file_header = $(`<div class="file-structure-header">
                    <span class="file-header-name">File Name</span>
                    <span class="file-header-inheritance">Inheritance Status</span>
                    <span class="file-header-permissions">Change Permissions</span>
                </div>`)
                container_elem.append(file_header)
            }
            
            for(child_file of parent_to_children[file_hash]) {
                let child_elem = make_file_element(child_file)
                container_elem.append(child_elem)
            }
        }
        return folder_elem
    }
    else {
        // Determine inheritance status and display
        let inheritance_status = file_obj.using_permission_inheritance
        let inheritance_display = inheritance_status 
            ? '<span class="oi oi-check inheritance-icon inheritance-enabled"></span><span class="inheritance-label inheritance-enabled-label">Inheriting</span>' 
            : '<span class="oi oi-x inheritance-icon inheritance-disabled"></span><span class="inheritance-label inheritance-disabled-label">Not inheriting</span>'
        
        return $(`<div class='file'  id="${file_hash}_div">
            <span class="file-name-container">
                <span class="oi oi-file" id="${file_hash}_icon"></span> ${file_obj.filename}
            </span>
            <span class="file-inheritance-status">
                ${inheritance_display}
            </span>
            <button
                class="ui-button ui-widget ui-corner-all permbutton permbutton-file"
                path="${file_hash}"
                id="${file_hash}_permbutton"
                aria-label="Change file permissions"
                title="Change file permissions"
                style="margin-left: 10px;"
            >
                <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"></span>
                <span class="perm-label">File Permissions</span>
            </button>
        </div>`)
    }
}

// Check if there are any root-level files (not folders) and add header if needed
let hasRootFiles = false
for(let root_file of root_files) {
    if (!root_file.is_folder) {
        hasRootFiles = true
        break
    }
}

if (hasRootFiles) {
    let file_header = $(`<div class="file-structure-header">
        <span class="file-header-name">File Name</span>
        <span class="file-header-inheritance">Inheritance Status</span>
        <span class="file-header-permissions">Change Permissions</span>
    </div>`)
    $( "#filestructure" ).append( file_header)
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

// Add legend explaining file structure
let file_structure_legend = $(`<div class="file-structure-legend">
    <div class="legend-title"><strong>Legend:</strong></div>
    <div class="legend-item">
        <span class="oi oi-check inheritance-icon inheritance-enabled"></span>
        <span class="inheritance-label inheritance-enabled-label">Inheriting</span>
        <span class="legend-description">- Permissions are passed from the parent folder</span>
    </div>
    <div class="legend-item">
        <span class="oi oi-x inheritance-icon inheritance-disabled"></span>
        <span class="inheritance-label inheritance-disabled-label">Not inheriting</span>
        <span class="legend-description">- File has its own explicit permissions (not inherited from parent)</span>
    </div>
</div>`)
$( "#filestructure" ).append( file_structure_legend)


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