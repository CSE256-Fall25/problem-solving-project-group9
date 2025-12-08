// Configuration
show_starter_dialogs = false // set this to "false" to disable the survey and 3-minute timer. Set to "true" before submitting to MTurk!!

// ---- Set up main Permissions dialog ----

// --- Create all the elements, and connect them as needed: ---
// Make permissions dialog:
perm_dialog = define_new_dialog('permdialog', title='Permissions', options = {
    // The following are standard jquery-ui options. See https://jqueryui.com/dialog/
    height: 900,
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

// Make breadcrumb/path display for clarity:
let breadcrumb_div = $('<div id="permdialog_breadcrumb" class="perm-dialog-breadcrumb"><strong>Modifying permissions for:</strong> <span id="permdialog_breadcrumb_path"></span></div>')

// Object name div removed - breadcrumb now shows the path

//Make the div with the explanation about special permissions/advanced settings:
advanced_expl_div = $('<div id="permdialog_advanced_explantion_text">For special permissions or advanced settings, click Advanced.</div>')

// Make the (grouped) permission checkboxes table:
grouped_permissions = define_grouped_permission_checkboxes('permdialog_grouped_permissions')
grouped_permissions.addClass('section') // add a 'section' class to the grouped_permissions element. This class adds a bit of spacing between this element and the next.

// Make the list of users (empty for now - will get populated when we know the file):
file_permission_users = define_checkbox_list('permdialog_file_user_list', function(selected_items){
    // when a user is selected, change username attribute of grouped permissions (use first selected):
    if (selected_items.length > 0) {
        grouped_permissions.attr('username', selected_items[0])
        file_permission_users.attr('selected_item', selected_items[0]) // for backward compatibility
    } else {
        grouped_permissions.attr('username', '')
        file_permission_users.attr('selected_item', '')
    }
})
file_permission_users.css({
    'height':'200px',
})

// Make button to add a new user to the list:
perm_add_user_select = define_new_user_select_field('perm_add_user', 'Add new user', on_user_change = function(selected_user){
    // console.log("add...")
    let filepath = perm_dialog.attr('filepath')
        if(selected_user && (selected_user.length > 0) && (selected_user in all_users)) { // sanity check that a user is actually selected (and exists)
        let expected_user_elem_id = `permdialog_file_user_${selected_user}`
        if( file_permission_users.find(`#${expected_user_elem_id}`).length === 0 ) { // if such a user element doesn't already exist
            new_user_elem = make_user_elem('permdialog_file_user', selected_user, null, true) // include checkbox
            file_permission_users.append(new_user_elem)
        }
    }
})
perm_add_user_select.find('span').hide()// Cheating a bit - just show the button from the user select; hide the part that displays the username.


// -- Make button to remove currently-selected user; also make some dialogs that may pop up when user clicks this. --

// Make a dialog which shows up when they're not allowed to remove that user from that file (because of inheritance)
cant_remove_dialog = define_new_dialog('cant_remove_inherited_dialog', 'Cannot Remove User', {
    width: 550,
    buttons: {
        Cancel: {
            text: "Cancel",
            id: "cant-remove-cancel-button",
            click: function() {
                $( this ).dialog( "close" );
            }
        },
        "Open Advanced Settings": {
            text: "Open Advanced Settings →",
            id: "cant-remove-open-advanced-button",
            click: function() {
                // Get the filepath from the permissions dialog
                let filepath = perm_dialog.attr('filepath')
                let selected_username = file_permission_users.attr('selected_item')
                // Close this dialog
                $( this ).dialog( "close" );
                // Open the Advanced dialog with flag indicating it's from the "can't remove" error
                open_advanced_dialog(filepath, true)
                // Store the username we want to remove for later
                $('#advdialog').data('pending_remove_user', selected_username)
            }
        }
    }
})
cant_remove_dialog.html(`
<div id="cant_remove_text">
    <div style="margin-bottom: 12px;">
        <strong>⚠️ Cannot Remove User</strong><br/><br/>
        <span id="cant_remove_username_1" class="cant_remove_username"></span> cannot be removed because this file is currently inheriting 
        permissions from its parent folder.
    </div>
    <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 8px; margin-top: 12px;">
        <strong style="color: #0066cc;">To remove a user:</strong><br/>
        <span style="color: #004085;">Step 1: Go to <strong>Advanced</strong> → Uncheck "Include inheritable permissions"</span><br/>
        <span style="color: #004085;">Step 2: Return here and click <strong>Remove user</strong></span>
    </div>
</div>`)

// Make a confirmation "are you sure you want to remove?" dialog
// Dialog for confirming removal of permissions for user and file (user and file attributed need to be populated)
let are_you_sure_dialog = define_new_dialog('are_you_sure_dialog', "Are you sure?", {
    buttons: {
        Yes: {
            text: "Yes",
            id: "are-you-sure-yes-button",
            click: function() {
                // Which user and file were they trying to remove permissions for?
                let username = file_permission_users.attr('selected_item')
                let filepath = perm_dialog.attr('filepath')

                // Remove all the permissions:
                remove_all_perms_for_user(path_to_file[filepath], all_users[username]) 

                // Force refresh of permissions dialog to update user list:
                perm_dialog.attr('filepath', filepath)

                // Update the UI to show that it's been removed:
                let selected_username = file_permission_users.attr('selected_item')
                if (selected_username) {
                    file_permission_users.find(`#permdialog_file_user_${selected_username}`).remove()
                }
                file_permission_users.clear_selection() // clear user selection

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
perm_remove_user_button  = $('<button id="perm_remove_user" class="ui-button ui-widget ui-corner-all" title="Please select a user first">Remove user</button>')
perm_remove_user_button.prop('disabled', true)

// Enable/disable Remove user button and update tooltip when selection changes:
file_permission_users.on('change', '.user-checkbox', function() {
    update_remove_button_state()
})

function update_remove_button_state() {
    let selected_items = file_permission_users.get_selected_items()
    if(selected_items.length > 0) {
        let selected_username = selected_items[0]
        let selected_user_elem = file_permission_users.find(`#permdialog_file_user_${selected_username}`)
        let has_inherited_permissions = selected_user_elem.attr('inherited') === "true"
        
        // Always enable the button - we'll guide users through the workflow
        perm_remove_user_button.prop('disabled', false)
        perm_remove_user_button.removeClass('ui-state-disabled')
        
        if(has_inherited_permissions) {
            // User has inherited permissions - show helpful tooltip
            perm_remove_user_button.attr('title', 'Click to see instructions for removing this user (inheritance must be disabled first)')
        } else {
            // User can be removed directly
            perm_remove_user_button.attr('title', 'Remove selected user')
        }
    } else {
        perm_remove_user_button.prop('disabled', true)
        perm_remove_user_button.removeClass('ui-state-disabled')
        perm_remove_user_button.attr('title', 'Please select a user first')
    }
}

// Initial state
update_remove_button_state()

perm_remove_user_button.click(function(){
    // Get the currently selected user (only one can be selected):
    let selected_items = file_permission_users.get_selected_items()
    if (selected_items.length === 0) return
    
    let selected_username = selected_items[0]

    // Get the actual element that we want to remove from the user list:
    let selected_user_elem = file_permission_users.find(`#permdialog_file_user_${selected_username}`)
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
perm_dialog.append(breadcrumb_div)
perm_dialog.append($('<div id="permissions_user_title"><strong>Select employee to change permissions for:</strong><br/></div>'))
perm_dialog.append(file_permission_users)
perm_dialog.append(perm_add_user_select)
perm_add_user_select.append(perm_remove_user_button) // Cheating a bit again - add the remove button the the 'add user select' div, just so it shows up on the same line.

// Add inheritance status indicator and workflow guide
let inheritance_status_box = $('<div id="permdialog_inheritance_status" style="padding: 10px; margin: 10px 0; font-size: 0.9em; border: 1px solid #ddd; border-radius: 4px;"></div>')
perm_dialog.append(inheritance_status_box)

// Add inheritance explanation box between buttons and permissions table
let inheritance_explanation_box = $('<div id="permdialog_inheritance_explanation" style="padding: 10px; margin: 10px 0; font-size: 0.9em; color: #666; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;"><span class="fa fa-info-circle" style="margin-right: 6px;"></span><strong>Note:</strong> If checkboxes are greyed out, they cannot be changed because the permissions are inherited from the parent folder. To modify inherited permissions, go to <strong>Advanced</strong> and uncheck include inheritable permissions.</div>')
perm_dialog.append(inheritance_explanation_box)

perm_dialog.append(grouped_permissions)
perm_dialog.append(advanced_expl_div)

// Create a dialog for showing permission group information
let perm_group_info_dialog = define_new_dialog('perm_group_info_dialog', 'Permission Information', {
    width: 400,
    height: 'auto',
    modal: false,
    buttons: {
        Close: {
            text: "Close",
            click: function() {
                $(this).dialog('close');
            }
        }
    }
});

// Handle clicks on permission group info icons
$(document).on('click', '.perm_group_info', function() {
    let description = $(this).attr('data-description') || 'No description available.';
    let groupName = $(this).attr('data-group') || 'Permission';
    
    // Format the group name for display
    let displayName = groupName;
    if (groupName === 'Full_control') {
        displayName = 'Complete Access';
    } else {
        displayName = groupName.replace(/_/g, ' ');
    }
    
    perm_group_info_dialog.html(`
        <div style="padding: 10px;">
            <h3 style="margin-top: 0; margin-bottom: 10px;">${displayName}</h3>
            <p style="margin: 0; line-height: 1.5;">${description}</p>
        </div>
    `);
    
    // Position the dialog near the clicked icon and open it
    perm_group_info_dialog.dialog('option', 'position', {
        my: "left top",
        at: "right+10 top",
        of: $(this)
    });
    
    perm_group_info_dialog.dialog('open');
});

// --- Additional logic for reloading contents when needed: ---
//Define an observer which will propagate perm_dialog's filepath attribute to all the relevant elements, whenever it changes:
define_attribute_observer(perm_dialog, 'filepath', function(){
    let current_filepath = perm_dialog.attr('filepath')
    let file_obj = path_to_file[current_filepath]
    let current_scenario = $('#scenario_context').data('tag')

    // Update breadcrumb with clear path display
    $('#permdialog_breadcrumb_path').text(current_filepath)
    
    // Update dialog title to show "Folder Permissions" or "File Permissions"
    let object_type = file_obj.is_folder ? 'Folder Permissions' : 'File Permissions'
    perm_dialog.dialog('option', 'title', object_type)

    grouped_permissions.attr('filepath', current_filepath) // set filepath for permission checkboxes

    // Hide permission group info icons to reduce distractions for add_full_permissions scenario
    if (current_scenario === 'add_full_permissions') {
        $('#permdialog_grouped_permissions .perm_group_info').hide()
    } else {
        $('#permdialog_grouped_permissions .perm_group_info').show()
    }

    // Update inheritance status indicator
    if (file_obj.using_permission_inheritance) {
        $('#permdialog_inheritance_status').html(`
            <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 10px;">
                <strong style="color: #0c5460;">ℹ️ Inheritance Enabled</strong><br/>
                <span style="color: #0c5460;">This file is inheriting permissions from its parent folder.</span>
            </div>
        `).show()
    } else {
        $('#permdialog_inheritance_status').html(`
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 10px;">
                <strong style="color: #155724;">✓ Inheritance Disabled</strong><br/>
                <span style="color: #155724;">This file has its own explicit permissions.</span>
            </div>
        `).show()
    }

    // Generate element with all the file-specific users:
    file_users = get_file_users(path_to_file[current_filepath])
    file_user_list = make_user_list('permdialog_file_user', file_users, add_attributes = true, true) // include checkboxes
    grouped_permissions.attr('username', '') // since we are reloading the user list, reset the username in permission checkboxes
    //replace previous user list with the one we just generated:
    file_permission_users.empty()
    
    // If user list is empty and inheritance is disabled, show helpful message
    if (file_user_list.length === 0 && !file_obj.using_permission_inheritance && file_obj.acl.length === 0) {
        let empty_list_message = $(`
            <div style="padding: 15px; text-align: center; color: #666; background-color: #f9f9f9; border: 1px dashed #ccc; border-radius: 4px; margin: 10px 0;">
                <div style="font-size: 1.1em; margin-bottom: 8px;">
                    <strong>No users found</strong>
                </div>
                <div style="font-size: 0.95em; line-height: 1.5;">
                    This file has no explicit permissions and inheritance is disabled.<br/>
                    To see users with permissions, go to <strong>Advanced</strong> and check<br/>
                    <strong>"Include inheritable permissions from this object's parent"</strong>
                </div>
            </div>
        `)
        file_permission_users.append(empty_list_message)
    } else {
        file_permission_users.append(file_user_list)
    }
    
    update_remove_button_state() // update remove button state after reloading list
})



// ---- Old code which doesn't use the helper functions starts here ----


// Make (semi-generic) checkbox list of elements for all users (single selection).
// attr_set_id is the id of the element where we should store the currently selected username.
function make_all_users_list(id_prefix, attr_set_id, height=80) {
    let all_user_list = $(`<div id="${id_prefix}_all_users" class="checkbox-list section" style="height:${height}px;overflow-y:scroll"></div>`)
    for(let username in all_users) {
        let user = all_users[username]
        let user_elem = make_user_elem(id_prefix, username, null, true) // include checkbox
        user_elem.attr('username', username)
        all_user_list.append(user_elem)
    }

    // Handle checkbox changes - enforce single selection
    all_user_list.on('change', '.user-checkbox', function() {
        let this_checkbox = $(this)
        if (this_checkbox.prop('checked')) {
            // Uncheck all other checkboxes
            all_user_list.find('.user-checkbox').not(this_checkbox).prop('checked', false)
            $(`#${attr_set_id}`).attr('username', this_checkbox.attr('name'))
        } else {
            $(`#${attr_set_id}`).attr('username', '')
        }
        
        emitter.dispatchEvent(new CustomEvent('userEvent', { 
            detail: new ClickEntry(
                ActionEnum.CLICK, 
                (event.clientX + window.pageXOffset), 
                (event.clientY + window.pageYOffset), 
                `user dialog: checkbox ${$(this).attr('name')} ${$(this).prop('checked') ? 'checked' : 'unchecked'}`,
                new Date().getTime()) 
        }))
    })
    
    // Allow clicking on the row to toggle checkbox (single selection)
    all_user_list.on('click', '.user-list-item', function(e) {
        if (e.target.type !== 'checkbox') {
            let checkbox = $(this).find('.user-checkbox')
            let was_checked = checkbox.prop('checked')
            // If clicking to check, uncheck all others first
            if (!was_checked) {
                all_user_list.find('.user-checkbox').not(checkbox).prop('checked', false)
            }
            checkbox.prop('checked', !was_checked)
            checkbox.trigger('change')
        }
    })

    return all_user_list
}

// populate and open the "permissions entry" dialog for a given file
function open_permission_entry(file_path) {
    let file_obj = path_to_file[file_path]

    $('#perm_entry_username').text('')

    $('.perm_entry_checkcell').empty()

    $(`#permentry`).dialog('open')
}

// populate and open the "advanced" dialog for a given file
// from_cant_remove_error: optional flag indicating dialog was opened from "can't remove" error path
function open_advanced_dialog(file_path, from_cant_remove_error = false) {
    let file_obj = path_to_file[file_path]

    // Replace object name displays with breadcrumb boxes at the top
    // Permissions tab - breadcrumb at the very top
    $('#adv_perm_object_name').html('<div class="perm-dialog-breadcrumb"><strong>Modifying permissions for:</strong> <span id="adv_perm_filepath">' + file_path + '</span></div>');
    
    // Owner tab - move breadcrumb to the very top, before explanation
    let owner_explanation = $('#adv_owner_explanation').detach();
    let owner_object_name = $('#adv_owner_object_name').detach();
    owner_object_name.html('<div class="perm-dialog-breadcrumb"><strong>Modifying permissions for:</strong> <span id="adv_owner_filepath">' + file_path + '</span></div>');
    $('#adv_owner_tab').prepend(owner_object_name);
    owner_object_name.after(owner_explanation);
    
    // Effective tab - breadcrumb at the very top
    $('#adv_effective_object_name').html('<div class="perm-dialog-breadcrumb"><strong>Modifying permissions for:</strong> <span id="adv_effective_filepath">' + file_path + '</span></div>');
    
    $('#advdialog').attr('filepath', file_path);
    
    // Show/hide warning banner based on scenario or whether opened from "can't remove" error
    let current_scenario = $('#scenario_context').data('tag');
    let should_show_warning = from_cant_remove_error || 
                              current_scenario === 'remove_user_with_inheritance' || 
                              current_scenario === 'remove_inherited_permission';
    
    if (should_show_warning) {
        $('#adv_perm_warning_banner').show();
        // Store flag for use in inheritance dialog
        if (from_cant_remove_error) {
            $('#advdialog').data('from_cant_remove_error', true);
        }
    } else {
        $('#adv_perm_warning_banner').hide();
        $('#advdialog').data('from_cant_remove_error', false);
    }

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

    // user list for owner tab:
    let all_user_list = make_all_users_list('adv_owner_','adv_owner_current_owner') 

    $('#adv_owner_current_owner').text(get_user_name(file_obj.owner))

    $('#adv_owner_user_list').append(all_user_list)

    // Always restore all tabs when opening dialog (they may have been hidden previously)
    // Show the tab list items∂
    $('#advtab_title_owner').show();
    $('#advtab_title_effective').show();
    // Show the tab content panels
    $('#adv_owner_tab').show();
    $('#adv_effective_tab').show();
    
    // Only hide tabs if specifically coming from "can't remove" error
    if (from_cant_remove_error) {
        $('#advtab_title_owner').hide();
        $('#advtab_title_effective').hide();
        $('#adv_owner_tab').hide();
        $('#adv_effective_tab').hide();
        // Make sure Permissions tab is active
        $('#advtabs').tabs('option', 'active', 0);
    } else {
        // Ensure tabs are visible and refresh the tabs widget
        $('#advtabs ul li').show();
        $('#advtabs').tabs('refresh');
    }
    
    // open dialog:
    $(`#advdialog`).dialog('open')
    
    $(document).ready(function() {
        $('#adv_permissions_tab').css('height', '500px');
        $('#adv_owner_tab').css('height', '500px');
        $('#adv_effective_tab').css('height', '500px');
    });
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

// TODO: redo everything to use the new user_select_dialog
function open_user_select(to_populate) {
    $('#user_select_dialog').attr('to_populate', to_populate)

    $('#user_select_container').empty()
    user_select_list = make_all_users_list('user_select', 'user_select_dialog', 200)
    $('#user_select_container').append(user_select_list)

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

// Add warning banner to Advanced dialog (initially hidden)
$('#adv_perm_object_name').after(`
    <div id="adv_perm_warning_banner" class="adv-warning-banner" style="display:none;">
        ⚠️ To remove inheritance, uncheck "Include inheritable permissions from this object's parent" below.
    </div>
`);

// Advanced dialog
$( "#advtabs" ).tabs({
    heightStyle: 'fill'
});
let adv_contents = $(`#advdialog`).dialog({
    position: { my: "top", at: "top", of: $('#html-loc') },
    width: 700,
    height: 750,
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
        // Check if this is the remove_user_with_inheritance scenario for custom messaging
        let current_scenario = $('#scenario_context').data('tag');
        let is_remove_user_scenario = current_scenario === 'remove_user_with_inheritance';
        let from_cant_remove = $('#advdialog').data('from_cant_remove_error') || false;
        
        let dialog_content = '';
        if (is_remove_user_scenario && from_cant_remove) {
            // Scenario-specific messaging for remove_user_with_inheritance
            dialog_content = `
                <div style="margin-bottom: 12px;">
                    <strong>⚠️ To remove a user, you need to convert inherited permissions first.</strong>
                </div>
                <div style="margin-bottom: 12px;">
                    This file is currently inheriting permissions from its parent folder. To remove a user, you must first convert those inherited permissions into explicit permissions on this file.
                </div>
                <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 10px; margin: 12px 0;">
                    <strong style="color: #0066cc;">✓ Recommended: Click "Convert & Add"</strong><br/>
                    This converts inherited permissions to explicit permissions, allowing you to remove the user you selected.
                </div>
                <div style="color: #666; font-size: 0.9em; margin-top: 12px;">
                    <strong>Other options:</strong><br/>
                    • <strong>Remove</strong>: Removes inherited permissions without converting (won't help you remove the user)<br/>
                    • <strong>Cancel</strong>: Keep inheritance settings as they are
                </div>
            `;
        } else {
            // Default messaging - styled to match remove_user_with_inheritance
            dialog_content = `
                <div style="margin-bottom: 12px;">
                    <strong>⚠️ Warning: Inheritable permissions will no longer propagate to this object.</strong>
                </div>
                <div style="margin-bottom: 12px;">
                    If you proceed, this object will stop inheriting permissions from its parent folder. You can choose to convert the inherited permissions to explicit permissions, or remove them entirely.
                </div>
                <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 10px; margin: 12px 0;">
                    <strong style="color: #0066cc;">✓ Recommended: Click "Convert & Add"</strong><br/>
                    This converts inherited permissions to explicit permissions on this object, preserving the current access settings.
                </div>
                <div style="color: #666; font-size: 0.9em; margin-top: 12px;">
                    <strong>Other options:</strong><br/>
                    • <strong>Remove</strong>: Removes inherited permissions without converting (may restrict access)<br/>
                    • <strong>Cancel</strong>: Keep inheritance settings as they are
                </div>
            `;
        }
        
        $(`<div id="add_remove_cancel" title="Security">${dialog_content}</div>`).dialog({ // TODO: don't create this dialog on the fly
            modal: true,
            width: 500,
            appendTo: "#html-loc",
            position: { my: "top", at: "top", of: $('#html-loc') },
            buttons: {
                "Convert & Add": {
                    text: "Convert & Add",
                    id: "adv-inheritance-add-button",
                    class: "ui-button-primary",
                    style: "background-color: #0066cc; color: white;",
                    click: function() {
                        let filepath = $('#advdialog').attr('filepath')
                        let file_obj = path_to_file[filepath]
                        let pending_user = $('#advdialog').data('pending_remove_user')
                        convert_parent_permissions(file_obj)
                        $( this ).dialog( "close" );
                        // Close advanced dialog and return to permissions dialog
                        $('#advdialog').dialog('close')
                        perm_dialog.attr('filepath', filepath) // force reload 'permissions' dialog
                        // If there's a pending user to remove, select them after a brief delay
                        if (pending_user) {
                            setTimeout(function() {
                                // Select the user
                                let user_checkbox = file_permission_users.find(`#permdialog_file_user_${pending_user}_checkbox`)
                                if (user_checkbox.length > 0) {
                                    file_permission_users.find('.user-checkbox').prop('checked', false)
                                    user_checkbox.prop('checked', true)
                                    user_checkbox.trigger('change')
                                    update_remove_button_state()
                                }
                                // Clear the pending user flag
                                $('#advdialog').data('pending_remove_user', null)
                            }, 100)
                        }
                    },
                },
                Remove: {
                    text: "Remove",
                    id: "adv-inheritance-remove-button",
                    click: function() {
                        let filepath = $('#advdialog').attr('filepath')
                        let file_obj = path_to_file[filepath]
                        let pending_user = $('#advdialog').data('pending_remove_user')
                        file_obj.using_permission_inheritance = false
                        emitState()
                        $( this ).dialog( "close" );
                        // Close advanced dialog and return to permissions dialog
                        $('#advdialog').dialog('close')
                        perm_dialog.attr('filepath', filepath) // force reload 'permissions' dialog
                        // If there's a pending user to remove, select them after a brief delay
                        if (pending_user) {
                            setTimeout(function() {
                                // Select the user
                                let user_checkbox = file_permission_users.find(`#permdialog_file_user_${pending_user}_checkbox`)
                                if (user_checkbox.length > 0) {
                                    file_permission_users.find('.user-checkbox').prop('checked', false)
                                    user_checkbox.prop('checked', true)
                                    user_checkbox.trigger('change')
                                    update_remove_button_state()
                                }
                                // Clear the pending user flag
                                $('#advdialog').data('pending_remove_user', null)
                            }, 100)
                        }
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



// User dialog 
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
                let selected_value = $(this).attr('username')
                $(`#${to_populate_id}`).text(selected_value)
                $(`#${to_populate_id}`).attr('selected_user', selected_value)
                $( this ).dialog( "close" );
            }
        }
      }
})



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
                open_advanced_dialog($('#advdialog').attr('filepath') )// redo advanced dialog (recalc permissions)
                perm_dialog.attr('filepath', filepath) // reload contents of permissions dialog
                $( this ).dialog( "close" );
            }
        }
    }
})

for(let p of Object.values(permissions)){
    let row = $(`<tr id="perm_entry_row_${p}">
        <td id="perm_entry_row_${p}_cell">${p}</td>
    </tr>`)
    for(let ace_type of ['allow', 'deny']) {
        row.append(`<td id="perm_entry_row_${p}_${ace_type}" class="perm_entry_checkcell" perm="${p}" type="${ace_type}"></td>`)
    }
    $('#perm_entry_table').append(row)
}  

$('#adv_perm_edit').click(function(){
    let filepath = $('#advdialog').attr('filepath')
    open_permission_entry(filepath)
})

// Add inheritance explanation box to permission entry dialog (between Change button and table)
if ($('#perm_entry_inheritance_explanation_box').length === 0) {
    let perm_entry_explanation_box = $('<div id="perm_entry_inheritance_explanation_box" style="padding: 10px; margin: 10px 0; font-size: 0.9em; color: #666; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;"><span class="fa fa-info-circle" style="margin-right: 6px;"></span><strong>Note:</strong> If checkboxes are greyed out, they cannot be changed because the permissions are inherited from the parent folder. To modify inherited permissions, go to <strong>Advanced</strong> and uncheck include inheritable permissions.</div>')
    $('#perm_entry_change_user').after(perm_entry_explanation_box)
}

$('#perm_entry_change_user').click(function(){
    open_user_select('perm_entry_username') 
})


perm_entry_user_observer = new MutationObserver(function(mutationsList, observer){
    for(let mutation of mutationsList) {
        if(mutation.type === 'attributes') {
            if(mutation.attributeName === 'selected_user') {

                let filepath = $('#advdialog').attr('filepath') // TODO: maybe set and use own filepath in this dialog.
                let file_obj = path_to_file[filepath]
                
                // get rid of previous checkboxes:
                $('.perm_entry_checkcell').empty()
                // by default, put unchecked checkboxes everywhere:
                $('.perm_entry_checkcell').each(function(i){
                    let cell_id = $(this).attr('id')
                    let checkbox = $(`<input type="checkbox" id="${cell_id}_checkbox" class="perm_entry_checkbox"></input>`)
                    $(this).append(checkbox)
                })

                let all_perms = get_total_permissions(file_obj,$('#perm_entry_username').attr('selected_user'))
                for(let ace_type in all_perms) {
                    for(let p in all_perms[ace_type]) {
                        let checkbox = $(document.getElementById(`perm_entry_row_${p}_${ace_type}_checkbox`))
                        checkbox.prop('checked', true)
                        if(all_perms[ace_type][p].inherited) {
                            // can't uncheck inherited permissions.
                            checkbox.prop('disabled', true)
                        }
                    }
                }

                $('.perm_entry_checkbox').change(function(){
                    let username =  $('#perm_entry_username').attr('selected_user')
                    let filepath =  $(`#advdialog`).attr('filepath')
                    toggle_permission(filepath, username, $(this).parent().attr('perm'), $(this).parent().attr('type'), $(this).prop('checked'))
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

