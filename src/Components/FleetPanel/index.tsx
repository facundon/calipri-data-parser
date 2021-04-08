import React, { useState } from "react"
import Table from "rsuite/lib/Table"
import ManageCell from "../ManageCell"
import Button from "rsuite/lib/Button"
import Icon from "rsuite/lib/Icon"  
import Modal from "rsuite/lib/Modal"
import TagCell from "../TagCell"

interface IFleetPanel {
  isFleetPanelOpen: boolean,
  fleetPanelHandler: (val: boolean) => void
}

export type Fleet = {
  id: string,
  fleet: string,
  profiles: string[]
}

const fleetData: Fleet[] = [
  {
    id: "1",
    fleet: "CNR",
    profiles: ["ORE"]
  },
  {
    id: "2",
    fleet: "FIAT",
    profiles: ["ORE", "CDE"]
  }
]

const FleetPanel: React.FC<IFleetPanel> = ({ isFleetPanelOpen, fleetPanelHandler }) => {
  const [fleets, setFleets] = useState<Fleet[]>(fleetData)
  const [showAddFleet, setShowAddFleet] = useState<boolean>(false)
  const { Column, Cell, HeaderCell } = Table

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

  return (
    <Modal full show={isFleetPanelOpen} className="config-form">
      <Modal.Header closeButton={false}>
        <Modal.Title>Flotas</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Table
          isTree
          shouldUpdateScroll={false}
          rowKey="id"
          height={600}
          data={fleets}
          renderTreeToggle={(icon, rowData) => {
            if (rowData.children && rowData.children.length === 0) {
              return null
            }
            return icon
          }}
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
      </Modal.Body>

      <Modal.Footer>
      </Modal.Footer>
    </Modal>
  )
}

export default FleetPanel
