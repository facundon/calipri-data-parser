// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from "react"
import Modal, { ModalProps } from "rsuite/lib/Modal"
import Button from "rsuite/lib/Button"
import Icon, { IconNames } from "rsuite/lib/Icon"
import Whisper from "rsuite/lib/Whisper"
import Tooltip from "rsuite/lib/Tooltip"

import "./styles/index.scss"

interface IInputModal {
  setShow: (value: boolean) => void,
  onSubmit: (inputName: string) => void,
  show: boolean,
  title: string,
  size?: ModalProps["size"]
  validationMessage: string,
  actionMessage: string
  actionIcon?: IconNames,
  children: React.ReactElement,
}

const InputModal: React.FC<IInputModal> = ({
  setShow,
  onSubmit,
  show,
  title,
  size = "xs",
  validationMessage,
  actionMessage,
  actionIcon,
  children,
}) => {
  const [inputName, setinputName] = useState<string>("")
  const [error, setError] = useState<boolean>(false)

  const change = (data: string) => {
    setinputName(data)
    setError(false)
  }

  useEffect(() => {
    children!.props.onChange = change
  }, [children])

  const reset = () => {
    setError(false)
    setinputName("")
    setShow(false)
  }

  const handleSave = () => {
    if (!children!.props.data.some(
      (item: string) => item === inputName.toUpperCase()
    )) {
      onSubmit(inputName)
      reset()
    } else {
      setError(true)
    }
  }

  return (
    <Modal
      backdrop
      size={size}
      show={show}
      onHide={() => reset()}
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Whisper
          open={error}
          trigger="none"
          placement="bottomStart"
          speaker={<Tooltip className="modal-form">{validationMessage}</Tooltip>}
        >
          {children}
        </Whisper>
      </Modal.Body>

      <Modal.Footer className="modal-form">
        <Button
          disabled={inputName?.length === 0}
          onClick={handleSave}
          appearance="primary">
          {actionIcon && <Icon icon={actionIcon} size="lg" />}
          {actionMessage}
        </Button>
        <Button
          onClick={() => reset()}
          appearance="subtle"
        >
          <Icon icon="trash-o" size="lg"/>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default InputModal
