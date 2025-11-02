// Configuration
show_starter_dialogs = false // set this to "false" to disable the survey and 3-minute timer. Set to "true" before submitting to MTurk!!

// ---- Set up main Permissions dialog ----

// --- Create all the elements, and connect them as needed: ---
// Make permissions dialog:
perm_dialog = define_new_dialog('permdialog', title='Permissions', options = {
    // The following are standard jquery-ui options. See https://jqueryui.com/dialog/
    height: 850,
    width: 700,
    buttons: {
        OK:{
            text: "OK",
            id: "perm-dialog-ok-button",
            click: function() {
                $( this ).dialog( "close" );
            }
        },
        Advanced: {
            text: "Advanced",
            id: "perm-dialog-advanced-button",
            click: function() {
                open_advanced_dialog(perm_dialog.attr('filepath'))
            }
        }
    }
})

// Make the initial "Object Name:" text:
// If you pass in valid HTML to $(), it will *create* elements instead of selecting them. (You still have to append them, though)
obj_name_div = $('<div id="permdialog_objname" class="section">Object Name: <span id="permdialog_objname_namespan"></span> </div>')

//Make the div with the explanation about special permissions/advanced settings:
advanced_expl_div = $('<div id="permdialog_advanced_explantion_text">For special permissions or advanced settings, click Advanced.</div>')

// Make the (grouped) permission checkboxes table:
grouped_permissions = define_grouped_permission_checkboxes('permdialog_grouped_permissions')
grouped_permissions.addClass('section') // add a 'section' class to the grouped_permissions element. This class adds a bit of spacing between this element and the next.

// Make the list of users container (will use checkboxes instead of selectable)
file_permission_users = $('<div id="permdialog_file_user_list" style="overflow-y:scroll; border: 1px solid #ddd; border-radius: 4px; padding: 8px;"></div>')
file_permission_users.css({
    'height':'150px',
})

// Make button to add a new user to the list:
perm_add_user_select = define_new_user_select_field('perm_add_user', 'Add New User', on_user_change = function(selected_user){
    // console.log("add...")
    let filepath = perm_dialog.attr('filepath')
    if(selected_user && (selected_user.length > 0) && (selected_user in all_users)) { // sanity check that a user is actually selected (and exists)
        let expected_user_elem_id = `permdialog_file_user_${selected_user}`
        if( file_permission_users.find(`#${expected_user_elem_id}`).length === 0 ) { // if such a user element doesn't already exist
            new_user_elem = make_user_elem('permdialog_file_user', selected_user, null, true)
            file_permission_users.append(new_user_elem)
            
            // Make entire row clickable to toggle checkbox
            new_user_elem.click(function(e) {
                if (e.target.type !== 'checkbox') {
                    let checkbox = new_user_elem.find('input[type="checkbox"]')
                    checkbox.prop('checked', !checkbox.prop('checked')).trigger('change')
                }
            })
            
            // Add change handler for checkbox
            new_user_elem.find('input[type="checkbox"]').change(function() {
                // Uncheck all other checkboxes (single selection)
                file_permission_users.find('input[type="checkbox"]').not(this).prop('checked', false)
                
                if ($(this).prop('checked')) {
                    grouped_permissions.attr('username', selected_user)
                    file_permission_users.find('.perm_user_checkbox_row').removeClass('ui-selected')
                    new_user_elem.addClass('ui-selected')
                } else {
                    grouped_permissions.attr('username', '')
                    new_user_elem.removeClass('ui-selected')
                }
            })
        }
    }    
})
perm_add_user_select.find('span').hide()// Cheating a bit - just show the button from the user select; hide the part that displays the username.


// -- Make button to remove currently-selected user; also make some dialogs that may pop up when user clicks this. --

// Make a dialog which shows up when they're not allowed to remove that user from that file (because of inheritance)
cant_remove_dialog = define_new_dialog('cant_remove_inherited_dialog', 'Security', {
    buttons: {
        OK: {
            text: "OK",
            id: "cant-remove-ok-button",
            click: function() {
                $( this ).dialog( "close" );
            }
        }
    }
})
cant_remove_dialog.html(`
<div id="cant_remove_text">
    You can't remove <span id="cant_remove_username_1" class = "cant_remove_username"></span> because this object is inheriting permissions from 
    its parent. To remove <span id="cant_remove_username_2" class = "cant_remove_username"></span>, you must prevent this object from inheriting permissions.
    Turn off the option for inheriting permissions in Advanced, and then try removing <span id="cant_remove_username_3" class = "cant_remove_username"></span>  again.
</div>`)

// Make a confirmation "are you sure you want to remove?" dialog
// Dialog for confirming removal of permissions for user and file (user and file attributed need to be populated)
let are_you_sure_dialog = define_new_dialog('are_you_sure_dialog', "Are you sure?", {
    buttons: {
        Yes: {
            text: "Yes",
            id: "are-you-sure-yes-button",
            click: function() {
                // Get the currently checked user checkbox:
                let selected_checkbox = file_permission_users.find('input[type="checkbox"]:checked')
                if (selected_checkbox.length === 0) {
                    $( this ).dialog( "close" );
                    return
                }
                let selected_user_elem = selected_checkbox.closest('.perm_user_checkbox_row')
                let username = selected_user_elem.attr('name')
                let filepath = perm_dialog.attr('filepath')

                // Remove all the permissions:
                remove_all_perms_for_user(path_to_file[filepath], all_users[username]) 

                // Update the UI to show that it's been removed:
                file_permission_users.find(`#permdialog_file_user_${username}`).remove()
                grouped_permissions.attr('username', '') // clear selection

                // Finally, close this dialog:
                $( this ).dialog( "close" );

            },
        },
        No: {
            text: "No",
            id: "are-you-sure-no-button",
            click: function() {
                $( this ).dialog( "close" );
            }
        }
    }
})
// Add text to the dialog:
are_you_sure_dialog.text('Do you want to remove permissions for this user?')

// Make actual "remove" button:
perm_remove_user_button  = $('<button id="perm_remove_user" class="ui-button ui-widget ui-corner-all remove-user" style="background-color: #dc3545; color: white; border-color: #dc3545;">Remove User</button>')
perm_remove_user_button.click(function(){
    // Get the currently checked user checkbox:
    let selected_checkbox = file_permission_users.find('input[type="checkbox"]:checked')
    if (selected_checkbox.length === 0) {
        return // no user selected
    }
    let selected_user_elem = selected_checkbox.closest('.perm_user_checkbox_row')
    let selected_username = selected_user_elem.attr('name')

    // Get whether user has inherited permissions:
    let has_inherited_permissions = selected_user_elem.attr('inherited')  === "true" // does it have inherited attribute set to "true"?
    
    // Check whether it's OK to remove it:
    if(has_inherited_permissions) { 
        // Not OK -  pop up "can't remove" dialog instead
        $('.cant_remove_username').text(selected_username) // populate ALL the fields with the username
        cant_remove_dialog.dialog('open') // open the dialog
    }
    else 
    {
        // OK to remove - pop up confirmation dialog
        // pass along username and filepath to the dialog, so that it knows what to remove if they click "Yes"
        are_you_sure_dialog.dialog('open') // Open the "are you sure" dialog
    }
})


// --- Append all the elements to the permissions dialog in the right order: --- 
perm_dialog.append(obj_name_div)
perm_dialog.append($('<div id="permissions_user_title" style="font-weight: bold; font-size: 14px; margin-top: 15px; margin-bottom: 8px;">Select employee to change permissions for:</div>'))
perm_dialog.append(file_permission_users)
perm_dialog.append(perm_add_user_select)
perm_add_user_select.append(perm_remove_user_button) // Cheating a bit again - add the remove button the the 'add user select' div, just so it shows up on the same line.
perm_dialog.append(grouped_permissions)
perm_dialog.append(advanced_expl_div)

// --- Additional logic for reloading contents when needed: ---
//Define an observer which will propagate perm_dialog's filepath attribute to all the relevant elements, whenever it changes:
define_attribute_observer(perm_dialog, 'filepath', function(){
    let current_filepath = perm_dialog.attr('filepath')
    // Save the currently selected username before resetting
    let previous_selected_username = grouped_permissions.attr('username')

    grouped_permissions.attr('filepath', current_filepath) // set filepath for permission checkboxes
    $('#permdialog_objname_namespan').text(current_filepath) // set filepath for Object Name text

    // Generate element with all the file-specific users:
    file_users = get_file_users(path_to_file[current_filepath])
    // Create checkbox-based user list instead of selectable
    file_permission_users.empty()
    for(let uname in file_users) {
        let user_elem = make_user_elem('permdialog_file_user', uname, file_users[uname], true)
        file_permission_users.append(user_elem)
        
        // Make entire row clickable to toggle checkbox
        user_elem.click(function(e) {
            if (e.target.type !== 'checkbox') {
                let checkbox = user_elem.find('input[type="checkbox"]')
                checkbox.prop('checked', !checkbox.prop('checked')).trigger('change')
            }
        })
        
        // Add change handler for checkbox
        user_elem.find('input[type="checkbox"]').change(function() {
            // Uncheck all other checkboxes (single selection)
            file_permission_users.find('input[type="checkbox"]').not(this).prop('checked', false)
            
            if ($(this).prop('checked')) {
                grouped_permissions.attr('username', uname)
                // Visual feedback for selected user
                file_permission_users.find('.perm_user_checkbox_row').removeClass('ui-selected')
                user_elem.addClass('ui-selected')
            } else {
                grouped_permissions.attr('username', '')
                user_elem.removeClass('ui-selected')
            }
        })
    }
    
    // Restore the previously selected user if it still exists in the file users
    if (previous_selected_username && previous_selected_username in file_users) {
        // Find the checkbox for this user by ID and check it
        let checkbox = $(`#permdialog_file_user_${previous_selected_username}_checkbox`)
        if (checkbox.length > 0) {
            checkbox.prop('checked', true)
            // Trigger the change event to update grouped_permissions
            checkbox.trigger('change')
        }
    } else {
        // No previous selection or user no longer valid, reset
        grouped_permissions.attr('username', '')
    }
})



// ---- Old code which doesn't use the helper functions starts here ----


// Make (semi-generic) selectable list of elements for all users.
// attr_set_id is the id of the element where we should store the currently selected username.
function make_all_users_list(id_prefix, attr_set_id, height=80) {
    let all_user_list = $(`<div id="${id_prefix}_all_users" class="selectlist section" style="height:${height}px;overflow-y:scroll"></div>`)
    for(let username in all_users) {
        let user = all_users[username]
        all_user_list.append(
            `<div class="ui-widget-content" id="${id_prefix}_${username}" username="${username}">
                <span id="${id_prefix}_${username}_icon" class="oi ${is_user(user)?'oi-person':'oi-people'}"/> 
                ${username}
            </div>`)
    }

    all_user_list.selectable({
        selected: function(e, ui) { 
            // Unselect any previously selected (normally, selectable allows multiple selections)
            $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected"); 

            $(`#${attr_set_id}`).attr('username', ui.selected.getAttribute('username'))

            emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), 'user dialog: select user '+ui.selected.getAttribute('username'),new Date().getTime()) }))


        }
    })

    return all_user_list
}

// populate and open the "permissions entry" dialog for a given file
function open_permission_entry(file_path) {
    let file_obj = path_to_file[file_path]

    $('#perm_entry_username').text('')

    $('.perm_entry_permission_cell').empty()

    $(`#permentry`).dialog('open')
}

// populate and open the "advanced" dialog for a given file
function open_advanced_dialog(file_path) {
    let file_obj = path_to_file[file_path]

    // set file path in UI:
    $('#adv_perm_filepath').text(file_path);
    $('#adv_owner_filepath').text(file_path);
    $('#adv_effective_filepath').text(file_path);
    $('#advdialog').attr('filepath', file_path);

    // clear dynamic content:
    $('#adv_perm_table tr:gt(0)').remove()
    $('#adv_owner_user_list').empty()
    $(`.effectivecheckcell`).empty()

    if(file_obj.using_permission_inheritance) {
        $('#adv_perm_inheritance').prop('checked', true)
    }
    else {
        $('#adv_perm_inheritance').prop('checked', false)
    }



    // permissions list for permissions tab:
    let users = get_file_users(file_obj)
    for(let u in users) {
        let grouped_perms = get_grouped_permissions(file_obj, u)
        for(let ace_type in grouped_perms) {
            for(let perm in grouped_perms[ace_type]) {
                $('#adv_perm_table').append(`<tr id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}">
                    <td id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}_type">${ace_type}</td>
                    <td id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}_name">${u}</td>
                    <td id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}_permission">${perm}</td>
                    <td id="adv_perm_${file_obj.filename}__${u}_${ace_type}_${perm}_type">${grouped_perms[ace_type][perm].inherited?"Parent Object":"(not inherited)"}</td>
                </tr>`)
            }
        }
    }

    // user list for owner tab - using checkbox style:
    $('#adv_owner_current_owner').text(get_user_name(file_obj.owner))
    $('#adv_owner_user_list').empty()
    
    // Style the container
    $('#adv_owner_user_list').css({
        'overflow-y': 'scroll',
        'border': '1px solid #ddd',
        'border-radius': '4px',
        'padding': '8px',
        'height': '200px'
    })
    
    // Populate with checkbox-based selection
    for(let username in all_users) {
        let user = all_users[username]
        let user_elem = make_user_elem('adv_owner_', username, null, true)
        $('#adv_owner_user_list').append(user_elem)
        
        // Make entire row clickable to toggle checkbox
        user_elem.click(function(e) {
            if (e.target.type !== 'checkbox') {
                let checkbox = user_elem.find('input[type="checkbox"]')
                checkbox.prop('checked', !checkbox.prop('checked')).trigger('change')
            }
        })
        
        // Single selection - when checked, update the owner attribute
        user_elem.find('input[type="checkbox"]').change(function() {
            if ($(this).prop('checked')) {
                // Uncheck all other checkboxes
                $('#adv_owner_user_list').find('input[type="checkbox"]').not(this).prop('checked', false)
                // Visual feedback
                $('#adv_owner_user_list').find('.perm_user_checkbox_row').removeClass('ui-selected')
                user_elem.addClass('ui-selected')
                // Update the current owner attribute
                $('#adv_owner_current_owner').attr('username', username)
            } else {
                user_elem.removeClass('ui-selected')
                $('#adv_owner_current_owner').attr('username', '')
            }
        })
    }

    // open dialog:
    $(`#advdialog`).dialog('open')
}

// Update Effective User display
function update_effective_user() {
    $('.effectivecheckcell').empty()
    let selected_username = $('#adv_effective_current_user').attr('selected_user')

    // if a user is actually selected (and is in the user list):
    if(selected_username && (selected_username.length > 0) && (selected_username in all_users) ) {
        let selected_user = all_users[selected_username]

        let filepath = $('#advdialog').attr('filepath')
        let file = path_to_file[filepath]

        // for each possible permission value
        for(let p of Object.values(permissions)) {
            // if the actual model would allow an action with permission
            if( allow_user_action(file, selected_user, p)) {
                // find the checkbox cell and put a checkbox there.
                $(document.getElementById(`adv_effective_checkcell_${p}`)).append(`<span id="adv_effective_checkbox_${p}" class="oi oi-check"/>`)
            }
        }
    }
    
}

// Function to populate user select container with checkbox-based selection
function populate_user_select_container(container_id) {
    $(`#${container_id}`).empty()
    for(let uname in all_users) {
        let user_elem = make_user_elem('user_select', uname, null, true)
        $(`#${container_id}`).append(user_elem)
        
        // Make entire row clickable to toggle checkbox
        user_elem.click(function(e) {
            if (e.target.type !== 'checkbox') {
                let checkbox = user_elem.find('input[type="checkbox"]')
                checkbox.prop('checked', !checkbox.prop('checked')).trigger('change')
            }
        })
        
        // Single selection - uncheck others when this is checked
        user_elem.find('input[type="checkbox"]').change(function() {
            if ($(this).prop('checked')) {
                // Uncheck all other checkboxes
                $(`#${container_id}`).find('input[type="checkbox"]').not(this).prop('checked', false)
                // Visual feedback for selected user
                $(`#${container_id}`).find('.perm_user_checkbox_row').removeClass('ui-selected')
                user_elem.addClass('ui-selected')
                // Store selected username in dialog
                $('#user_select_dialog').attr('username', uname)
            } else {
                user_elem.removeClass('ui-selected')
                $('#user_select_dialog').attr('username', '')
            }
        })
    }
}

// Updated function to use checkbox style selection
function open_user_select(to_populate) {
    $('#user_select_dialog').attr('to_populate', to_populate)
    
    // Reset selection
    $('#user_select_container').find('input[type="checkbox"]').prop('checked', false)
    $('#user_select_container').find('.perm_user_checkbox_row').removeClass('ui-selected')
    $('#user_select_dialog').attr('username', '')
    
    // Populate with checkbox-based list
    populate_user_select_container('user_select_container')

    $(`#user_select_dialog`).dialog('open')
}

// set up effective permissions table in advanced -> effective dialog
for(let p of Object.values(permissions)) {
    let row = $(`
    <tr id="adv_effective_row_${p}">
        <td id="adv_effective_checkcell_${p}"class="effectivecheckcell"></td>
        <td id="adv_effective_name_${p}">${p}</td>
    </tr>
    `)
    $('#adv_effective_effective_list').append(row)
}

// Advanced dialog
$( "#advtabs" ).tabs({
    heightStyle: 'fill'
});
let adv_contents = $(`#advdialog`).dialog({
    position: { my: "top", at: "top", of: $('#html-loc') },
    width: 850,
    height: 650,
    modal: true,
    autoOpen: false,
    appendTo: "#html-loc",
    buttons: {
        OK: {
            text: "OK",
            id: "advanced-dialog-ok-button",
            click: function() {
                $( this ).dialog( "close" );
            }
        }
      }
});
// generate ID for each HTML element making up the dialog:

// open user select dialog on "select" button press:
$("#adv_effective_user_select").click(function(event){
    open_user_select("adv_effective_current_user") // Update element with id=adv_effective_current_user once user is selected.
})

// listen for changes to inheritance checkbox:
$('#adv_perm_inheritance').change(function(){
    let filepath = $('#advdialog').attr('filepath')
    let file_obj = path_to_file[filepath]
    if( $('#adv_perm_inheritance').prop('checked')) {
        // has just been turned on
        file_obj.using_permission_inheritance = true
        emitState()
        open_advanced_dialog(filepath) // reload/reopen dialog
        perm_dialog.attr('filepath', filepath) // force reload 'permissions' dialog
    }
    else {
        // has just been turned off - pop up dialog with add/remove/cancel
        $(`<div id="add_remove_cancel" title="Security">
            Warning: if you proceed, inheritable permissions will no longer propagate to this object.<br/>
            - Click Add to convert and add inherited parent permissions as explicit permissions on this object<br/>
            - Click Remove to remove inherited parent permissions from this object<br/>
            - Click Cancel if you do not want to modify inheritance settings at this time.<br/>
        </div>`).dialog({ // TODO: don't create this dialog on the fly
            modal: true,
            width: 400,
            appendTo: "#html-loc",
            position: { my: "top", at: "top", of: $('#html-loc') },
            buttons: {
                Add: {
                    text: "Add",
                    id: "adv-inheritance-add-button",
                    click: function() {
                        let filepath = $('#advdialog').attr('filepath')
                        let file_obj = path_to_file[filepath]
                        convert_parent_permissions(file_obj)
                        open_advanced_dialog(filepath) // reload/reopen 'advanced' dialog
                        perm_dialog.attr('filepath', filepath) // force reload 'permissions' dialog
                        $( this ).dialog( "close" );
                    },
                },
                Remove: {
                    text: "Remove",
                    id: "adv-inheritance-remove-button",
                    click: function() {
                        let filepath = $('#advdialog').attr('filepath')
                        let file_obj = path_to_file[filepath]
                        file_obj.using_permission_inheritance = false
                        emitState()
                        open_advanced_dialog(filepath) // reload/reopen 'advanced' dialog
                        perm_dialog.attr('filepath', filepath) // force reload 'permissions' dialog
                        $( this ).dialog( "close" );
                    },
                },
                Cancel: {
                    text: "Cancel",
                    id: "adv-inheritance-cancel-button",
                    click: function() {
                        $('#adv_perm_inheritance').prop('checked', true) // undo unchecking
                        $( this ).dialog( "close" );
                    },
                },
            }
        })
    }
})


// listen for changes to "replace..." checkbox:
$('#adv_perm_replace_child_permissions').change(function(){
    if( $('#adv_perm_replace_child_permissions').prop('checked')) {
        // we only care when it's been checked (nothing happens on uncheck) (this should really not be a checkbox...)
        let filepath = $('#advdialog').attr('filepath')
        let file_obj = path_to_file[filepath]
        $(`<div id="replace_perm_dialog" title="Security">
            This will replace explicitly defined permissions on all descendants of this object with inheritable permissions from ${file_obj.filename}.<br/>
            Do you wish to continue?
        </div>`).dialog({
            modal: true,
            position: { my: "top", at: "top", of: $('#html-loc') },
            width: 400,
            buttons: {
                Yes:  {
                    text: "Yes",
                    id: "adv-replace-yes-button",
                    click: function() {
                        let filepath = $('#advdialog').attr('filepath')
                        let file_obj = path_to_file[filepath]
                        replace_child_perm_with_inherited(file_obj)
                        open_advanced_dialog(filepath) // reload/reopen 'advanced' dialog
                        perm_dialog.attr('filepath', filepath) // reload contents of permissions dialog
                        $( this ).dialog( "close" );
                    },
                },
                No: {
                    text: "No",
                    id: "adv-replace-no-button",
                    click: function() {
                        $('#adv_perm_replace_child_permissions').prop('checked', false) // undo checking
                        $( this ).dialog( "close" );
                    },
                },
            }
        })
    }
})

// listen for mutations on selected user name in effective user permissions:
effective_user_observer = new MutationObserver(function(mutationsList, observer){
    for(let mutation of mutationsList) {
        if(mutation.type === 'attributes') {
            if(mutation.attributeName === 'selected_user') {
                update_effective_user()
            }
        }
    }
})

effective_user_observer.observe(document.getElementById('adv_effective_current_user'), {attributes: true})

// change owner button:
$('#adv_owner_change_button').click(function() {
    let selected_username = $('#adv_owner_current_owner').attr('username')
    let filepath = $('#advdialog').attr('filepath')
    let file_obj = path_to_file[filepath]
    if (selected_username && (selected_username.length > 0) && (selected_username in all_users) ) {
        file_obj.owner = all_users[selected_username]
        $('#adv_owner_current_owner').text(selected_username)
        emitState() // Log new state
    }
})



// User dialog - updated to use checkbox style
let user_select_contents = $("#user_select_dialog").dialog({
    height: 450,
    width: 400,
    modal: true,
    autoOpen: false,
    appendTo: "#html-loc",
    position: { my: "top", at: "top", of: $('#html-loc') },
    buttons: {
        Cancel: {
            text: "Cancel",
            id: "user-select-cancel-button",
            click: function() {
                $( this ).dialog( "close" );
            },
        },
        OK: {
            text: "OK",
            id: "user-select-ok-button",
            click: function() {
                // populate field with user name (assume these are stored in attributes)
                let to_populate_id = $(this).attr('to_populate')
                let selected_value = $(this).attr('username') || ''
                
                // If no username in attribute, try to get from checked checkbox
                if (!selected_value) {
                    let selected_checkbox = $('#user_select_container').find('input[type="checkbox"]:checked')
                    if (selected_checkbox.length > 0) {
                        let selected_user_elem = selected_checkbox.closest('.perm_user_checkbox_row')
                        selected_value = selected_user_elem.attr('name')
                    }
                }
                
                if (selected_value) {
                    $(`#${to_populate_id}`).text(selected_value)
                    $(`#${to_populate_id}`).attr('selected_user', selected_value)
                }
                $( this ).dialog( "close" );
            }
        }
      }
})

// Style the user select container to match checkbox style (when it exists)
if ($('#user_select_container').length > 0) {
    $('#user_select_container').css({
        'overflow-y': 'scroll',
        'border': '1px solid #ddd',
        'border-radius': '4px',
        'padding': '8px',
        'height': '250px'
    })
}

// Also add a header to the dialog if the container exists
if ($('#user_select_dialog').length > 0 && $('#user_select_container').length > 0) {
    // Check if header doesn't already exist
    if ($('#user_select_dialog').find('.user_select_header').length === 0) {
        $('#user_select_container').before($('<div class="user_select_header" style="margin-bottom: 10px; font-weight: bold;">Select a user:</div>'))
    }
}



let perm_entry_dialog = $('#permentry').dialog({
    modal: true,
    autoOpen: false,
    height: 500,
    width: 400,
    appendTo: "#html-loc",
    position: { my: "top", at: "top", of: $('#html-loc') },
    buttons: {
        OK: {
            text: "OK",
            id: "permission-entry-ok-button",
            click: function() {
                let filepath = $('#advdialog').attr('filepath') // Get current filepath
                open_advanced_dialog(filepath) // redo advanced dialog (recalc permissions)
                perm_dialog.attr('filepath', filepath) // reload contents of permissions dialog
                $( this ).dialog( "close" );
            }
        }
    }
})

for(let p of Object.values(permissions)){
    let p_id = p.replace(/[ \/]/g, '_')
    let row = $(`<tr id="perm_entry_row_${p_id}">
        <td id="perm_entry_row_${p_id}_cell">${p}</td>
        <td id="perm_entry_row_${p_id}_permission_cell" class="perm_entry_permission_cell" perm="${p}" style="text-align: center;"></td>
    </tr>`)
    $('#perm_entry_table').append(row)
}  

$('#adv_perm_edit').click(function(){
    let filepath = $('#advdialog').attr('filepath')
    open_permission_entry(filepath)
})

$('#perm_entry_change_user').click(function(){
    open_user_select('perm_entry_username') 
})


perm_entry_user_observer = new MutationObserver(function(mutationsList, observer){
    for(let mutation of mutationsList) {
        if(mutation.type === 'attributes') {
            if(mutation.attributeName === 'selected_user') {

                let filepath = $('#advdialog').attr('filepath') // TODO: maybe set and use own filepath in this dialog.
                let file_obj = path_to_file[filepath]
                
                // get rid of previous toggles:
                $('.perm_entry_permission_cell').empty()
                
                // Create toggle switches for each permission
                $('.perm_entry_permission_cell').each(function(){
                    let permission = $(this).attr('perm')
                    let p_id = permission.replace(/[ \/]/g, '_')
                    let cell = $(this)
                    
                    let toggle_html = `
                        <div class="perm_toggle_container" style="display: inline-flex; align-items: center;">
                            <span class="perm_toggle_label" style="margin-right: 8px; font-size: 12px; color: #666;">Deny</span>
                            <label class="perm_toggle_switch" id="perm_entry_${p_id}_toggle_switch" permission="${permission}">
                                <input type="checkbox" id="perm_entry_${p_id}_toggle" class="perm_entry_checkbox_toggle" permission="${permission}">
                                <span class="perm_toggle_slider"></span>
                            </label>
                            <span class="perm_toggle_label" style="margin-left: 8px; font-size: 12px; color: #666;">Allow</span>
                        </div>
                    `
                    cell.append(toggle_html)
                })

                let all_perms = get_total_permissions(file_obj, $('#perm_entry_username').attr('selected_user'))
                
                // Set toggle states based on permissions
                for(let p of Object.values(permissions)) {
                    let p_id = p.replace(/[ \/]/g, '_')
                    let toggle_checkbox = $(`#perm_entry_${p_id}_toggle`)
                    let has_allow = all_perms.allow[p] && all_perms.allow[p].set
                    let has_deny = all_perms.deny[p] && all_perms.deny[p].set
                    
                    if (has_allow) {
                        // Allow = checked (right side)
                        toggle_checkbox.prop('checked', true)
                        if (all_perms.allow[p].inherited) {
                            toggle_checkbox.prop('disabled', true)
                        }
                    } else if (has_deny) {
                        // Deny = unchecked (left side, default)
                        toggle_checkbox.prop('checked', false)
                        if (all_perms.deny[p].inherited) {
                            toggle_checkbox.prop('disabled', true)
                        }
                    } else {
                        // No explicit permissions - check parent if using inheritance
                        if (filepath && filepath in path_to_file) {
                            let file_obj = path_to_file[filepath]
                            if (file_obj.using_permission_inheritance && file_obj.parent !== null) {
                                let parent_perms = get_total_permissions(file_obj.parent, $('#perm_entry_username').attr('selected_user'))
                                let parent_has_allow = parent_perms.allow[p] && parent_perms.allow[p].set
                                let parent_has_deny = parent_perms.deny[p] && parent_perms.deny[p].set
                                
                                if (parent_has_allow) {
                                    // Parent has Allow - show as Allow (inherited, so disabled)
                                    toggle_checkbox.prop('checked', true)
                                    toggle_checkbox.prop('disabled', true)
                                } else if (parent_has_deny) {
                                    // Parent has Deny - show as Deny (inherited, so disabled)
                                    toggle_checkbox.prop('checked', false)
                                    toggle_checkbox.prop('disabled', true)
                                } else {
                                    // Parent also has nothing - default to Deny
                                    toggle_checkbox.prop('checked', false)
                                }
                            } else {
                                // No inheritance - default to Deny
                                toggle_checkbox.prop('checked', false)
                            }
                        } else {
                            // No file object - default to Deny
                            toggle_checkbox.prop('checked', false)
                        }
                    }
                }

                $('.perm_entry_checkbox_toggle').change(function(){
                    let username = $('#perm_entry_username').attr('selected_user')
                    let filepath = $('#advdialog').attr('filepath')
                    let permission = $(this).attr('permission')
                    let is_checked = $(this).prop('checked') // checked = Allow, unchecked = Deny
                    
                    // Remove opposite type first, then add selected type
                    let selected_type = is_checked ? 'allow' : 'deny'
                    let opposite_type = is_checked ? 'deny' : 'allow'
                    
                    toggle_permission(filepath, username, permission, opposite_type, false)
                    toggle_permission(filepath, username, permission, selected_type, true)
                })
            }
        }
    }
})

perm_entry_user_observer.observe(document.getElementById('perm_entry_username'), {attributes: true})



// --- add pre- and post- dialogs ---



function end_task() {
    $('#html-loc').empty()
    $(`<div id="end_dialog" title="Task Ended">The time allotted for this task has run out. Please select one of the options in the collapsible task panel below to submit the task.</div>`)
        .dialog({
            width: 400,
            height: 200,
            appendTo: "#html-loc",
            dialogClass: "no-close",
            position: { my: "top", at: "top", of: $('#html-loc') },
        })
}


$(`<div id="start-dialog" title = "Description">
In a moment, you will see a simplified file system management interface and a task.
Pretend that you are an administrator for this file system, and you are tasked with maintaining correct file permissions.
<br/><br/>
You will have 3 minutes to attempt the task described in the task panel at the bottom of the page. (Note: the task panel is collapsible; if it blocks the interface, use the bottom-right button to collapse it.)
<br/><br/>
After 3 minutes, the interface will be disabled and you will submit an answer to a single question about how far you got with the task. 
If you complete the task early, you will also be able to submit the answer as soon as you are done.
<br/><br/>
<b style="color:red">In order to get your HIT approved, You MUST use the file interface to try to complete the given task.</b> 
You will still get paid if you don't finish the task, but you have to try.
</div>`).dialog({
    modal:true,
    width: 700,
    //height: 350,
    appendTo: "#html-loc",
    dialogClass: "no-close",
    autoOpen: show_starter_dialogs,
    close: function( event, ui ) {
        window.setTimeout(end_task, 3*60*1000)
    },
    buttons:{
        OK: {
            text: "OK",
            id: "start-dialog-ok-button",
            click: function() {
                $( this ).dialog( "close" );
                emitState("Initial permission state");
                $('#mturk-top-banner-collapse-button').click()
            }
        }
    }
})

$(`<div id="survey-dialog" title="Survey">
    <div id="survey-explanation" style="section">Before you begin the task, please indicate how much you agree or disagree with each of the following statements:</div>
    <form id="survey-form">
    <br/>

    <div id="motivation1_question">I enjoy piloting/beta-testing next-generation technology</div>
    <label id="motivation1_a0_label"><input id="motivation1_a0" type="radio" name="motivation1" value="0" required> Strongly Disagree</label>
    <label id="motivation1_a1_label"><input id="motivation1_a1" type="radio" name="motivation1" value="1" required> Disagree</label>
    <label id="motivation1_a2_label"><input id="motivation1_a2" type="radio" name="motivation1" value="2" required> Neither Agree nor Disagree</label>
    <label id="motivation1_a3_label"><input id="motivation1_a3" type="radio" name="motivation1" value="3" required> Agree</label>
    <label id="motivation1_a4_label"><input id="motivation1_a4" type="radio" name="motivation1" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="motivation2_question">I only learn the technology I have to know to get my work done</div>
    <label id="motivation2_a0_label"><input id="motivation2_a0" type="radio" name="motivation2" value="0" required> Strongly Disagree</label>
    <label id="motivation2_a1_label"><input id="motivation2_a1" type="radio" name="motivation2" value="1" required> Disagree</label>
    <label id="motivation2_a2_label"><input id="motivation2_a2" type="radio" name="motivation2" value="2" required> Neither Agree nor Disagree</label>
    <label id="motivation2_a3_label"><input id="motivation2_a3" type="radio" name="motivation2" value="3" required> Agree</label>
    <label id="motivation2_a4_label"><input id="motivation2_a4" type="radio" name="motivation2" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="info_proc_question">When problem-solving, I prefer to collect as much information as possible before making any changes</div>
    <label id="info_proc_a0_label"><input id="info_proc_a0" type="radio" name="info_proc" value="0" required> Strongly Disagree</label>
    <label id="info_proc_a1_label"><input id="info_proc_a1" type="radio" name="info_proc" value="1" required> Disagree</label>
    <label id="info_proc_a2_label"><input id="info_proc_a2" type="radio" name="info_proc" value="2" required> Neither Agree nor Disagree</label>
    <label id="info_proc_a3_label"><input id="info_proc_a3" type="radio" name="info_proc" value="3" required> Agree</label>
    <label id="info_proc_a4_label"><input id="info_proc_a4" type="radio" name="info_proc" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="efficacy_question">If I encounter a problem with computer software, I am confident I would be able to fix it</div>
    <label id="efficacy_a0_label"><input id="efficacy_a0" type="radio" name="efficacy" value="0" required> Strongly Disagree</label>
    <label id="efficacy_a1_label"><input id="efficacy_a1" type="radio" name="efficacy" value="1" required> Disagree</label>
    <label id="efficacy_a2_label"><input id="efficacy_a2" type="radio" name="efficacy" value="2" required> Neither Agree nor Disagree</label>
    <label id="efficacy_a3_label"><input id="efficacy_a3" type="radio" name="efficacy" value="3" required> Agree</label>
    <label id="efficacy_a4_label"><input id="efficacy_a4" type="radio" name="efficacy" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="risk_question">When given a choice, I will usually pick the lower-risk option, even if it has a lower reward</div>
    <label id="risk_a0_label"><input id="risk_a0" type="radio" name="risk" value="0" required> Strongly Disagree</label>
    <label id="risk_a1_label"><input id="risk_a1" type="radio" name="risk" value="1" required> Disagree</label>
    <label id="risk_a2_label"><input id="risk_a2" type="radio" name="risk" value="2" required> Neither Agree nor Disagree</label>
    <label id="risk_a3_label"><input id="risk_a3" type="radio" name="risk" value="3" required> Agree</label>
    <label id="risk_a4_label"><input id="risk_a4" type="radio" name="risk" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <div id="tinkering_question">When using new software, I like to experiment and tinker with the available features</div>
    <label id="tinkering_a0_label"><input id="tinkering_a0" type="radio" name="tinkering" value="0" required> Strongly Disagree</label>
    <label id="tinkering_a1_label"><input id="tinkering_a1" type="radio" name="tinkering" value="1" required> Disagree</label>
    <label id="tinkering_a2_label"><input id="tinkering_a2" type="radio" name="tinkering" value="2" required> Neither Agree nor Disagree</label>
    <label id="tinkering_a3_label"><input id="tinkering_a3" type="radio" name="tinkering" value="3" required> Agree</label>
    <label id="tinkering_a4_label"><input id="tinkering_a4" type="radio" name="tinkering" value="4" required> Strongly Agree</label>
    <br/>
    <br/>

    <button id="submit-survey" class="ui-button ui-widget ui-corner-all" type="submit">
        Submit
    </button>
    </form>
</div>`).dialog({
    modal:true,
    width: 700,
    height: 500,
    autoOpen: show_starter_dialogs,
    appendTo: "#html-loc",
    dialogClass: "no-close",
    closeOnEscape: false
})

$('#survey-form').submit(function(){
    $('#survey-dialog').dialog( "close" );
    event.preventDefault();
})
