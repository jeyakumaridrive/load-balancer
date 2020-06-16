// @flow

import React from 'react';

import { Icon } from '../../../icons';
import AbstractStatelessAvatar, { type Props as AbstractProps } from '../AbstractStatelessAvatar';

type Props = AbstractProps & {

    /**
     * External class name passed through props.
     */
    className?: string,

    /**
     * The default avatar URL if we want to override the app bundled one (e.g. AlwaysOnTop)
     */
    defaultAvatar?: string,

    /**
     * ID of the component to be rendered.
     */
    id?: string,

    /**
     * One of the expected status strings (e.g. 'available') to render a badge on the avatar, if necessary.
     */
    status?: ?string
};

/**
 * Implements a stateless avatar component that renders an avatar purely from what gets passed through
 * props.
 */
export default class StatelessAvatar extends AbstractStatelessAvatar<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { initials, url } = this.props;

        if (this._isIcon(url)) {
            return (
                <div
                    className = { `${this._getAvatarClassName()} ${this._getBadgeClassName()}` }
                    id = { this.props.id }
                    style = { this._getAvatarStyle(this.props.color) }>
                    <Icon
                        size = '50%'
                        src = { url } />
                </div>
            );
        }

        if (url) {
            return (
                <div className = { this._getBadgeClassName() }>
                    <img
                        className = { this._getAvatarClassName() }
                        id = { this.props.id }
                        onError = { this.props.onAvatarLoadError }
                        src = { url }
                        style = { this._getAvatarStyle() } />
                </div>
            );
        }

        if (initials) {
            return (
                <div
                    className = { `${this._getAvatarClassName()} ${this._getBadgeClassName()}` }
                    id = { this.props.id }
                    style = { this._getAvatarStyle(this.props.color) }>
                    <div
                        className = 'avatar-svg'>
                        <div
                            height = '100%'
                            width = '100%'>
                            <span
                                className = 'avatar-foreign'>
                                { initials }
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        // default avatar
        return (
            <div className = { this._getBadgeClassName() }>
                <img
                    className = { this._getAvatarClassName('defaultAvatar') }
                    id = { this.props.id }
                    src = { this.props.defaultAvatar || 'images/avatar.png' }
                    style = { this._getAvatarStyle() } />
            </div>
        );
    }

    /**
     * Constructs a style object to be used on the avatars.
     *
     * @param {string?} color - The desired background color.
     * @returns {Object}
     */
    _getAvatarStyle(color) {
        const { size } = this.props;

        return {
            backgroundColor: color || undefined,
            fontSize: size ? size * 0.5 : '220%',
            height: size || '100%',
            width: size || '100%'
        };
    }

    /**
     * Constructs a list of class names required for the avatar component.
     *
     * @param {string} additional - Any additional class to add.
     * @returns {string}
     */
    _getAvatarClassName(additional) {
        return `avatar ${additional || ''} ${this.props.className || ''}`;
    }

    /**
     * Generates a class name to render a badge on the avatar, if necessary.
     *
     * @returns {string}
     */
    _getBadgeClassName() {
        const { status } = this.props;

        if (status) {
            return `avatar-badge avatar-badge-${status}`;
        }

        return '';
    }

    _isIcon: (?string | ?Object) => boolean
}
