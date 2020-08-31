// @flow

import * as bodyPix from '@tensorflow-models/body-pix';

import JitsiStreamVirtualBackgroundEffect from './JitsiStreamVirtualBackgroundEffect';

/**
 * Creates a new instance of JitsiStreamVirtualBackgroundEffect. This loads the bodyPix model that is used to
 * extract person segmentation.
 *
 * @returns {Promise<JitsiStreamVirtualBackgroundEffect>}
 */
export async function createVirtualBackgroundEffect() {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamVirtualBackgroundEffect not supported!');
    }

    // An output stride of 16 and a multiplier of 0.5 are used for improved
    // performance on a larger range of CPUs.
    const bpModel = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
    });

    return new JitsiStreamVirtualBackgroundEffect(bpModel);
}
