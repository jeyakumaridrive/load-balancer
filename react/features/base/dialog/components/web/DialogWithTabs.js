// @flow

import Tabs from '@atlaskit/tabs';
import React, { Component } from 'react';

import { translate } from '../../../i18n/functions';
import logger from '../../logger';

import StatelessDialog from './StatelessDialog';

/**
 * The type of the React {@code Component} props of {@link DialogWithTabs}.
 */
export type Props = {

    /**
     * Function that closes the dialog.
     */
    closeDialog: Function,

    /**
     * Css class name that will be added to the dialog.
     */
    cssClassName: string,

    /**
     * Which settings tab should be initially displayed. If not defined then
     * the first tab will be displayed.
     */
    defaultTab: number,

    /**
     * Disables dismissing the dialog when the blanket is clicked. Enabled
     * by default.
     */
    disableBlanketClickDismiss: boolean,

    /**
     * Callback invoked when the Save button has been pressed.
     */
    onSubmit: Function,


    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Information about the tabs that will be rendered.
     */
    tabs: Array<Object>,

    /**
     * Key to use for showing a title.
     */
    titleKey: string

};

/**
 * The type of the React {@code Component} state of {@link DialogWithTabs}.
 */
type State = {

    /**
     * The index of the tab that should be displayed.
     */
    selectedTab: number,

    /**
     * An array of the states of the tabs.
     */
    tabStates: Array<Object>
};

/**
 * A React {@code Component} for displaying a dialog with tabs.
 *
 * @extends Component
 */
class DialogWithTabs extends Component<Props, State> {
    /**
     * Initializes a new {@code DialogWithTabs} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            selectedTab: this.props.defaultTab || 0,
            tabStates: this.props.tabs.map(tab => tab.props)
        };
        this._onSubmit = this._onSubmit.bind(this);
        this._onTabSelected = this._onTabSelected.bind(this);
        this._onTabStateChange = this._onTabStateChange.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const onCancel = this.props.closeDialog;

        return (
            <StatelessDialog
                disableBlanketClickDismiss
                    = { this.props.disableBlanketClickDismiss }
                onCancel = { onCancel }
                okKey = { ' Done '}
                modalClass= { 'device-select-dialog' }
                footerClass = { 'device-dialog-footer' }
                onSubmit = { this._onSubmit }
                titleKey = { this.props.titleKey } >
                <div className = { this.props.cssClassName } >

                <div className="modal-header">
                    <h4 className="modal-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 841.889 595.281"><g fill="#0071bc"><path d="M379.668 412.88H171.941c-4.828 0-8.761-3.934-8.761-8.762V66.153c0-4.827 3.934-8.76 8.761-8.76h497.988c4.83 0 8.761 3.933 8.761 8.76v74.019c14.585 1.722 28.251 6.502 39.874 14.359V66.153c0-26.819-21.825-48.636-48.636-48.636H171.941c-26.811 0-48.636 21.815-48.636 48.636v337.963c0 26.821 21.825 48.639 48.636 48.639h166.917v65.196h-26.322c-16.511 0-29.906 13.386-29.906 29.906s13.396 29.907 29.906 29.907h83.955c-10.493-14.758-16.82-32.672-16.82-52.122V412.88h-.003z"></path><path d="M547.032 547.603v-43.077h-87.615V229.384c0-5.805 4.712-10.525 10.514-10.525h198.246c5.802 0 10.513 4.721 10.513 10.525v85.152h14.936c9.131 0 17.581 2.638 24.938 6.94v-92.093c0-27.796-22.604-50.4-50.388-50.4H469.931c-27.783 0-50.388 22.604-50.388 50.4V525.64c0 27.795 22.604 50.399 50.388 50.399h86.097c-5.491-7.884-8.996-18.871-8.996-28.436z"></path><path d="M693.625 339.459h-96.709c-13.768 0-24.962 11.205-24.962 24.969v183.176c0 13.765 11.194 24.961 24.962 24.961h96.709c13.766 0 24.959-11.196 24.959-24.961V364.427c0-13.765-11.194-24.968-24.959-24.968zm-91.764 29.905h86.817v158.341h-86.817V369.364zm43.42 191.07c-2.746 0-5.198-1.111-7.067-2.823-2.124-1.929-3.486-4.637-3.486-7.723 0-5.82 4.713-10.533 10.554-10.533 5.802 0 10.514 4.713 10.514 10.533 0 3.086-1.364 5.793-3.466 7.723-1.873 1.713-4.325 2.823-7.049 2.823z"></path></g></svg>
                        Devices

                    </h4>
                        <a className='close-settings'
                            onClick={ onCancel }
                                appearance="link" >
                                    <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDMzOS4yIDMzOS4yIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzMzkuMiAzMzkuMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9DQo8L3N0eWxlPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTI0Ny4yLDE2OS42bDgzLjktODMuOWM1LjMtNS4zLDgtMTEuOCw4LTE5LjRjMC03LjYtMi43LTE0LjEtOC0xOS40TDI5Mi40LDhjLTUuMy01LjMtMTEuOC04LTE5LjQtOA0KCQljLTcuNiwwLTE0LjEsMi43LTE5LjQsOGwtODMuOSw4My45TDg1LjcsOGMtNS4zLTUuMy0xMS44LTgtMTkuNC04Yy03LjYsMC0xNC4xLDIuNy0xOS40LDhMOCw0Ni44Yy01LjMsNS4zLTgsMTEuOC04LDE5LjQNCgkJYzAsNy42LDIuNywxNC4xLDgsMTkuNGw4My45LDgzLjlMOCwyNTMuNWMtNS4zLDUuMy04LDExLjgtOCwxOS40YzAsNy42LDIuNywxNC4xLDgsMTkuNGwzOC44LDM4LjhjNS4zLDUuMywxMS44LDgsMTkuNCw4DQoJCWM3LjYsMCwxNC4xLTIuNywxOS40LThsODMuOS04My45bDgzLjksODMuOWM1LjMsNS4zLDExLjgsOCwxOS40LDhjNy42LDAsMTQuMS0yLjcsMTkuNC04bDM4LjgtMzguOGM1LjMtNS4zLDgtMTEuOCw4LTE5LjQNCgkJYzAtNy42LTIuNy0xNC4xLTgtMTkuNEwyNDcuMiwxNjkuNnoiLz4NCjwvZz4NCjwvc3ZnPg0K" />
                             </a>
                    </div>
                    { this._renderTabs() }
                    {this.props.children}

                </div>
            </StatelessDialog>
        );
    }

    /**
     * Gets the props to pass into the tab component.
     *
     * @param {number} tabId - The index of the tab configuration within
     * {@link this.state.tabStates}.
     * @returns {Object}
     */
    _getTabProps(tabId) {
        const { tabs } = this.props;
        const { tabStates } = this.state;
        const tabConfiguration = tabs[tabId];
        const currentTabState = tabStates[tabId];

        if (tabConfiguration.propsUpdateFunction) {
            return tabConfiguration.propsUpdateFunction(
                currentTabState,
                tabConfiguration.props);
        }

        return { ...currentTabState };
    }

    _onTabSelected: (Object, number) => void;

    /**
     * Callback invoked when the desired tab to display should be changed.
     *
     * @param {Object} tab - The configuration passed into atlaskit tabs to
     * describe how to display the selected tab.
     * @param {number} tabIndex - The index of the tab within the array of
     * displayed tabs.
     * @private
     * @returns {void}
     */
    _onTabSelected(tab, tabIndex) { // eslint-disable-line no-unused-vars
        this.setState({ selectedTab: tabIndex });
    }

    /**
     * Renders the tabs from the tab information passed on props.
     *
     * @returns {void}
     */
    _renderTabs() {
        const { t, tabs } = this.props;

        if (tabs.length === 1) {
            return this._renderTab({
                ...tabs[0],
                tabId: 0
            });
        }

        if (tabs.length > 1) {
            return (
                <Tabs
                    onSelect = { this._onTabSelected }
                    selected = { this.state.selectedTab }
                    tabs = {
                        tabs.map(({ component, label, styles }, idx) => {
                            return {
                                content: this._renderTab({
                                    component,
                                    styles,
                                    tabId: idx
                                }),
                                label: t(label)
                            };
                        })
                    } />);
        }

        logger.warn('No settings tabs configured to display.');

        return null;
    }

    /**
     * Renders a tab from the tab information passed as parameters.
     *
     * @param {Object} tabInfo - Information about the tab.
     * @returns {Component} - The tab.
     */
    _renderTab({ component, styles, tabId }) {
        const { closeDialog } = this.props;
        const TabComponent = component;

        return (
            <div className = { styles }>
                <TabComponent
                    closeDialog = { closeDialog }
                    mountCallback = { this.props.tabs[tabId].onMount }
                    onTabStateChange
                        = { this._onTabStateChange }
                    tabId = { tabId }
                    { ...this._getTabProps(tabId) } />
            </div>);
    }

    _onTabStateChange: (number, Object) => void;

    /**
     * Changes the state for a tab.
     *
     * @param {number} tabId - The id of the tab which state will be changed.
     * @param {Object} state - The new state.
     * @returns {void}
     */
    _onTabStateChange(tabId, state) {
        const tabStates = [ ...this.state.tabStates ];

        tabStates[tabId] = state;
        this.setState({ tabStates });
    }

    _onSubmit: () => void;

    /**
     * Submits the information filled in the dialog.
     *
     * @returns {void}
     */
    _onSubmit() {
        const { onSubmit, tabs } = this.props;

        tabs.forEach(({ submit }, idx) => {
            submit && submit(this.state.tabStates[idx]);
        });

        onSubmit();
    }
}

export default translate(DialogWithTabs);
