// ---- Define your dialogs and panels here ----
// let effective_permissions_panel = define_new_effective_permissions(
//     'effective_permissions_panel',
//     true
// );
// $('#sidepanel').append(effective_permissions_panel);

// let user_selector = define_new_user_select_field(
//     'user_select',
//     'Select the user',
//     function(selected_user) {
//         $('#effective_permissions_panel').attr('username', selected_user);
//     }
// );
// $('#sidepanel').append(user_selector);

// let new_dialog = define_new_dialog('info_dialog', 'Information/Details');
// $('.perm_info').click(
//     function() {
//         let name = $('#effective-permissions-panel').attr('username');
//         let path = $('#effective-permissions-panel').attr('filepath');
//         let permission = $(this).attr('permission_name');
//         console.log('Username:', name, 'Filepath:', path, 'Permission Type:', permission);

//         if (!name || !path) {
//             new_dialog.html('Select a user and file first.').dialog('Open');
//             return;
//         }
  
//         let file_obj = path_to_file[path];
//         let user_obj = all_users[name];
//         console.log('File Object:', file_obj, 'User Object:', user_obj);
  
//         let explanation_obj = allow_user_action(file_obj, user_obj, permission, true);
//         console.log('Explanation Object:', explanation_obj);
  
//         let text = get_explanation_text(explanation_obj);
//         console.log('Explanation Text:', text);

//         new_dialog.html(text).dialog('Open');
//     }
// );

// ---- Display file structure ----

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
    let file_hash = get_full_path(file_obj)

    if(file_obj.is_folder) {
        let folder_elem = $(`<div class='folder' id="${file_hash}_div">
            <h3 id="${file_hash}_header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> ${file_obj.filename} 
                <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton" title="Change Permissions" style="margin-left: 8px; padding: 4px 10px;"> 
                    <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> Change Permissions
                </button>
            </h3>
        </div>`)

        // append children, if any:
        if( file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>")
            
            // Check if this folder has any files (not just folders)
            let has_files = false
            for(let child_file of parent_to_children[file_hash]) {
                if (!child_file.is_folder) {
                    has_files = true
                    break
                }
            }
            
            // Only create table with headers if there are files
            if (has_files) {
                let file_table = $(`
                    <table class="folder_file_table" width="100%">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 8px; background-color: #f8f9fa; font-weight: 600;">File Name</th>
                                <th style="text-align: center; padding: 8px; background-color: #f8f9fa; font-weight: 600; width: 150px;">Inheritance Status</th>
                                <th style="text-align: right; padding: 8px; background-color: #f8f9fa; font-weight: 600; width: 200px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="folder_file_table_body"></tbody>
                    </table>
                `)
                container_elem.append(file_table)
                
                for(child_file of parent_to_children[file_hash]) {
                    let child_elem = make_file_element(child_file)
                    // If it's a file, add it to the table; if it's a folder, add it normally
                    if (!child_file.is_folder) {
                        file_table.find('.folder_file_table_body').append(child_elem)
                    } else {
                        container_elem.append(child_elem)
                    }
                }
            } else {
                // No files, just add folders directly without table structure
                for(child_file of parent_to_children[file_hash]) {
                    let child_elem = make_file_element(child_file)
                    container_elem.append(child_elem)
                }
            }
            folder_elem.append(container_elem)
        }
        return folder_elem
    }
    else {
        // Add visual indicator for inheritance status
        let inheritance_indicator = ''
        let inheritance_text = ''
        if (file_obj.using_permission_inheritance) {
            // Green checkmark with down arrow - inheriting
            inheritance_indicator = '<span style="color: #28a745; font-weight: bold;" title="Inheriting permissions from parent">✓↓</span>'
            inheritance_text = 'Inheriting'
        } else {
            // Check if file has empty ACL and parent has permissions - this might indicate broken inheritance
            if (file_obj.acl.length === 0 && file_obj.parent !== null) {
                let parent_has_permissions = file_obj.parent.acl.length > 0 || 
                    (file_obj.parent.using_permission_inheritance && file_obj.parent.parent !== null)
                if (parent_has_permissions) {
                    // Red warning - broken inheritance
                    inheritance_indicator = '<span style="color: #dc3545; font-weight: bold;" title="Warning: Not inheriting permissions - file may be inaccessible">⚠</span>'
                    inheritance_text = 'Warning'
                } else {
                    // Gray X - not inheriting (but parent also has no permissions, so ok)
                    inheritance_indicator = '<span style="color: #6c757d; font-weight: bold;" title="Not inheriting permissions">✗</span>'
                    inheritance_text = 'Not Inheriting'
                }
            } else {
                // Gray X - not inheriting, using explicit permissions
                inheritance_indicator = '<span style="color: #6c757d; font-weight: bold;" title="Not inheriting permissions - using explicit permissions">✗</span>'
                inheritance_text = 'Explicit'
            }
        }
        
        // Return as a table row for column layout
        return $(`<tr class='file' id="${file_hash}_div">
            <td style="padding: 8px; vertical-align: middle;">
                <span class="oi oi-file" id="${file_hash}_icon" style="margin-right: 8px;"/>${file_obj.filename}
            </td>
            <td style="padding: 8px; text-align: center; vertical-align: middle;">
                ${inheritance_indicator} <span style="font-size: 0.9em; color: #666;">${inheritance_text}</span>
            </td>
            <td style="padding: 8px; text-align: right; vertical-align: middle;">
                <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton" title="Change Permissions" style="padding: 4px 10px;"> 
                    <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> Change Permissions
                </button>
            </td>
        </tr>`)
    }
}

for(let root_file of root_files) {
    let file_elem = make_file_element(root_file)
    $( "#filestructure" ).append( file_elem);    
}

// Add legend/key panel below file structure
let inheritance_legend = $(`
    <div id="inheritance_legend" style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-family: Arial, sans-serif;">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">Inheritance Status Indicators:</h3>
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
            <tr>
                <td style="padding: 8px; text-align: center; width: 60px; font-family: Arial, sans-serif;">
                    <span style="color: #28a745; font-weight: bold; font-size: 18px;">✓↓</span>
                </td>
                <td style="padding: 8px; font-family: Arial, sans-serif;">
                    <strong style="font-family: Arial, sans-serif;">Inheriting</strong> - File is inheriting permissions from its parent folder
                </td>
            </tr>
            <tr>
                <td style="padding: 8px; text-align: center; width: 60px; font-family: Arial, sans-serif;">
                    <span style="color: #dc3545; font-weight: bold; font-size: 18px;">⚠</span>
                </td>
                <td style="padding: 8px; font-family: Arial, sans-serif;">
                    <strong style="font-family: Arial, sans-serif;">Warning</strong> - File is not inheriting permissions and has no explicit permissions. The file may be inaccessible.
                </td>
            </tr>
            <tr>
                <td style="padding: 8px; text-align: center; width: 60px; font-family: Arial, sans-serif;">
                    <span style="color: #6c757d; font-weight: bold; font-size: 18px;">✗</span>
                </td>
                <td style="padding: 8px; font-family: Arial, sans-serif;">
                    <strong style="font-family: Arial, sans-serif;">Not Inheriting</strong> - File is using explicit permissions instead of inheriting from parent
                </td>
            </tr>
        </table>
    </div>
`)
$("#filestructure").after(inheritance_legend)

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