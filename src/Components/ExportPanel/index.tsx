/* eslint-disable react-hooks/rules-of-hooks */
import React, { FC, useEffect, useState } from "react"
import MultiCascader from "rsuite/lib/MultiCascader"
import Button from "rsuite/lib/Button"
import Icon from "rsuite/lib/Icon"  
import Modal from "rsuite/lib/Modal"
import Alert from "rsuite/lib/Alert"

import { useDb } from "../../Scripts/storage"

import "./styles/index.scss"

type CascaderData = {
  value: string,
  label: string,
  children?: CascaderData[]
}

interface IExportPanel {
  isExportPanelOpen: boolean,
  exportPanelHandler: (val: boolean) => void
}

const ExportPanel: FC<IExportPanel> = ({ isExportPanelOpen, exportPanelHandler }) => {
  const [measurements, setMeasurements] = useState<CascaderData[]>([])
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>([])

  useEffect(() => {
    const loadData = async() => {
      const lines: [{["line"]: string}] = await useDb("fetchLines")
      let data: CascaderData[] = []
      let lIndex = 0
      for (const line of lines) {
        lIndex++
        const units: [{["unit"]: string}] = await useDb("fetchUnitsByLine", line.line)


        let dateChildren: {[x: string]: {["date"]: string}[]} = {}
        for (const unit of units) {
          const dates: [{["date"]: string}] = await useDb("fetchDatesByUnit", unit.unit)
          dateChildren[unit.unit] = dates
        }
        
        const childrenUnit: CascaderData[] = units.map((unit, uIndex) => {
          const childrenDate: CascaderData[] = dateChildren[unit.unit].map((date, dIndex) => ({
            value: `${lIndex.toString()}-${(uIndex + 1).toString()}-${(dIndex + 1).toString()}`,
            label: date.date,
          }))
          return ({
            value: `${lIndex.toString()}-${(uIndex + 1).toString()}`,
            label: unit.unit,
            children: childrenDate
          })
        })
        data.push({
          value: lIndex.toString(),
          label: line.line,
          children: childrenUnit
        })
      }
      setMeasurements(data)
    }
    loadData()
  }, [])

  const renderMenu = (children: any, menu: any) => {
    if (children.length === 0) {
      return (
        <p style={{ padding: 4, color: "#999", textAlign: "center" }}>
          <Icon icon="spinner" spin /> Cargando...
        </p>
      )
    }
    return menu
  }

  const findLabelsByValue = () => {
    const lineValues = measurements.filter(item => 
      item.children?.every(firstChild => 
        selectedMeasurements.includes(firstChild.value)
      )
    )
    const dateValues = measurements.forEach(item => 
      item.children?.filter(firstChild =>
        firstChild.children?.every(secondChild => 
          selectedMeasurements.includes(secondChild.value)
        ) 
      )
    )
    console.log(dateValues)
  }

  const handleExport = () => {
    findLabelsByValue()
    exportPanelHandler(false)
  }
  
  return( isExportPanelOpen 
    ? 
    <Modal 
      backdrop
      size={"xs"}
      show={isExportPanelOpen}
      className="config-form export-panel"
      onHide={() => exportPanelHandler(false)}
    >
      <Modal.Header >
        <Modal.Title>Exportar</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <MultiCascader
          data={measurements}
          block
          placeholder="Mediciones"
          menuHeight="auto"
          menuWidth={130}
          renderMenu={renderMenu}
          locale={{ 
            noResultsText: "No se encontraron resultados",
            checkAll: "Todas",
            placeholder: "Seleccionar",
            searchPlaceholder: "Buscar",
          }}
          onChange={(e) => setSelectedMeasurements(e)}
          renderValue={(value, selectedItems, selectedElement) => (
            <span>
              <span style={{ color: "#575757" }}>
                <Icon icon="calendar" /> Mediciones :
              </span>{" "}
              {selectedItems.map(item => item?.children ? item.label + " (Todas)" : item.label).join(" , ")}
            </span>
          )}
          uncheckableItemValues={Array(100).fill(1).map((_, idx) => (1 + idx++).toString())}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleExport} appearance="primary">
          <Icon icon="file-download" size="lg"/>
          Exportar
        </Button>
      </Modal.Footer>
    </Modal>
    : null
  )
}

export default ExportPanel
