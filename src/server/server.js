// TODO: error handling route
import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import cors from '@fastify/cors'
import { s3ClientConfig } from './s3Client.js'
import { GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { TransformationsEnum } from './fireflyOperations.js'
import { PhotoshopClient } from '@adobe/photoshop-apis'
import { FireflyClient } from '@adobe/firefly-apis'
import { LightroomClient } from '@adobe/lightroom-apis'
import createFFClientConfig from './ffServicesClient.js'
import { appendToFilename, createUniqueObjectKey } from './utils.js'

const fastify = Fastify({
  logger: true,
})

fastify.register(cors, {})
// https://github.com/fastify/fastify-multipart
fastify.register(multipart)

/**
 * Healthcheck
 */
fastify.get('/', function (request, reply) {
  reply.send('ok')
})

/**
 * Upload original asset for later processing via Firefly Services API.
 */
fastify.post('/api/upload', async function (request, reply) {
  const data = await request.file()
  const buffer = await data.toBuffer()

  const { targets } = request.query // e.g. `external,firefly`
  const uploadTargets = targets.split(',')

  const replyObject = {
    external: {},
    firefly: {},
  }

  // TODO: Promise.all to send these off in parallel
  if (uploadTargets.includes('external')) {
    const objectKey = createUniqueObjectKey(data.filename)

    /** @type string */
    let presignedUrlForRead = ''
    try {
      const putCommand = new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: objectKey,
        Body: buffer,
      })

      await new S3(s3ClientConfig).send(putCommand)

      // A get command instance specifically for generating a presigned URL
      const getCommand = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: objectKey,
      })

      presignedUrlForRead = await getSignedUrl(
        new S3(s3ClientConfig),
        getCommand,
        { expiresIn: 3600 },
      )

      replyObject.external.presignedUrlForRead = presignedUrlForRead
      replyObject.external.uploadedFilename = objectKey
    } catch (e) {
      console.error(e)
    }
  }

  if (uploadTargets.includes('firefly')) {
    const ffClientConfig = createFFClientConfig(
      process.env.FF_CLIENT_ID,
      process.env.FF_CLIENT_SECRET,
      process.env.FF_SCOPES,
    )
    const fireflyClient = new FireflyClient(ffClientConfig)

    try {
      const fireflyUploadRes = await fireflyClient.upload(
        new Blob([buffer], {
          type: data.mimetype,
        }),
      )
      console.debug(fireflyUploadRes.result)

      replyObject.firefly.uploadedId = fireflyUploadRes.result.images?.[0].id
    } catch (e) {
      console.error(e)
    }
  }

  reply.send(replyObject)
})

// TODO: Not DRY enough
fastify.post('/api/transform/:transformation', async function (request, reply) {
  const { transformation } = request.params
  const { inputImage } = request.query
  const { filename } = request.query

  const ffClientConfig = createFFClientConfig(
    process.env.FF_CLIENT_ID,
    process.env.FF_CLIENT_SECRET,
    process.env.FF_SCOPES,
  )

  if (transformation === TransformationsEnum.removeBackground) {
    try {
      const transformedObjectKey = appendToFilename(filename, '_bgRemoved')
      const photoshopClient = new PhotoshopClient(ffClientConfig)
      const putCommand = new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: transformedObjectKey,
      })
      const presignedUrlForPut = await getSignedUrl(
        new S3(s3ClientConfig),
        putCommand,
        { expiresIn: 3600 },
      )

      await photoshopClient.removeBackground({
        input: {
          href: decodeURIComponent(inputImage),
          storage: 'external',
        },
        output: {
          href: presignedUrlForPut,
          storage: 'external',
        },
      })

      // TODO: Poll job id given in above removeBackgroundOpRes using setInterval
      // ...or not? It seems like it's completed inside the original request lifecycle, contrary to what it says in Adobe docs.

      // Provide client with presigned read URL for download
      const getCommand = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: transformedObjectKey,
      })

      const presignedUrlForRead = await getSignedUrl(
        new S3(s3ClientConfig),
        getCommand,
        { expiresIn: 3600 },
      )

      reply.send({
        message: 'success',
        outputImage: presignedUrlForRead,
        filename: transformedObjectKey,
        transformationsDict: request.body,
      })
    } catch (e) {
      console.error(e)
    }
  } else if (transformation === TransformationsEnum.generativeExpand) {
    try {
      const ffClientConfig = createFFClientConfig(
        process.env.FF_CLIENT_ID,
        process.env.FF_CLIENT_SECRET,
        process.env.FF_SCOPES,
      )
      const fireflyClient = new FireflyClient(ffClientConfig)

      // TODO: get rid of hard-coded values for testing
      const expandImageResponse = await fireflyClient.expandImage({
        prompt: request.body[TransformationsEnum.generativeExpand]['prompt'],
        image: {
          id: inputImage,
        },
        size: {
          width: 1024,
          height: 1408,
        },
      })

      reply.send({
        message: 'success',
        outputImage: expandImageResponse.result.images[0].image.presignedUrl,
        filename: filename,
        transformationsDict: request.body,
      })
    } catch (e) {
      console.error(e)
    }
  } else if (transformation === TransformationsEnum.lightroomAdjustments) {
    const transformedObjectKey = appendToFilename(
      filename,
      '_lightroomEditsApplied',
    )
    const lightroomClient = new LightroomClient(ffClientConfig)
    const putCommand = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: transformedObjectKey,
    })
    const presignedUrlForPut = await getSignedUrl(
      new S3(s3ClientConfig),
      putCommand,
      { expiresIn: 3600 },
    )

    try {
      console.debug(request.body)
      const lightroomTransformationRes = await lightroomClient.applyEdits({
        inputs: {
          source: {
            storage: 'external',
            href: decodeURIComponent(inputImage),
          },
        },
        outputs: [
          {
            storage: 'external',
            href: presignedUrlForPut,
            type: 'image/jpeg',
          },
        ],
        options: {
          //...request.body[TransformationsEnum.lightroomAdjustments]
          Exposure: 50,
          Contrast: 50,
        },
      })
      console.debug(lightroomTransformationRes)
    } catch (e) {
      console.error(e)
    }

    // Provide client with presigned read URL for download
    const getCommand = new GetObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: transformedObjectKey,
    })

    const presignedUrlForRead = await getSignedUrl(
      new S3(s3ClientConfig),
      getCommand,
      { expiresIn: 3600 },
    )

    reply.send({
      message: 'success',
      outputImage: presignedUrlForRead,
      filename: transformedObjectKey,
      transformationsDict: request.body,
    })
  } else {
    // No match case, throw error 'undefined operation'
  }
})

// Listener
fastify.listen({ port: 3000 }, function (err, _address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  // Server is now listening on ${address}
})
