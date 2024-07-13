import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import classnames from 'classnames';
import _ from 'lodash';
// import { RouteComponentProps } from 'react-router-dom';
import { VideoQuality } from '@zoom/videosdk';
import ZoomContext from '../../context/zoom-context';
import ZoomMediaContext from '../../context/media-context';
import AvatarActionContext from './context/avatar-context';
import ShareView from './components/share-view';
import VideoFooter from './components/video-footer';
import ReportBtn from './components/report-btn';
import Avatar from './components/avatar';
import { useActiveVideo } from './hooks/useAvtiveVideo';
import { useAvatarAction } from './hooks/useAvatarAction';
import { useNetworkQuality } from './hooks/useNetworkQuality';
import { useParticipantsChange } from './hooks/useParticipantsChange';
import { useOrientation, usePrevious } from '../../hooks';
import { useVideoAspect } from './hooks/useVideoAspectRatio';
import { Radio } from 'antd';

const VideoContainer = () => {
  const zmClient = useContext(ZoomContext)
  const { mediaStream } = useContext(ZoomMediaContext)
  const shareViewRef = useRef(null)
  const videoPlayerListRef = useRef({})
  const [isRecieveSharing, setIsRecieveSharing] = useState(false)
  const [participants, setParticipants] = useState(zmClient.getAllUser())
  const [subscribers, setSubscribers] = useState([])

  const activeVideo = useActiveVideo(zmClient)
  const avatarActionState = useAvatarAction(zmClient, participants, true)
  const networkQuality = useNetworkQuality(zmClient)
  const previousSubscribers = usePrevious(subscribers)
  const aspectRatio = useVideoAspect(zmClient)

  const optionsOfVideoResolution = [
    { label: "720P", value: VideoQuality.Video_720P },
    { label: "360P", value: VideoQuality.Video_360P },
    { label: "180P", value: VideoQuality.Video_180P },
    { label: "90P", value: VideoQuality.Video_90P }
  ]

  const orientation = useOrientation()
  const maxVideoCellWidth =
    orientation === "portrait"
      ? "none"
      : `calc(100vw/${Math.min(participants.length, 4)})`

  useParticipantsChange(zmClient, participants => {
    let pageParticipants = []

    if (participants.length > 0) {
      if (participants.length === 1) {
        pageParticipants = participants
      } else {
        pageParticipants = participants
          .filter(user => user.userId !== zmClient.getSessionInfo().userId)
          .sort((user1, user2) => Number(user2.bVideoOn) - Number(user1.bVideoOn))
        const currentUser = zmClient.getCurrentUserInfo()
        if (currentUser) {
          pageParticipants.splice(1, 0, currentUser)
        }
      }
    }

    setParticipants(pageParticipants)
    setSubscribers(
      pageParticipants.filter(user => user.bVideoOn).map(u => u.userId)
    )
  })

  const setVideoPlayerRef = (userId, element) => {
    if (element) {
      videoPlayerListRef.current[`${userId}`] = element
    }
  }

  useEffect(() => {
    const addedUsers = subscribers.filter(
      user => !(previousSubscribers || []).includes(user)
    )
    const removedUsers = (previousSubscribers || []).filter(
      user => !subscribers.includes(user)
    )
    if (removedUsers.length > 0) {
      removedUsers.forEach(userId => {
        mediaStream?.detachVideo(userId)
      })
    }

    if (addedUsers.length > 0) {
      addedUsers.forEach(userId => {
        const attachment = videoPlayerListRef.current[`${userId}`]
        if (attachment) {
          mediaStream?.attachVideo(userId, VideoQuality.Video_720P, attachment)
        }
      })
    }
  }, [subscribers, previousSubscribers, mediaStream])

  const onVideoResolutionChange = useCallback(
    ({ target: { value } }, userId) => {
      const attachment = videoPlayerListRef.current[`${userId}`]
      mediaStream?.attachVideo(userId, value, attachment)
    },
    [videoPlayerListRef, mediaStream]
  )


  return (
    <div
      className="viewport"
      style={{ height: "auto", width: "auto", minHeight: "100vh" }}
    >
      <ShareView ref={shareViewRef} onRecieveSharingChange={setIsRecieveSharing} />
      <div
        className={classnames("video-container", "video-container-attech", {
          "video-container-in-sharing": isRecieveSharing
        })}
      >
        <video-player-container class="video-container-wrap">
          <AvatarActionContext.Provider value={avatarActionState}>
            <ul className="user-list">
              {participants.map(user => (
                <div
                  className="video-cell"
                  key={user.userId}
                  style={
                    aspectRatio[`${user.userId}`]
                      ? {
                        aspectRatio: aspectRatio[`${user.userId}`],
                        maxWidth: maxVideoCellWidth
                      }
                      : { maxWidth: maxVideoCellWidth }
                  }
                >
                  {avatarActionState?.avatarActionState[user?.userId]
                    ?.videoResolutionAdjust?.toggled && (
                      <div className="change-video-resolution">
                        <Radio.Group
                          options={optionsOfVideoResolution}
                          onChange={value => {
                            onVideoResolutionChange(value, user.userId)
                          }}
                          defaultValue={VideoQuality.Video_720P}
                          optionType="button"
                          buttonStyle="solid"
                        />
                      </div>
                    )}
                  {user.bVideoOn && (
                    <div>
                      <video-player
                        class="video-player"
                        ref={element => {
                          setVideoPlayerRef(user.userId, element)
                        }}
                      />
                    </div>
                  )}
                  <Avatar
                    participant={user}
                    key={user.userId}
                    isActive={activeVideo === user.userId}
                    networkQuality={networkQuality[`${user.userId}`]}
                  />
                </div>
              ))}
            </ul>
          </AvatarActionContext.Provider>
        </video-player-container>
      </div>
      <VideoFooter
        className="video-operations"
        sharing
        selfShareCanvas={shareViewRef.current?.selfShareRef}
      />
      <ReportBtn />
    </div>

  );
};
export default VideoContainer;
