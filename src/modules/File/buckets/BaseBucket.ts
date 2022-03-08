import Jimp from 'jimp/es';

class BaseBucket {
  async compressImageMultiple(
    bufferOrPath: Buffer | string | Jimp,
    qualities: number[],
  ) {
    const jimpInstance = await Jimp.read(bufferOrPath as any);
    return Promise.all(
      qualities.map(async quality => {
        return {
          quality,
          buffer: await this.compressImage(jimpInstance, quality),
        };
      }),
    );
  }

  async compressImage(bufferOrPath: Buffer | string | Jimp, quality: number) {
    // bufferOrPath can be: buffer, filepath or Jimp instance
    let jimpInstance = await Jimp.read(bufferOrPath as any);
    if (quality > 1) {
      jimpInstance = jimpInstance.resize(
        quality,
        Jimp.AUTO,
        Jimp.RESIZE_BEZIER,
      );
      jimpInstance = jimpInstance.quality(75);
    } else {
      jimpInstance = jimpInstance.resize(
        jimpInstance.bitmap.width * quality,
        jimpInstance.bitmap.height * quality,
        Jimp.RESIZE_BEZIER,
      );
      jimpInstance = jimpInstance.quality(quality * 100);
    }
    return jimpInstance.getBufferAsync(jimpInstance.getMIME());
  }
}

export default BaseBucket;
