// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconConnectionActive, IconSignalFull, IconConnectionInactive, IconSignalAverage } from '../../../base/icons';
import { JitsiParticipantConnectionStatus } from '../../../base/lib-jitsi-meet';
import { Popover } from '../../../base/popover';
import { ConnectionStatsTable } from '../../../connection-stats';

import AbstractConnectionIndicator, {
    INDICATOR_DISPLAY_THRESHOLD,
    type Props as AbstractProps,
    type State as AbstractState
} from '../AbstractConnectionIndicator';

declare var interfaceConfig: Object;

/**
 * An array of display configurations for the connection indicator and its bars.
 * The ordering is done specifically for faster iteration to find a matching
 * configuration to the current connection strength percentage.
 *
 * @type {Object[]}
 */
const QUALITY_TO_WIDTH: Array<Object> = [

    // Full (3 bars)
    {
        colorClass: 'status-high',
        percent: INDICATOR_DISPLAY_THRESHOLD,
        tip: 'connectionindicator.quality.good',
        width: '100%'
    },

    // 2 bars
    {
        colorClass: 'status-med',
        percent: 10,
        tip: 'connectionindicator.quality.nonoptimal',
        width: '66%'
    },

    // 1 bar
    {
        colorClass: 'status-low',
        percent: 0,
        tip: 'connectionindicator.quality.poor',
        width: '33%'
    }

    // Note: we never show 0 bars as long as there is a connection.
];

/**
 * The type of the React {@code Component} props of {@link ConnectionIndicator}.
 */
type Props = AbstractProps & {

    /**
     * Whether or not the component should ignore setting a visibility class for
     * hiding the component when the connection quality is not strong.
     */
    alwaysVisible: boolean,

    /**
     * The current condition of the user's connection, matching one of the
     * enumerated values in the library.
     */
    connectionStatus: string,

    /**
     * Whether or not clicking the indicator should display a popover for more
     * details.
     */
    enableStatsDisplay: boolean,

    /**
     * The font-size for the icon.
     */
    iconSize: number,

    /**
     * Whether or not the displays stats are for local video.
     */
    isLocalVideo: boolean,

    /**
     * Relative to the icon from where the popover for more connection details
     * should display.
     */
    statsPopoverPosition: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link ConnectionIndicator}.
 */
type State = AbstractState & {

    /**
     * Whether or not the popover content should display additional statistics.
     */
    showMoreStats: boolean
};

/**
 * Implements a React {@link Component} which displays the current connection
 * quality percentage and has a popover to show more detailed connection stats.
 *
 * @extends {Component}
 */
class ConnectionIndicator extends AbstractConnectionIndicator<Props, State> {
    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            autoHideTimeout: undefined,
            showIndicator: false,
            showMoreStats: false,
            stats: {}
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onToggleShowMore = this._onToggleShowMore.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const visibilityClass = this._getVisibilityClass();
        const rootClassNames = `indicator-container ${visibilityClass}`;

        const colorClass = this._getConnectionColorClass();
        const indicatorContainerClassNames
            = `connection-indicator indicator ${colorClass}`;

        return (
            <Popover
                className = { rootClassNames }
                content = { this._renderStatisticsTable() }
                disablePopover = { !this.props.enableStatsDisplay }
                position = { this.props.statsPopoverPosition }>
                <div className = 'popover-trigger'>
                    <div
                        className = { indicatorContainerClassNames }
                        style = {{ fontSize: this.props.iconSize }}>
                        <div className = 'connection indicatoricon'>
                            { this._renderIcon() }
                        </div>
                    </div>
                </div>
            </Popover>
        );
    }

    /**
     * Returns a CSS class that interprets the current connection status as a
     * color.
     *
     * @private
     * @returns {string}
     */
    _getConnectionColorClass() {
        const { connectionStatus } = this.props;
        const { percent } = this.state.stats;
        const { INACTIVE, INTERRUPTED } = JitsiParticipantConnectionStatus;

        if (connectionStatus === INACTIVE) {
            return 'status-other';
        } else if (connectionStatus === INTERRUPTED) {
            return 'status-lost';
        } else if (typeof percent === 'undefined') {
            return 'status-high';
        }

        return this._getDisplayConfiguration(percent).colorClass;
    }

    /**
     * Returns a string that describes the current connection status.
     *
     * @private
     * @returns {string}
     */
    _getConnectionStatusTip() {
        let tipKey;

        switch (this.props.connectionStatus) {
        case JitsiParticipantConnectionStatus.INTERRUPTED:
            tipKey = 'connectionindicator.quality.lost';
            break;

        case JitsiParticipantConnectionStatus.INACTIVE:
            tipKey = 'connectionindicator.quality.inactive';
            break;

        default: {
            const { percent } = this.state.stats;

            if (typeof percent === 'undefined') {
                // If percentage is undefined then there are no stats available
                // yet, likely because only a local connection has been
                // established so far. Assume a strong connection to start.
                tipKey = 'connectionindicator.quality.good';
            } else {
                const config = this._getDisplayConfiguration(percent);

                tipKey = config.tip;
            }
        }
        }

        return this.props.t(tipKey);
    }

    /**
     * Get the icon configuration from QUALITY_TO_WIDTH which has a percentage
     * that matches or exceeds the passed in percentage. The implementation
     * assumes QUALITY_TO_WIDTH is already sorted by highest to lowest
     * percentage.
     *
     * @param {number} percent - The connection percentage, out of 100, to find
     * the closest matching configuration for.
     * @private
     * @returns {Object}
     */
    _getDisplayConfiguration(percent: number): Object {
        return QUALITY_TO_WIDTH.find(x => percent >= x.percent) || {};
    }

    /**
     * Returns additional class names to add to the root of the component. The
     * class names are intended to be used for hiding or showing the indicator.
     *
     * @private
     * @returns {string}
     */
    _getVisibilityClass() {
        const { connectionStatus } = this.props;

        return  connectionStatus === JitsiParticipantConnectionStatus.INTERRUPTED
            || connectionStatus === JitsiParticipantConnectionStatus.INACTIVE
            ? 'show-connection-indicator' : 'hide-connection-indicator';
    }

    _onToggleShowMore: () => void;

    /**
     * Callback to invoke when the show more link in the popover content is
     * clicked. Sets the state which will determine if the popover should show
     * additional statistics about the connection.
     *
     * @returns {void}
     */
    _onToggleShowMore() {
        this.setState({ showMoreStats: !this.state.showMoreStats });
    }

    /**
     * Creates a ReactElement for displaying an icon that represents the current
     * connection quality.
     *
     * @returns {ReactElement}
     */
    _renderIcon() {
        if (this.props.connectionStatus
            === JitsiParticipantConnectionStatus.INACTIVE) {
            return (
                <span className = 'connection_ninja'>
                    <Icon
                        className = 'icon-ninja'
                        size = '1.5em'
                        src = { IconConnectionInactive } />
                </span>
            );
        }

        let iconWidth;
        let emptyIconWrapperClassName = 'connection_empty';
        

        if (this.props.connectionStatus
            === JitsiParticipantConnectionStatus.INTERRUPTED) {

            // emptyIconWrapperClassName is used by the torture tests to
            // identify lost connection status handling.
            emptyIconWrapperClassName = 'connection_lost';
            iconWidth = '0%';
        } else if (typeof this.state.stats.percent === 'undefined') {
            iconWidth = '100%';
        } else {
            const { percent } = this.state.stats;

            iconWidth = this._getDisplayConfiguration(percent).width;
        }

        return [
            <span
                className = { emptyIconWrapperClassName }
                key = 'icon-empty'>
                    <img src='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCA0MDIuNSAyNTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwMi41IDI1NjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9DQo8L3N0eWxlPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTYxLjIsMjU0LjlIMTIuN2MtNC40LDAtOC0zLjYtOC04di03Ni41YzAtNC40LDMuNi04LDgtOGg0OC41YzQuNCwwLDgsMy42LDgsOHY3Ni41DQoJQzY5LjIsMjUxLjMsNjUuNiwyNTQuOSw2MS4yLDI1NC45eiIvPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTE2My40LDI1NC44aC00OC41Yy00LjQsMC04LTMuNi04LTh2LTExM2MwLTQuNCwzLjYtOCw4LThoNDguNWM0LjQsMCw4LDMuNiw4LDh2MTEzDQoJQzE3MS40LDI1MS4yLDE2Ny44LDI1NC44LDE2My40LDI1NC44eiIvPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTI3NC42LDI1NS4xaC00OS45Yy00LDAtNy4zLTQuMS03LjMtOS4yVjY4LjZjMC01LDMuMy05LjIsNy4zLTkuMmg0OS45YzQsMCw3LjMsNC4xLDcuMyw5LjJ2MTc3LjMNCglDMjgxLjksMjUwLjksMjc4LjcsMjU1LjEsMjc0LjYsMjU1LjF6Ii8+DQo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMzg4LjQsMjU1LjFoLTQ4LjVjLTQuNCwwLTgtNC41LTgtMTBWMTIuOGMwLTUuNSwzLjYtMTAsOC0xMGg0OC41YzQuNCwwLDgsNC41LDgsMTBWMjQ1DQoJQzM5Ni40LDI1MC41LDM5Mi44LDI1NS4xLDM4OC40LDI1NS4xeiIvPg0KPC9zdmc+DQo=' />
            </span>,
            <span
                className = 'connection_full'
                key = 'icon-full'
                style = {{ width: iconWidth }}>
                    <img src='data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyMy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCA0MDIuNSAyNTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwMi41IDI1NjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9DQo8L3N0eWxlPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTYxLjIsMjU0LjlIMTIuN2MtNC40LDAtOC0zLjYtOC04di03Ni41YzAtNC40LDMuNi04LDgtOGg0OC41YzQuNCwwLDgsMy42LDgsOHY3Ni41DQoJQzY5LjIsMjUxLjMsNjUuNiwyNTQuOSw2MS4yLDI1NC45eiIvPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTE2My40LDI1NC44aC00OC41Yy00LjQsMC04LTMuNi04LTh2LTExM2MwLTQuNCwzLjYtOCw4LThoNDguNWM0LjQsMCw4LDMuNiw4LDh2MTEzDQoJQzE3MS40LDI1MS4yLDE2Ny44LDI1NC44LDE2My40LDI1NC44eiIvPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTI3NC42LDI1NS4xaC00OS45Yy00LDAtNy4zLTQuMS03LjMtOS4yVjY4LjZjMC01LDMuMy05LjIsNy4zLTkuMmg0OS45YzQsMCw3LjMsNC4xLDcuMyw5LjJ2MTc3LjMNCglDMjgxLjksMjUwLjksMjc4LjcsMjU1LjEsMjc0LjYsMjU1LjF6Ii8+DQo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMzg4LjQsMjU1LjFoLTQ4LjVjLTQuNCwwLTgtNC41LTgtMTBWMTIuOGMwLTUuNSwzLjYtMTAsOC0xMGg0OC41YzQuNCwwLDgsNC41LDgsMTBWMjQ1DQoJQzM5Ni40LDI1MC41LDM5Mi44LDI1NS4xLDM4OC40LDI1NS4xeiIvPg0KPC9zdmc+DQo=' />
            </span>
        ];
    }

    /**
     * Creates a {@code ConnectionStatisticsTable} instance.
     *
     * @returns {ReactElement}
     */
    _renderStatisticsTable() {
        const {
            bandwidth,
            bitrate,
            bridgeCount,
            e2eRtt,
            framerate,
            packetLoss,
            region,
            resolution,
            serverRegion,
            transport
        } = this.state.stats;

        return (
            <ConnectionStatsTable
                bandwidth = { bandwidth }
                bitrate = { bitrate }
                bridgeCount = { bridgeCount }
                connectionSummary = { this._getConnectionStatusTip() }
                e2eRtt = { e2eRtt }
                framerate = { framerate }
                isLocalVideo = { this.props.isLocalVideo }
                onShowMore = { this._onToggleShowMore }
                packetLoss = { packetLoss }
                region = { region }
                resolution = { resolution }
                serverRegion = { serverRegion }
                shouldShowMore = { this.state.showMoreStats }
                transport = { transport } />
        );
    }
}

export default translate(ConnectionIndicator);
