import React, { useState } from "react"
import Table from "rsuite/lib/Table"
import IconButton from "rsuite/lib/IconButton"
import Icon from "rsuite/lib/Icon"
import Tag from "rsuite/lib/Tag"
import Whisper from "rsuite/lib/Whisper"
import Tooltip from "rsuite/lib/Tooltip"

import { Fleet } from "../FleetPanel/template"
import Input from "rsuite/lib/Input"

import "./styles/index.scss"


const SingleTagCell: React.ElementType = ({ rowData, updateReference, ...props }: {
    rowData: Fleet,
    updateReference: (ref: string, id: string, action: "update") => void,
  }) => {
  const { Cell } = Table
  const [ref, setRef] = useState<string>("")
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
    <Cell {...props}>
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
              setRef(val)
              setError(false)
            }}
            onPressEnter={handleSubmit}
            maxLength={1}
            autoFocus
            size="xs"
            placeholder={ref || "R"}
            defaultValue={ref}
          />
        </Whisper>
        : <Tag key={rowData.id} className="single-tag-tag">{rowData.reference}</Tag>
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
