// @flow

import { getVirtualBackgroundEffect } from '../../virtual-background';
import { getBlurEffect } from '../../blur';
import { createScreenshotCaptureEffect } from '../../stream-effects/screenshot-capture';

import logger from './logger';

/**
 * Loads the enabled stream effects.
 *
 * @param {Object} store - The Redux store.
 * @returns {Promsie} - A Promise which resolves when all effects are created.
 */
export default function loadEffects(store: Object): Promise<any> {
    const state = store.getState();

    const virtualBackgroundPromise = state['features/virtual-background'].virtualBackgroundEnabled
        ? getVirtualBackgroundEffect()
            .catch(error => {
                logger.error('Failed to obtain the virtual background effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();
    const blurPromise = state['features/blur'].blurEnabled
        ? getBlurEffect()
            .catch(error => {
                logger.error('Failed to obtain the blur effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();
    const screenshotCapturePromise = state['features/screenshot-capture']?.capturesEnabled
        ? createScreenshotCaptureEffect(state)
            .catch(error => {
                logger.error('Failed to obtain the screenshot capture effect effect instance with error: ', error);

                return Promise.resolve();
            })
        : Promise.resolve();

    return Promise.all([ virtualBackgroundPromise, blurPromise, screenshotCapturePromise ]);
}
