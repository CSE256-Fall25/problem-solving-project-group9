
// This describes a file permissions model which closely replicates the Windows one.


emitter = new EventTarget()

// -- pseudo-enum of permission types -- 
// see also "List of possible permission" table at  https://espace.cern.ch/winservices-help/NICESecurityAndAntivirus/NICESecurityHowTo/Pages/ManagingACLSettingPermssion.aspx 
permissions = {
  EXECUTE: 'traverse folder/execute file',
  LIST: 'list folder/read contents',
  READ_ATTR: 'read attributes',
  READ_EXTENDED_ATTR: 'read extended attributes',
  WRITE_DATA: 'create files/write data',
  APPEND_DATA: 'create folders/append data',
  WRITE_ATTR: 'write attributes',
  WRITE_EXTENDED_ATTR: 'write extended attributes',
  DELETE_SUB: 'delete subfolders and files',
  DELETE: 'delete',
  READ_PERMS: 'read permissions',
  CHANGE_PERMS: 'change permissions',
  TAKE_OWNERSHIP: 'take ownership',
}

permission_ids = {}
id_to_permission = {}
let cur_p_id = 0
for(p of Object.values(permissions)) {
  permission_ids[p] = cur_p_id
  id_to_permission[cur_p_id] = p
  cur_p_id += 1
}

// -- Helper functions to generate elements - these define the element structure. --

// make an Access Control Element (ACE)
function make_ace(who, permission, is_allow_ace) {
  return {
    who:who,
    permission: permission,
    is_allow_ace: is_allow_ace // boolean: if it's not an 'allow' ACE, it is a 'deny'.
  }
}

// make a file or folder
function make_file(filename, owner, parent=null, acl=[], using_permission_inheritance = false, is_folder = false) {
  return { 
    filename: filename, 
    owner: owner,
    acl: acl,
    parent: parent,
    using_permission_inheritance: using_permission_inheritance,
    is_folder: is_folder,
  }
}

// make a user group
function make_group(groupname, userlist=[]) {
  return {
    name:groupname,
    users: userlist
  }
}


// special admin group which always exists - users who are admins have special permissions logic.
admin_group = make_group('admin', ['administrator']);

// -- permissions logic -- 

// helper function to determine whether user matches the user or group represented by user_or_group
function ace_applies(user, ace) {
  if( typeof (ace.who) === 'string') {
    // a string - assume this is a single user
    return user === ace.who
  }
  else {
    // not a string - assume this is a group.
    return ace.who.users.includes(user)
  }
}

/*
Helper function: wraps return value for allow_user_action into an object along with explanatory metadata, if required.
*/
function make_allow_return_value(is_allowed, file, ace, explain_why, text_explanation = null) {
  if(explain_why)
    return {
      is_allowed: is_allowed,
      ace_responsible: ace,
      file_responsible: file,
      text_explanation: text_explanation
    }
  else
    return is_allowed
}

/*
returns whether the given user is allowed to do something, where the thing being allowed/denied depends on permission_to_check.
If explain_why is false, returns a boolean.
if explain_why is true, returns an object which contains information about why this decision was made. (see make_allow_return_value for the object structure)
*/
function allow_user_action(file, user, permission_to_check, explain_why = false){
  // first, check for "special" built-in permissions:
  // If user is owner or admin, they can always change permissons, read permissions, and take ownership of the file.
  if ( [permissions.CHANGE_PERMS, permissions.TAKE_OWNERSHIP, permissions.READ_PERMS].includes(permission_to_check)  && 
      (file.owner === user || admin_group.users.includes(user)) ) {
        return make_allow_return_value(true, file, null, explain_why,'This user is the file owner or an administrator') 
  }

  // fall through to normal permission check
  found_reason_to_allow = false;
  reason_to_allow = null;
  for(let ace of file.acl) {
    if ( ace.permission === permission_to_check && ace_applies(user, ace) ) {
        // found an ACE for this user, file, and action
        if( ace.is_allow_ace == false ) {
          // this is a Deny ACE - deny immediately
          return make_allow_return_value(false, file, ace, explain_why) 
        }
        else {
          // this is an Allow ACE - mark as "found a reason to allow" and continue checking
          found_reason_to_allow = true;
          reason_to_allow = ace
        }
    }
  }
  // finished going through ACL and did not deny the action - check for allow:
  if (found_reason_to_allow) {
    return make_allow_return_value(true, file, reason_to_allow, explain_why) 
  }

  // fallthrough - did not find a reason to either allow or deny
  if(file.using_permission_inheritance && file.parent !== null) {
    return allow_user_action(file.parent, user, permission_to_check, explain_why)
  }

  // fallthrough - did not find any explicit permission settings. deny permission.
  return make_allow_return_value(false, null, null, explain_why, 'No permissions found for this file and user') 
}

// -- helper functions --

// make an ACL Denying or Allowing all permissions in the given list to all the users in the given list.
function make_crossjoin_acl(user_list, permission_list, is_allow) {
  let acl = []
  for(let user of user_list) {
    for(let p of permission_list) {
      acl.push(make_ace(user, p, is_allow))
    }
  }
  return acl
}

// mace an ACL for a user which gives them ALL the permissions.
function make_full_access_acl(user) {
  return make_crossjoin_acl([user], Object.values(permissions), true)
}

// determine whether a given user object is a user or a group
function is_user(user_or_group) {
  return typeof(user_or_group) === 'string'
}

// Get name of user or group represented by the 'user' variable
function get_user_name(user) {
  if( typeof (user) === 'string') {
    // a string - assume this is a single user
    return user
  }
  else {
    // not a string - assume this is a group.
    return user.name
  }
}

function get_allowed_actions_string(){
  let allowedActions = ""
  for(f in path_to_file) {
    for(u in all_users) {
      for (p of Object.values(permissions)) {
        if(allow_user_action(path_to_file[f], all_users[u], p)){
          allowedActions += filepath_to_id[f]+':'+username_to_id[u]+':'+permission_ids[p]+';'
        }
      }
    }
  }
  return allowedActions
}

function emitState(purpose = "Permission state changed"){
  let allowedActions = get_allowed_actions_string()

  let data = new SpecialEventEntry(ActionEnum.SPECIAL_EVENT, new Date().getTime(), {
    purpose: purpose,
    newState: allowedActions
  })
  emitter.dispatchEvent(new CustomEvent('userEvent', { detail: data }));
}

// add each permission in "permissions" (all of is_allow type) for the given file and user
function add_permissons(file, user, permissions, is_allow) {
  for(p of permissions) {
    // Check if an ACE with the same user, permission, and allow/deny type already exists
    let exists = file.acl.some(ace => 
      ace.who === user && ace.permission === p && ace.is_allow_ace === is_allow
    )
    if (!exists) {
      file.acl.push(make_ace(user, p, is_allow))
    }
  }
  emitState()
}

function remove_permissions(file, user, permissions, is_allow) {
  file.acl = file.acl.filter(ace => {
    return !(ace.who === user && permissions.includes(ace.permission) && ace.is_allow_ace === is_allow)}
    )
  emitState()
}

// remove all permissions for given file and user
function remove_all_perms_for_user(file, user) {
  file.acl = file.acl.filter(ace => ace.who !==user)
  emitState()
}