// @flow

import React from 'react';

import { translate } from '../../../../base/i18n';
import { Dialog } from '../../../../base/dialog';
import { connect } from '../../../../base/redux';

import AbstractStopRecordingDialog, {
    type Props,
    _mapStateToProps
} from '../AbstractStopRecordingDialog';

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @extends Component
 */
class StopRecordingDialog extends AbstractStopRecordingDialog<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <Dialog
                okKey = 'Yes'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.recording'
                width = 'medium'>
                    <div classNAme='alert-dialog'>
                        { t('dialog.stopRecordingWarning') }
                    </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean
}

export default translate(connect(_mapStateToProps)(StopRecordingDialog));
