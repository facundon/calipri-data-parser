import React from "react"
import Avatar from "rsuite/lib/Avatar"
import Table from "rsuite/lib/Table"

import { TLine } from "../StationPanel/template"

import "./styles/index.scss"

const AvatarCell: React.ElementType = ({ rowData, onClick, ...props }: {rowData: TLine, onClick: (id: string) => void}) => {
  const { Cell } = Table

  return (
    <Cell 
      {...props}
      className="avatar-cell"
    >
      <Avatar
        circle
        style={{backgroundColor: rowData.color}}
        onClick={() => 
          onClick && onClick(rowData.id)
        }
      >
        {rowData.name}
      </Avatar>
    </Cell>
  )
}

export default AvatarCell
