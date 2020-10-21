// @flow

import Flag from '@atlaskit/flag';
import EditorInfoIcon from '@atlaskit/icon/glyph/editor/info';
import ErrorIcon from '@atlaskit/icon/glyph/error';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import { colors } from '@atlaskit/theme';
import React from 'react';

import { translate, getLocalizedDateFormatter } from '../../../base/i18n';

import { NOTIFICATION_TYPE } from '../../constants';

import AbstractNotification, {
    type Props
} from '../AbstractNotification';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';

const TIMESTAMP_FORMAT = 'hh:mm A';
declare var interfaceConfig: Object;

/**
 * Secondary colors for notification icons.
 *
 * @type {{error, info, normal, success, warning}}
 */
const ICON_COLOR = {
    error: colors.R400,
    info: colors.N500,
    normal: colors.N0,
    success: colors.G400,
    warning: colors.Y200
};

/**
 * Implements a React {@link Component} to display a notification.
 *
 * @extends Component
 */
class Notification extends AbstractNotification<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            appearance,
            hideErrorSupportLink,
            isDismissAllowed,
            onDismissed,
            t,
            title,
            titleArguments,
            titleKey,
            uid,
            logoIconCustom,
            timeStamp,
            newMessage,
        } = this.props;
       
       
        var acronym ='';
        if(logoIconCustom != undefined) {
            if(logoIconCustom!=''){
                var matches = logoIconCustom.match(/\b(\w)/g); 
                 acronym = matches.join('');

            }

        } 
        return (
            <div className="flag-wrapper">
                {newMessage ? 
                (<h2 className=""><span className="msg-time">{this._getFormattedTimestamp(timeStamp)}</span><img src="/images/ms-icon.png"/>New message</h2>) : ('')}
            <Flag
                actions = { this._mapAppearanceToButtons(hideErrorSupportLink) }
                appearance = { appearance }
                description = { this._renderDescription() }
                icon = { this._mapAppearanceToIcon() }
                id = { uid }
                isDismissAllowed = { isDismissAllowed }
                onDismissed = { onDismissed }
                className= {'notfications'}
                testId = { titleKey }
                title = { title || t(titleKey, titleArguments) } />
            </div>
        );
    }

    _getFormattedTimestamp(timeStamp) {
        return getLocalizedDateFormatter(new Date(timeStamp))
            .format(TIMESTAMP_FORMAT);
    }

    _getDescription: () => Array<string>

    _getDescriptionKey: () => string

    _onDismissed: () => void;

    /**
     * Creates a {@code ReactElement} for displaying the contents of the
     * notification.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderDescription() {
        const description = this._getDescription();

        // the id is used for testing the UI
        return (
            <div className="noto">
                {
                    ReactHtmlParser(description)
                }
            </div>
        );
    }

    /**
     * Opens the support page.
     *
     * @returns {void}
     * @private
     */
    _onOpenSupportLink() {
        window.open(interfaceConfig.SUPPORT_URL, '_blank', 'noopener');
    }

    /**
     * Creates action button configurations for the notification based on
     * notification appearance.
     *
     * @param {boolean} hideErrorSupportLink - Indicates if the support link
     * should be hidden in the error messages.
     * @private
     * @returns {Object[]}
     */
    _mapAppearanceToButtons(hideErrorSupportLink) {
        switch (this.props.appearance) {
        case NOTIFICATION_TYPE.ERROR: {
            const buttons = [
                {
                    content: this.props.t('dialog.dismiss'),
                    onClick: this._onDismissed
                }
            ];

            if (!hideErrorSupportLink) {
                buttons.push({
                    content: this.props.t('dialog.contactSupport'),
                    onClick: this._onOpenSupportLink
                });
            }

            return buttons;
        }
        case NOTIFICATION_TYPE.WARNING:
            return [
                {
                    content: this.props.t('dialog.Ok'),
                    onClick: this._onDismissed
                }
            ];

        default:
            if (this.props.customActionNameKey && this.props.customActionHandler) {
                return [
                    {
                        content: this.props.t(this.props.customActionNameKey),
                        onClick: () => {
                            if (this.props.customActionHandler()) {
                                this._onDismissed();
                            }
                        }
                    }
                ];
            }

            return [];
        }
    }

    /**
     * Creates an icon component depending on the configured notification
     * appearance.
     *
     * @private
     * @returns {ReactElement}
     */
    _mapAppearanceToIcon(tt,logoIconCustom) {
        const appearance = this.props.appearance;
        const secIconColor = ICON_COLOR[this.props.appearance];
        const iconSize = 'large';

        switch (appearance) {
        case NOTIFICATION_TYPE.ERROR:
            return (
                <ErrorIcon
                    label = { appearance }
                    secondaryColor = { secIconColor }
                    size = { iconSize } />
            );

        case NOTIFICATION_TYPE.WARNING:
            return (
                <WarningIcon
                    label = { appearance }
                    secondaryColor = { secIconColor }
                    size = { iconSize } />
            );

        default:
            return (
             <div>
                { tt!='' ? (
                 <div className="notification_logo">{tt}</div>) :
                   <EditorInfoIcon
                    label = { appearance }
                    secondaryColor = { secIconColor }
                    size = { iconSize } />
                }
                </div>
            );
        }
    }
}

export default translate(Notification);
