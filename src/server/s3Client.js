const s3ClientConfig = {
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: 'us-east-1', // Mandatory is us-east-1 when using S3 client with DO
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
}

export { s3ClientConfig }
