// @flow

import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { getLocalParticipant } from '../../base/participants';
import { connect } from '../../base/redux';
import {
    Icon,
    IconMuteEveryone
} from '../../base/icons';


import SpeakerStatsItem from './SpeakerStatsItem';
import SpeakerStatsLabels from './SpeakerStatsLabels';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link SpeakerStats}.
 */
type Props = {

    /**
     * The display name for the local participant obtained from the redux store.
     */
    _localDisplayName: string,

    /**
     * The JitsiConference from which stats will be pulled.
     */
    conference: Object,

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link SpeakerStats}.
 */
type State = {

    /**
     * The stats summary provided by the JitsiConference.
     */
    stats: Object
};

/**
 * React component for displaying a list of speaker stats.
 *
 * @extends Component
 */
class SpeakerStats extends Component<Props, State> {
    _updateInterval: IntervalID;

    /**
     * Initializes a new SpeakerStats instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            stats: this.props.conference.getSpeakerStats()
        };

        // Bind event handlers so they are only bound once per instance.
        this._updateStats = this._updateStats.bind(this);
        this.muteall = this.muteall.bind(this);
        this.unmuteall = this.unmuteall.bind(this);
        
    }
      muteall = (e) => {
        e.preventDefault();

        localStorage.setItem('mutede','true');
        document.getElementById('muteAll').click();
        console.log(APP.conference._room.isAdmin);
        $('#mute_all').hide();
        $('#unmuteall_').show();
     }
     unmuteall = (e) => {
        e.preventDefault();
        localStorage.setItem('mutede','false');
       document.getElementById('unmuteAll').click();
       $('#mute_all').show();
       $('#unmuteall_').hide();
        console.log(APP.conference._room.isAdmin);
     }

    /**
     * Begin polling for speaker stats updates.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateInterval = setInterval(this._updateStats, 1000);

    }
    componentWillMount() {
        setInterval(this._updateStats2, 100);

    }

    /**
     * Stop polling for speaker stats updates.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        clearInterval(this._updateInterval);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const userIds = Object.keys(this.state.stats);
        const items = userIds.map(userId => this._createStatsItem(userId));
          const isAdmin = APP.conference._room.isAdmin;
        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                submitDisabled = { true }
                titleKey = 'People'>
                <div className = 'speaker-stats'>
                    <SpeakerStatsLabels />
                    { items }
                </div>

                { isAdmin == "true" ? (
                <div className="mute-controller" >
                    <button className='btn-mute-all'
                        onClick={ this.muteall }
                        id='mute_all'>Mute All
                    </button>
                    <button className='btn-unmute-all'
                        onClick={ this.unmuteall }
                        style={{'display':'none'}}
                        id='unmuteall_'>Unmute All
                    </button>
                </div>) : '' }

            </Dialog>
        );
    }

    /**
     * Create a SpeakerStatsItem instance for the passed in user id.
     *
     * @param {string} userId -  User id used to look up the associated
     * speaker stats from the jitsi library.
     * @returns {SpeakerStatsItem|null}
     * @private
     */
    _createStatsItem(userId) {
        const statsModel = this.state.stats[userId];

        if (!statsModel) {
            return null;
        }

        const isDominantSpeaker = statsModel.isDominantSpeaker();
        const dominantSpeakerTime = statsModel.getTotalDominantSpeakerTime();
        const hasLeft = statsModel.hasLeft();

        let displayName;

        if (statsModel.isLocalStats()) {
            const { t } = this.props;
            const meString = t('me');

            displayName = this.props._localDisplayName;
            displayName
                = displayName ? `${displayName} (${meString})` : meString;
        } else {
            displayName
                = this.state.stats[userId].getDisplayName()
                    || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
        }

        return (
            <SpeakerStatsItem
                displayName = { displayName }
                dominantSpeakerTime = { dominantSpeakerTime }
                hasLeft = { hasLeft }
                isDominantSpeaker = { isDominantSpeaker }
                key = { userId } />
        );
    }

    _updateStats: () => void;
    _updateStats2: () => void;

    /**
     * Update the internal state with the latest speaker stats.
     *
     * @returns {void}
     * @private
     */
    _updateStats() {

        const stats = this.props.conference.getSpeakerStats();

        this.setState({ stats });
    }
    
    _updateStats2() {
       
         if(localStorage.mutede=='true'){
            $('#mute_all').hide();
            $('#unmuteall_').show();
        } else {
             $('#mute_all').show();
            $('#unmuteall_').hide();
        }
    }
}

/**
 * Maps (parts of) the redux state to the associated SpeakerStats's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _localDisplayName: ?string
 * }}
 */
function _mapStateToProps(state) {
    const localParticipant = getLocalParticipant(state);

    return {
        /**
         * The local display name.
         *
         * @private
         * @type {string|undefined}
         */
        _localDisplayName: localParticipant && localParticipant.name
    };
}

export default translate(connect(_mapStateToProps)(SpeakerStats));
