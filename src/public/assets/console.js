
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
    var val = $('#command').val();
    if ($.trim(val) === '') {
        return false;
    }
    if (!$('#browser-list b')[0]) {
        alert('[warn] no client connected!');
        return false;
    }
    
    TaskManager.add(val);
    $('#command').val('');
    return false;
});
