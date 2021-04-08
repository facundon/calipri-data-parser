import React, { useState, useEffect } from "react"
import Table from "rsuite/lib/Table"
import Button from "rsuite/lib/Button"
import Icon from "rsuite/lib/Icon"  
import Loader from "rsuite/lib/Loader"
import Modal from "rsuite/lib/Modal"
import TagCell from "../TagCell"
import confirmService from "../confirmService"
import Alert from "rsuite/lib/Alert"

import { save, load, getFiles } from "../../Scripts/storage"
import { FLEETS_TEMPLATE, Fleet } from "./template"

interface IFleetPanel {
  isFleetPanelOpen: boolean,
  fleetPanelHandler: (val: boolean) => void
}

const FleetPanel: React.FC<IFleetPanel> = ({ isFleetPanelOpen, fleetPanelHandler }) => {
  const [fleets, setFleets] = useState<Fleet[]>(FLEETS_TEMPLATE)
  const { Column, Cell, HeaderCell } = Table
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const loadProfiles = async() => {
      setLoading(true)
      const loadedFleets = await load("flotas")
      if (loadedFleets) {
        setFleets(loadedFleets)
      } else {
        Alert.error("No se pudo cargar la configuración de las Flotas", 7000)
        const files = await getFiles()
        if (!files.includes("flotas")) {
          await save("flotas", FLEETS_TEMPLATE) &&
            Alert.info("Se creo un archivo de configuración para las Flotas", 7000)
        }
      }
      setLoading(false)
    }
    loadProfiles()
  }, [])

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

  const handleSave = async() => {
    const confirm = await confirmService.show({
      message: "Seguro que desea guardar los cambios realizados?",
      actionIcon: "save",
      actionMessage: "Guardar"
    })
    if (confirm) {
      setLoading(true)
      const saved = await save("flotas", fleets)
      setLoading(false)
      saved ? Alert.success("Cambios Guardados!", 7000) : Alert.error("No se pudieron guardar los cambios", 7000)
      fleetPanelHandler(false)
    }
  }

  const handleDiscard = async() => {
    setLoading(true)
    const savedData = await load("flotas")
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
      }
    } else {
      fleetPanelHandler(false)
    }
  }

  return (
    <Modal size={"sm"} show={isFleetPanelOpen} className="config-form">
      <Modal.Header closeButton={false}>
        <Modal.Title>Flotas</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Table
          shouldUpdateScroll={false}
          rowKey="id"
          height={600}
          data={fleets}
        >
          <Column flexGrow={2} fixed align="center">
            <HeaderCell>Flota</HeaderCell>
            <Cell dataKey="fleet" className="parameter-cell" />
          </Column>
          <Column flexGrow={6}>
            <HeaderCell>Perfiles</HeaderCell>
            <TagCell dataKey="profiles" manageProfile={handleManageProfile}/>
          </Column>
        </Table>
        {loading &&
          <Loader
            center
            size="md"
            backdrop
            content="Cargando..."
            vertical
          />
        }
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
