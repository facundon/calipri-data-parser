// eslint-disable-next-line no-use-before-define
import * as React from "react"
import Table from "rsuite/lib/Table"
import { Dimension } from "../ProfilePanel/template"
import Whisper from "rsuite/lib/Whisper"
import Tooltip from "rsuite/lib/Tooltip"
import Icon from "rsuite/lib/Icon"
import Divider from "rsuite/lib/Divider"

import { DataKey } from "../EditCell"
import "./styles/index.scss"

const tooltip = (text: string) => <Tooltip>{text}</Tooltip>

const ManageCell: React.ElementType = ({ rowData, dataKey, onClick, noTree = false, ...props }: 
  {
    rowData: Dimension,
    dataKey:DataKey,
    onClick: any,
    noTree: boolean,
  }) => {
  const { Cell } = Table
  const onlyRemove = rowData.id.split("-").length === 3
  const onlyAdd = rowData.id.split("-").length === 2
  const excluded = rowData.id.indexOf("-") === -1

  const handleAction = (action : "remove" | "add") => {
    onClick && onClick(rowData.id, action)
  }

  return (
    !excluded || noTree
      ? <Cell {...props}>
        {onlyRemove || noTree
          ? <Whisper placement="left" trigger="hover" speaker={tooltip("Remover Item")}>
            <Icon onClick={() => handleAction("remove")} icon="minus-square-o" className="action-icon remove" />
          </Whisper>
          : null}
        {!onlyAdd && !onlyRemove ? <Divider vertical style={{ margin: "0 4px" }}/> : null}
        {onlyAdd
          ? <Whisper placement="top" trigger="hover" speaker={tooltip("Agregar Sub-Item")}>
            <Icon onClick={() => handleAction("add")} icon="plus-square-o" className="action-icon add" />
          </Whisper>
          : null
        }
      </Cell>
      : null
  )
}

export default ManageCell
