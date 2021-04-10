import React, { Component } from "react"

import { ProfilePanel, DragLoader, FleetPanel } from "./Components"
import Button from "rsuite/lib/Button"
import ButtonGroup from "rsuite/lib/ButtonGroup"
import Dropdown from "rsuite/lib/Dropdown"
import Icon from "rsuite/lib/Icon"
import { IParsedData } from "./Components/DragLoader/types"
import { PARSED_DATA_INITIAL_VALUES } from "./Components/DragLoader"

import "./rsuite-default.css"
import "./globalStyles/index.scss"
import { evaluate } from "./Scripts/evaluate"

interface IProps {
}

interface IState {
  isLoaded: boolean,
  isPrinting: boolean,
  isProfilePanelOpen: boolean,
  isFleetConfigOpen: boolean,
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
      parsedData: PARSED_DATA_INITIAL_VALUES
    }
  }

  handlePrintPDF = async() => {
    this.setState({ isPrinting: true })
    const evaluatedData = await evaluate(this.state.parsedData)
    console.log(evaluatedData)
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
                  color="cyan"
                  appearance="subtle"
                >
                  <Icon icon="sliders" size="2x" />
                  {children}
                </Button>
              }
            >
              <Dropdown.Item onSelect={() => this.setState({ isFleetConfigOpen: true })}>
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
          profilePanelHandler={value => this.setState({ isProfilePanelOpen: value })} 
          isProfilePanelOpen={this.state.isProfilePanelOpen} 
        />
        <FleetPanel
          fleetPanelHandler={val => this.setState({ isFleetConfigOpen: val })}
          isFleetPanelOpen={this.state.isFleetConfigOpen}
        />
      </div>
    )
  }
}

export default App
