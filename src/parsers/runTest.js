
var runTest = {
    index: 1,
    name: 'runTest',

    // :run <url>
    // :runTest <url>
    pattern: /:run(?:Test)?\s(.+)/,

    runTask: (function(data, Client) {
        Client.iframe(data.command, {
            'taskId': data.taskId
        });
    }).toString(),

    outputTemplate: '' +
            '<div class="task task-{{taskType}}" id="{{taskId}}">' +
            '<h3>{{taskType}}: {{command}}</h3>' +
            '<div class="task-bd">' +
            '{{#clientStatus}}' +
            // '<p class="js"><span>{{browser}}</span><b>{{message}}</b></p>' +
            '<p class="browser loading" title="{{message}}">{{browser}}<b>{{message}}</b></p>' +
            '{{/clientStatus}}' +
            '</div>' +
            '</div>'
};

module.exports = runTest;
