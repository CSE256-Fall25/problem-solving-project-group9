console.log('controller loaded');

//files = [test_folder, test_file, test_file2]
this_user = 'administrator'; // by default, we are acting as if the user of the system is the user 'administrator', who is automatically part of the 'admin' group.

// The canonical "correct" permission states to validate a solution against (for student solutions to their own interfaces)
// TODO: load from correct_scenario_summary?.. still depends on that getting updated properly.
correct_scenario_solutions = {
    remove_user_with_inheritance:
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:0;1:0:1;1:0:2;1:0:3;1:0:4;1:0:5;1:0:6;1:0:7;1:0:8;1:0:9;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:2:1;1:2:2;1:2:3;1:2:4;1:2:5;1:2:6;1:2:7;1:2:8;1:2:9;1:2:10;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;2:0:0;2:0:1;2:0:2;2:0:3;2:0:4;2:0:5;2:0:6;2:0:7;2:0:8;2:0:9;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:2:1;2:2:2;2:2:3;2:2:4;2:2:5;2:2:6;2:2:7;2:2:8;2:2:9;2:2:10;',
    lost_inheritance:
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:0;1:0:1;1:0:2;1:0:3;1:0:4;1:0:5;1:0:6;1:0:7;1:0:8;1:0:9;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;2:0:0;2:0:1;2:0:2;2:0:3;2:0:4;2:0:5;2:0:6;2:0:7;2:0:8;2:0:9;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:3:1;2:3:2;2:3:3;2:3:4;2:3:5;2:3:6;2:3:7;2:3:8;2:3:9;2:3:10;3:0:0;3:0:1;3:0:2;3:0:3;3:0:4;3:0:5;3:0:6;3:0:7;3:0:8;3:0:9;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:3:1;3:3:2;3:3:3;3:3:4;3:3:5;3:3:6;3:3:7;3:3:8;3:3:9;3:3:10;4:0:0;4:0:1;4:0:2;4:0:3;4:0:4;4:0:5;4:0:6;4:0:7;4:0:8;4:0:9;4:0:10;4:0:11;4:0:12;4:1:1;4:1:2;4:1:3;4:1:4;4:1:5;4:1:6;4:1:7;4:1:8;4:1:9;4:1:10;4:1:11;4:1:12;4:3:1;4:3:2;4:3:3;4:3:4;4:3:5;4:3:6;4:3:7;4:3:8;4:3:9;4:3:10;5:0:0;5:0:1;5:0:2;5:0:3;5:0:4;5:0:5;5:0:6;5:0:7;5:0:8;5:0:9;5:0:10;5:0:11;5:0:12;5:1:1;5:1:2;5:1:3;5:1:4;5:1:5;5:1:6;5:1:7;5:1:8;5:1:9;5:1:10;5:1:11;5:1:12;5:3:1;5:3:2;5:3:3;5:3:4;5:3:5;5:3:6;5:3:7;5:3:8;5:3:9;5:3:10;',
    intern_permissions:
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:0;1:0:1;1:0:2;1:0:3;1:0:4;1:0:5;1:0:6;1:0:7;1:0:8;1:0:9;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:2:1;1:2:2;1:2:3;1:2:4;1:2:5;1:2:6;1:2:7;1:2:8;1:2:9;1:2:10;1:3:1;1:3:2;1:3:3;1:3:10;2:0:0;2:0:1;2:0:2;2:0:3;2:0:4;2:0:5;2:0:6;2:0:7;2:0:8;2:0:9;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:2:1;2:2:2;2:2:3;2:2:4;2:2:5;2:2:6;2:2:7;2:2:8;2:2:9;2:2:10;2:3:1;2:3:2;2:3:3;2:3:10;3:0:0;3:0:1;3:0:2;3:0:3;3:0:4;3:0:5;3:0:6;3:0:7;3:0:8;3:0:9;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:2:1;3:2:2;3:2:3;3:2:4;3:2:5;3:2:6;3:2:7;3:2:8;3:2:9;3:2:10;3:3:1;3:3:2;3:3:3;3:3:10;4:0:0;4:0:1;4:0:2;4:0:3;4:0:4;4:0:5;4:0:6;4:0:7;4:0:8;4:0:9;4:0:10;4:0:11;4:0:12;4:1:1;4:1:2;4:1:3;4:1:4;4:1:5;4:1:6;4:1:7;4:1:8;4:1:9;4:1:10;4:1:11;4:1:12;4:2:1;4:2:2;4:2:3;4:2:4;4:2:5;4:2:6;4:2:7;4:2:8;4:2:9;4:2:10;4:2:11;4:2:12;4:3:1;4:3:2;4:3:3;4:3:4;4:3:5;4:3:6;4:3:7;4:3:10;5:0:0;5:0:1;5:0:2;5:0:3;5:0:4;5:0:5;5:0:6;5:0:7;5:0:8;5:0:9;5:0:10;5:0:11;5:0:12;5:1:1;5:1:2;5:1:3;5:1:4;5:1:5;5:1:6;5:1:7;5:1:8;5:1:9;5:1:10;5:1:11;5:1:12;5:2:1;5:2:2;5:2:3;5:2:4;5:2:5;5:2:6;5:2:7;5:2:8;5:2:9;5:2:10;5:2:11;5:2:12;5:3:1;5:3:2;5:3:3;5:3:4;5:3:5;5:3:6;5:3:7;5:3:10;6:0:0;6:0:1;6:0:2;6:0:3;6:0:4;6:0:5;6:0:6;6:0:7;6:0:8;6:0:9;6:0:10;6:0:11;6:0:12;6:1:1;6:1:2;6:1:3;6:1:4;6:1:5;6:1:6;6:1:7;6:1:8;6:1:9;6:1:10;6:1:11;6:1:12;6:2:1;6:2:2;6:2:3;6:2:4;6:2:5;6:2:6;6:2:7;6:2:8;6:2:9;6:2:10;6:2:11;6:2:12;6:3:1;6:3:2;6:3:3;6:3:4;6:3:5;6:3:6;6:3:7;6:3:10;',
    add_full_permissions:
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:0;1:0:1;1:0:2;1:0:3;1:0:4;1:0:5;1:0:6;1:0:7;1:0:8;1:0:9;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:2:1;1:2:2;1:2:3;1:2:4;1:2:5;1:2:6;1:2:7;1:2:8;1:2:9;1:2:10;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;1:4:0;1:4:1;1:4:2;1:4:3;1:4:4;1:4:5;1:4:6;1:4:7;1:4:8;1:4:9;1:4:10;1:4:11;1:4:12;2:0:0;2:0:1;2:0:2;2:0:3;2:0:4;2:0:5;2:0:6;2:0:7;2:0:8;2:0:9;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:2:1;2:2:2;2:2:3;2:2:4;2:2:5;2:2:6;2:2:7;2:2:8;2:2:9;2:2:10;2:3:1;2:3:2;2:3:3;2:3:4;2:3:5;2:3:6;2:3:7;2:3:8;2:3:9;2:3:10;2:4:0;2:4:1;2:4:2;2:4:3;2:4:4;2:4:5;2:4:6;2:4:7;2:4:8;2:4:9;2:4:10;2:4:11;2:4:12;3:0:0;3:0:1;3:0:2;3:0:3;3:0:4;3:0:5;3:0:6;3:0:7;3:0:8;3:0:9;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:2:1;3:2:2;3:2:3;3:2:4;3:2:5;3:2:6;3:2:7;3:2:8;3:2:9;3:2:10;3:3:1;3:3:2;3:3:3;3:3:4;3:3:5;3:3:6;3:3:7;3:3:8;3:3:9;3:3:10;3:4:0;3:4:1;3:4:2;3:4:3;3:4:4;3:4:5;3:4:6;3:4:7;3:4:8;3:4:9;3:4:10;3:4:11;3:4:12;',
    let_ta_modify:
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:0;1:0:1;1:0:2;1:0:3;1:0:4;1:0:5;1:0:6;1:0:7;1:0:8;1:0:9;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;2:0:0;2:0:1;2:0:2;2:0:3;2:0:4;2:0:5;2:0:6;2:0:7;2:0:8;2:0:9;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:3:1;2:3:2;2:3:3;2:3:4;2:3:5;2:3:6;2:3:7;2:3:8;2:3:9;2:3:10;3:0:0;3:0:1;3:0:2;3:0:3;3:0:4;3:0:5;3:0:6;3:0:7;3:0:8;3:0:9;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:3:1;3:3:2;3:3:3;3:3:4;3:3:5;3:3:6;3:3:7;3:3:8;3:3:9;3:3:10;4:0:0;4:0:1;4:0:2;4:0:3;4:0:4;4:0:5;4:0:6;4:0:7;4:0:8;4:0:9;4:0:10;4:0:11;4:0:12;4:1:1;4:1:2;4:1:3;4:1:4;4:1:5;4:1:6;4:1:7;4:1:8;4:1:9;4:1:10;4:1:11;4:1:12;4:3:1;4:3:2;4:3:3;4:3:4;4:3:5;4:3:6;4:3:7;4:3:8;4:3:9;4:3:10;5:0:0;5:0:1;5:0:2;5:0:3;5:0:4;5:0:5;5:0:6;5:0:7;5:0:8;5:0:9;5:0:10;5:0:11;5:0:12;5:1:1;5:1:2;5:1:3;5:1:4;5:1:5;5:1:6;5:1:7;5:1:8;5:1:9;5:1:10;5:1:11;5:1:12;5:3:1;5:3:2;5:3:3;5:3:4;5:3:5;5:3:6;5:3:7;5:3:8;5:3:9;5:3:10;',
    restrict_group_member:
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;1:4:1;1:4:2;1:4:3;1:4:4;1:4:5;1:4:6;1:4:7;1:4:8;1:4:9;1:4:10;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:3:1;2:3:2;2:3:3;2:3:4;2:3:5;2:3:6;2:3:7;2:3:8;2:3:9;2:3:10;2:4:1;2:4:2;2:4:3;2:4:10;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:3:1;3:3:2;3:3:3;3:3:4;3:3:5;3:3:6;3:3:7;3:3:8;3:3:9;3:3:10;3:4:1;3:4:2;3:4:3;3:4:4;3:4:5;3:4:6;3:4:7;3:4:8;3:4:9;3:4:10;',
    add_new_user:
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:0;1:0:1;1:0:2;1:0:3;1:0:4;1:0:5;1:0:6;1:0:7;1:0:8;1:0:9;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:2:1;1:2:2;1:2:3;1:2:4;1:2:5;1:2:6;1:2:7;1:2:8;1:2:9;1:2:10;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;1:4:1;1:4:2;1:4:3;1:4:4;1:4:5;1:4:6;1:4:7;1:4:8;1:4:9;1:4:10;2:0:0;2:0:1;2:0:2;2:0:3;2:0:4;2:0:5;2:0:6;2:0:7;2:0:8;2:0:9;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:2:1;2:2:2;2:2:3;2:2:4;2:2:5;2:2:6;2:2:7;2:2:8;2:2:9;2:2:10;2:3:1;2:3:2;2:3:3;2:3:4;2:3:5;2:3:6;2:3:7;2:3:8;2:3:9;2:3:10;2:4:1;2:4:2;2:4:3;2:4:4;2:4:5;2:4:6;2:4:7;2:4:8;2:4:9;2:4:10;3:0:0;3:0:1;3:0:2;3:0:3;3:0:4;3:0:5;3:0:6;3:0:7;3:0:8;3:0:9;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:2:1;3:2:2;3:2:3;3:2:4;3:2:5;3:2:6;3:2:7;3:2:8;3:2:9;3:2:10;3:3:1;3:3:2;3:3:3;3:3:4;3:3:5;3:3:6;3:3:7;3:3:8;3:3:9;3:3:10;3:4:1;3:4:2;3:4:3;3:4:4;3:4:5;3:4:6;3:4:7;3:4:8;3:4:9;3:4:10;',
    remove_inherited_permission:
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:0;1:0:1;1:0:2;1:0:3;1:0:4;1:0:5;1:0:6;1:0:7;1:0:8;1:0:9;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:2:1;1:2:2;1:2:3;1:2:4;1:2:5;1:2:6;1:2:7;1:2:8;1:2:9;1:2:10;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;2:0:0;2:0:1;2:0:2;2:0:3;2:0:4;2:0:5;2:0:6;2:0:7;2:0:8;2:0:9;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:2:1;2:2:2;2:2:3;2:2:4;2:2:5;2:2:6;2:2:7;2:2:8;2:2:9;2:2:10;2:3:1;2:3:2;2:3:3;2:3:10;3:0:0;3:0:1;3:0:2;3:0:3;3:0:4;3:0:5;3:0:6;3:0:7;3:0:8;3:0:9;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:2:1;3:2:2;3:2:3;3:2:4;3:2:5;3:2:6;3:2:7;3:2:8;3:2:9;3:2:10;3:3:1;3:3:2;3:3:3;3:3:4;3:3:5;3:3:6;3:3:7;3:3:8;3:3:9;3:3:10;',
    remove_direct_permission:
        // '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:2:1;1:2:2;1:2:3;1:2:4;1:2:5;1:2:6;1:2:7;1:2:8;1:2:9;1:2:10;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:2:1;2:2:2;2:2:3;2:2:4;2:2:5;2:2:6;2:2:7;2:2:8;2:2:9;2:2:10;2:3:1;2:3:2;2:3:3;2:3:10;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:2:1;3:2:2;3:2:3;3:2:4;3:2:5;3:2:6;3:2:7;3:2:8;3:2:9;3:2:10;3:3:1;3:3:2;3:3:3;3:3:4;3:3:5;3:3:6;3:3:7;3:3:8;3:3:9;3:3:10;',
        '0:0:0;0:0:1;0:0:2;0:0:3;0:0:4;0:0:5;0:0:6;0:0:7;0:0:8;0:0:9;0:0:10;0:0:11;0:0:12;1:0:10;1:0:11;1:0:12;1:1:1;1:1:2;1:1:3;1:1:4;1:1:5;1:1:6;1:1:7;1:1:8;1:1:9;1:1:10;1:1:11;1:1:12;1:2:1;1:2:2;1:2:3;1:2:4;1:2:5;1:2:6;1:2:7;1:2:8;1:2:9;1:2:10;1:3:1;1:3:2;1:3:3;1:3:4;1:3:5;1:3:6;1:3:7;1:3:8;1:3:9;1:3:10;2:0:10;2:0:11;2:0:12;2:1:1;2:1:2;2:1:3;2:1:4;2:1:5;2:1:6;2:1:7;2:1:8;2:1:9;2:1:10;2:1:11;2:1:12;2:2:1;2:2:2;2:2:3;2:2:4;2:2:5;2:2:6;2:2:7;2:2:8;2:2:9;2:2:10;3:0:10;3:0:11;3:0:12;3:1:1;3:1:2;3:1:3;3:1:4;3:1:5;3:1:6;3:1:7;3:1:8;3:1:9;3:1:10;3:1:11;3:1:12;3:2:1;3:2:2;3:2:3;3:2:4;3:2:5;3:2:6;3:2:7;3:2:8;3:2:9;3:2:10;3:3:1;3:3:2;3:3:3;3:3:4;3:3:5;3:3:6;3:3:7;3:3:8;3:3:9;3:3:10;'
};

// defines how the 13 permission settings in the model fit into the 5 groups of permissions exposed in the "basic" interface.
permission_groups = {
    Read: [
        permissions.LIST,
        permissions.READ_ATTR,
        permissions.READ_EXTENDED_ATTR,
        permissions.READ_PERMS,
    ],
    Write: [
        permissions.WRITE_DATA,
        permissions.APPEND_DATA,
        permissions.WRITE_ATTR,
        permissions.WRITE_EXTENDED_ATTR,
    ],
    Read_Execute: [
        permissions.LIST,
        permissions.READ_ATTR,
        permissions.READ_EXTENDED_ATTR,
        permissions.READ_PERMS,
        permissions.EXECUTE,
    ],
    Modify: [
        permissions.WRITE_DATA,
        permissions.APPEND_DATA,
        permissions.WRITE_ATTR,
        permissions.WRITE_EXTENDED_ATTR,
        permissions.DELETE,
        permissions.DELETE_SUB,
    ],
    Full_control: [
        permissions.LIST,
        permissions.READ_ATTR,
        permissions.READ_EXTENDED_ATTR,
        permissions.READ_PERMS,
        permissions.EXECUTE,
        permissions.WRITE_DATA,
        permissions.APPEND_DATA,
        permissions.WRITE_ATTR,
        permissions.WRITE_EXTENDED_ATTR,
        permissions.DELETE,
        permissions.DELETE_SUB,
        permissions.READ_PERMS,
        permissions.CHANGE_PERMS,
        permissions.TAKE_OWNERSHIP,
    ],
};
perm_groupnames = Object.keys(permission_groups);
// Reorder to put Full_control first
perm_groupnames = ['Full_control', ...perm_groupnames.filter(g => g !== 'Full_control')];
perm_groupnames.push('Special_permissions');

// Extra permission groups (this way Read, Write, Delete, Other make up the whole set; and are disjoint)
// TODO/commit when??: WRITE_DATA should actually be in Write, also. [not in Other]

permission_groups['Delete'] = [permissions.DELETE, permissions.DELETE_SUB];
permission_groups['Other'] = [
    permissions.EXECUTE,
    permissions.CHANGE_PERMS,
    permissions.TAKE_OWNERSHIP,
];

// given a file object, generate the full path from root
function get_full_path(file_obj) {
    let path = '/' + file_obj.filename;
    if (file_obj.parent !== null) {
        path = get_full_path(file_obj.parent) + path;
    }
    return path;
}

path_to_file = {}; // map of file path to file object
parent_to_children = {}; // map of parent folder to its children (using file path to identify parent uniquely)
root_files = []; // files and folders at the root
all_users = {}; // map of user name to user object (string with same name OR group object)
username_to_id = {};
filepath_to_id = {};
id_to_filepath = {};
id_to_username = {};

// Generate mappings from filepath to (integer) file id and from username to (integer) user id.
function generate_file_user_ids() {
    let cur_file_id = 0;
    for (let f in path_to_file) {
        filepath_to_id[f] = cur_file_id;
        id_to_filepath[cur_file_id] = f;
        cur_file_id += 1;
    }

    let cur_user_id = 0;
    for (let u in all_users) {
        username_to_id[u] = cur_user_id;
        id_to_username[cur_user_id] = u;
        cur_user_id += 1;
    }
}

//store the file-to-id and user-to-id data in the appropriate attribute:
function log_file_user_ids() {
    $('#html-loc').attr(
        'data-tag',
        JSON.stringify(filepath_to_id) +
            JSON.stringify(username_to_id) +
            JSON.stringify(permission_ids)
    );
}

// recompute global data structures about the set of files which will be displayed
function recompute_file_structure(display_files) {
    // reset:
    path_to_file = {};
    parent_to_children = {};
    root_files = [];
    all_users = {};

    // recompute:
    for (let file of display_files) {
        path_to_file[get_full_path(file)] = file;
        if (file.parent !== null) {
            let parent_hash = get_full_path(file.parent);
            if (!(parent_hash in parent_to_children)) {
                // TODO: make path strings instead?.. enforce unique file names?..
                parent_to_children[parent_hash] = [];
            }
            parent_to_children[parent_hash].push(file);
        } else {
            //file.parent is null - this is at the root level
            root_files.push(file);
        }

        // Add user/group name to all_users
        // TODO: also add each member of a given group?..
        all_users[get_user_name(file.owner)] = file.owner;
        for (let ace of file.acl) {
            all_users[get_user_name(ace.who)] = ace.who;
        }
    }
    // TODO: also generate global list of users: name to user(string) or group(object)
    // add admin users, even if they aren't involved in any file permissions.
    for (let u of admin_group.users) {
        all_users[get_user_name(u)] = u;
    }

    generate_file_user_ids();
    log_file_user_ids();
}
recompute_file_structure(files);

// get the users with ACEs for a given file object.
// recursively follow inheritance if appropriate; following_inheritance flag indicates that this user has at least some inherited permissions.
// returns a map of username to metadata about this file/user pair:
//  - type: is this a user or a group?
//  - inherited: does this user have any inherited permissions for this file?
function get_file_users(file_obj, users = {}, following_inheritance = false) {
    // TODO: also follow inheritance links if appropriate?..

    for (let ace of file_obj.acl) {
        if (typeof ace.who === 'string') {
            // a string - assume this is a single user.
            users[ace.who] = {
                type: 'user',
                inherited: following_inheritance,
            };
        } else {
            // not a string - assume this is a group.
            users[ace.who.name] = {
                type: 'group',
                inherited: following_inheritance,
            };
        }
    }
    // add inherited users, if appropriate
    if (file_obj.using_permission_inheritance && file_obj.parent !== null) {
        // recurse; add to users map. inherited values will override non-inherited;
        // thus, if a user has at least some inheritance, they will be marked as "inherited" and the interface won't let you delete them from that particular file.
        get_file_users(file_obj.parent, users, true);
    }
    return users;
}

// Get the list of ACEs for the given file object and user name.
// recursively follow inheritance if appropriate; following_inheritance flag indicates that these are already inherited permissions.
function get_aces_file_user(file_obj, username, following_inheritance = false) {
    let aces = [];
    for (let ace of file_obj.acl) {
        if (get_user_name(ace.who) === username) {
            aces.push({
                ace: ace,
                inherited: following_inheritance,
            });
        }
    }
    // add inherited ACEs, if appropriate
    if (file_obj.using_permission_inheritance && file_obj.parent !== null) {
        return aces.concat(get_aces_file_user(file_obj.parent, username, true));
    } else {
        // just return direct ACEs
        return aces;
    }
}

// summarize total cumulative permissions from given file and user
// TODO: put in model?..
function get_total_permissions(file_obj, username) {
    let ace_list = get_aces_file_user(file_obj, username);
    let total_permissions = {
        allow: {},
        deny: {},
    };
    // TODO: override if inherited/if not inherited?
    for (let ace_item of ace_list) {
        if (ace_item.ace.is_allow_ace) {
            if (
                !total_permissions.allow[ace_item.ace.permission] ||
                ace_item.inherited
            )
                // if not already set, OR should override with inherited.
                total_permissions.allow[ace_item.ace.permission] = {
                    set: true,
                    inherited: ace_item.inherited,
                };
        } else {
            // this is a 'deny' ace
            if (
                !total_permissions.deny[ace_item.ace.permission] ||
                ace_item.inherited
            )
                // if not already set, OR should override with inherited.
                total_permissions.deny[ace_item.ace.permission] = {
                    set: true,
                    inherited: ace_item.inherited,
                };
        }
    }

    return total_permissions;
}

// Get grouped permission info (based on 'simplified' permission categories)
function get_grouped_permissions(file_obj, username) {
    let grouped_permissions = {
        allow: {},
        deny: {},
    };

    let total_permissions = get_total_permissions(file_obj, username);
    for (let ace_type in grouped_permissions) {
        // 'allow' and 'deny'
        for (let groupname in permission_groups) {
            // if any of the permission listed in that group are not listed in the total permissions, then we will not check the checkbox for that group.
            let should_check = true;
            let has_inherited = false;
            for (let perm of permission_groups[groupname]) {
                if (!total_permissions[ace_type][perm]) {
                    should_check = false;
                } else if (total_permissions[ace_type][perm].inherited) {
                    has_inherited = true;
                }
            }
            if (should_check) {
                grouped_permissions[ace_type][groupname] = {
                    set: true,
                    inherited: has_inherited,
                };
                // if we've checked the box, mark each permission in this group as "used" for some permission group - if there are any "unused" permissions, then we will check "special permissions"
                for (let perm of permission_groups[groupname]) {
                    total_permissions[ace_type][perm].used = true;
                }
            }
        }
    }

    // check whether we need "special permissions"
    for (let ace_type in total_permissions) {
        let need_special = false;
        let special_inherited = false;
        for (let perm in total_permissions[ace_type]) {
            if (!total_permissions[ace_type][perm].used) {
                need_special = true;
                if (total_permissions[ace_type][perm].inherited) {
                    special_inherited = true;
                }
            }
        }
        if (need_special) {
            grouped_permissions[ace_type].Special_permissions = {
                set: true,
                inherited: special_inherited,
            };
        }
    }

    return grouped_permissions;
}

function convert_parent_permissions(file_obj) {
    if (file_obj.using_permission_inheritance) {
        // Only do this if inheritance is actually on
        for (user of Object.values(all_users)) {
            // for each user
            let user_perms = get_total_permissions(file_obj, user);
            for (let ace_type in user_perms) {
                //for each of 'allow' and 'deny'
                for (let perm in user_perms[ace_type]) {
                    // for each permission
                    if (user_perms[ace_type][perm].inherited) {
                        // if it's inherited, add directly
                        file_obj.acl.push(
                            make_ace(user, perm, ace_type === 'allow')
                        );
                    }
                }
            }
        }
        file_obj.using_permission_inheritance = false;
        emitState();
    }
}

function replace_child_perm_with_inherited(file_obj) {
    let filepath = get_full_path(file_obj);
    for (c of parent_to_children[filepath]) {
        c.using_permission_inheritance = true;
        c.acl = [];
    }
    emitState();
}

//Add a group of permissions for given file path and user name
function toggle_permission_group(filepath, username, group, type, is_on) {
    // Sanity check - the file object and user exist.
    if (!(filepath in path_to_file) || !(username in all_users)) return false;

    let file_obj = path_to_file[filepath];
    let user = all_users[username];
    let permissions = permission_groups[group];
    let is_allow_ace = type === 'allow';

    if (is_on) {
        add_permissons(file_obj, user, permissions, is_allow_ace);
    } else {
        remove_permissions(file_obj, user, permissions, is_allow_ace);
    }
}

function toggle_permission(filepath, username, permission, type, is_on) {
    // Sanity check - the file object and user exist.
    if (!(filepath in path_to_file) || !(username in all_users)) return false;

    let file_obj = path_to_file[filepath];
    let user = all_users[username];
    let is_allow_ace = type === 'allow';

    if (is_on) {
        add_permissons(file_obj, user, [permission], is_allow_ace);
    } else {
        remove_permissions(file_obj, user, [permission], is_allow_ace);
    }
}

function validate_and_get_logs() {
    let scenario = $('#scenario_context').data('tag');
    let scenario_solution_state = new Set(
        correct_scenario_solutions[scenario].split(';')
    );
    let current_state = new Set(get_allowed_actions_string().split(';'));

    let missing_allowed = [];
    for (let correct_allowed of scenario_solution_state) {
        if (!current_state.has(correct_allowed)) {
            missing_allowed.push(correct_allowed);
        }
    }

    let should_not_be_allowed = [];
    for (let current_allowed of current_state) {
        if (!scenario_solution_state.has(current_allowed)) {
            should_not_be_allowed.push(current_allowed);
        }
    }

    console.log(missing_allowed, should_not_be_allowed);
    if (missing_allowed.length > 0 || should_not_be_allowed.length > 0) {
        console.error(
            'ERROR: Your current permissions state does not match the correct solution; In particular:'
        );
        if (should_not_be_allowed.length > 0) {
            console.warn(
                'The following permissions are currently allowed, but should be denied in a correct solution:'
            );
            for (let p of should_not_be_allowed) {
                let ids = p.split(':');
                let filepath = id_to_filepath[parseInt(ids[0])];
                let username = id_to_username[parseInt(ids[1])];
                let perm = id_to_permission[parseInt(ids[2])];
                console.log('\t', username, ': ', perm, filepath);
            }
        }
        if (missing_allowed.length > 0) {
            console.warn(
                'The following permissions are currently denied, but should be allowed in a correct solution:'
            );
            for (let p of missing_allowed) {
                let ids = p.split(':');
                let filepath = id_to_filepath[parseInt(ids[0])];
                let username = id_to_username[parseInt(ids[1])];
                let perm = id_to_permission[parseInt(ids[2])];
                console.log('\t', username, ': ', perm, filepath);
            }
        }

        console.error(
            'ERROR: Your current permissions state does not match the correct solution; see above for list of problems.'
        );
    } else {
        console.log(JSON.stringify(userData));
    }
}
