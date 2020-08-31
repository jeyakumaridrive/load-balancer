// @flow

import { ReducerRegistry } from '../base/redux';

import { VIRTUAL_BACKGROUND_ENABLED, VIRTUAL_BACKGROUND_DISABLED } from './actionTypes';


ReducerRegistry.register('features/virtual-background', (state = {}, action) => {

    switch (action.type) {
    case VIRTUAL_BACKGROUND_ENABLED: {
        return {
            ...state,
            virtualBackgroundEnabled: true
        };
    }
    case VIRTUAL_BACKGROUND_DISABLED: {
        return {
            ...state,
            virtualBackgroundEnabled: false
        };
    }
    }

    return state;
});
