/* eslint-disable react-hooks/rules-of-hooks */
import React, { Component } from "react"

import { ProfilePanel, DragLoader, FleetPanel, StationPanel, ExportPanel, confirmService } from "./Components"
import Button from "rsuite/lib/Button"
import ButtonGroup from "rsuite/lib/ButtonGroup"
import Dropdown from "rsuite/lib/Dropdown"
import Icon from "rsuite/lib/Icon"
import Alert from "rsuite/lib/Alert"
import { forIn } from "lodash"

import { load, save, printPdf, useDb, selectConfigDirectory, resetConfig } from "./Scripts/storage"
import evaluate from "./Scripts/evaluate"
import prepareData from "./Scripts/print.js"

import { PARSED_DATA_INITIAL_VALUES } from "./Components/DragLoader"
import { IParsedData } from "./Components/DragLoader/types"
import { Line } from "./Components/StationPanel/template"
import "./rsuite-default.css"
import "./globalStyles/index.scss"

type DbMeasurementsData = {
  date: string,
  line: string,
  fleet: string,
  unit: string,
  data: string,
}

interface IProps {
}

interface IState {
  isLoaded: boolean,
  isPrinting: boolean,
  isProfilePanelOpen: boolean,
  isFleetConfigOpen: boolean,
  isStationConfigOpen: boolean,
  isExportPanelOpen: boolean,
  parsedData: IParsedData
}



class App extends Component<IProps, IState> {
  constructor(props: any) {
    super(props)
    this.state = {
      isLoaded: false,
      isPrinting: false,
      isProfilePanelOpen: false,
      isFleetConfigOpen: false,
      isStationConfigOpen: false,
      isExportPanelOpen: false,
      parsedData: PARSED_DATA_INITIAL_VALUES
    }
  }

  getItemInHeader = (item: string) => this.state.parsedData.header.find(val => Object.keys(val)[0] === item)![item]
  
  handleSelectConfigDirectory = async() => {
    const result = await selectConfigDirectory()
    if (typeof result === "string") {
      Alert.error(result, 10000)
    } else if (result) {
      Alert.success("Configuración cargada con éxito!", 10000) 
    }
  }

  handleResetConfig = async() => {
    const confirm = await confirmService.show({
      message: "¿Seguro que desea reestablecer la configuración? Esto sobreescribira cualquier cambio realizado a los perfiles, flotas y estaciones",
      actionIcon: "undo",
      actionMessage: "Reestablecer",
      iconColor: "#f44336",
    })
    if (confirm) {
      const result = await resetConfig()
      result !== true ? Alert.error(result, 10000) : Alert.success("Configuración reestablecida éxito!", 10000) 
    }
  }

  handlePrintPDF = async() => {
    const findStations = async() => {
      const lines: Line[] = await load("lineas")
      if (lines){
        const line = lines.find(line => line.name === this.state.parsedData.header.find(item => Object.keys(item)[0] === "Linea")?.Linea)
        if (!line) {
          Alert.error("No se encontro el parámetro 'Linea' en los datos de la medición", 10000)  
          return null
        }
        return [line.station1, line.station2, line.color]
      } else {
        Alert.error("No se pudieron cargar las cabeceras", 10000)
        return null
      }
    }

    this.setState({ isPrinting: true })
    const evaluatedData = await evaluate(this.state.parsedData)
    if (evaluatedData) {
      const vehicleSchema: string = await load("esquema", "templates", ".html")
      const stations = await findStations()
      const ers = await load("ers")
      const lastDate = await useDb("fetchLastDate", { 
        line: this.getItemInHeader("Linea"),
        fleet: this.getItemInHeader("Flota"),
        unit: this.getItemInHeader("Formacion")
      })
      if (!stations) return
      const preparedData = prepareData(evaluatedData, this.state.parsedData.header, vehicleSchema, stations, ers, lastDate)
      const loadedHtml: string = await load("report", "templates", ".html")
      if (!loadedHtml) {
        Alert.error("No se pudo cargar la plantilla para crear PDF", 10000)
        return
      }
      let replacedHtml = loadedHtml
      forIn(preparedData, (val, key) => {
        replacedHtml = replacedHtml.replaceAll(`$${key}$`, val)
      })
      replacedHtml = replacedHtml.replace(/\r?\n|\r/g, "")
      const fileName = `Linea ${this.getItemInHeader("Linea")} - ${this.getItemInHeader("Flota")} - ${this.getItemInHeader("Formacion")} - ${this.getItemInHeader("Fecha").replaceAll("/", "-")}`
      // await save("test", replacedHtml, "templates", ".html")
      
      const success = await printPdf(replacedHtml, fileName)
      if (success && success !== "canceled") {
        Alert.success("Reporte emitido!", 10000)
        const dataToSave: DbMeasurementsData = {
          data: JSON.stringify(this.state.parsedData.wheels),
          line: this.getItemInHeader("Linea"),
          fleet: this.getItemInHeader("Flota"),
          unit: this.getItemInHeader("Formacion"),
          date: this.getItemInHeader("Fecha")
        }
        let success = await useDb("add", dataToSave)
        !success && Alert.error("No se pudo guardar la medición en la base de datos", 10000)
        if (success === "unique") {
          const confirm = await confirmService.show({
            message: `Ya existe una medición de la formación ${this.getItemInHeader("Formacion")} del día ${this.getItemInHeader("Fecha")}. Desea reemplazarla?`,
            actionIcon: "clone",
            actionMessage: "Reemplazar",
            iconColor: "#f44336",
          })
          if (confirm) {
            success = await useDb("update", dataToSave)
            !success && Alert.error("No se pudo guardar la medición en la base de datos", 10000)
          }
        }
      } else if (!success) {
        Alert.error("Ocurrio un error al emitir el reporte.", 10000)
      }
    }   
    this.setState({ isPrinting: false })
  }

  render() {
    return (
      <div className="container">
        <div className="title">
          <h1>Calipri Data Parser</h1>
        </div>
        <div className="loader">
          <DragLoader
            handleIsLoaded={(loaded) => this.setState({ isLoaded: loaded })}
            handleParsedData={(data) => this.setState({ parsedData: data })}
          />
        </div>
        <div className="btn-group">
          <ButtonGroup justified>
            <Button
              color="green"
              disabled={!this.state.isLoaded}
              loading={this.state.isPrinting}
              onClick={this.handlePrintPDF}
            >
              <Icon icon="file-pdf-o" size="2x" />
              Emitir Informe
            </Button>
            <Dropdown
              title="Configuración"
              placement="topStart"
              renderTitle={(children) =>
                <Button
                  appearance="subtle"
                  className="dropdown-btn"
                >
                  <Icon icon="sliders" size="2x" />
                  {children}
                </Button>
              }
            >
              <Dropdown.Menu icon={<Icon icon="more" />} title="Más" pullLeft>
                <Dropdown.Item onSelect={this.handleResetConfig}>
                  <Icon icon="undo" />
                  Reestablecer Configuración
                </Dropdown.Item>
                <Dropdown.Item onSelect={this.handleSelectConfigDirectory}>
                  <Icon icon="crosshairs" />
                  Seleccionar Configuración
                </Dropdown.Item>
              </Dropdown.Menu>
              <Dropdown.Item onSelect={() => this.setState({ isExportPanelOpen: true })}>
                <Icon icon="file-download" size="lg" />
                Exportar
              </Dropdown.Item>
              <Dropdown.Item onSelect={() => this.setState({ isStationConfigOpen: true })}>
                <Icon icon="map-marker" size="lg" />
                Cabeceras
              </Dropdown.Item>
              <Dropdown.Item onSelect={() => this.setState({ isProfilePanelOpen: true })}>
                <Icon icon="target" size="lg" />
                Perfiles
              </Dropdown.Item>
              <Dropdown.Item onSelect={() => this.setState({ isFleetConfigOpen: true })}>
                <Icon icon="subway" size="lg" />
                Flotas
              </Dropdown.Item>
            </Dropdown>
          </ButtonGroup>
        </div>
        <ProfilePanel 
          profilePanelHandler={val => this.setState({ isProfilePanelOpen: val })} 
          isProfilePanelOpen={this.state.isProfilePanelOpen} 
        />
        <FleetPanel
          fleetPanelHandler={val => this.setState({ isFleetConfigOpen: val })}
          isFleetPanelOpen={this.state.isFleetConfigOpen}
        />
        <StationPanel 
          stationPanelHandler={val => this.setState({ isStationConfigOpen: val })}
          isStationPanelOpen={this.state.isStationConfigOpen}
        />
        <ExportPanel
          exportPanelHandler={val => this.setState({ isExportPanelOpen: val })}
          isExportPanelOpen={this.state.isExportPanelOpen}
        />
      </div>
    )
  }
}

export default App
