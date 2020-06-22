// @flow

import throttle from 'lodash/throttle';
import type { Dispatch } from 'redux';

import {
    CLEAR_NOTIFICATIONS,
    HIDE_NOTIFICATION,
    SET_NOTIFICATIONS_ENABLED,
    SHOW_NOTIFICATION
} from './actionTypes';
import { NOTIFICATION_TIMEOUT, NOTIFICATION_TYPE } from './constants';

/**
 * Clears (removes) all the notifications.
 *
 * @returns {{
 *     type: CLEAR_NOTIFICATIONS
 * }}
 */
export function clearNotifications() {
    return {
        type: CLEAR_NOTIFICATIONS
    };
}

/**
 * Removes the notification with the passed in id.
 *
 * @param {string} uid - The unique identifier for the notification to be
 * removed.
 * @returns {{
 *     type: HIDE_NOTIFICATION,
 *     uid: number
 * }}
 */
export function hideNotification(uid: number) {
    return {
        type: HIDE_NOTIFICATION,
        uid
    };
}

/**
 * Stops notifications from being displayed.
 *
 * @param {boolean} enabled - Whether or not notifications should display.
 * @returns {{
 *     type: SET_NOTIFICATIONS_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setNotificationsEnabled(enabled: boolean) {
    return {
        type: SET_NOTIFICATIONS_ENABLED,
        enabled
    };
}

/**
 * Queues an error notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @returns {Object}
 */
export function showErrorNotification(props: Object) {
    return showNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.ERROR
    });
}

/**
 * Queues a notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @param {number} timeout - How long the notification should display before
 * automatically being hidden.
 * @returns {{
 *     type: SHOW_NOTIFICATION,
 *     props: Object,
 *     timeout: number,
 *     uid: number
 * }}
 */
export function showNotification(props: Object = {}, timeout: ?number) {
    return {
        type: SHOW_NOTIFICATION,
        props,
        timeout,
        uid: window.Date.now()
    };
}

/**
 * Queues a warning notification for display.
 *
 * @param {Object} props - The props needed to show the notification component.
 * @returns {Object}
 */
export function showWarningNotification(props: Object) {
    return showNotification({
        ...props,
        appearance: NOTIFICATION_TYPE.WARNING
    });
}

/**
 * An array of names of participants that have joined the conference. The array
 * is replaced with an empty array as notifications are displayed.
 *
 * @private
 * @type {string[]}
 */
let joinedParticipantsNames = [];

/**
 * A throttled internal function that takes the internal list of participant
 * names, {@code joinedParticipantsNames}, and triggers the display of a
 * notification informing of their joining.
 *
 * @private
 * @type {Function}
 */
const _throttledNotifyParticipantConnected = throttle((dispatch: Dispatch<any>) => {
    const joinedParticipantsCount = joinedParticipantsNames.length;

    let notificationProps;
    let participant_name = joinedParticipantsNames[0] != '' && joinedParticipantsNames[0].match(/^[0-9]+$/) != null && joinedParticipantsNames[0].match(/^[0-9]+$/).length > 0 ? joinedParticipantsNames[0].toString().replace(/^(.{5})(.*)(.{1})$/, "$1*****$3") : joinedParticipantsNames[0];

    if (joinedParticipantsCount >= 3) {
        // notificationProps = {
        //     titleArguments: {
        //         name: participant_name,
        //         count: joinedParticipantsCount - 1
        //     },
        //     titleKey: 'notify.connectedThreePlusMembers',
        //     descriptionKey: 'others joined this meeting',
        //     logoIconCustom: participant_name
        // };
    } else if (joinedParticipantsCount === 2) {
        // notificationProps = {
        //     titleArguments: {
        //         first: participant_name,
        //         second: joinedParticipantsNames[1] != '' && joinedParticipantsNames[1].match(/^[0-9]+$/) != null && joinedParticipantsNames[1].match(/^[0-9]+$/).length > 0 ? joinedParticipantsNames[1].toString().replace(/^(.{5})(.*)(.{1})$/, "$1*****$3") : joinedParticipantsNames[1]
        //     },
        //     titleKey: 'notify.connectedTwoMembers',
        //     descriptionKey: 'notify.connectedOneMember',
        //     logoIconCustom: participant_name
        // };
    } else if (joinedParticipantsCount) {
        var cDDc = document.getElementById("true-joining").value;
        if(cDDc == 0 || cDDc == '0')
        {
            notificationProps = {
                titleArguments: {
                    name: participant_name
                },
                titleKey: participant_name,
                descriptionKey: 'notify.connectedOneMember',
                logoIconCustom: participant_name
            };
        }
    }

    if (notificationProps) {
        dispatch(
            showNotification(notificationProps, NOTIFICATION_TIMEOUT));
    }

    joinedParticipantsNames = [];

}, 500, { leading: false });

/**
 * Queues the display of a notification of a participant having connected to
 * the meeting. The notifications are batched so that quick consecutive
 * connection events are shown in one notification.
 *
 * @param {string} displayName - The name of the participant that connected.
 * @returns {Function}
 */
export function showParticipantJoinedNotification(displayName: string) {
    joinedParticipantsNames.push(displayName);

    return (dispatch: Dispatch<any>) => _throttledNotifyParticipantConnected(dispatch);
}
