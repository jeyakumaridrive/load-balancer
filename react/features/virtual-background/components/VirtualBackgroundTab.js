// @flow

import Button from '@atlaskit/button';
import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import UIEvents from '../../../../service/UI/UIEvents';
import {
    sendAnalytics,
    createProfilePanelButtonEvent
} from '../../analytics';
import { AbstractDialogTab } from '../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../base/dialog';
import { translate } from '../../base/i18n';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link VirtualBackgroundTab}.
 */
export type Props = {
    ...$Exact<AbstractDialogTabProps>,

    
    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @extends Component
 */
class VirtualBackgroundTab extends AbstractDialogTab<Props> {
    static defaultProps = {
        virtual_background: window.$default_virtual_background
    };

    /**
     * Initializes a new {@code ConnectedVirtualBackgroundDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ConnectedVirtualBackgroundDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        /*const {
            authEnabled,
            displayName,
            email,
            t
        } = this.props;
        */
        return (
            <div className='virtual-background-section'>
                <div className="virtual-background-selector-label">Virtual Background Settings</div>
                <div class="virtual-background-dialog">
                    <div class="hide-warning"></div>
                    <div class="virtual-background-dialog-contents">
                        <p class="virtual-background-select">Choose an image</p>
                        <div className="virtual-background-selectable" onClick={() => this.changeVirtualBackground("selected_bar_bg1","images/bg1.jpg")}>
                            <div className={"selected-bar-vb selected_bar_bg1 " + ((window.$default_virtual_background_image == "/images/bg1.jpg") ? ' ' : ' hide')}>Currently Selected</div>
                            <img src="images/bg1.jpg" alt="bg1" width="150" height="150"/>
                        </div>
                        <div className="virtual-background-selectable" onClick={() => this.changeVirtualBackground("selected_bar_bg2","images/bg2.jpg")}>
                            <div className={"selected-bar-vb selected_bar_bg2 " + ((window.$default_virtual_background_image == "/images/bg2.jpg") ? ' ' : ' hide')}>Currently Selected</div>
                            <img src="images/bg2.jpg" alt="bg2" width="150" height="150"/>
                        </div>
                        <div className="virtual-background-selectable" onClick={() => this.changeVirtualBackground("selected_bar_bg3","images/bg3.jpg")}>
                            <div className={"selected-bar-vb selected_bar_bg3 " + ((window.$default_virtual_background_image == "/images/bg3.jpg") ? ' ' : ' hide')}>Currently Selected</div>
                            <img src="images/bg3.jpg" alt="bg3" width="150" height="150"/>
                        </div>
                        <div className="virtual-background-selectable" onClick={() => this.changeVirtualBackground("selected_bar_bg4","images/bg4.jpg")}>
                            <div className={"selected-bar-vb selected_bar_bg4 " + ((window.$default_virtual_background_image == "/images/bg4.jpg") ? ' ' : ' hide')}>Currently Selected</div>
                            <img src="images/bg4.jpg" alt="bg4" width="150" height="150"/>
                        </div>
                        <div className="virtual-background-selectable" onClick={() => this.changeVirtualBackground("selected_bar_bg5","images/bg5.jpg")}>
                            <div className={"selected-bar-vb selected_bar_bg5 " + ((window.$default_virtual_background_image == "/images/bg5.jpg") ? ' ' : ' hide')}>Currently Selected</div>
                            <img src="images/bg5.jpg" alt="bg5" width="150" height="150"/>
                        </div>
                        <div className="virtual-background-selectable" onClick={() => this.changeVirtualBackground("selected_bar_bg6","images/bg6.jpg")}>
                            <div className={"selected-bar-vb selected_bar_bg6 " + ((window.$default_virtual_background_image == "/images/bg6.jpg") ? ' ' : ' hide')}>Currently Selected</div>
                            <img src="images/bg6.jpg" alt="bg6" width="150" height="150"/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    
}

export default translate(VirtualBackgroundTab);
