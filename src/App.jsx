import { useEffect, useState } from 'react'
import MainInput from './components/MainInput.jsx'
import OutputPreview from './components/OutputPreview.jsx'

function App() {
  // TODO: Too many state objects, getting unwieldy. Coalesce into reducer if time.
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImageData, setSelectedImageData] = useState(null)
  const [transformedImageData, setTransformedImageData] = useState(null)
  const [selectedTransformations, setSelectedTransformations] = useState([])

  // States governing input data for parameterized transformations (e.g. Which lightroom adjustments, and what values?)
  const [genExpandPrompt, setGenExpandPrompt] = useState(
    'A rusty red canyon in the American Southwest',
  )
  const [lightroomAdjustments, setLightroomAdjustments] = useState({})

  // For dev
  useEffect(() => {
    console.log(selectedImageData)
    console.log(selectedTransformations)
    console.log(lightroomAdjustments)
  }, [selectedImageData, selectedTransformations, lightroomAdjustments])

  // TODO: indicator that shows which transformations are being applied
  // TODO: indicator: "Refresh to reset transformations"
  return (
    <div className="p-4">
      <h1 className="text-4xl font-bold mb-8">Profile image generator</h1>
      <main className="flex flex-wrap gap-8">
        <MainInput
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          selectedImageData={selectedImageData}
          setSelectedImageData={setSelectedImageData}
          setTransformedImageData={setTransformedImageData}
          selectedTransformations={selectedTransformations}
          setSelectedTransformations={setSelectedTransformations}
          genExpandPrompt={genExpandPrompt}
          setGenExpandPrompt={setGenExpandPrompt}
          lightroomAdjustments={lightroomAdjustments}
          setLightroomAdjustments={setLightroomAdjustments}
        />
        <OutputPreview
          selectedImageData={selectedImageData}
          transformedImageData={transformedImageData}
        />
      </main>
    </div>
  )
}

export default App
