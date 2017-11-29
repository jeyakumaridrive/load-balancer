import PropTypes from 'prop-types';
import { Component } from 'react';

/**
 * Implements a React {@link Component} for suspended overlay. Shown when a
 * suspend is detected.
 */
export default class AbstractSuspendedOverlay extends Component {
    /**
     * {@code AbstractSuspendedOverlay} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The function to translate human-readable text.
         *
         * @public
         * @type {Function}
         */
        t: PropTypes.func
    };

    /**
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRender(state) {
        return state['features/overlay'].suspendDetected;
    }
}