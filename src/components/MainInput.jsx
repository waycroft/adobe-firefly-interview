import * as api from '../api.js'
import { TransformationsEnum } from '../server/fireflyOperations.js'

export default function MainInput({
  isLoading,
  setIsLoading,
  selectedImageData,
  setSelectedImageData,
  setTransformedImageData,
  selectedTransformations,
  setSelectedTransformations,
  genExpandPrompt,
  setGenExpandPrompt,
  lightroomAdjustments,
  setLightroomAdjustments,
}) {
  // For file select component
  const imageSelectHandler = (e) => {
    const file = e.target.files[0]
    if (file instanceof File) {
      // Make sure the OutputPreview component can render the image
      setSelectedImageData({
        name: file.name,
        size: file.size,
        type: file.type,
        src: URL.createObjectURL(file),
      })
    }
  }

  // TODO: Generalize/abstract this, not coupling directly to <input> names (not very DRY)
  const selectTransformationHandler = (e) => {
    if (e.target instanceof HTMLInputElement === false) {
      return
    }
    /** @type {HTMLInputElement} */
    const inputElement = e.target
    if (
      inputElement.name ===
      `transformation__${TransformationsEnum.removeBackground}`
    ) {
      if (inputElement.checked) {
        setSelectedTransformations((prev) => {
          return [...prev, TransformationsEnum.removeBackground]
        })
      } else {
        setSelectedTransformations((prev) => {
          const indexOfTransformation = prev.findIndex(
            (elem) => elem === TransformationsEnum.removeBackground,
          )
          return prev.toSpliced(indexOfTransformation, 1)
        })
      }
    }
    if (
      inputElement.name ===
      `transformation__${TransformationsEnum.generativeExpand}`
    ) {
      if (inputElement.checked) {
        setSelectedTransformations((prev) => {
          return [...prev, TransformationsEnum.generativeExpand]
        })
      } else {
        setSelectedTransformations((prev) => {
          const indexOfTransformation = prev.findIndex(
            (elem) => elem === TransformationsEnum.generativeExpand,
          )
          return prev.toSpliced(indexOfTransformation, 1)
        })
      }
    }
    if (
      inputElement.name ===
      `transformation__${TransformationsEnum.lightroomAdjustments}`
    ) {
      if (inputElement.checked) {
        setSelectedTransformations((prev) => {
          return [...prev, TransformationsEnum.lightroomAdjustments]
        })
      } else {
        setSelectedTransformations((prev) => {
          const indexOfTransformation = prev.findIndex(
            (elem) => elem === TransformationsEnum.lightroomAdjustments,
          )
          return prev.toSpliced(indexOfTransformation, 1)
        })
      }
    }
  }

  /**
   * For transformations that require additional input parameter data.
   * (I.e. unlike a simple yes/no, like 'remove background')
   * This is NOT the ideal approach to collating this data, but due to time constraints, works for now.
   * Ideally, all transformation selections in the client have a dedicated reducer which not only signals which transformations the user wants, but also in which specific order, along with parameters that each requires.
   */
  function collateRequiredTransformationParameters(transformations) {
    const transformationsParamsDict = {}
    for (const transformation of transformations) {
      if (transformation === TransformationsEnum.generativeExpand) {
        transformationsParamsDict[TransformationsEnum.generativeExpand] = {
          prompt: genExpandPrompt,
        }
      } else if (transformation === TransformationsEnum.lightroomAdjustments) {
        transformationsParamsDict[TransformationsEnum.lightroomAdjustments] = {
          ...lightroomAdjustments,
        }
      }
    }
    console.debug('transformationsParamsDict: ', transformationsParamsDict)
    return transformationsParamsDict
  }

  // For final submission of upload/transformations (whole form submission)
  const submitHandler = async (e) => {
    // TODO: Handle no files selected
    //
    setIsLoading(true)
    e.preventDefault()

    const formElement = e.target
    const formData = new FormData(formElement)

    let transformationsRequested = selectedTransformations.length > 0
    if (transformationsRequested) {
      // When the user submits the form, signaling they've decided on their asset and their desired transformations, we first upload the asset, storing it into block storage target(s) as necessary (based on transforms), get information back about the upload operation, which we then utilize in the transformations step.
      let uploadRes
      try {
        uploadRes = await api.uploadAsset(formData, [
          'external',
          selectedTransformations.includes(TransformationsEnum.generativeExpand)
            ? 'firefly'
            : '',
        ])
        console.debug(uploadRes)
      } catch (e) {
        console.error(e)
      }

      try {
        // TODO: On hold: Need to sort this out after OutputViewer
        //const transformationPipelineResult = await executeTransformationPipeline(
        //  selectedTransformations,
        //  {
        //    inputImage: uploadRes.external.presignedUrlForRead,
        //    filename: uploadRes.external.uploadedFilename,
        //    transformationsDict: collateRequiredTransformationParameters(selectedTransformations)
        //  }
        //)
        //
        const transformationsRes = await api.performTransformation(
          selectedTransformations[0], // TODO
          {
            filename: uploadRes.external.uploadedFilename,
            inputImage: uploadRes.external.presignedUrlForRead,
            transformationsDict: collateRequiredTransformationParameters(
              selectedTransformations,
            ),
          },
          //{
          //  filename: uploadRes.firefly.uploadedFilename,
          //  inputImage: uploadRes.firefly.uploadedId,
          //  transformationsDict: collateRequiredTransformationParameters(selectedTransformations)
          //}
        )
        console.debug(transformationsRes)
        console.debug('Transformation(s) complete.')

        // Renders the transformed image returned back from Adobe APIs
        setTransformedImageData({
          src: transformationsRes.outputImage,
        })
        setIsLoading(false)
      } catch (e) {
        console.error(e)
      }
    } else {
      // TODO: Throw warning to the client: No transforms selected! (So it won't upload anything)
    }
  }

  return (
    <div className="">
      <form onSubmit={submitHandler} className="flex flex-col gap-2 basis-1/3">
        <fieldset className="flex flex-col gap-2 mb-8">
          <label htmlFor="uploaded-asset" className="font-bold my-2">
            Choose file to upload
          </label>
          <input
            type="file"
            name="uploaded-asset"
            accept="image/jpeg, image/png, image/tiff" // These are what's accepted by Photoshop API
            onChange={imageSelectHandler}
          />
        </fieldset>
        <p className="font-bold">Transformations to apply:</p>
        <fieldset>
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Remove background</span>
              <input
                type="checkbox"
                className="checkbox"
                name={`transformation__${TransformationsEnum.removeBackground}`}
                onChange={selectTransformationHandler}
              />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <div className="collapse collapse-plus bg-base-200">
            <input
              type="checkbox"
              name={`transformation__${TransformationsEnum.generativeExpand}`}
              onChange={selectTransformationHandler}
            />
            <div className="collapse-title label-text font-medium">
              Use AI to expand image
            </div>
            <div className="collapse-content flex flex-col gap-2">
              <label className="input input-bordered flex items-center gap-2">
                Prompt
                <input
                  type="text"
                  className="grow"
                  defaultValue="A rusty red canyon in Utah"
                  onChange={(e) => setGenExpandPrompt(e.target.value)}
                />
              </label>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Square</span>
                  <input
                    type="radio"
                    name="radio-10"
                    className="radio radio-primary"
                    checked
                  />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Portrait</span>
                  <input
                    type="radio"
                    name="radio-10"
                    className="radio radio-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <div className="collapse collapse-plus bg-base-200">
            <input
              type="checkbox"
              name={`transformation__${TransformationsEnum.lightroomAdjustments}`}
              onChange={selectTransformationHandler}
            />
            <div className="collapse-title label-text font-medium">
              Photo adjustments
            </div>
            <div className="collapse-content flex flex-col gap-2">
              {/* TODO */}
              <label className="input input-bordered flex items-center gap-2">
                Exposure
                <input
                  type="number"
                  className="grow"
                  defaultValue={0}
                  onChange={(e) =>
                    setLightroomAdjustments((prev) => {
                      return {
                        ...prev,
                        exposure: e.target.value,
                      }
                    })
                  }
                />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                Contrast
                <input
                  type="number"
                  className="grow"
                  defaultValue={0}
                  onChange={(e) =>
                    setLightroomAdjustments((prev) => {
                      return {
                        ...prev,
                        contrast: e.target.value,
                      }
                    })
                  }
                />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                Saturation
                <input
                  type="number"
                  className="grow"
                  defaultValue={0}
                  onChange={(e) =>
                    setLightroomAdjustments((prev) => {
                      return {
                        ...prev,
                        saturation: e.target.value,
                      }
                    })
                  }
                />
              </label>
            </div>
          </div>
        </fieldset>
        <button type="submit" className="btn btn-primary">
          {isLoading ? 'Working...' : 'Transform'}
        </button>
      </form>
    </div>
  )
}
