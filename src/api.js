// This file is for co-locating all API endpoints together as functions.
// Try to keep form validation/input validation logic out of here and only in input handlers and endpoint handlers on server, for simplicity's sake.

import { TransformationsEnum } from './server/fireflyOperations'

// TODO: inject at buildtime
const baseApiUrl = 'http://localhost:3000/api'

/**
 * @param {FormData} formData
 * @param {[string]} targets
 * @returns {Promise<JSON>}
 */
export async function uploadAsset(formData, targets) {
  try {
    // TODO: add query params conditionally depending on selected transforms
    const url = `${baseApiUrl}/upload?targets=${targets.join(',')}`
    const res = await fetch(url, {
      body: formData,
      method: 'POST',
    })
    if (!res.ok) {
      throw new Error('Response not ok')
    }
    return await res.json()
  } catch (e) {
    console.error(e)
  }
}

/**
 * Calls the "perform transformation" endpoint.
 * @param {JSON} inputData.transformationDict - A map containing add'l input parameters for transformations that need it.
 */
export async function performTransformation(transformation, inputData) {
  const { filename, inputImage } = inputData
  const transformationDict = inputData.transformationDict ?? {}

  try {
    const url = `${baseApiUrl}/transform/${transformation}?inputImage=${encodeURIComponent(inputImage)}&filename=${filename ?? ''}`
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(transformationDict),
    })
    if (!res.ok) {
      throw new Error('Response not ok')
    }
    return await res.json()
  } catch (e) {
    console.error(e)
  }
}
