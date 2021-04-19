import React from "react"
import Avatar from "rsuite/lib/Avatar"
import Table from "rsuite/lib/Table"

import { Line } from "../StationPanel/template"

import "./styles/index.scss"

const AvatarCell: React.ElementType = ({ rowData, ...props }: {rowData: Line}) => {
  const { Cell } = Table
  return (
    <Cell 
      {...props}
      className="avatar-cell"
    >
      <Avatar circle className={rowData.name} style={{backgroundColor: rowData.color}}>
        {rowData.name}
      </Avatar>
    </Cell>
  )
}

export default AvatarCell
