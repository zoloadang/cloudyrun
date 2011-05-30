
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
            '{{#clientStatus}}' +
            '{{#loading}}' +
            '<p class="browser browser-{{_status}}" title="{{message}}">{{browser}}<b>running</b></p>' +
            '{{/loading}}' +
            '{{#loaded}}' +
            '<p class="browser browser-{{_status}}" title="{{message}}">{{browser}}<b>{{_result}}</b></p>' +
            '{{/loaded}}' +
            '{{/clientStatus}}'
};

module.exports = runTest;
