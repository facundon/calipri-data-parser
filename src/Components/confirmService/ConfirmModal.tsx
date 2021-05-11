// eslint-disable-next-line no-use-before-define
import { Component } from "react"
import { render } from "react-dom"
import Modal from "rsuite/lib/Modal"
import Button from "rsuite/lib/Button"
import Icon, { IconNames } from "rsuite/lib/Icon"

import "./styles/index.scss"

type Config = {
  actionMessage?: string
  actionIcon?: IconNames,
  message?: string,
  mainIcon?: IconNames,
  iconColor?: string,
}

interface IState {
  configProps: Config,
  show: boolean
}

interface IProps {
  createConfirmProps: Config
}

let resolveAction : (value: any) => void
const defaultConfig: Config = {
  message: "Esta seguro?",
  actionMessage: "Aceptar",
  actionIcon: "check",
  mainIcon: "exclamation-triangle",
  iconColor: "#ffb300"
}

class ConfirmModal extends Component<IProps, IState> {
  static create = (props: Config = {}): any => {
    const containerElement = document.createElement("div")
    document.body.appendChild(containerElement)
    return render(
      <ConfirmModal createConfirmProps={props}/>, containerElement)
  }

  constructor(props: any) {
    super(props)

    this.state = {
      show: false,
      configProps: {}
    }
  }

  handleClick(confirm: boolean) {
    this.setState({ show: false })
    resolveAction(confirm)
  }

  show(props: Config = {}): Promise<boolean> {
    const configProps = { ...this.props.createConfirmProps, ...props }
    this.setState({ show: true, configProps })
    return new Promise((resolve) => {
      resolveAction = resolve
    })
  }

  render() {
    const { show, configProps } = this.state
    const { message, actionIcon, actionMessage, mainIcon, iconColor } = configProps
    return (
      <Modal
        backdrop
        size="xs"
        show={show}
        onHide={() => this.handleClick(false)}
      >
        <Modal.Header>
          <Modal.Title>Confirmar</Modal.Title>
        </Modal.Header>

        <Modal.Body className="confirm-message">
          <Icon icon={mainIcon || defaultConfig.mainIcon!} size="3x" style={{ color: `${iconColor || defaultConfig.iconColor!}` }} />
          <p>{message || defaultConfig.message}</p>
        </Modal.Body>

        <Modal.Footer className="modal-form">
          <Button
            onClick={() => this.handleClick(true)}
            appearance="primary">
            {<Icon icon={actionIcon || defaultConfig.actionIcon!} size="lg" />}
            {actionMessage || defaultConfig.actionMessage}
          </Button>
          <Button
            onClick={() => this.handleClick(false)}
            appearance="subtle"
          >
            <Icon icon="close" size="lg"/>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

export default ConfirmModal
