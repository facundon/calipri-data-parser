/* eslint-disable react-hooks/rules-of-hooks */
import { FC, useEffect, useState } from "react"
import MultiCascader from "rsuite/lib/MultiCascader"
import Button from "rsuite/lib/Button"
import Icon from "rsuite/lib/Icon"  
import Modal from "rsuite/lib/Modal"
import Tag from "rsuite/lib/Tag"
import TagGroup from "rsuite/lib/TagGroup"
import Loader from "rsuite/lib/Loader"
import Alert from "rsuite/lib/Alert"

import { jsonToCSV } from "react-papaparse"
import { printPdf, saveBulk, useDb } from "../../Scripts/electron-bridge"

import "./styles/index.scss"
import { concat } from "lodash"
import { 
  IExportPanel,
  CascaderData,
  MeasurementCallback,
  FetchedData
} from "./types"
import { IParsedData } from "../DragLoader/types"
import preparePrint, { getItemInHeader } from "../../Scripts/print"


const ExportPanel: FC<IExportPanel> = ({ isExportPanelOpen, exportPanelHandler }) => {
  const [measurements, setMeasurements] = useState<CascaderData[]>([])
  const [selectedMeasurements, setSelectedMeasurements] = useState<(CascaderData | undefined)[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setSelectedMeasurements([])
    const loadData = async() => {
      const lines: [{["line"]: string}] = await useDb("fetchLines")
      if (!lines) return
      let data: CascaderData[] = []
      let lIndex = 0
      for (const line of lines) {
        lIndex++
        const units: [{["unit"]: string}] = await useDb("fetchUnitsByLine", line.line)

        let dateChildren: {[x: string]: {["date"]: string}[]} = {}
        for (const unit of units) {
          const dates: [{["date"]: string}] = await useDb("fetchDatesByUnitAndLine", { ...line, ...unit })
          dateChildren[unit.unit] = dates
        }
        
        const childrenUnit: CascaderData[] = units.map((unit, uIndex) => {
          const childrenDate: CascaderData[] = dateChildren[unit.unit].map((date, dIndex) => ({
            value: `${lIndex.toString()}-${(uIndex + 1).toString()}-${(dIndex + 1).toString()}`,
            label: date.date,
          }))
          return ({
            value: `${lIndex.toString()}-${(uIndex + 1).toString()}`,
            label: "Formación " + unit.unit,
            children: childrenDate
          })
        })
        data.push({
          value: lIndex.toString(),
          label: "Linea " + line.line,
          children: childrenUnit
        })
      }
      setMeasurements(data)
    }
    loadData()
    setLoading(false)
  }, [isExportPanelOpen])

  useEffect(() => {

  }, [selectedMeasurements])

  const renderMenu = (children: any, menu: any) => {
    if (loading) {
      return (
        <p style={{ padding: 4, color: "#999", textAlign: "center" }}>
          <Icon icon="spinner" spin /> Cargando...
        </p>
      )
    }
    if (children.length === 0) {
      return (
        <p style={{ padding: 4, color: "#999", textAlign: "center" }}>
          <Icon icon="close" /> No hay mediciones
        </p>
      )
    }
    return menu
  }

  const findSelectedLabels = (val: string[]) => {
    const lineValues = measurements.flatMap(item => 
      item.children?.filter(firstChild => 
        val.includes(firstChild.value)
      )
    )
    const dateValues = measurements.flatMap(item => 
      item.children?.flatMap(firstChild =>
        firstChild.children?.filter(secondChild => 
          val.includes(secondChild.value)
        )
      )
    )
    return concat(lineValues, dateValues)
  }

  const getIdData = (item: CascaderData | undefined, id: number | null = null) => {
    const isDate = Boolean(!item?.children)
    let line = ""
    let unit = ""
    let date: string | null = ""
    if (isDate) {  
      line = item?.parent?.parent?.label!
      unit = item?.parent?.label!
      date = item?.label!
    } else {
      line = item?.parent?.label!
      unit = item?.label!
      date = id !== null ? item?.children![id].label! : null
    }
    return { line, unit, date }
  }

  const getMeasurementData = async(callback: MeasurementCallback) => {
    let returnFileNames = []
    let returnData = []
    for (const item of selectedMeasurements) {
      let idData = getIdData(item)
      idData.line = idData.line?.replace("Linea ", "")
      idData.unit = idData.unit?.replace("Formación ", "")
      const allData: FetchedData[] = await useDb("fetchData", idData)
      const result = await callback(allData, item)
      if (result) {
        const { fileNames, data } = result
        returnFileNames.push(fileNames)
        returnData.push(data)
      }
    }
    return {
      fileNames: returnFileNames.flat(),
      data: returnData.flat()
    }
  }

  const handleExport = async() => {
    setLoading(true)
    const { fileNames, data } = await getMeasurementData(async(allData, item) => {
      let fileNames = []
      let csvs = []
      let index = 0
      for (const data of allData) {
        const dataObj: IParsedData = JSON.parse(data.data)
        csvs.push(jsonToCSV(dataObj.wheels))
        const idData = getIdData(item, index)
        fileNames.push(`${idData.line} - ${idData.unit} - ${idData.date?.replaceAll("/", "-")}`)
        index++
      }
      return { fileNames, data: csvs }
    })
    const success = await saveBulk(fileNames, data, "Calipri Parser Exports", ".csv")
    if (typeof success === "boolean"){
      success
        ? Alert.success("Exportación exitosa!", 10000)
        : Alert.error("Hubo un problema al exportar", 10000)
    } 
    setLoading(false)
    exportPanelHandler(false)
  }

  const handleRePrint = async() => {
    setLoading(true)
    await getMeasurementData(async(allData) => {
      for (const data of allData) {
        const dataObj: IParsedData = JSON.parse(data.data)
        await preparePrint(dataObj, async(replacedHtml) => {
          const fileName = `Linea ${getItemInHeader("Linea", dataObj.header)} - ${getItemInHeader("Flota", dataObj.header)} - ${getItemInHeader("Formacion", dataObj.header)} - ${getItemInHeader("Fecha", dataObj.header).replaceAll("/", "-")}`
          const success = await printPdf(replacedHtml, fileName)
          if (success && success !== "canceled") {
            Alert.success("Reporte emitido!", 10000)
          } else {
            Alert.error("Ocurrio un error al emitir el reporte.", 10000)
          }
        })
      }
    })
    setLoading(false)
    exportPanelHandler(false)
  }
  
  return( isExportPanelOpen &&
    loading 
    ? <Loader backdrop size="md" content="Exportando..." /> 
    : <Modal 
      backdrop
      size={"sm"}
      show={isExportPanelOpen}
      className="config-form export-panel"
      onHide={() => exportPanelHandler(false)}
    >
      <Modal.Header >
        <Modal.Title>Exportar</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {selectedMeasurements.length > 0 &&
        <TagGroup>
          {selectedMeasurements.map(item => 
            <Tag key={item?.value} color="cyan">{item?.children ? item?.label + " (Todas)" : item?.label}</Tag>
          )}
        </TagGroup>}
        <MultiCascader
          inline
          data={measurements}
          block
          placeholder="Mediciones"
          menuHeight="auto"
          menuWidth={180}
          renderMenu={renderMenu}
          locale={{ 
            noResultsText: "No se encontraron resultados",
            checkAll: "Todas",
            placeholder: "Seleccionar",
            searchPlaceholder: "Buscar",
          }}
          onChange={(val) => {
            const labels = findSelectedLabels(val)
            setSelectedMeasurements(labels)
          }}
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
        <Button onClick={handleExport} appearance="primary" disabled={!selectedMeasurements.length}>
          <Icon icon="file-download" size="lg"/>
          Exportar
        </Button>
        <Button onClick={handleRePrint} appearance="primary" disabled={!selectedMeasurements.length}>
          <Icon icon="file-pdf-o" size="lg"/>
          Re-Imprimir
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ExportPanel
