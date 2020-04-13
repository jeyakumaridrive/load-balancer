// @flow

import Button, { ButtonGroup } from '@atlaskit/button';
import Modal, { ModalFooter } from '@atlaskit/modal-dialog';
import _ from 'lodash';
import React, { Component } from 'react';

import { translate } from '../../../i18n/functions';

import type { DialogProps } from '../../constants';

/**
 * The ID to be used for the cancel button if enabled.
 * @type {string}
 */
const CANCEL_BUTTON_ID = 'modal-dialog-cancel-button';

/**
 * The ID to be used for the ok button if enabled.
 * @type {string}
 */
const OK_BUTTON_ID = 'modal-dialog-ok-button';

/**
 * The type of the React {@code Component} props of {@link StatelessDialog}.
 *
 * @static
 */
type Props = {
    ...DialogProps,

    i18n: Object,

    /**
     * Disables dismissing the dialog when the blanket is clicked. Enabled
     * by default.
     */
    disableBlanketClickDismiss: boolean,

    /**
     * If true, the cancel button will not display but cancel actions, like
     * clicking the blanket, will cancel.
     */
    hideCancelButton: boolean,

    /**
     * Whether the dialog is modal. This means clicking on the blanket will
     * leave the dialog open. No cancel button.
     */
    isModal: boolean,

    /**
     * Disables rendering of the submit button.
     */
    submitDisabled: boolean,

    /**
     * Function to be used to retreive translated i18n labels.
     */
    t: Function,

    /**
     * Width of the dialog, can be:
     * - 'small' (400px), 'medium' (600px), 'large' (800px),
     *   'x-large' (968px)
     * - integer value for pixel width
     * - string value for percentage
     */
    width: string
};

/**
 * Web dialog that uses atlaskit modal-dialog to display dialogs.
 */
class StatelessDialog extends Component<Props> {
    /**
     * The functional component to be used for rendering the modal footer.
     */
    _Footer: ?Function

    _dialogElement: ?HTMLElement;

    /**
     * Initializes a new {@code StatelessDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onCancel = this._onCancel.bind(this);
        this._onDialogDismissed = this._onDialogDismissed.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._renderFooter = this._renderFooter.bind(this);
        this._setDialogElement = this._setDialogElement.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            children,
            t /* The following fixes a flow error: */ = _.identity,
            titleString,
            titleKey,
            width
        } = this.props;

        return (
            <Modal
                className= { this.props.modalClass }
                autoFocus = { true }
                footer = { this._renderFooter }
                heading = { titleString || t(titleKey) }
                i18n = { this.props.i18n }
                onClose = { this._onDialogDismissed }
                onDialogDismissed = { this._onDialogDismissed }
                shouldCloseOnEscapePress = { true }
                width = { width || 'medium' }>
                <div
                    onKeyDown = { this._onKeyDown }
                    ref = { this._setDialogElement }>
                    <form
                        className = 'modal-dialog-form device-select-'
                        id = 'modal-dialog-form'
                        onSubmit = { this._onSubmit }>
                            <a className='close-settings'
                                onClick={this._onDialogDismissed}
                                appearance="link" >
                                    <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDMzOS4yIDMzOS4yIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzMzkuMiAzMzkuMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9DQo8L3N0eWxlPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTI0Ny4yLDE2OS42bDgzLjktODMuOWM1LjMtNS4zLDgtMTEuOCw4LTE5LjRjMC03LjYtMi43LTE0LjEtOC0xOS40TDI5Mi40LDhjLTUuMy01LjMtMTEuOC04LTE5LjQtOA0KCQljLTcuNiwwLTE0LjEsMi43LTE5LjQsOGwtODMuOSw4My45TDg1LjcsOGMtNS4zLTUuMy0xMS44LTgtMTkuNC04Yy03LjYsMC0xNC4xLDIuNy0xOS40LDhMOCw0Ni44Yy01LjMsNS4zLTgsMTEuOC04LDE5LjQNCgkJYzAsNy42LDIuNywxNC4xLDgsMTkuNGw4My45LDgzLjlMOCwyNTMuNWMtNS4zLDUuMy04LDExLjgtOCwxOS40YzAsNy42LDIuNywxNC4xLDgsMTkuNGwzOC44LDM4LjhjNS4zLDUuMywxMS44LDgsMTkuNCw4DQoJCWM3LjYsMCwxNC4xLTIuNywxOS40LThsODMuOS04My45bDgzLjksODMuOWM1LjMsNS4zLDExLjgsOCwxOS40LDhjNy42LDAsMTQuMS0yLjcsMTkuNC04bDM4LjgtMzguOGM1LjMtNS4zLDgtMTEuOCw4LTE5LjQNCgkJYzAtNy42LTIuNy0xNC4xLTgtMTkuNEwyNDcuMiwxNjkuNnoiLz4NCjwvZz4NCjwvc3ZnPg0K" />
                             </a>
                        { children }
                    </form>
                </div>
            </Modal>
        );
    }

    _renderFooter: () => React$Node;

    /**
     * Returns a ReactElement to display buttons for closing the modal.
     *
     * @param {Object} propsFromModalFooter - The props passed in from the
     * {@link ModalFooter} component.
     * @private
     * @returns {ReactElement}
     */
    _renderFooter(propsFromModalFooter) {
        // Filter out falsy (null) values because {@code ButtonGroup} will error
        // if passed in anything but buttons with valid type props.
        const buttons = [
            this._renderOKButton(),
            this._renderCancelButton()
        ].filter(Boolean);

        return (
            <ModalFooter className={this.props.footerClass} showKeyline = { propsFromModalFooter.showKeyline } >
                {

                    /**
                     * Atlaskit has this empty span (JustifySim) so...
                     */
                }
                <span />
                <ButtonGroup>
                    { buttons }
                </ButtonGroup>
            </ModalFooter>
        );
    }

    _onCancel: () => void;

    /**
     * Dispatches action to hide the dialog.
     *
     * @returns {void}
     */
    _onCancel() {
        if (!this.props.isModal) {
            const { onCancel } = this.props;

            onCancel && onCancel();
        }
    }

    _onDialogDismissed: () => void;

    /**
     * Handles click on the blanket area.
     *
     * @returns {void}
     */
    _onDialogDismissed() {
        if (!this.props.disableBlanketClickDismiss) {
            this._onCancel();
        }
    }

    _onSubmit: (?string) => void;

    /**
     * Dispatches the action when submitting the dialog.
     *
     * @private
     * @param {string} value - The submitted value if any.
     * @returns {void}
     */
    _onSubmit(value) {
        const { onSubmit } = this.props;

        onSubmit && onSubmit(value);
    }

    /**
     * Renders Cancel button.
     *
     * @private
     * @returns {ReactElement|null} The Cancel button if enabled and dialog is
     * not modal.
     */
    _renderCancelButton() {
        if (this.props.cancelDisabled
            || this.props.isModal
            || this.props.hideCancelButton) {
            return null;
        }

        const {
            t /* The following fixes a flow error: */ = _.identity
        } = this.props;

        return (
            <Button
                appearance = 'subtle'
                id = { CANCEL_BUTTON_ID }
                key = 'cancel'
                onClick = { this._onCancel }
                type = 'button'>
                { t(this.props.cancelKey || 'dialog.Cancel') }
            </Button>
        );
    }

    /**
     * Renders OK button.
     *
     * @private
     * @returns {ReactElement|null} The OK button if enabled.
     */
    _renderOKButton() {
        if (this.props.submitDisabled) {
            return null;
        }

        const {
            t /* The following fixes a flow error: */ = _.identity
        } = this.props;

        return (
            <Button
                appearance = 'primary'
                form = 'modal-dialog-form'
                id = { OK_BUTTON_ID }
                isDisabled = { this.props.okDisabled }
                key = 'submit'
                onClick = { this._onSubmit }
                type = 'button'>
                { t(this.props.okKey || 'dialog.Ok') }
            </Button>
        );
    }

    _setDialogElement: (?HTMLElement) => void;

    /**
     * Sets the instance variable for the div containing the component's dialog
     * element so it can be accessed directly.
     *
     * @param {HTMLElement} element - The DOM element for the component's
     * dialog.
     * @private
     * @returns {void}
     */
    _setDialogElement(element: ?HTMLElement) {
        this._dialogElement = element;
    }

    _onKeyDown: (Object) => void;

    /**
     * Handles 'Enter' key in the dialog to submit/hide dialog depending on
     * the available buttons and their disabled state.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyDown(event) {
        // If the event coming to the dialog has been subject to preventDefault
        // we don't handle it here.
        if (event.defaultPrevented) {
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();

            if (this.props.submitDisabled && !this.props.cancelDisabled) {
                this._onCancel();
            } else if (!this.props.okDisabled) {
                this._onSubmit();
            }
        }
    }
}

export default translate(StatelessDialog);
