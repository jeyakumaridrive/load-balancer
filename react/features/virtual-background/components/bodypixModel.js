import * as bodyPix from '@tensorflow-models/body-pix';

export async function createbodypixModel() {
    
    // An output stride of 16 and a multiplier of 0.5 are used for improved
    // performance on a larger range of CPUs.
    const bpModel = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
    });

    return bpModel;
}