/* eslint-disable react-hooks/rules-of-hooks */
import { Component } from "react"

import { 
  ProfilePanel,
  DragLoader,
  FleetPanel,
  StationPanel,
  ExportPanel,
  confirmService
} from "./Components"
import Button from "rsuite/lib/Button"
import ButtonGroup from "rsuite/lib/ButtonGroup"
import Dropdown from "rsuite/lib/Dropdown"
import Icon from "rsuite/lib/Icon"
import IconButton from "rsuite/lib/IconButton"
import Alert from "rsuite/lib/Alert"
import Progress from "rsuite/lib/Progress"
import { forIn } from "lodash"

import { 
  load,
  printPdf,
  useDb,
  selectConfigDirectory,
  resetConfig,
  closeApp,
  minimizeApp,
  onUpdate,
  startUpdate,
  getUpdateProgress,
  onUpdateDownloaded,
} from "./Scripts/electron-bridge"
import evaluate from "./Scripts/evaluate"
import prepareData from "./Scripts/print"

import { PARSED_DATA_INITIAL_VALUES } from "./Components/DragLoader"
import { IParsedData } from "./Components/DragLoader/types"
import { TLine } from "./Components/StationPanel/template"

import "rsuite/dist/styles/rsuite-default.css"
import "./globalStyles/index.scss"


const { Line } = Progress

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
  needUpdate: boolean,
  isUpdating: boolean,
  updateProgress: number,
  updateError: boolean,
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
      needUpdate: false,
      isUpdating: false,
      updateProgress: 0,
      updateError: false,
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
      const lines: TLine[] = await load("lineas")
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
      const ers: {[x: string]: string} = await load("ers")
      const lastDate: {date: string} = await useDb("fetchLastDate", { 
        line: this.getItemInHeader("Linea"),
        fleet: this.getItemInHeader("Flota"),
        unit: this.getItemInHeader("Formacion")
      })
      if (!stations) return
      const preparedData = prepareData(
        evaluatedData,
        this.state.parsedData.header,
        vehicleSchema, stations,
        ers,
        lastDate
      )
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

  componentDidMount() {
    onUpdate(() => {
      this.setState({ needUpdate: true })
    })
    getUpdateProgress((progress: number, updating: boolean) => {
      this.setState({
        updateProgress: Math.round(progress),
        updateError: !updating
      })
    })
    onUpdateDownloaded(() => {
      this.setState({
        isUpdating: false,
        needUpdate: false
      })
    })
  }

  render() {
    const { isExportPanelOpen, isFleetConfigOpen, isProfilePanelOpen,
      isLoaded, isPrinting, isStationConfigOpen, isUpdating, needUpdate,
      updateError, updateProgress } = this.state
    return (
      <>
        <div className={`top-bar ${needUpdate && "update"}`}>
          {needUpdate &&
            <div className="update-wrapper">
              {updateProgress 
                ? <Line 
                  percent={updateProgress}
                  status={updateError ? "fail" : updateProgress !== 100 ? "active" : "success"}
                />  
                : <span>Nueva version disponible!</span>
              }
            </div>
          }
          <div className="btn-wrapper">
            {needUpdate &&
              <Button
                color="green"
                size="md"
                appearance="primary"
                loading={isUpdating}
                onClick={() => {
                  this.setState({ isUpdating: true })
                  startUpdate()
                }}
              >
                Actualizar
                <Icon icon="cloud-download" style={{paddingLeft: "5px"}}/>
              </Button>
            }
            <IconButton 
              icon={<Icon icon="minus"/>}
              appearance="subtle"
              onClick={() => minimizeApp()}
            />
            <IconButton 
              icon={<Icon icon="close"/>}
              color="red"
              appearance="subtle"
              disabled={isPrinting || isUpdating}
              onClick={() => closeApp()}
            />
          </div>
        </div>
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
                disabled={!isLoaded || isPrinting || isUpdating}
                loading={isPrinting}
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
                    disabled={isUpdating}
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
            isProfilePanelOpen={isProfilePanelOpen} 
          />
          <FleetPanel
            fleetPanelHandler={val => this.setState({ isFleetConfigOpen: val })}
            isFleetPanelOpen={isFleetConfigOpen}
          />
          <StationPanel 
            stationPanelHandler={val => this.setState({ isStationConfigOpen: val })}
            isStationPanelOpen={isStationConfigOpen}
          />
          <ExportPanel
            exportPanelHandler={val => this.setState({ isExportPanelOpen: val })}
            isExportPanelOpen={isExportPanelOpen}
          />
        </div>
      </>
    )
  }
}

export default App
