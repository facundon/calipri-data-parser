// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from "react"
import Modal from "rsuite/lib/Modal"
import Button from "rsuite/lib/Button"
import Icon from "rsuite/lib/Icon"
import Nav from "rsuite/lib/Nav"
import InputPicker from "rsuite/lib/InputPicker"
import Input from "rsuite/lib/Input"
import Table from "rsuite/lib/Table"
import InputModal from "../InputModal"
import ActionEditCell, { EditableValues } from "../ActionEditCell"
import EditCell, { DataKey } from "../EditCell"
import ManageCell from "../ManageCell"
import confirmService from "../confirmService/index"
import AddItemModal from "../AddItemModal"
import Alert from "rsuite/lib/Alert"
import Loader from "rsuite/lib/Loader"

import { normalize } from "../../Scripts/utils"
import { load, save, deleteFile, getFiles } from "../../Scripts/storage"
import { TEMPLATE, Dimension } from "./template"
import "./styles/index.scss"

interface IFleetPanel {
  configHandler: (value: boolean) => void,
  isFleetConfigOpen: boolean,
}

const FleetPanel: React.FC<IFleetPanel> = ({ configHandler, isFleetConfigOpen }) => {
  const [profiles, setProfiles] = useState<string[]>(["ORE"])
  const [activeProfile, setActiveProfile] = useState<string>(profiles[0])
  const [showAddProfile, setshowAddProfile] = useState<boolean>(false)
  const [showRemoveProfile, setshowRemoveProfile] = useState<boolean>(false)
  const { Column, Cell, HeaderCell } = Table
  const [activeData, setActiveData] = useState<Dimension[]>(TEMPLATE)
  const [activeItem, setActiveItem] = useState<Dimension>(TEMPLATE[0])
  const [showAddItem, setShowAddItem] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  return (
    <Modal full show={isFleetConfigOpen} className="config-form">
      <Modal.Header closeButton={false}>
        <Modal.Title>Flotas</Modal.Title>
      </Modal.Header>

      <Modal.Body>

      </Modal.Body>

      <Modal.Footer>
        <Button onClick={() => setshowAddProfile(true)} appearance="ghost" className="btn-left">
          <Icon icon="plus" size="lg"/>
          Nuevo Perfil
        </Button>
        <Button onClick={() => setshowRemoveProfile(true)} appearance="ghost" className="btn-left">
          <Icon icon="minus" size="lg"/>
          Eliminar Perfil
        </Button>
        <Button onClick={handleSave} appearance="primary">
          <Icon icon="save" size="lg"/>
          Guardar
        </Button>
        <Button onClick={handleDiscard} appearance="subtle">
          <Icon icon="trash-o" size="lg"/>
          Descartar
        </Button>
      </Modal.Footer>
      <InputModal
        setShow={setshowRemoveProfile}
        onSubmit={handleRemoveProfile}
        show={showRemoveProfile}
        actionMessage="Eliminar"
        actionIcon="minus"
        title="Eliminar Perfil"
        validationMessage="Seleccionar un perfil"
      >
        <InputPicker
          block
          cleanable={false}
          placeholder="Perfil"
          locale={{ noResultsText: "No se encontraron resultados" }}
          data={profiles.map(
            item => ({ value: item, label: item })
          )}
        />
      </InputModal>
      <InputModal
        setShow={setshowAddProfile}
        onSubmit={handleAddProfile}
        show={showAddProfile}
        actionMessage="Crear"
        actionIcon="plus"
        title="Crear Perfil"
        validationMessage="Ese perfil ya existe"
      >
        <Input
          placeholder="Nuevo Perfil"
          data={profiles}
          maxLength={10}
          autoFocus
        />
      </InputModal>
      <AddItemModal
        setShow={setShowAddItem}
        onSubmit={handleAddItem}
        data={activeItem!}
        show={showAddItem}
        title="Agregar Item"
        validationMessage="Ese item ya existe"
      />
    </Modal>
  )
}

export default FleetPanel
