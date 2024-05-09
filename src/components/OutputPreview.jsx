/**
 * Should show original image when chosen, along with dimensions.
 * Should render DaisyUI Diff component when a transformed image is available from Firefly.
 */
export default function OutputPreview({
  selectedImageData,
  transformedImageData,
}) {
  return (
    <div className="basis-2/3">
      {selectedImageData !== null ? (
        <div className="mb-8">
          <p className="mb-2">Original: </p>
          {/* TODO: control for large images */}
          {/* We render the img tag here, instead of passing via the prop, because it's convenient to control its attributes (like onload) */}
          <img
            id="selected-image"
            src={selectedImageData.src}
            className="max-h-[80vh]"
          />
        </div>
      ) : null}
      {transformedImageData !== null ? (
        <div>
          <p className="mb-2">Transformed: </p>
          <img
            id="transformed-image"
            src={transformedImageData.src}
            className="max-h-[80vh]"
          />
        </div>
      ) : null}
    </div>
  )
}
