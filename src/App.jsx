import {
  useEffect,
  useContext,
  useState,
  useCallback,
  useReducer,
  useMemo
} from "react"
import ZoomVideo, { ConnectionState, ReconnectReason } from "@zoom/videosdk"
import { message, Modal } from "antd"
// import "antd/dist/antd.min.css"
import { produce } from "immer"
import VideoSingle from "./feature/video/video-single"
import VideoAttach from "./feature/video/video-attach"
import ZoomContext from "./context/zoom-context"
import ZoomMediaContext from "./context/media-context"
import LoadingLayer from "./component/loading-layer"
import "./App.css"
import axios from "axios"

const mediaShape = {
  audio: {
    encode: false,
    decode: false
  },
  video: {
    encode: false,
    decode: false
  },
  share: {
    encode: false,
    decode: false
  }
}

const mediaReducer = produce((draft, action) => {
  switch (action.type) {
    case "audio-encode": {
      draft.audio.encode = action.payload
      break
    }
    case "audio-decode": {
      draft.audio.decode = action.payload
      break
    }
    case "video-encode": {
      draft.video.encode = action.payload
      break
    }
    case "video-decode": {
      draft.video.decode = action.payload
      break
    }
    case "share-encode": {
      draft.share.encode = action.payload
      break
    }
    case "share-decode": {
      draft.share.decode = action.payload
      break
    }
    case "reset-media": {
      Object.assign(draft, { ...mediaShape })
      break
    }
    default:
      break
  }
}, mediaShape)

function App(props) {
  const { meetingArgs: { enforceGalleryView, enforceVB, lang } } = props

  const [loading, setIsLoading] = useState(true)
  const [loadingText, setLoadingText] = useState("")

  const [isFaiLover, setIsFaiLover] = useState(false)
  const [status, setStatus] = useState("closed")
  const [mediaState, dispatch] = useReducer(mediaReducer, mediaShape)
  const [mediaStream, setMediaStream] = useState(null)
  const [isSupportGalleryView, setIsSupportGalleryView] = useState(false)
  const zmClient = useContext(ZoomContext)

  let webEndpoint = window?.webEndpoint ?? "zoom.us"

  const mediaContext = useMemo(() => ({ ...mediaState, mediaStream }), [
    mediaState,
    mediaStream
  ])

  const galleryViewWithoutSAB = Number(enforceGalleryView) === 1 && !window.crossOriginIsolated
  const vbWithoutSAB = Number(enforceVB) === 1 && !window.crossOriginIsolated

  useEffect(() => {
    const init = async () => {
      await zmClient.init("en-US", `${window.location.origin}/lib`, {
        webEndpoint,
        enforceMultipleVideos: galleryViewWithoutSAB,
        enforceVirtualBackground: vbWithoutSAB,
        stayAwake: true,
        patchJsMedia: true,
        leaveOnPageUnload: false
      })
      try {
        setLoadingText("Joining the session...")
        const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmdWxsTmFtZSI6IlNvdW1hbGx5YSBEZXkiLCJ1c2VyVW5pcXVlSWQiOiIzZDM0MzA4Mi03Y2NiLTRhMmYtYjY3MS0xN2Q1MzYxN2QwNDciLCJlbWFpbCI6InNvdW1hbGx5YV9pbnN0dWN0dXJlQHlvcG1haWwuY29tIiwicm9sZSI6IklOU1RSVUNUT1IiLCJpYXQiOjE3MjA4MDAyNDIsImV4cCI6MTcyMDg4NjY0Mn0._klB7DcPRcV8TSdneLQFcJb8dlsvC5wvXN6bek2tA4E`
        const response = await axios.post(
          "https://devapigatewayservice.lightforth.org/live-class/createVideoSdkToken",
          { classId: "ecca911a-04a2-4c70-a746-03895b4e595a" },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        await zmClient.join(
          response.data.data.sessionName,
          response.data.data.token,
          "Soumallya Dey",
          "123"
        )
        const stream = zmClient.getMediaStream()
        setMediaStream(stream)
        console.log(stream.isSupportMultipleVideos())
        setIsSupportGalleryView(stream.isSupportMultipleVideos())
        setIsLoading(false)
      } catch (e) {
        setIsLoading(false)
        message.error(e.reason)
      }
    }
    init()
    return () => {
      ZoomVideo.destroyClient()
    }
  }, [zmClient, webEndpoint, galleryViewWithoutSAB, lang, vbWithoutSAB])

  const onConnectionChange = useCallback(
    ({ reason, subsessionName, state }) => {
      if (state === ConnectionState.Reconnecting) {
        setIsLoading(true)
        setIsFaiLover(true)
        setStatus("connecting")
        if (reason === ReconnectReason.Failover) {
          setLoadingText("Session Disconnected,Try to reconnect")
        } else if (
          reason === ReconnectReason.JoinSubsession ||
          reason === ReconnectReason.MoveToSubsession
        ) {
          setLoadingText(`Joining ${subsessionName}...`)
        } else if (reason === ReconnectReason.BackToMainSession) {
          setLoadingText("Returning to Main Session...")
        }
      } else if (state === ConnectionState.Connected) {
        setStatus("connected")
        if (isFaiLover) {
          setIsLoading(false)
        }
        window.zmClient = zmClient
        window.mediaStream = zmClient.getMediaStream()
      } else if (state === ConnectionState.Closed) {
        setStatus("closed")
        dispatch({ type: "reset-media" })
        if (reason === "ended by host") {
          Modal.warning({
            title: "Meeting ended",
            content: "This meeting has been ended by host"
          })
        }
      }
    },
    [isFaiLover, zmClient]
  )

  const onMediaSDKChange = useCallback(({ action, type, result }) => {
    dispatch({ type: `${type}-${action}`, payload: result === "success" })
  }, [])

  const onLeaveOrJoinSession = useCallback(async () => {
    if (status === "closed") {
      setIsLoading(true)

      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmdWxsTmFtZSI6IlNvdW1hbGx5YSBEZXkiLCJ1c2VyVW5pcXVlSWQiOiIzZDM0MzA4Mi03Y2NiLTRhMmYtYjY3MS0xN2Q1MzYxN2QwNDciLCJlbWFpbCI6InNvdW1hbGx5YV9pbnN0dWN0dXJlQHlvcG1haWwuY29tIiwicm9sZSI6IklOU1RSVUNUT1IiLCJpYXQiOjE3MjA4MDAyNDIsImV4cCI6MTcyMDg4NjY0Mn0._klB7DcPRcV8TSdneLQFcJb8dlsvC5wvXN6bek2tA4E`
      const response = await axios.post(
        "https://devapigatewayservice.lightforth.org/live-class/createVideoSdkToken",
        { classId: "19c270de-e468-4a5e-90e2-a595b50c2b0b" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await zmClient.join(
        response.data.data.sessionName,
        response.data.data.token,
        "Soumallya Dey",
        "123"
      )

      setIsLoading(false)
    } else if (status === "connected") {
      await zmClient.leave()
      message.warn("You have left the session.")
    }
  }, [zmClient, status])

  useEffect(() => {
    zmClient.on("connection-change", onConnectionChange)
    zmClient.on("media-sdk-change", onMediaSDKChange)
    return () => {
      zmClient.off("connection-change", onConnectionChange)
      zmClient.off("media-sdk-change", onMediaSDKChange)
    }
  }, [zmClient, onConnectionChange, onMediaSDKChange])

  return (
    <div className="App">
      {loading && <LoadingLayer content={loadingText} />}
      {!loading && (
        <ZoomMediaContext.Provider value={mediaContext}>
          {isSupportGalleryView ? <VideoAttach /> : <VideoSingle />}
        </ZoomMediaContext.Provider>
      )}
    </div>
  )
}

export default App
