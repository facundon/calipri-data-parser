import React, { useState, useEffect } from "react"
import Table from "rsuite/lib/Table"
import Button from "rsuite/lib/Button"
import Icon from "rsuite/lib/Icon"  
import Modal from "rsuite/lib/Modal"
import Alert from "rsuite/lib/Alert"
import Input from "rsuite/lib/Input"
import IconButton from "rsuite/lib/IconButton"
import Whisper from "rsuite/lib/Whisper"
import Tooltip from "rsuite/lib/Tooltip"

import TagCell from "../TagCell"
import confirmService from "../confirmService"
import ManageCell from "../ManageCell"

import { save, load, getFiles } from "../../Scripts/storage"
import { FLEETS_TEMPLATE, Fleet } from "./template"

import "./styles/index.scss"

const FLEET_FILE = "flotas"

interface IFleetPanel {
  isFleetPanelOpen: boolean,
  fleetPanelHandler: (val: boolean) => void
}

const FleetPanel: React.FC<IFleetPanel> = ({ isFleetPanelOpen, fleetPanelHandler }) => {
  const [fleets, setFleets] = useState<Fleet[]>(FLEETS_TEMPLATE)
  const { Column, Cell, HeaderCell } = Table
  const [loading, setLoading] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)
  const [newFleetName, setNewFleetName] = useState<string>("")
  const [error, setError] = useState<boolean>(false)

  function getNewId() {
    const ids = fleets.map(fleet => fleet.id)
    let newLastId = ids.findIndex((val, index) => parseInt(val) !== index + 1) + 1 
    if (newLastId === -1 || newLastId === 0) {
      // If there is no empty space, add a newLastId to the end of the array
      newLastId = parseInt(ids[ids.length - 1]) + 1 
    }
    return newLastId.toString()
  }
  
  useEffect(() => {
    const loadProfiles = async() => {
      setLoading(true)
      const loadedFleets = await load(FLEET_FILE)
      if (loadedFleets) {
        setFleets(loadedFleets)
      } else {
        Alert.error("No se pudo cargar la configuración de las Flotas", 7000)
        const files = await getFiles()
        if (!files.includes(FLEET_FILE)) {
          await save(FLEET_FILE, FLEETS_TEMPLATE) &&
            Alert.info("Se creo un archivo de configuración para las Flotas", 7000)
        }
      }
      setLoading(false)
    }
    loadProfiles()
  }, [])

  const reset = () => {
    setError(false)
    setNewFleetName("")
    setEditing(false)
  }

  const handleManageProfile = (profile: string, fleetId: string, action: "add" | "remove") => {
    const nextFleets: Fleet[] = Object.assign([], fleets)
    nextFleets.forEach((fleet, index) => {
      if (fleet.id === fleetId) {
        switch (action) {
        case "add":
          nextFleets[index].profiles.push(profile)
          break
        case "remove":
          const profileIndex = fleet.profiles.indexOf(profile)
          nextFleets[index].profiles.splice(profileIndex, 1)
          break
        }
      }
    })
    setFleets(nextFleets)
  }

  const handleRemoveFleet = (fleetId: string) => {
    const nextFleets: Fleet[] = Object.assign([], fleets)
    const fleetIndex = nextFleets.findIndex(fleet => fleet.id === fleetId)
    nextFleets.splice(fleetIndex, 1)
    setFleets(nextFleets)
  }

  const handleAddFleet = () => {
    if (editing && newFleetName !== "") {
      const fleetsNames = fleets.map(fleet => fleet.fleet)
      if (fleetsNames.includes(newFleetName)) {
        setError(true)
        return
      }
      const newFleet: Fleet = {
        id: getNewId(),
        fleet: newFleetName,
        profiles: ["ORE"]
      }
      const nextFleets = Object.assign([], fleets)
      nextFleets.push(newFleet)
      setFleets(nextFleets)
      reset()
    } else {
      setEditing(prev => !prev)
    }
  }

  const handleSave = async() => {
    const confirm = await confirmService.show({
      message: "Seguro que desea guardar los cambios realizados?",
      actionIcon: "save",
      actionMessage: "Guardar"
    })
    if (confirm) {
      setLoading(true)
      const saved = await save(FLEET_FILE, fleets)
      setLoading(false)
      saved ? Alert.success("Cambios Guardados!", 7000) : Alert.error("No se pudieron guardar los cambios", 7000)
      fleetPanelHandler(false)
    }
  }

  const handleDiscard = async() => {
    setLoading(true)
    const savedData = await load(FLEET_FILE)
    setLoading(false)
    if (savedData && JSON.stringify(savedData) !== JSON.stringify(fleets)) {
      const confirm = await confirmService.show({
        message: "Seguro que desea descartar los cambios realizados?",
        actionIcon: "trash2",
        actionMessage: "Descartar",
        iconColor: "#f44336",
      })
      if (confirm) {
        fleetPanelHandler(false)
        setFleets(savedData)
        reset()
      }
    } else {
      fleetPanelHandler(false)
      reset()
    }
  }

  return (
    <Modal size={"sm"} show={isFleetPanelOpen} className="config-form fleet-form">
      <Modal.Header closeButton={false}>
        <Modal.Title>Flotas</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Table
          shouldUpdateScroll={false}
          rowKey="id"
          data={fleets}
          loading={loading}
          autoHeight
        >
          <Column width={30} align="center" >
            <HeaderCell></HeaderCell>
            <ManageCell noTree dataKey="id" onClick={handleRemoveFleet} />
          </Column>
          <Column flexGrow={2} fixed align="center">
            <HeaderCell>Flota</HeaderCell>
            <Cell dataKey="fleet" className="parameter-cell" />
          </Column>
          <Column flexGrow={6}>
            <HeaderCell>Perfiles</HeaderCell>
            <TagCell dataKey="profiles" manageProfile={handleManageProfile} isOpen={isFleetPanelOpen}/>
          </Column>
        </Table>
        <div className="add-profile-wrapper">
          <IconButton 
            className={`add-fleet${editing ? "-moved" : ""}`}
            icon={<Icon icon={editing ? "check" : "plus"}/>}
            color="green"
            appearance={editing ? "primary" : "subtle"}
            circle
            onClick={handleAddFleet}
          />
          {editing &&
          <Whisper
            open={error}
            trigger="none"
            placement="bottomStart"
            speaker={<Tooltip className="modal-form">Esa flota ya existe</Tooltip>}
          >
            <Input
              placeholder="Nueva Flota"
              maxLength={10}
              autoFocus
              onChange={val => {
                setNewFleetName(val)
                setError(false)
              }} 
              onPressEnter={handleAddFleet}
            />
          </Whisper>
          }
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={handleSave} appearance="primary">
          <Icon icon="save" size="lg"/>
          Guardar
        </Button>
        <Button onClick={handleDiscard} appearance="subtle">
          <Icon icon="trash-o" size="lg"/>
          Descartar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default FleetPanel
