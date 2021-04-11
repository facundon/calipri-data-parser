// eslint-disable-next-line no-use-before-define
import React, { useState } from "react"
import Modal, { ModalProps } from "rsuite/lib/Modal"
import Button from "rsuite/lib/Button"
import Icon, { IconNames } from "rsuite/lib/Icon"
import Input from "rsuite/lib/Input"
import InputPicker from "rsuite/lib/InputPicker"
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
  actionMessage: string,
  actionIcon?: IconNames,
  type: "add" | "delete",
  data: string[]
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
  type,
  data,
}) => {
  const [inputName, setinputName] = useState<string>("")
  const [error, setError] = useState<boolean>(false)

  const handleChange = (data: string) => {
    setinputName(data)
    setError(false)
  }

  const reset = () => {
    setError(false)
    setinputName("")
    setShow(false)
  }

  const handleSave = () => {
    if (data.some(
      item => item === inputName.toUpperCase()
    ) && type === "add") {
      setError(true)
    } else {
      onSubmit(inputName)
      reset()
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
          <>
            {type === "add" &&
            <Input
              placeholder="Nuevo Perfil"
              maxLength={10}
              autoFocus
              onChange={handleChange}
              onPressEnter={handleSave}
            />
            }
            {type === "delete" &&
            <InputPicker
              onChange={handleChange}
              block
              cleanable={false}
              placeholder="Perfil"
              locale={{ noResultsText: "No se encontraron resultados" }}
              data={data.map(
                (item: string) => ({ value: item, label: item })
              )}
            />
            }
          </>
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
