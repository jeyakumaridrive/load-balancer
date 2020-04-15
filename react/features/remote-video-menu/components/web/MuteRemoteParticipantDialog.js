/* @flow */

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

import AbstractMuteRemoteParticipantDialog
    from '../AbstractMuteRemoteParticipantDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting a remote participant.
 *
 * @extends Component
 */
class MuteRemoteParticipantDialog extends AbstractMuteRemoteParticipantDialog {
    
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okKey = 'dialog.muteParticipantButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.muteParticipantTitle'
                width = 'medium'>
                <div className='alert-dialog'>
                    { 'Mute <participantDisplayName> for everyone in the meeting? <participantDisplayName> can unmute themselves.'}
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(MuteRemoteParticipantDialog));
