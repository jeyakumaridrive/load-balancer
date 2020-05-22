/* @flow */

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

import AbstractUnmuteRemoteParticipantDialog
    from '../AbstractUnmuteRemoteParticipantDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting a remote participant.
 *
 * @extends Component
 */
class UnuteRemoteParticipantDialog extends AbstractUnmuteRemoteParticipantDialog {
    
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
       // alert(this.props.participantID)
       // alert(localStorage.getItem('dialog_name'));
       // alert(APP.conference.getSpeakerStats()[this.props.participantID].displayName);
        if(APP.conference.getSpeakerStats()[this.props.participantID].displayName != undefined) {
            name = APP.conference.getSpeakerStats()[this.props.participantID].displayName;
        } else {
            name = '';
        }
        var name = APP.conference.getSpeakerStats()[this.props.participantID].displayName;
        var text = 'Unmute '+name+' for everyone in the meeting? '+name+' can unmute themselves.';
        return (
            <Dialog
                okKey = 'dialog.muteParticipantButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.muteParticipantTitle'
                width = 'medium'>
                <div className='alert-dialog'>
                    { text }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(UnuteRemoteParticipantDialog));
