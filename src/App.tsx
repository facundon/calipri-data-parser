import React, { Component } from "react"

import { ProfilePanel, DragLoader, FleetPanel, StationPanel } from "./Components"
import Button from "rsuite/lib/Button"
import ButtonGroup from "rsuite/lib/ButtonGroup"
import Dropdown from "rsuite/lib/Dropdown"
import Icon from "rsuite/lib/Icon"
import { IParsedData } from "./Components/DragLoader/types"
import { PARSED_DATA_INITIAL_VALUES } from "./Components/DragLoader"
import { load, save, printPdf } from "./Scripts/storage"
import { forIn, replace } from "lodash"

import "./rsuite-default.css"
import "./globalStyles/index.scss"
import evaluate from "./Scripts/evaluate"
import prepareData from "./Scripts/print.js"
import Alert from "rsuite/lib/Alert"
import { Line } from "./Components/StationPanel/template"

interface IProps {
}

interface IState {
  isLoaded: boolean,
  isPrinting: boolean,
  isProfilePanelOpen: boolean,
  isFleetConfigOpen: boolean,
  isStationConfigOpen: boolean,
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
      parsedData: PARSED_DATA_INITIAL_VALUES
    }
  }

  handlePrintPDF = async() => {
    const findStations = async() => {
      const lines: Line[] = await load("lineas", undefined)
      if (lines){
        const line = lines.find(line => line.name === this.state.parsedData.header.find(item => Object.keys(item)[0] === "Linea")?.Linea)
        if (!line) {
          Alert.error("No se encontro el parámetro 'Linea' en los datos de la medición", 10000)  
          return null
        }
        return [line.station1, line.station2]
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
      if (!stations) return
      const preparedData = prepareData(evaluatedData, this.state.parsedData.header, vehicleSchema, stations)
      const loadedHtml: string = await load("report", "templates", ".html")
      if (!loadedHtml) {
        Alert.error("No se pudo cargar la plantilla para imprimri", 10000)
        return
      }
      let replacedHtml = loadedHtml
      forIn(preparedData, (val, key) => {
        replacedHtml = replacedHtml.replaceAll(`$${key}$`, val)
      })
      replacedHtml = replacedHtml.replace(/\r?\n|\r/g, "")
      // await save("test", replacedHtml, "templates", ".html")
      const success = await printPdf(replacedHtml, "test")
      success ? Alert.success("Reporte emitido!", 10000) : Alert.error("Ocurrio un error al emitir el reporte.", 10000)
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
                  color="yellow"
                  appearance="subtle"
                >
                  <Icon icon="sliders" size="2x" />
                  {children}
                </Button>
              }
            >
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
      </div>
    )
  }
}

export default App
