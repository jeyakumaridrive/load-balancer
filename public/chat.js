$(function() {

    
    $('#participant').show();
    $('#participant input').focus();

    
    $('#participant input').keydown(function(event) {
        if (event.keyCode == 13) {
            $('#participant a').click();
        }
    })

    
    $('#participant a').click(function() {
        join($('#participant input').val());
        $('#participant').hide();
        $('#chat').show();
        $('input#message').focus();
    });

    function join(name) {
        var host = window.location.host.split(':')[0];
        var socket = io();

        
        socket.emit('join', $.toJSON({
            user: name
        }));

        var container = $('div#msgs');

        
        socket.on('chat', function(msg) {
            var message = $.evalJSON(msg);

            var action = message.action;
            var struct = container.find('li.' + action + ':first');

            if (struct.length < 1) {
                console.log("Could not handle: " + message);
                return;
            }

            var messageView = struct.clone();

            messageView.find('.time').text((new Date()).toString("HH:mm"));

            switch (action) {
                case 'message':
                    var matches;
                    if (matches = message.msg.match(/^\s*[\/\\]me\s(.*)/)) {
                        messageView.find('.user').text(message.user + ' ' + matches[1]);
                        messageView.find('.user').css('font-weight', 'bold');							
                    } else {
                        messageView.find('.user').text(message.user);
                        messageView.find('.message').text(': ' + message.msg);
                    }
                    break;
                case 'control':
                    messageView.find('.user').text(message.user);
                    messageView.find('.message').text(message.msg);
                    messageView.addClass('control');
                    break;
            }

            if (message.user == name) messageView.find('.user').addClass('self');

            container.find('ul').append(messageView.show());
            container.scrollTop(container.find('ul').innerHeight());
        });

        $('#chat form').submit(function(event) {
            event.preventDefault();
            var input = $(this).find(':input');
            var msg = input.val();
            socket.emit('chat', $.toJSON({
                action: 'message',
                user: name,
                msg: msg
            }));
            input.val('');
        });

    }
});