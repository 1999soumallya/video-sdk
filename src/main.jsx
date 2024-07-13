import React from "react"
import { createRoot } from "react-dom/client"
import ZoomVideo from "@zoom/videosdk"
import "./index.css"
import App from "./App"
import ZoomContext from "./context/zoom-context"
import { b64DecodeUnicode } from "./utils/util"

let meetingArgs = Object.fromEntries(new URLSearchParams(location.search))

if (meetingArgs.web && meetingArgs.web !== "0") {
  ["topic", "name", "password", "sessionKey", "userIdentity"].forEach(
    field => {
      if (Object.hasOwn(meetingArgs, field)) {
        try {
          meetingArgs[field] = b64DecodeUnicode(meetingArgs[field])
        } catch (e) {
          console.log("ingore base64 decode", field, meetingArgs[field])
        }
      }
    }
  )
  if (meetingArgs.role) {
    meetingArgs.role = parseInt(meetingArgs.role, 10)
  } else {
    meetingArgs.role = 1
  }
}
// enforce use <video> tag render video, https://marketplacefront.zoom.us/sdk/custom/web/modules/Stream.html#attachVideo
meetingArgs.useVideoPlayer = 1;

[
  "enforceGalleryView",
  "enforceVB",
  "cloud_recording_option",
  "cloud_recording_election"
].forEach(field => {
  if (Object.hasOwn(meetingArgs, field)) {
    try {
      meetingArgs[field] = Number(meetingArgs[field])
    } catch (e) {
      meetingArgs[field] = 0
    }
  }
})
if (meetingArgs?.telemetry_tracking_id) {
  try {
    meetingArgs.telemetry_tracking_id = b64DecodeUnicode(
      meetingArgs.telemetry_tracking_id
    )
  } catch (e) {
    console.log("ingore base64 decode", meetingArgs.telemetry_tracking_id)
  }
} else {
  meetingArgs.telemetry_tracking_id = ""
}

const zmClient = ZoomVideo.createClient()
const root = createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <ZoomContext.Provider value={zmClient}>
      <App meetingArgs={meetingArgs} />
    </ZoomContext.Provider>
  </React.StrictMode>
)
