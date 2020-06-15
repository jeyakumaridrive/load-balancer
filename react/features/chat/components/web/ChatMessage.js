// @flow

import React from 'react';
import { toArray } from 'react-emoji-render';


import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';

import { MESSAGE_TYPE_LOCAL } from '../../constants';

import AbstractChatMessage, {
    type Props
} from '../AbstractChatMessage';
import PrivateMessageButton from '../PrivateMessageButton';

declare var APP: Object;

/**
 * Renders a single chat message.
 */
class ChatMessage extends AbstractChatMessage<Props> {

    download (processedMessage) {
        let { parentApi } = APP.store.getState()['features/base/config'];
        const key = processedMessage.key.split("::attachment:")[1].split(":attachment::")[0];
        const url = parentApi+'/api/v1'+'/download/'+key;
        window.open(url, '_blank');
    }
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { message } = this.props;
        const processedMessage = [];

        // content is an array of text and emoji components
        const content = toArray(this._getMessageText(), { className: 'smiley' });

        content.forEach(i => {
            if (typeof i === 'string') {
                processedMessage.push(<Linkify key = { i }>{ i }</Linkify>);
            } else {
                processedMessage.push(i);
            }
        });

        return (
            <div className = 'chatmessage-wrapper'>
                <div className = { `chatmessage ${message.privateMessage ? 'privatemessage' : ''}` }>
                    <div className = 'replywrapper'>
                        <div className = 'messagecontent'>
                            { this._renderDisplayName() }
                            {/* { this.props.showDisplayName && this._renderDisplayName() } */}
                            <div className = 'usermessage'>
                                { processedMessage[0].key.indexOf("::attachment:") >= 0 &&
                                    <div>
                                        { processedMessage[0].key.split("::attachment:")[0] }
                                        <a onClick={ () => { this.download(processedMessage[0]) } } style={{display:"block", color:"#2473bd", cursor: "pointer"}} >{processedMessage[0].key.split("::attachment:")[1].split(":attachment::")[0].slice(12)}</a>
                                    </div>
                                }
                                { processedMessage[0].key.indexOf("::attachment:") == -1 &&
                                    <div>
                                        { processedMessage[0].key }
                                    </div>
                                }
                            </div>
                            { message.privateMessage && this._renderPrivateNotice() }
                            { this._renderTimestamp() }
                            {/* { this.props.showTimestamp && this._renderTimestamp() } */}
                        </div>
                        { message.privateMessage && message.messageType !== MESSAGE_TYPE_LOCAL
                            && (
                                <div className = 'messageactions'>
                                    <PrivateMessageButton
                                        participantID = { message.id }
                                        reply = { true }
                                        showLabel = { true } />
                                </div>
                            ) }
                    </div>
                </div>
                
            </div>
        );
    }

    _getFormattedTimestamp: () => string;

    _getMessageText: () => string;

    _getPrivateNoticeMessage: () => string;

    /**
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderDisplayName() {
        return (
            <div className = 'display-name'>
                { this.props.message.displayName }
            </div>
        );
    }

    /**
     * Renders the message privacy notice.
     *
     * @returns {React$Element<*>}
     */
    _renderPrivateNotice() {
        return (
            <div className = 'privatemessagenotice'>
                { this._getPrivateNoticeMessage() }
            </div>
        );
    }

    /**
     * Renders the time at which the message was sent.
     *
     * @returns {React$Element<*>}
     */
    _renderTimestamp() {
        return (
            <div className = 'timestamp'>
                { this._getFormattedTimestamp() }
            </div>
        );
    }
}

export default translate(ChatMessage);
