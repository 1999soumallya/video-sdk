import _ from "lodash"
import { useState, useCallback, useRef, useEffect } from "react"
import { useSizeCallback, useMount } from "../../../hooks"
export function useCanvasDimension(mediaStream, videoRef) {
  const [dimension, setDimension] = useState({ width: 0, height: 0 })
  const debounceRef = useRef(_.debounce(setDimension, 0))
  const onCanvasResize = useCallback(
    ({ width, height }) => {
      if (videoRef) {
        debounceRef.current({ width, height })
      }
    },
    [videoRef]
  )
  useSizeCallback(videoRef.current, onCanvasResize)
  useMount(() => {
    if (videoRef.current) {
      const { width, height } = videoRef.current.getBoundingClientRect()
      setDimension({ width, height })
    }
  })
  useEffect(() => {
    const { width, height } = dimension
    try {
      if (videoRef.current) {
        videoRef.current.width = width
        videoRef.current.height = height
      }
    } catch (e) {
      mediaStream?.updateVideoCanvasDimension(videoRef.current, width, height)
    }
  }, [mediaStream, dimension, videoRef])
  return dimension
}
