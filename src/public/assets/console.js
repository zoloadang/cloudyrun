
if (typeof socket === 'undefined') {
    alert('[error] socket is undefined!');
}

var TaskManager = {

    /**
     * 添加任务
     */
    add: function(command, client) {
        socket.sendData({
            'messageType': 'addTask',
            'command': command,
            'client': client
        });
    }
};


$('#command').focus();
$('#frm').submit(function() {
    var val = $.trim($('#command').val());

    if (val === '') {
        return false;
    }

    if (!$('#browser-list b')[0]) {
        alert('[warn] no client connected!');
        return false;
    }

    if (val === ':clear') {
        $('#output div.task:not(.task-help)').remove();
        $('#command').val('');
        return false;
    }
    
    TaskManager.add(val);
    $('#command').val('');
    return false;
});
