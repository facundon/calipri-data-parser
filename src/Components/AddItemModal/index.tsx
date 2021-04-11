// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from "react"
import Modal from "rsuite/lib/Modal"
import Button from "rsuite/lib/Button"
import Icon from "rsuite/lib/Icon"
import Checkbox from "rsuite/lib/Checkbox"
import Divider from "rsuite/lib/Divider"
import InputPicker from "rsuite/lib/InputPicker"
import Whisper from "rsuite/lib/Whisper"
import Tooltip from "rsuite/lib/Tooltip"
import { InputWithButtons } from "../EditCell"
import { Dimension } from "../ProfilePanel/template"

import "./styles/index.scss"

interface IAddItemModal {
  setShow: (value: boolean) => void,
  onSubmit: (itemName: string, values: {min: string | null, max: string | null}) => void,
  show: boolean,
  title: string,
  validationMessage: string,
  data: Dimension
}

const AddItemModal: React.FC<IAddItemModal> = ({
  setShow,
  onSubmit,
  show,
  title,
  validationMessage,
  data,
}) => {
  const names = [
    {
      value: "Motriz",
      label: "Motriz",
    },
    {
      value: data.id.split("-")[0] === "10" ? "Motriz - Remolque" : "Remolque",
      label: data.id.split("-")[0] === "10" ? "Motriz - Remolque" : "Remolque",
    }
  ]
  const [itemName, setItemName] = useState<string>(names[0].label)
  const [error, setError] = useState<boolean>(false)
  const [values, setValues] = useState<{min: string | null, max: string | null}>({ min: null, max: null })
  const [withChildren, setWithChildren] = useState<boolean>(data.id.split("-").length !== 2)
  
  useEffect(() => {
    setWithChildren(data.id.split("-").length !== 2)
  }, [data])

  const reset = () => {
    setError(false)
    setItemName(names[0].label)
    setWithChildren(data.id.split("-").length !== 2)
    setValues({ min: null, max: null })
    setShow(false)
  }

  const handleSave = () => {
    if (data.children?.some(
      item => item.name.toUpperCase() === itemName.toUpperCase()
    )) {
      setError(true)
    } else {
      onSubmit(itemName, values)
      reset()
    }
  }

  return (
    <Modal
      backdrop
      size="xs"
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
          <InputPicker
            data={names}
            onChange={val => val && setItemName(val)}
            block
            onPressEnter={handleSave}
            placeholder="Seleccionar"
            defaultValue={names[0].label}
          />
        </Whisper>
        <Divider />
        <div className="input-wrapper">
          <p>Mínimo</p>
          <InputWithButtons
            defaultValue={"0"}
            autoFocus
            disabled={withChildren}
            onChange={(value: string) => setValues(prev => ({ min: value, max: prev.max }))}
            onPressEnter={handleSave}
          />
        </div>
        <div className="input-wrapper">
          <p>Máximo</p>
          <InputWithButtons
            defaultValue={"0"}
            disabled={withChildren}
            onChange={(value: string) => setValues(prev => ({ min: prev.min, max: value }))}
            onPressEnter={handleSave}
          />
        </div>
      </Modal.Body>

      <Modal.Footer className="modal-form">
        <Checkbox
          value="subitems"
          defaultChecked={data.id.split("-").length !== 2}
          disabled={data.id.split("-").length === 2}
          onChange={(_, checked) => {
            setWithChildren(checked)
            checked && setValues({ min: null, max: null })
          }}
        >Sub-Items</Checkbox>
        <Button
          disabled={itemName?.length === 0}
          onClick={handleSave}
          appearance="primary">
          {<Icon icon={"plus"} size="lg" />}
          Agregar
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

export default AddItemModal
