// @flow

import React, { Component } from 'react';
import Emoji from 'react-emoji-render';
import TextareaAutosize from 'react-textarea-autosize';
import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

import SmileysPanel from './SmileysPanel';

/**
 * The type of the React {@code Component} props of {@link ChatInput}.
 */
type Props = {

    /**
     * Invoked to send chat messages.
     */
    dispatch: Dispatch<any>,

    /**
     * Optional callback to invoke when the chat textarea has auto-resized to
     * fit overflowing text.
     */
    onResize: ?Function,

    /**
     * Callback to invoke on message send.
     */
    onSend: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link ChatInput}.
 */
type State = {

    /**
     * User provided nickname when the input text is provided in the view.
     */
    message: string,

    /**
     * Whether or not the smiley selector is visible.
     */
    showSmileysPanel: boolean
};

/**
 * Implements a React Component for drafting and submitting a chat message.
 *
 * @extends Component
 */
class ChatInput extends Component<Props, State> {
    _textArea: ?HTMLTextAreaElement;

    state = {
        message: '',
        showSmileysPanel: false
    };

    /**
     * Initializes a new {@code ChatInput} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._textArea = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onToggleSmileysPanel = this._onToggleSmileysPanel.bind(this);
        this._setTextAreaRef = this._setTextAreaRef.bind(this);
        this.sendMsg = this.sendMsg.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        /**
         * HTML Textareas do not support autofocus. Simulate autofocus by
         * manually focusing.
         */
        this._focus();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const smileysPanelClassName = `${this.state.showSmileysPanel
            ? 'show-smileys' : 'hide-smileys'} smileys-panel`;
            const { message } = this.props;
            console.log(message);
            
        return (
            <React.Fragment>
                <div id = 'chat-input' >
                    <div className = 'usrmsg-form'>
                        <TextareaAutosize
                            id = 'usermsg'
                            inputRef = { this._setTextAreaRef }
                            maxRows = { 5 }
                            onChange = { this._onMessageChange }
                            onHeightChange = { this.props.onResize }
                            onKeyDown = { this._onDetectSubmit }
                            placeholder = { 'Send a message to everyone' }
                            value = { this.state.message } />
                    </div>
                    {/* <div className = 'smiley-input'>
                        <div id = 'smileysarea'>
                            <div id = 'smileys'>
                                <Emoji
                                    onClick = { this._onToggleSmileysPanel }
                                    text = ':)' />
                            </div>
                        </div>
                        <div className = { smileysPanelClassName }>
                            <SmileysPanel
                                onSmileySelect = { this._onSmileySelect } />
                        </div>
                    </div> */}
                </div>
                <div className='chat-actions'>
                    <div className="upload-btn-wrapper">
                        <button className="btn">
                            <img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4IiB2aWV3Qm94PSIwIDAgNDM2LjI1NiA0MzYuMjU3IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0MzYuMjU2IDQzNi4yNTc7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8cGF0aCBkPSJNMzg5LjQyOCwyOTAuNjYxbC0xNjUuODc5LTE2NS44OGMtMTEuNjEzLTExLjk5Mi0yNS43OTItMTcuOTg3LTQyLjU0MS0xNy45ODdjLTE1LjYwOCwwLTI4LjgzMyw1LjQyNC0zOS42ODQsMTYuMjc0ICAgYy0xMC44NTQsMTAuODQ4LTE2LjI3NywyNC4wNzgtMTYuMjc3LDM5LjY4N2MwLDE2Ljc1LDUuOTk2LDMwLjkzMSwxNy45ODcsNDIuNTQxbDExNy4wNiwxMTcuMDU4ICAgYzEuOTAyLDEuOTAzLDQuMDAxLDIuODU0LDYuMjgzLDIuODU0YzMuMDQ2LDAsNy41MTktMi45NTMsMTMuNDE1LTguODVjNS44OTktNS44OTksOC44NDYtMTAuMzc2LDguODQ2LTEzLjQyMiAgIGMwLTIuMjc5LTAuOTQ3LTQuMzc0LTIuODUxLTYuMjc5TDE2OC43MzEsMTc5LjU5OWMtNC43NTgtNS4xNC03LjEzNy0xMC43NTQtNy4xMzctMTYuODQ0YzAtNS41MjMsMS44MDctMTAuMDksNS40MjQtMTMuNzA2ICAgYzMuNjE1LTMuNjE3LDguMTg2LTUuNDI0LDEzLjcwNi01LjQyNGM2LjQ3MSwwLDEyLjE4LDIuMjgxLDE3LjEzMSw2Ljg0OWwxNjUuODc1LDE2NS44OCAgIGMxMS45OTgsMTEuOTg4LDE3Ljk5NCwyNS43ODYsMTcuOTk0LDQxLjM5MmMwLDEyLjE4OS00LjAwMSwyMi4yNzQtMTEuOTkyLDMwLjI2NmMtOCw3Ljk5NC0xOC4wODIsMTEuOTk4LTMwLjI2OSwxMS45OTggICBjLTE1LjYwOCwwLTI5LjQwNi02LjAwMy00MS4zOTEtMTcuOTk0TDc2LjUxMywxNjAuMTc4Yy0xNC40NjYtMTQuNDY1LTIxLjY5NS0zMS42OTItMjEuNjk1LTUxLjY3OCAgIGMwLTIwLjE3Nyw2Ljk0NS0zNy40MDQsMjAuODQxLTUxLjY3OGMxMy44OTQtMTQuMjcyLDMwLjkyOC0yMS40MTEsNTEuMTA2LTIxLjQxMWMxOS40MTIsMCwzNi42MzYsNy4zMjgsNTEuNjczLDIxLjk3OSAgIGwxNzMuMDE4LDE3My4zMDJjMS45MDIsMS45MDYsNC4wOSwyLjg1MSw2LjU2NywyLjg1MWMzLjA0NiwwLDcuNDc0LTIuOTAyLDEzLjI3NC04LjcwNmM1LjgwOC01LjgwNCw4LjcwMy0xMC4yMjksOC43MDMtMTMuMjc0ICAgYzAtMi4yODEtMC45NDgtNC4zNzctMi44NDgtNi4yOEwyMDQuNDE5LDMyLjI2NEMxODIuNTMxLDEwLjc1NiwxNTYuNTUyLDAsMTI2LjQ3OCwwYy0zMC4yNjQsMC01NS44NjMsMTAuNTY2LTc2LjgsMzEuNjkzICAgQzI4LjczOSw1Mi44MjEsMTguMjcxLDc4LjUxOCwxOC4yNzEsMTA4Ljc4YzAsMjkuNjkyLDEwLjc1Miw1NS40ODMsMzIuMjYsNzcuMzcybDIyMS44NDIsMjIxLjU1NyAgIGMxOS4wMzMsMTkuMDI3LDQxLjM5NCwyOC41NDgsNjcuMDkxLDI4LjU0OGMyMi4yNjksMCw0MC45MjYtNy41MjEsNTUuOTU5LTIyLjU1OWMxNS4wMzctMTUuMDMsMjIuNTYyLTMzLjY4OCwyMi41NjItNTUuOTYzICAgQzQxNy45NzksMzMxLjY2Miw0MDguNDU4LDMwOS4zMDIsMzg5LjQyOCwyOTAuNjYxeiIgZmlsbD0iIzAwMDAwMCIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=" />
                        </button>
                        <input type="file" name="myfile" />
                    </div>
                    <a onClick={ ()=>{ this.sendMsg() } } className='btn-send'>SEND</a>
                </div>
            </React.Fragment>
                
        );
    }

    /**
     * Place cursor focus on this component's text area.
     *
     * @private
     * @returns {void}
     */
    _focus() {
        this._textArea && this._textArea.focus();
    }

    _onDetectSubmit: (Object) => void;

    /**
     * Detects if enter has been pressed. If so, submit the message in the chat
     * window.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onDetectSubmit(event) {
        if (event.keyCode === 13
            && event.shiftKey === false) {
            event.preventDefault();

            const trimmed = this.state.message.trim();

            if (trimmed) {
                this.props.onSend(trimmed);

                this.setState({ message: '' });
            }
        }
    }
    sendMsg(event)
    {
        const trimmed = this.state.message.trim();

        if(trimmed)
        {
            this.props.onSend(trimmed);

            this.setState({ message: '' });
        }

    }
    _onMessageChange: (Object) => void;

    /**
     * Updates the known message the user is drafting.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onMessageChange(event) {
        this.setState({ message: event.target.value });
    }

    _onSmileySelect: (string) => void;

    /**
     * Appends a selected smileys to the chat message draft.
     *
     * @param {string} smileyText - The value of the smiley to append to the
     * chat message.
     * @private
     * @returns {void}
     */
    _onSmileySelect(smileyText) {
        this.setState({
            message: `${this.state.message} ${smileyText}`,
            showSmileysPanel: false
        });

        this._focus();
    }

    _onToggleSmileysPanel: () => void;

    /**
     * Callback invoked to hide or show the smileys selector.
     *
     * @private
     * @returns {void}
     */
    _onToggleSmileysPanel() {
        this.setState({ showSmileysPanel: !this.state.showSmileysPanel });

        this._focus();
    }

    _setTextAreaRef: (?HTMLTextAreaElement) => void;

    /**
     * Sets the reference to the HTML TextArea.
     *
     * @param {HTMLAudioElement} textAreaElement - The HTML text area element.
     * @private
     * @returns {void}
     */
    _setTextAreaRef(textAreaElement: ?HTMLTextAreaElement) {
        this._textArea = textAreaElement;
    }
}

export default translate(connect()(ChatInput));
