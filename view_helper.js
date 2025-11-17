// ---- these are helper functions that let you more easily create useful elements. ----
// ---- Most functions have a required "id_prefix" parameter: you need to specify unique ids that will be used in the HTML, 
// ---- so that we can tell from the logs what was actually clicked on.


// --- helper functions for connecting things with events ---

// define an observer which will call the passed on_attr_change function when the watched_attribute of watched_elem_selector 
// (more precisely, the first element that matches watched_elem_selector; will not work as intended if the selector selects more than one thing.)
function define_attribute_observer(watched_elem_selector, watched_attribute, on_attr_change = function(new_value){}){
    // set up the observer:
    let attribute_observer = new MutationObserver(function(mutationsList, observer){
        for(let mutation of mutationsList) {
            if(mutation.type === 'attributes') {
                if(mutation.attributeName === watched_attribute) {
                    // call the function for processing of the attribute change:
                    on_attr_change(watched_elem_selector.attr(watched_attribute))
                }
            }
        }
    })
    let watched_element = watched_elem_selector.get(0) // get the DOM element associated with the selector
    attribute_observer.observe(watched_element, {attributes: true})

}


// --- Helper functions to create transient elements and data structures.
// --- These elements will be created and destroyed as needed (often when the data being displayed changes).

// Make an element for a user - this element would usually go into a selectable list of users or checkbox list. 
// The element automatically creates an icon which varies based on whether it's a singular user or a group, 
// and also adds any attributes you pass along
function make_user_elem(id_prefix, uname, user_attributes=null) {
    // Add a special class to the "students" group so its icon and label can be styled consistently
    // But don't apply styling for let_ta_modify or lost_inheritance scenarios (revert to original black unbolded format)
    let current_scenario = $('#scenario_context').data('tag');
    let group_students_class = (uname === 'students' && current_scenario !== 'let_ta_modify' && current_scenario !== 'lost_inheritance') ? 'group-students-label' : '';

    user_elem = $(`<div class="ui-widget-content" id="${id_prefix}_${uname}" name="${uname}">
        <span id="${id_prefix}_${uname}_icon" class="oi ${is_user(all_users[uname])?'oi-person':'oi-people'} ${group_students_class}"></span> 
        <span id="${id_prefix}_${uname}_text" class="${group_students_class}">${uname}</span>
    </div>`)

    // Scenario-specific badge: indicate that teaching_assistant is a member of the "students" group
    if (uname === 'teaching_assistant') {
        user_elem.append(`<span class="user-membership-badge">member of: "students"</span>`)
    }

    if (user_attributes) {
        // if we need to add the user's attributes: go through the properties for that user and add each as an attribute to user_elem.
        for(uprop in user_attributes) {
            user_elem.attr(uprop, user_attributes[uprop])
        }
    }

    return user_elem
}


// make a list of users, suitable for inserting into a select list, given a map of user name to some arbitrary info.
// optionally, adds all the properties listed for a given user as attributes for that user's element.
function make_user_list(id_prefix, usermap, add_attributes = false) {
    let u_elements = []
    for(uname in usermap){
        // make user element; if add_attributes is true, pass along usermap[uname] for attribute creation.
        user_elem = make_user_elem(id_prefix, uname, add_attributes ? usermap[uname] : null )
        u_elements.push(user_elem)
    }
    return u_elements
}


// --- helper functions to define various semi-permanent elements.
// --- Only call these once for each new dialog/selection/item etc. you are defining! (NOT each time you want to open/close/hide a dialog)


// Define a new type of dialog. 
//
// This is essentially a wrapper for a jquery-ui dialog (https://jqueryui.com/dialog/) with some defaults.
// So you can pass in any options available for the dialog widget, and then use the returned value as you would a dialog.
//
// Store the return value in a variable, say new_dialog; then open/close the dialog as needed using:
// new_dialog.dialog('open')
// new_dialog.dialog('close')
//
// - id_orefux is any unique id prefix, as usual
// - title is a string which will go in the title area of the dialog box
// - options is a set of jquery-ui options
// - returns the dialog jquery object
function define_new_dialog(id_prefix, title='', options = {}){
    let default_options = {
        appendTo: "#html-loc",
        autoOpen: false,
        modal: true,
        position: { my: "top", at: "top", of: $('#html-loc') },
    }
    
    // add default options - do not override ones that are already specified.
    for(let d_o in default_options){
        if(!(d_o in options)){
            options[d_o] = default_options[d_o];
        } 
    }

    let dialog = $(`<div id="${id_prefix}" title="${title}"></div>`).dialog(options)

    return dialog
}

// Define a generic list which allows you to select one of the items, and propagates that item's 'name' attribute to its own 'selected_item' attribute.
// Note: each selectable item in the list is expted to have a 'name' attribute.
// creates and returns a custom jquery-ui selectable (https://jqueryui.com/selectable/).
// Optionally, provide a custom callback function for what to update when a new selection is made. 
// This callback function will be called with 3 arguments: 
//    the string from the 'name' attribute of the selected item (probably the only thing you need);
//    the selection event;
//    and the actual HTML element of the selected item
function define_single_select_list(id_prefix, on_selection_change = function(selected_item_name, e, ui){}) {
    let select_list = $(`<div id="${id_prefix}" style="overflow-y:scroll"></div>`).selectable({
        selected: function(e, ui) { 

            // Unselect any previously selected (normally, selectable allows multiple selections)
            $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");
            
            // store info about what item was selected:
            selected_item_name = $(ui.selected).attr('name')
            $( this ).attr('selected_item', selected_item_name)

            on_selection_change(selected_item_name, e, ui)

            emitter.dispatchEvent(new CustomEvent('userEvent', { 
                detail: new ClickEntry(
                    ActionEnum.CLICK, 
                    (e.clientX + window.pageXOffset), 
                    (e.clientY + window.pageYOffset), 
                    `${$( this ).attr('id')} selected: ${selected_item_name}`,
                    new Date().getTime()) 
            }))
        }
    })

    select_list.unselect = function() {
        select_list.find('.ui-selectee').removeClass('ui-selected')
        on_selection_change('', null, null)
    }

    return select_list
}

 
// define an element which will display effective permissions for a given file and user
// It expects the file path to be stored in its *filepath* attribute, 
// and the user name to be stored in its *username* attribute 
// when either changes, the panel attempts to recalculate the effective permissions.
// - id_prefix is a (required) unique string which will be prepended to all the generated elements.
// - add_info_col is a boolean for whether you want a third column with "info" buttons (which do nothing by default)
// - returns the jquery object for the effective permissions panel, ready to be attached/appended anywhere you want it.
function define_new_effective_permissions(id_prefix, add_info_col = false, which_permissions = null){
    // Set up the table:
    let effective_container = $(`<div id="${id_prefix}" class="ui-widget-content" style="overflow-y:scroll"></div>`)
    
    // If no subset of permissions is passed in, use all of them.
    if(which_permissions === null) {
        which_permissions = Object.values(permissions)
    }
    // add a row for each permission:
    for(let p of which_permissions) {
        let p_id = p.replace(/[ \/]/g, '_') //get jquery-readable id
        let row = $(`
        <tr id="${id_prefix}_row_${p_id}" permission_name="${p}" permission_id="${p_id}">
            <td id="${id_prefix}_checkcell_${p_id}" class="effectivecheckcell" width="16px"></td>
            <td id="${id_prefix}_name_${p_id}" class="effective_perm_name">${p}</td>
        </tr>
        `)
        // If we want to add an additional info column (which does nothing by default)
        if(add_info_col) {
            row.append(`
            <td id="${id_prefix}_${p_id}_info_cell" width="32px" style="text-align:right">
                <span id="${id_prefix}_${p_id}_info_icon" class="fa fa-info-circle perm_info" permission_name="${p}" setting_container_id="${id_prefix}"/>
            </td>`)
        }
        effective_container.append(row)
    }

    // Define how to update contents on attribute change:
    let update_effective_contents = function(){
        // get current settings:
        let username = effective_container.attr('username')
        let filepath = effective_container.attr('filepath')
        // if both properties are set correctly:
        if( username && username.length > 0 && (username in all_users) &&
            filepath && filepath.length > 0 && (filepath in path_to_file)) {
            //clear out the checkboxes:
            effective_container.find(`.effectivecheckcell`).empty()

            // Set checkboxes correctly for given file and user:
            for(let p of which_permissions) {
                let p_id = p.replace(/[ \/]/g, '_') //get jquery-readable id
                // if the actual model would allow an action with permission
                if( allow_user_action(path_to_file[filepath], all_users[username], p)) {
                    // This action is allowed. Find the checkbox cell and put a checkbox there.
                    let this_checkcell = effective_container.find(`#${id_prefix}_checkcell_${p_id}`)
                    this_checkcell.append(`<span id="${id_prefix}_checkbox_${p_id}" class="oi oi-check"/>`)
                }
            }
        }
    }

    // call update_effective_contents when either username or filepath changes:
    define_attribute_observer(effective_container, 'username', update_effective_contents)
    define_attribute_observer(effective_container, 'filepath', update_effective_contents)
    
    return effective_container
}


// define an element which will display *grouped* permissions for a given file and user, and allow for changing them by checking/unchecking the checkboxes.
function define_grouped_permission_checkboxes(id_prefix, which_groups = null) {
    // Set up table and header:
    let group_table = $(`
    <table id="${id_prefix}" class="ui-widget-content grouped_permissions" width="100%" style="border-collapse: separate; border-spacing: 0;">
        <tr id="${id_prefix}_header">
            <th id="${id_prefix}_header_p" width="70%">Permissions for <span id="${id_prefix}_header_username"></span>
            </th>
            <th id="${id_prefix}_header_permission" width="30%">Permission</th>
        </tr>
        <tr id="${id_prefix}_warning_row_teaching_assistant" style="display:none;">
            <td colspan="3" class="perm-warning-text">
                ⚠️ WARNING: if permissions are denied for the "students" group, they will also be denied for the group member "teaching_assistant."
            </td>
        </tr>
        <tr id="${id_prefix}_warning_row_students" style="display:none;">
            <td colspan="3" class="perm-warning-text">
                ⚠️ WARNING: denying permissions for "students" will override and deny for "teaching_assistant"
            </td>
        </tr>
    </table>
    `)

    if(which_groups === null) {
        which_groups = perm_groupnames
    }
    // Short, user-friendly descriptions for each permission group (shown in info tooltips)
    const group_descriptions = {
        Read: 'Read files and see folder contents.',
        Write: 'Create and edit files and folders.',
        Read_Execute: 'Read and open/run files.',
        Modify: 'Edit and delete files and folders.',
        Full_control: 'Complete access: includes all permissions plus changing permissions and taking ownership.',
        Special_permissions: 'Advanced permissions used in rare cases.'
    };

    // For each permissions group, create a row:
    for(let i = 0; i < which_groups.length; i++){
        let g = which_groups[i];
        // Use a friendlier display name for some groups (without changing the underlying group key)
        let display_name = g;
        if (g === 'Full_control') {
            display_name = '<strong>Complete Access</strong>';
        }

        // Description used for the inline info icon tooltip
        let description = group_descriptions[g] || '';

        let row = $(`<tr id="${id_prefix}_row_${g}">
            <td id="${id_prefix}_${g}_name">
                ${display_name}
                <span class="fa fa-info-circle perm_group_info" data-group="${g}" data-description="${description.replace(/"/g, '&quot;')}" style="cursor: pointer; margin-left: 6px; color: #888;" title="Click for more information"></span>
            </td>
        </tr>`)
        group_table.append(row)
        
        // Add solid line separator after Full_control with equal spacing above and below
        if(g === 'Full_control' && i < which_groups.length - 1) {
            let separator_row = $(`<tr id="${id_prefix}_separator_after_full_control" class="perm_group_separator">
                <td colspan="3" style="border-top: 2px solid #ccc; padding: 2px 0 1px 0;"></td>
            </tr>`)
            group_table.append(separator_row)
        }
    }  


    group_table.find('.perm_toggle_checkbox').prop('disabled', true)// disable all toggles to start

    // Update toggles when either user or file changes:
    let update_group_checkboxes = function(){

        // get current settings:
        let username = group_table.attr('username')
        let filepath = group_table.attr('filepath')
        // if both properties are set correctly:
        if( username && username.length > 0 && (username in all_users) &&
            filepath && filepath.length > 0 && (filepath in path_to_file)) {
                    
            // clear previous toggle state:
            group_table.find('.perm_toggle_checkbox').prop('disabled', false)
            group_table.find('.perm_toggle_checkbox').prop('checked', false) // Default to Deny (unchecked)
            group_table.find('.perm_toggle_checkbox[group="Special_Permissions"]').prop('disabled', true) // special_permissions is always disabled

            // change name on table:
            $(`#${id_prefix}_header_username`).text(username)

            // get new grouped permissions:
            let grouped_perms = get_grouped_permissions(path_to_file[filepath], username)

            for( ace_type in grouped_perms) { // 'allow' and 'deny'
                for(allowed_group in grouped_perms[ace_type]) {
                    let checkbox = group_table.find(`#${id_prefix}_${allowed_group}_${ace_type}_checkbox`)
                    
                    // Special case: if Write should appear unchecked (because Modify is checked),
                    // don't check the Write checkbox even though permissions exist
                    if (allowed_group === 'Write') {
                        let file_obj = path_to_file[filepath];
                        if (file_obj._write_unchecked_flags && 
                            file_obj._write_unchecked_flags[username] && 
                            file_obj._write_unchecked_flags[username][ace_type]) {
                            checkbox.prop('checked', false);
                            if(grouped_perms[ace_type][allowed_group].inherited) {
                                checkbox.prop('disabled', true)
                            }
                            continue; // Skip setting this checkbox to checked
                        }
                    }
                    
                    checkbox.prop('checked', true)
                    if(grouped_perms[ace_type][allowed_group].inherited) {
                        // can't uncheck inherited permissions.
                        checkbox.prop('disabled', true)
                    }
                } else if (has_deny) {
                    // Deny = unchecked (left side, default)
                    toggle_checkbox.prop('checked', false)
                    if (grouped_perms.deny[g].inherited) {
                        toggle_checkbox.prop('disabled', true)
                    }
                } else {
                    // No explicit permissions - check parent if using inheritance
                    if (file_obj.using_permission_inheritance && file_obj.parent !== null) {
                        let parent_grouped_perms = get_grouped_permissions(file_obj.parent, username)
                        let parent_has_allow = parent_grouped_perms.allow[g] && parent_grouped_perms.allow[g].set
                        let parent_has_deny = parent_grouped_perms.deny[g] && parent_grouped_perms.deny[g].set
                        
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
                }
            }
            
            // Check if there are any disabled toggles (inherited permissions) and show help
            let has_disabled_toggles = false
            group_table.find('.perm_toggle_checkbox').each(function() {
                let checkbox = $(this)
                let row_id = checkbox.closest('tr').attr('id')
                // Check if disabled and not Special_Permissions
                if (checkbox.prop('disabled') && row_id !== `${id_prefix}_row_Special_Permissions`) {
                    has_disabled_toggles = true
                    return false // break out of each loop
                }
            } 

            // After checkboxes reflect current permissions, show or hide the scenario-specific warning for let_ta_modify:
            let warning_row_ta = group_table.find(`#${id_prefix}_warning_row_teaching_assistant`)
            let warning_row_students = group_table.find(`#${id_prefix}_warning_row_students`)
            
            if (filepath === '/C/Lecture_Notes/Lecture4.txt') {
                if (username === 'teaching_assistant') {
                    warning_row_ta.show()
                    warning_row_students.hide()
                } else if (username === 'students') {
                    warning_row_ta.hide()
                    warning_row_students.show()
                } else {
                    warning_row_ta.hide()
                    warning_row_students.hide()
                }
            } else {
                warning_row_ta.hide()
                warning_row_students.hide()
            }
        }
        else {
            // can't get permissions for this username/filepath - reset everything into a blank state
            group_table.find('.perm_toggle_checkbox').prop('disabled', true)
            group_table.find('.perm_toggle_checkbox').prop('checked', false) // Default to Deny
            $(`#${id_prefix}_header_username`).text('')
            // Remove highlight when no user is selected
            $('#perm_remove_user').removeClass('highlight')
        }

    }
    
    // Function to check if all permissions (editable and inherited) are Deny and highlight remove button
    function check_and_highlight_remove_button(group_table, grouped_perms, which_groups) {
        let all_toggles = group_table.find('.perm_toggle_checkbox').not('[group="Special_Permissions"]')
        let enabled_toggles = all_toggles.filter(':not(:disabled)')
        
        if (enabled_toggles.length === 0) {
            // No enabled toggles, don't highlight
            $('#perm_remove_user').removeClass('highlight')
            return
        }
        
        // Check if all enabled toggles are in Deny position (unchecked)
        let all_editable_deny = true
        enabled_toggles.each(function() {
            if ($(this).prop('checked')) {
                all_editable_deny = false
                return false // break the loop
            }
        })
        
        // Also check that there are no inherited Allow permissions
        // Check both the grouped_perms data and disabled toggles that might be checked (Allow)
        let has_inherited_allow = false
        
        // Check disabled toggles that are checked (these represent inherited Allow)
        let disabled_toggles = all_toggles.filter(':disabled')
        disabled_toggles.each(function() {
            if ($(this).prop('checked')) {
                has_inherited_allow = true
                return false // break the loop
            }
        })
        
        // Also check grouped_perms for inherited Allow (as a backup check)
        if (!has_inherited_allow && grouped_perms && which_groups) {
            for(let g of which_groups) {
                if (g === 'Special_Permissions') continue
                // Check if there's an inherited Allow permission
                if (grouped_perms.allow[g] && grouped_perms.allow[g].set && grouped_perms.allow[g].inherited) {
                    has_inherited_allow = true
                    break
                }
            }
        }
        
        // Only highlight if all editable toggles are Deny AND there are no inherited Allow permissions
        if (all_editable_deny && !has_inherited_allow) {
            $('#perm_remove_user').addClass('highlight')
        } else {
            $('#perm_remove_user').removeClass('highlight')
        }
    }
    
    define_attribute_observer(group_table, 'username', update_group_checkboxes)
    define_attribute_observer(group_table, 'filepath', update_group_checkboxes)

    //Update permissions when checkbox is clicked:
    let checkboxChangeHandler = function(){
        let group = $(this).attr('group');
        let ptype = $(this).attr('ptype');
        let is_checked = $(this).prop('checked');
        let filepath = group_table.attr('filepath');
        let username = group_table.attr('username');
        
        // Special handling for Write/Modify relationship:
        // - Modify controls Write: when Modify is checked/unchecked, also check/uncheck Write
        // - Write does NOT control Modify: Write can be checked/unchecked independently
        // - If unchecking Write while Modify is checked, store a flag so Write appears unchecked
        //   but permissions remain (since Modify needs them)
        
        if (group === 'Modify') {
            // Modify controls Write - sync Write checkbox and permissions
            let write_checkbox = group_table.find(`#${id_prefix}_Write_${ptype}_checkbox`);
            let file_obj = path_to_file[filepath];
            
            if (is_checked) {
                // When checking Modify, also check Write
                if (!write_checkbox.prop('checked')) {
                    write_checkbox.off('change', checkboxChangeHandler);
                    write_checkbox.prop('checked', true);
                    toggle_permission_group(filepath, username, 'Write', ptype, true);
                    write_checkbox.on('change', checkboxChangeHandler);
                }
                // Clear any unchecked flag since we're checking both
                if (file_obj._write_unchecked_flags && file_obj._write_unchecked_flags[username]) {
                    delete file_obj._write_unchecked_flags[username][ptype];
                }
            } else {
                // When unchecking Modify, also uncheck Write
                if (write_checkbox.prop('checked')) {
                    write_checkbox.off('change', checkboxChangeHandler);
                    write_checkbox.prop('checked', false);
                    toggle_permission_group(filepath, username, 'Write', ptype, false);
                    write_checkbox.on('change', checkboxChangeHandler);
                }
                // Clear any unchecked flag since we're removing permissions
                if (file_obj._write_unchecked_flags && file_obj._write_unchecked_flags[username]) {
                    delete file_obj._write_unchecked_flags[username][ptype];
                }
            }
        }
        
        if (group === 'Write' && !is_checked) {
            // Check if Modify is currently checked for the same type
            let modify_checkbox = group_table.find(`#${id_prefix}_Modify_${ptype}_checkbox`);
            if (modify_checkbox.prop('checked')) {
                // Modify is still checked, so we should NOT remove Write permissions
                // Store a flag that Write should appear unchecked even though permissions exist
                let file_obj = path_to_file[filepath];
                if (!file_obj._write_unchecked_flags) {
                    file_obj._write_unchecked_flags = {};
                }
                if (!file_obj._write_unchecked_flags[username]) {
                    file_obj._write_unchecked_flags[username] = {};
                }
                file_obj._write_unchecked_flags[username][ptype] = true;
                // Don't toggle the permissions, just update the UI
                update_group_checkboxes();
                return; // Don't proceed with the toggle
            } else {
                // Modify is not checked, so we can safely remove Write permissions
                // Clear any flag if it exists
                let file_obj = path_to_file[filepath];
                if (file_obj._write_unchecked_flags && file_obj._write_unchecked_flags[username]) {
                    delete file_obj._write_unchecked_flags[username][ptype];
                }
            }
        }
        
        if (group === 'Write' && is_checked) {
            // When checking Write, clear any unchecked flag
            let file_obj = path_to_file[filepath];
            if (file_obj._write_unchecked_flags && file_obj._write_unchecked_flags[username]) {
                delete file_obj._write_unchecked_flags[username][ptype];
            }
        }
        
        toggle_permission_group(filepath, username, group, ptype, is_checked);
        update_group_checkboxes()// reload checkboxes
    };
    
    group_table.find('.groupcheckbox').on('change', checkboxChangeHandler);

    return group_table
}

// define an element which will display *individual* permissions for a given file and user, and allow for changing them using toggle switches.
function define_permission_checkboxes(id_prefix, which_permissions = null){
    // Set up table and header:
    let perm_table = $(`
    <table id="${id_prefix}" class="ui-widget-content" width="100%">
        <tr id="${id_prefix}_header">
            <th id="${id_prefix}_header_p" width="70%">Permissions for <span id="${id_prefix}_header_username"></span>
            </th>
            <th id="${id_prefix}_header_permission" width="30%">Permission</th>
        </tr>
    </table>
    `)

    // If no subset of permissions is passed in, use all of them.
    if(which_permissions === null) {
        which_permissions = Object.values(permissions)
    }
    // For each type of permission, create a row:
    for(let p of which_permissions){
        let p_id = p.replace(/[ \/]/g, '_') 
        let row = $(`<tr id="${id_prefix}_row_${p_id}">
            <td id="${id_prefix}_${p_id}_name">${p}</td>
            <td id="${id_prefix}_${p_id}_permission_cell" style="text-align: center;">
                <div class="perm_toggle_container" style="display: inline-flex; align-items: center;">
                    <span class="perm_toggle_label" style="margin-right: 8px; font-size: 12px; color: #666;">Deny</span>
                    <label class="perm_toggle_switch" id="${id_prefix}_${p_id}_toggle_switch" permission="${p}">
                        <input type="checkbox" id="${id_prefix}_${p_id}_permission_toggle" class="perm_checkbox_toggle" permission="${p}">
                        <span class="perm_toggle_slider"></span>
                    </label>
                    <span class="perm_toggle_label" style="margin-left: 8px; font-size: 12px; color: #666;">Allow</span>
                </div>
            </td>
        </tr>`)
        perm_table.append(row)
    }

    perm_table.find('.perm_checkbox_toggle').prop('disabled', true)// disable all toggles to start

    let update_perm_table = function(){

        // get current settings:
        let username = perm_table.attr('username')
        let filepath = perm_table.attr('filepath')
        // if both properties are set correctly:
        if( username && username.length > 0 && (username in all_users) &&
            filepath && filepath.length > 0 && (filepath in path_to_file)) {
            
            // clear previous toggle state:
            perm_table.find('.perm_checkbox_toggle').prop('disabled', false)
            perm_table.find('.perm_checkbox_toggle').prop('checked', false) // Default to Deny

            //change name on table:
            $(`#${id_prefix}_header_username`).text(username)

            // Get permissions:
            let all_perms = get_total_permissions(path_to_file[filepath], username)
            
            // Check both allow and deny to determine toggle state
            for(let p of which_permissions) {
                let p_id = p.replace(/[ \/]/g, '_')
                let toggle_checkbox = perm_table.find(`#${id_prefix}_${p_id}_permission_toggle`)
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
                            let parent_perms = get_total_permissions(file_obj.parent, username)
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
        }
        else {
            // can't get permissions for this username/filepath - reset everything into a blank state
            perm_table.find('.perm_checkbox_toggle').prop('disabled', true)
            perm_table.find('.perm_checkbox_toggle').prop('checked', false) // Default to Deny
            $(`#${id_prefix}_header_username`).text('')
        }
    }

    define_attribute_observer(perm_table, 'username', update_perm_table)
    define_attribute_observer(perm_table, 'filepath', update_perm_table)

    //Update permissions when toggle is changed:
    perm_table.find('.perm_checkbox_toggle').change(function(){
        let permission = $(this).attr('permission')
        let is_checked = $(this).prop('checked') // checked = Allow, unchecked = Deny
        let username = perm_table.attr('username')
        let filepath = perm_table.attr('filepath')
        
        // Remove opposite type first, then add selected type
        let selected_type = is_checked ? 'allow' : 'deny'
        let opposite_type = is_checked ? 'deny' : 'allow'
        
        toggle_permission(filepath, username, permission, opposite_type, false)
        toggle_permission(filepath, username, permission, selected_type, true)
        
        update_perm_table()// reload toggles
    })

    return perm_table
}

// Define a list of permission groups for a given file, for all users
function define_file_permission_groups_list(id_prefix){

    let perm_list= $(`
        <table id="${id_prefix}" class="ui-widget-content" width="100%">
            <tr id="${id_prefix}_header">
                <th id="${id_prefix}_header_type">Type</th>
                <th id="${id_prefix}_header_name">Name</th>
                <th id="${id_prefix}_header_permission">Permission</th>
                <th id="${id_prefix}_header_inherited">Inherited From</th>
            </tr>
        </table>
    `)

    let update_perm_list = function(){
        $(`#${id_prefix} tr:gt(0)`).remove() // remove all old permission stuff - all but the first (title) row of the table.

        let filepath = perm_list.attr('filepath')
        console.log(filepath)

        if(filepath && filepath.length > 0 && (filepath in path_to_file)) {

            console.log('filepath')

            let file_obj = path_to_file[filepath]
            let users = get_file_users(file_obj)
            for(let u in users) {
                let grouped_perms = get_grouped_permissions(file_obj, u)
                for(let ace_type in grouped_perms) {
                    for(let perm in grouped_perms[ace_type]) {
                        perm_list.append(`<tr id="${id_prefix}_${file_obj.filename}__${u}_${ace_type}_${perm}">
                            <td id="${id_prefix}_${file_obj.filename}__${u}_${ace_type}_${perm}_type">${ace_type}</td>
                            <td id="${id_prefix}_${file_obj.filename}__${u}_${ace_type}_${perm}_name">${u}</td>
                            <td id="${id_prefix}_${file_obj.filename}__${u}_${ace_type}_${perm}_permission">${perm}</td>
                            <td id="${id_prefix}_${file_obj.filename}__${u}_${ace_type}_${perm}_type">${grouped_perms[ace_type][perm].inherited?"Parent Object":"(not inherited)"}</td>
                        </tr>`)
                    }
                }
            }
        }

    }

    define_attribute_observer(perm_list, 'filepath', update_perm_list)

    return perm_list
}


// -- a general-purpose User Select dialog which can be opened when we need to select a user. -- 

// Make a checkbox-based list for user selection (same style as main permissions panel)
all_users_container = $('<div id="user_select_list" style="overflow-y:scroll; border: 1px solid #ddd; border-radius: 4px; padding: 8px; height: 250px;"></div>')

// Make the dialog:
user_select_dialog = define_new_dialog('user_select_dialog2', 'Select User to Add', {
    buttons: {
        Cancel: {
            text: "Cancel",
            id: "user_select_cancel_button",
            click: function() {
                $( this ).dialog( "close" );
            },
        },
        OK: {
            text: "OK",
            id: "user_select_ok_button",
            click: function() {
                // When "OK" is clicked, get the checked user and populate the field
                let to_populate_id = $(this).attr('to_populate') // which field do we need to populate?
                let selected_checkbox = all_users_container.find('input[type="checkbox"]:checked')
                if (selected_checkbox.length > 0) {
                    let selected_user_elem = selected_checkbox.closest('.perm_user_checkbox_row')
                    let selected_value = selected_user_elem.attr('name') // get the username
                    $(`#${to_populate_id}`).attr('selected_user', selected_value) // populate the element with the id
                }
                $( this ).dialog( "close" );
            }
        }
    }
})

// Function to populate the user list with checkboxes
function populate_user_select_list() {
    all_users_container.empty()
    for(let uname in all_users) {
        let user_elem = make_user_elem('user_select', uname, null, true)
        all_users_container.append(user_elem)
        
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
                all_users_container.find('input[type="checkbox"]').not(this).prop('checked', false)
                // Visual feedback for selected user
                all_users_container.find('.perm_user_checkbox_row').removeClass('ui-selected')
                user_elem.addClass('ui-selected')
            } else {
                user_elem.removeClass('ui-selected')
            }
        })
    }
}

// add stuff to the dialog:
user_select_dialog.append($('<div style="margin-bottom: 10px; font-weight: bold;">Select a user:</div>'))
user_select_dialog.append(all_users_container)

// Call this function whenever you need a user select dialog; it will automatically populate the 'selected_user' attribute of the element with id to_populate_id
function open_user_select_dialog(to_populate_id) {
    // Reset selection and populate list
    all_users_container.find('input[type="checkbox"]').prop('checked', false)
    all_users_container.find('.perm_user_checkbox_row').removeClass('ui-selected')
    populate_user_select_list()
    
    user_select_dialog.attr('to_populate', to_populate_id)
    
    // Adjust width for lost_inheritance scenario
    let current_scenario = $('#scenario_context').data('tag');
    if (current_scenario === 'lost_inheritance') {
        user_select_dialog.dialog('option', 'width', 450);
    } else {
        user_select_dialog.dialog('option', 'width', 350);
    }
    
    user_select_dialog.dialog('open')
}

// define a new user-select field which opens up a user-select dialog and stores the result in its own selected_user attribute.
// The resulting jquery element contains a field and a button. The field's text also gets populated with the selected user.
// - id_prefix is the required id prefix that will be attached to all element ids.
// - select_button_text is the text that will go on the button
// - on_user_change is an additional function you can pass in, which will be called each time a user is selected.
function define_new_user_select_field(id_prefix, select_button_text, on_user_change = function(selected_user){}){
    // Make the element:
    let sel_section = $(`<div id="${id_prefix}_line" class="section">
            <span id="${id_prefix}_field" class="ui-widget-content" style="width: 80%;display: inline-block;">&nbsp</span>
            <button id="${id_prefix}_button" class="ui-button ui-widget ui-corner-all">${select_button_text}</button>
        </div>`)

    // Open user select on button click:
    sel_section.find(`#${id_prefix}_button`).click(function(){
        open_user_select_dialog(`${id_prefix}_field`)
    })

    // Set up an observer to watch the attribute change and change the field
    let field_selector = sel_section.find(`#${id_prefix}_field`)
    define_attribute_observer(field_selector, 'selected_user', function(new_username){
        field_selector.text(new_username)
        // call the function for additional processing of user change:
        on_user_change(new_username)
    })

    return sel_section
}

//---- misc. ----

// Get a (very simple) text representation of a permissions explanation
function get_explanation_text(explanation) {
    return `
    Action allowed?: ${explanation.is_allowed}; 
    Because of
    permission set for file: ${explanation.file_responsible?get_full_path(explanation.file_responsible):'N/A'}
    and for user: ${ explanation.ace_responsible ? get_user_name(explanation.ace_responsible.who) : 'N/A' }
    ${ explanation.text_explanation ? `(${explanation.text_explanation})`  : '' }
    `
}

//---- some universal HTML set-up so you don't have to do it in each wrapper.html ----
$('#filestructure').css({
    'display':'inline-block',
    'width':'49%',
    'vertical-align': 'top'
})
$('#filestructure').after('<div id="sidepanel" style="display:inline-block;width:49%"></div>')