// @flow

import React, { PureComponent } from 'react';
import type { Dispatch } from 'redux';

import { openDialog } from '../../../base/dialog';
import { getParticipantCount } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { SpeakerStats } from '../../../speaker-stats';
import { clientResized } from '../../../base/responsive-ui/actions';
import VideoLayout from '../../../../../modules/UI/videolayout/VideoLayout';

/**
 * The type of the React {@code Component} props of {@link ParticipantsCount}.
 */
type Props = {

    /**
     * Number of the conference participants.
     */
    count: string,

    /**
     * Conference data.
     */
    conference: Object,

    /**
     * Invoked to open Speaker stats.
     */
    dispatch: Dispatch<any>,
};

/**
 * ParticipantsCount react component.
 * Displays the number of participants and opens Speaker stats on click.
 *
 * @class ParticipantsCount
 */
class ParticipantsCount extends PureComponent<Props> {
    /**
     * Initializes a new ParticipantsCount instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            
        }

        this._onClick = this._onClick.bind(this);
    }

    _onClick: () => void;

    /**
     * Callback invoked to display {@code SpeakerStats}.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { dispatch, conference } = this.props;
        dispatch(openDialog(SpeakerStats, { conference }));
        setTimeout(() => {
            //check if the people toolbar is open
            
            var ps = $('#people_sidebar');
            if(!ps.hasClass('show-people-list')) {
                var element = document.getElementById("new-toolbox");
                element.classList.remove("visible");
                document.getElementById('hand-popup').classList.remove('show');
            }

            $('#videoconference_page').addClass('shrink');
            APP.store.dispatch(clientResized(innerWidth - 300, innerHeight));
            VideoLayout.onResize(true);

            ps.toggleClass('show-people-list');
        }, 300);
    }

    /**
     * Implements React's {@link PureComponent#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        
        return (
            <React.Fragment>
                <a
                    type="button" 
                    className="js-open-modal present-tab"
                    id='people-trigger'
                    onClick = { this._onClick }>
                    <div className = 'participants-count-number'>
                        {this.props.count}
                    </div>
                    <div className = 'participants-count-icon' />
                    <span>People</span>
                </a>

                <div 
                    className='rasie-hand-alert' 
                    id='hand-popup'
                    onClick = { this._onClick }>
                        User raised hand
                </div>
            </React.Fragment>
        );
    }
}


/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code ParticipantsCount} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
  
    return {
        conference: state['features/base/conference'].conference,
        count: getParticipantCount(state)
    };
}

export default connect(mapStateToProps)(ParticipantsCount);
