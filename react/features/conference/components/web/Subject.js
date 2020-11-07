/* @flow */

import React, { Component } from 'react';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { getConferenceName } from '../../../base/conference/functions';
import { getParticipantCount } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import { setTileView } from '../../../video-layout/actions';
// import ConferenceTimer from '../ConferenceTimer';
// import ParticipantsCount from './ParticipantsCount';

/**
 * The type of the React {@code Component} props of {@link Subject}.
 */
type Props = {

    /**
     * Whether then participant count should be shown or not.
     */
    _showParticipantCount: boolean,

    /**
     * The subject or the of the conference.
     * Falls back to conference name.
     */
    _subject: string,

    /**
     * Indicates whether the component should be visible or not.
     */
    _visible: boolean,

    /**
     * Whether or not tile view layout has been enabled as the user preference.
     */
    _tileViewEnabled: boolean,
};

/**
 * Subject react component.
 *
 * @class Subject
 */
class Subject extends Component<Props> {

    constructor(props: Props) {
        super(props);
        this.state = {
            galleryView: APP.store.getState()['features/video-layout'].tileViewEnabled
        };
        APP.store.getState()['features/video-layout'].tileViewEnabled = localStorage.tileViewWasEnabled ? true : false;
        setInterval(() => {
            if(APP.store.getState()['features/video-layout'].tileViewEnabled) {
                this.setState({
                    galleryView: true
                });
            } else if(APP.store.getState()['features/video-layout'].tileViewEnabled == false) {
                this.setState({
                    galleryView: false
                });
            } else {
                APP.store.getState()['features/video-layout'].tileViewEnabled = false;
            }
        }, 500);
        this._handleClick = this._handleClick.bind(this);
    }

    _handleClick() {
        const { dispatch } = this.props;
        const _tileViewEnabled = APP.store.getState()['features/video-layout'].tileViewEnabled;
        sendAnalytics(createToolbarEvent(
            'tileview.button',
            {
                'is_enabled': _tileViewEnabled
            }));
        const value = !_tileViewEnabled;
        console.log(`Tile view ${value ? 'enable' : 'disable'}`);
        value ? localStorage.tileViewWasEnabled = true : delete localStorage.tileViewWasEnabled;
        dispatch(setTileView(value));
        this.setState({
            galleryView: value
        });
    }
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _showParticipantCount, _subject, _visible } = this.props;

        return (
            <div className = { `subject ${_visible ? 'visible' : ''}` }>
                <span className = 'subject-text'>{ _subject }</span>
                {/* { _showParticipantCount && <ParticipantsCount /> }
                <ConferenceTimer /> */}
                <div className='view-settings'><div className='toggle-view' onClick={this._handleClick}>
                    { this.state.galleryView ? 
                        <React.Fragment>
                        <svg
                            viewBox="0 0 50 39">
                            <rect x="1" y="1.3" fill="#FFFFFF" width="33.1" height="36.5"/>
                            <rect x="36.6" y="1.4" fill="#FFFFFF" width="12.6" height="10.2"/>
                            <rect x="36.6" y="14.5" fill="#FFFFFF" width="12.6" height="10.2"/>
                            <rect x="36.7" y="27.6" fill="#FFFFFF" width="12.6" height="10.2"/>
                        </svg>
                        <span id="tile-view">Speaker View</span> 
                    </React.Fragment> : <React.Fragment>
                         <svg 
                             viewBox="0 0 50 38.6">
                             <rect x="1.1" y="1.2" fill="#FFFFFF" width="13.8" height="10.2"/>
                             <rect x="1.2" y="14.2" fill="#FFFFFF" width="13.8" height="10.2"/>
                             <rect x="1.2" y="27.3" fill="#FFFFFF" width="13.8" height="10.2"/>
                             <rect x="18" y="1" fill="#FFFFFF" width="13.8" height="10.2"/>
                             <rect x="18.1" y="14.1" fill="#FFFFFF" width="13.8" height="10.2"/>
                             <rect x="18.1" y="27.2" fill="#FFFFFF" width="13.8" height="10.2"/>
                             <rect x="34.9" y="0.9" fill="#FFFFFF" width="13.8" height="10.2"/>
                             <rect x="35" y="14" fill="#FFFFFF" width="13.8" height="10.2"/>
                             <rect x="35.1" y="27.1" fill="#FFFFFF" width="13.8" height="10.2"/>
                         </svg>
                         <span id="tile-view">Gallery View</span> 
                     </React.Fragment>
                    } 
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _subject: string,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const participantCount = getParticipantCount(state);

    return {
        _showParticipantCount: participantCount > 2,
        _subject: getConferenceName(state),
        _visible: isToolboxVisible(state)
    };
}

export default connect(_mapStateToProps)(Subject);