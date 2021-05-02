import React, { useState } from "react"
import Table from "rsuite/lib/Table"
import IconButton from "rsuite/lib/IconButton"
import Icon from "rsuite/lib/Icon"
import Tag from "rsuite/lib/Tag"
import Whisper from "rsuite/lib/Whisper"
import Tooltip from "rsuite/lib/Tooltip"
import Input from "rsuite/lib/Input"

import { Fleet } from "../FleetPanel/template"

import "./styles/index.scss"


const SingleTagCell: React.ElementType = ({ rowData, dataKey, updateReference, number = false, ...props }: {
    rowData: Fleet,
    dataKey: "reference" | "module",
    updateReference: (ref: string, id: string, action: "update") => void,
    number?: boolean,
  }) => {
  const { Cell } = Table
  const [ref, setRef] = useState<string>(rowData[dataKey])
  const [editing, setEditing] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)

  const handleSubmit = () => {
    if (editing) {
      if (!ref) {
        setError(true)
        return
      }
      updateReference(ref, rowData.id, "update")
      setEditing(false)
    } else {
      setEditing(true)
    }
  }

  return (
    <Cell {...props} >
      {editing
        ? 
        <Whisper
          open={error}
          trigger="none"
          placement="bottomStart"
          speaker={<Tooltip className="modal-form">Requerido</Tooltip>}
        >
          <Input
            className="single-tag-input"
            style={{width: 35}}
            onChange={val => {
              if (number) val = val.replace(/\D/g, "")
              setRef(val.toUpperCase())
              setError(false)
            }}
            onPressEnter={handleSubmit}
            maxLength={1}
            autoFocus
            size="xs"
            placeholder={ref || number ? "1" : "R"}
            defaultValue={ref}
            value={ref}
          />
        </Whisper>
        : <Tag key={rowData.id} className="single-tag-tag">{rowData[dataKey]}</Tag>
      }
      <IconButton 
        style={{marginLeft: "10px"}}
        className="single-tag-button"
        appearance={"link"}
        color={"green"}
        size={"sm"}
        icon={<Icon icon={editing ? "check" : "edit"} />}
        onClick={handleSubmit}
      />
    </Cell>
  )
}

export default SingleTagCell
