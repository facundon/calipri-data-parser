// eslint-disable-next-line no-use-before-define
import React from "react"
import Table from "rsuite/lib/Table"
import Input from "rsuite/lib/Input"

import "./styles/index.scss"
import { TLine } from "../StationPanel/template"

export type DataKey =
  | "station1"
  | "station2"

const EditCell: React.ElementType = ({ rowData, dataKey, onChange, onPressEnter, ...props }: {rowData: TLine, dataKey: DataKey, onChange: any, onPressEnter: any}) => {
  const { Cell } = Table
  const editing = rowData!.status === "EDIT"
  return (
    <Cell {...props} className={editing ? "table-content-editing" : ""}>
      {editing
        ? (
          <Input
            defaultValue={rowData[dataKey]?.toString()}
            onChange={value => {
              onChange && onChange(rowData.id, dataKey, value)
            }}
            onPressEnter={() => onPressEnter(rowData.id, false, null)}
          />
        )
        : (
          <span className="table-content-edit-span">{rowData![dataKey]}</span>
        )}
    </Cell>
  )
}

export default EditCell
