import React from "react"
import { Button, Tooltip, Dropdown } from "antd"
import classNames from "classnames"
import { IconFont } from "../../../component/icon-font"
import {
  LockOutlined,
  UnlockOutlined,
  UpOutlined,
  CheckOutlined
} from "@ant-design/icons"
import { SharePrivilege } from "@zoom/videosdk"
import { getAntdDropdownMenu, getAntdItem } from "./video-footer-utils"

const { Button: DropdownButton } = Dropdown

const ScreenShareButton = props => {
  const {
    sharePrivilege,
    isHostOrManager,
    onScreenShareClick,
    onSharePrivilegeClick
  } = props
  const menu = [
    getAntdItem(
      "Lock share",
      `${SharePrivilege.Locked}`,
      sharePrivilege === SharePrivilege.Locked && <CheckOutlined />
    ),
    getAntdItem(
      "One participant can share at a time",
      `${SharePrivilege.Unlocked}`,
      sharePrivilege === SharePrivilege.Unlocked && <CheckOutlined />
    ),
    getAntdItem(
      "Multiple participants can share simultaneously",
      `${SharePrivilege.MultipleShare}`,
      sharePrivilege === SharePrivilege.MultipleShare && <CheckOutlined />
    )
  ]
  const onMenuItemClick = payload => {
    onSharePrivilegeClick?.(Number(payload.key))
  }
  return (
    <>
      {isHostOrManager ? (
        <DropdownButton
          className="vc-dropdown-button"
          size="large"
          menu={getAntdDropdownMenu(menu, onMenuItemClick)}
          onClick={onScreenShareClick}
          trigger={["click"]}
          type="ghost"
          icon={<UpOutlined />}
          placement="topRight"
        >
          <IconFont type="icon-share" />
        </DropdownButton>
      ) : (
        <Button
          className={classNames("screen-share-button", "vc-button")}
          icon={<IconFont type="icon-share" />}
          ghost={true}
          shape="circle"
          size="large"
          onClick={onScreenShareClick}
        />
      )}
    </>
  )
}

const ScreenShareLockButton = props => {
  const { isLockedScreenShare, onScreenShareLockClick } = props
  return (
    <Tooltip
      title={isLockedScreenShare ? "unlock screen share" : " lock screen share"}
    >
      <Button
        className="screen-share-button"
        icon={isLockedScreenShare ? <LockOutlined /> : <UnlockOutlined />}
        ghost={true}
        shape="circle"
        size="large"
        onClick={onScreenShareLockClick}
      />
    </Tooltip>
  )
}

export { ScreenShareButton, ScreenShareLockButton }
