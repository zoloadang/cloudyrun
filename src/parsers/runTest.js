
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
            '<p class="browser browser-{{_status}}"><span title="{{browser}}">{{browser}}</span><b title="{{message}}">running</b></p>' +
            '{{/if(message==)}}' +
            '{{#if(_status==passed)}}' +
            '<p class="browser browser-{{_status}}"><span title="{{browser}}">{{browser}}</span><b title="{{message}}">{{_status}}</b></p>' +
            '{{/if(_status==passed)}}' +
            '{{#if(_status==failed)}}' +
            '<p class="browser browser-{{_status}}"><span title="{{browser}}">{{browser}}</span><b title="{{message}}">{{_status}}</b></p>' +
            '{{/if(_status==failed)}}' +
            '{{#if(_status==timeout)}}' +
            '<p class="browser browser-{{_status}}"><span title="{{browser}}">{{browser}}</span><b title="{{message}}">{{_status}}</b></p>' +
            '{{/if(_status==timeout)}}' +
            '{{/clientStatus}}'
            /*
            '{{#clientStatus}}' +
            '{{#loading}}' +
            '<p class="browser browser-{{_status}}"><span title="{{browser}}">{{browser}}</span><b title="{{message}}">running</b></p>' +
            '{{/loading}}' +
            '{{#loaded}}' +
            '<p class="browser browser-{{_status}}"><span title="{{browser}}">{{browser}}</span><b title="{{message}}">{{_status}}</b></p>' +
            '{{/loaded}}' +
            '{{/clientStatus}}'
            */
};

module.exports = runTest;
