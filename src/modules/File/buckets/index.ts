import AzureBucket from './AzureBucket';

const buckets = {
  azure: AzureBucket,
};

class BucketManager {
  buckets: { [name: string]: StorageBucket };
  defaultBucketType = process.env.BUCKET_TYPE_DEFAULT;

  constructor() {
    // setups
    this.buckets = {};
    Object.keys(buckets).forEach((bucketKey) => {
      const BucketClass = buckets[bucketKey];

      this.buckets[bucketKey] = new BucketClass();
    });
  }

  setDefaultBucketType = (_defaultBucketType: string) => {
    if (!Object.keys(this.buckets).includes(_defaultBucketType)) {
      throw new Error(`bucket type '${_defaultBucketType}' not found`);
    }
    this.defaultBucketType = _defaultBucketType;
  };

  getDefaultBucket = () => {
    return this.buckets[this.defaultBucketType];
  };
}

const bucketManager = new BucketManager();

export default bucketManager;
