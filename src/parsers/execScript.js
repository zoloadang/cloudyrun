
var execScript = {

    index: 9999,
    name: 'execScript',

    // :execScript <command>
    // <command>
    pattern: /(?::execScript\s)?(.+)/,

    runTask: (function(data, Client) {
        var result;
        try {
            result = Client.run(data.command);
        } catch(e) {
            result = '[script error] ' + e.message;
        }

        this.sendData({
            'messageType': 'updateTask',
            'result': result,
            'taskId': data.taskId
        });

    }).toString(),

    outputTemplate: '' +
            '{{#clientStatus}}' +
            '<p class="js"><span>{{browser}}</span><b>{{message}}</b></p>' +
            '{{/clientStatus}}'
};

module.exports = execScript;