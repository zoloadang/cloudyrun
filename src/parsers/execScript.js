
var execScript = {

    index: 9999,
    name: 'execScript',
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
            '<div class="task task-{{taskType}}" id="{{taskId}}">' +
            '<h3>{{taskType}}: {{command}}</h3>' +
            '<div class="task-bd">' +
            '{{#clientStatus}}' +
            '<p class="js"><span>{{browser}}</span><b>{{message}}</b></p>' +
            '{{/clientStatus}}' +
            '</div>' +
            '</div>'
};

module.exports = execScript;