
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
            '{{#if(message==)}}' +
            '<p class="browser browser-loading"><span title="{{browser}}">{{browser}}</span><b title="{{message}}">running</b></p>' +
            '{{/if(message==)}}' +
            '{{#if(message!=)}}' +
            '<p class="browser browser-{{_status}}"><span title="{{browser}}">{{browser}}</span><b title="{{message}}">{{_status}}</b></p>' +
            '{{/if(message!=)}}' +
            '{{/clientStatus}}'
};

module.exports = runTest;
