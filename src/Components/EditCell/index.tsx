// eslint-disable-next-line no-use-before-define
import React from "react"
import Table from "rsuite/lib/Table"
import InputNumber, { InputNumberProps } from "rsuite/lib/InputNumber"
import InputGroup from "rsuite/lib/InputGroup"
import { Dimension } from "../ProfilePanel/template"

import "./styles/index.scss"

export type DataKey =
  | "minVal"
  | "maxVal"

export const InputWithButtons: React.FC<InputNumberProps> = ({onPressEnter, id, disabled, ...props}) => {
  const inputRef: React.Ref<InputNumberProps> = React.createRef()
  const handleMinus = () => {
    !disabled && inputRef.current!.handleMinus()
  }
  const handlePlus = () => {
    !disabled && inputRef.current!.handlePlus()
  }
  return (
    <InputGroup>
      <InputGroup.Button disabled={disabled} onClick={handleMinus} appearance="subtle" color="orange">-</InputGroup.Button>
      <InputNumber
        {...props}
        className={"input-number-with-buttons"}
        ref={inputRef}
        step={1}
        maxLength={5}
        min={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          e.key === "Enter" && onPressEnter && onPressEnter(id, false, null)
        }}
      />
      <InputGroup.Button disabled={disabled} onClick={handlePlus} appearance="subtle" color="orange">+</InputGroup.Button>
    </InputGroup>
  )
}

const EditCell: React.ElementType = ({ rowData, dataKey, onChange, onPressEnter, ...props }: {rowData: Dimension, dataKey:DataKey, onChange: any, onPressEnter: any}) => {
  const { Cell } = Table
  const editing = rowData!.status === "EDIT"
  return (
    <Cell {...props} className={editing ? "table-content-editing" : ""}>
      {editing
        ? (
          <InputWithButtons
            defaultValue={rowData![dataKey]?.toString() === "-" ? "0" : rowData![dataKey]?.toString()}
            onChange={value => {
              onChange && onChange(rowData!.id, dataKey, value)
            }}
            onPressEnter={onPressEnter}
            id={rowData.id}
          />
        )
        : (
          <span className="table-content-edit-span">{rowData![dataKey]}</span>
        )}
    </Cell>
  )
}

export default EditCell
