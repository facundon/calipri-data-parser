// eslint-disable-next-line no-use-before-define
import React, { useState } from "react"
import IconButton from "rsuite/lib/IconButton"
import Icon from "rsuite/lib/Icon"
import Table from "rsuite/lib/Table"
import Divider from "rsuite/lib/Divider"
import { Dimension } from "../ProfilePanel/template"
import { DataKey } from "../EditCell"

export type EditableValues = {
  maxVal: number | null | "-",
  minVal: number | null | "-"
 }

const ActionEditCell: React.ElementType = ({ rowData, dataKey, onClick, ...props }: {rowData: Dimension, dataKey: DataKey, onClick: any}) => {
  const { Cell } = Table
  const [unchangedValues, setUnchangedValues] = useState<EditableValues>()
  const editing = rowData!.status === "EDIT"
  const editable = rowData.children?.length === 0

  const handleAction = (discard: boolean) => {
    setUnchangedValues({ minVal: rowData.minVal, maxVal: rowData.maxVal })
    onClick && onClick(rowData!.id, discard, unchangedValues)
  }

  return (
    editable
      ? <Cell {...props} className="link-group" style={{ padding: "8px 0" }}>
        <IconButton
          appearance="ghost"
          size="sm"
          color={editing ? "green" : "orange"}
          onClick={() => handleAction(false)}
          circle
          icon={<Icon icon={editing ? "save" : "edit2"} />}
        />
        {editing
          ? <>
            <Divider vertical style={{ margin: "0 9px" }}/>
            <IconButton
              appearance="ghost"
              color="red"
              size="sm"
              onClick={() => handleAction(true)}
              circle
              icon={<Icon icon="undo" />}
            />
          </>
          : null
        }
      </Cell>
      : null
  )
}

export default ActionEditCell
