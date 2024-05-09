// Currently unused.
/**
 * Fetch external image and return as object URL.
 */
//export async function fetchExternalImage(url) {
//  const res = await fetch(encodeURIComponent(url))
//  return URL.createObjectURL(await res.blob())
//}

//import * as api from './api.js'
//
//export async function executeTransformationPipeline(transformations, initArgs) {
//  let { inputImage, filename, transformationDict } = initArgs
//  for (const transformation of transformations) {
//    try {
//      const res = await api.performTransformation(transformation, {
//        inputImage: inputImage,
//        filename: filename,
//        transformationsDict: transformationDict
//      })
//      inputImage = res.outputImage
//      filename = res.filename
//    } catch (e) {
//      console.error(e)
//    }
//  }
//
//  return {
//    // The final input image is actually the final output image
//    outputImage: inputImage,
//    filename: filename
//  }
//}
