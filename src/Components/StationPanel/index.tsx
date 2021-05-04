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

import { isEqual } from "lodash"
import { HexColorPicker } from "react-colorful"

import confirmService from "../confirmService"
import ManageCell from "../ManageCell"
import AvatarCell from "../AvatarCell"
import EditCell, { DataKey } from "../EditCell"
import ActionEditCell, { EditableValues } from "../ActionEditCell"

import { save, load, getFiles } from "../../Scripts/electron-bridge"
import { LINE_TEMPLATE, TLine } from "./template"

import "./styles/index.scss"

export const LINE_FILE = "lineas"

interface IStationPanel {
  isStationPanelOpen: boolean,
  stationPanelHandler: (val: boolean) => void
}

const StationPanel: React.FC<IStationPanel> = ({ isStationPanelOpen, stationPanelHandler }) => {
  const [lines, setLines] = useState<TLine[]>(LINE_TEMPLATE)
  const { Column, HeaderCell } = Table
  const [loading, setLoading] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)
  const [newLineName, setNewLineName] = useState<string>("")
  const [error, setError] = useState<boolean>(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [activeColor, setActiveColor] = useState("")
  const [activeId, setActiveId] = useState("1")

  function getNewId() {
    const ids = lines.map(line => line.id)
    let newLastId = ids.findIndex((val, index) => parseInt(val) !== index + 1) + 1 
    if (newLastId === -1 || newLastId === 0) {
      // If there is no empty space, add a newLastId to the end of the array
      newLastId = parseInt(ids[ids.length - 1]) + 1 
    }
    return newLastId.toString()
  }

  useEffect(() => {
    if (isStationPanelOpen) {
      const loadProfiles = async() => {
        setLoading(true)
        const loadedLines: TLine[] = await load(LINE_FILE)
        if (loadedLines) {
          setLines([...loadedLines])
        } else {
          Alert.error("No se pudo cargar la configuración de las Lineas", 7000)
          const files = await getFiles()
          if (!files.includes(LINE_FILE)) {
            await save(LINE_FILE, LINE_TEMPLATE) &&
              Alert.info("Se creo un archivo de configuración para las Lineas", 7000)
          }
        }
        setLoading(false)
      }
      loadProfiles()
    }
  }, [isStationPanelOpen])

  const reset = () => {
    setError(false)
    setNewLineName("")
    setEditing(false)
    setColorOpen(false)
  }

  const handleRemoveFleet = (fleetId: string) => {
    const nextLines: TLine[] = Object.assign([], lines)
    const fleetIndex = nextLines.findIndex(line => line.id === fleetId)
    nextLines.splice(fleetIndex, 1)
    setLines([...nextLines])
  }

  const handleAddFleet = () => {
    if (editing && newLineName !== "") {
      const linesNames = lines.map(line => line.name.toUpperCase())
      if (linesNames.includes(newLineName.toUpperCase())) {
        setError(true)
        return
      }
      const newFleet: TLine = {
        id: getNewId(),
        name: newLineName,
        station1: "Cabecera 1",
        station2: "Cabecera 2",
        color: "#00ffbb",
        status: null,
      }
      const nextLines = Object.assign([], lines)
      nextLines.push(newFleet)
      setLines([...nextLines])
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
      const nextLines: TLine[] = Object.assign([], lines)
      lines.forEach((_, i) => nextLines[i].status = null)
      const saved = await save(LINE_FILE, nextLines)
      setLoading(false)
      saved ? Alert.success("Cambios Guardados!", 7000) : Alert.error("No se pudieron guardar los cambios", 7000)
      stationPanelHandler(false)
    }
  }

  const handleDiscard = async() => {
    setLoading(true)
    const savedData = await load(LINE_FILE)
    setLoading(false)
    if (savedData && !isEqual(savedData, lines)) {
      const confirm = await confirmService.show({
        message: "Seguro que desea descartar los cambios realizados?",
        actionIcon: "trash2",
        actionMessage: "Descartar",
        iconColor: "#f44336",
      })
      if (confirm) {
        stationPanelHandler(false)
        setLines(savedData)
        reset()
      }
    } else {
      stationPanelHandler(false)
      reset()
    }
  }

  const handleEditValue = (id: string, key: DataKey, value: string) => {
    const nextLines = Object.assign([], lines)
    const activeLine: TLine = lines.find(line => line.id === id)!
    if (!value) {
      
    }
    activeLine[key] = value
    setLines([...nextLines])
  }

  const handleEditState = (id: string, discard: boolean, unchangedValues: EditableValues) => {
    const nextLines = Object.assign([], lines)
    const activeLine = lines.find(line => line.id === id)
    if (discard) {
      activeLine!.station1 = unchangedValues.station1!
      activeLine!.station2 = unchangedValues.station2!
    }
    activeLine!.status = activeLine!.status ? null : "EDIT"
    setLines([...nextLines])
  }

  const handleOpenColor = (id: string) => {
    setActiveId(id)
    setColorOpen(prev => 
      prev 
        ? activeId !== id
        : true
    )
    const activeLine = lines.find(line => line.id === id)!
    setActiveColor(activeLine?.color)
  }

  const handleColorChange = (color: string) => {
    const nextLines: TLine[] = Object.assign([], lines)
    const activeLine = nextLines.find(line => line.id === activeId)!
    setActiveColor(color)
    activeLine.color = color
  }

  return (
    <Modal size={"md"} show={isStationPanelOpen} className="config-form station-form">
      <Modal.Header closeButton={false}>
        <Modal.Title>Lineas</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Table
          shouldUpdateScroll={false}
          rowKey="id"
          data={lines}
          locale={{loading: "Cargando"}}
          loading={loading}
          height={490}
          rowHeight={63}
          renderEmpty={() => 
            <div className="no-data-found-wrapper">
              <Icon icon="close-circle" size="5x" /> 
              <p>No se encontraron Lineas</p>
            </div>
          }
        >
          <Column width={30} align="center" >
            <HeaderCell></HeaderCell>
            <ManageCell noTree dataKey="id" onClick={handleRemoveFleet} />
          </Column>
          <Column flexGrow={2} fixed align="center">
            <HeaderCell>Linea</HeaderCell>
            <AvatarCell dataKey="name" className="parameter-cell" onClick={handleOpenColor} />
          </Column>
          <Column flexGrow={4}>
            <HeaderCell>Cabecera 1</HeaderCell>
            <EditCell dataKey="station1" onChange={handleEditValue} onPressEnter={handleEditState}/>
          </Column>
          <Column flexGrow={4}>
            <HeaderCell>Cabecera 2</HeaderCell>
            <EditCell dataKey="station2" onChange={handleEditValue} onPressEnter={handleEditState}/>
          </Column>
          <Column width={120} align="center" fixed="right">
            <HeaderCell>Editar</HeaderCell>
            <ActionEditCell station dataKey="id" onClick={handleEditState}/>
          </Column>
        </Table>
        <div className="add-profile-wrapper">
          <IconButton 
            className={`add-fleet${editing ? "-moved" : ""}`}
            icon={<Icon icon={editing ? ( newLineName.length === 0 ? "undo" : error ? "close" : "check") : "plus"}/>}
            color={newLineName.length === 0 && editing ? "orange" : error ? "red" : "green"}
            appearance={editing ? "primary" : "subtle"}
            circle
            onClick={handleAddFleet}
          />
          {editing &&
          <Whisper
            open={error}
            trigger="none"
            placement="bottomStart"
            speaker={<Tooltip className="modal-form">Esa linea ya existe</Tooltip>}
          >
            <Input
              placeholder="Linea"
              maxLength={1}
              autoFocus
              onChange={val => {
                setNewLineName(val.toUpperCase())
                setError(false)
              }} 
              onPressEnter={handleAddFleet}
            />
          </Whisper>
          }
        </div>
      </Modal.Body>
      <Modal.Footer>
        {colorOpen && 
          <HexColorPicker
            color={activeColor}
            onChange={handleColorChange}
          />
        }
        <Button onClick={handleDiscard} appearance="subtle">
          <Icon icon="trash-o" size="lg"/>
          Descartar
        </Button>
        <Button onClick={handleSave} appearance="primary">
          <Icon icon="save" size="lg"/>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default StationPanel
