// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from "react"
import Table from "rsuite/lib/Table"
import IconButton from "rsuite/lib/IconButton"
import Icon from "rsuite/lib/Icon"
import TagGroup from "rsuite/lib/TagGroup"
import Tag from "rsuite/lib/Tag"

import { getFiles } from "../../Scripts/storage"
import { Fleet } from "../FleetPanel/template"
import InputPicker from "rsuite/lib/InputPicker"
import { PROFILES_FOLDER } from "../ProfilePanel"

import "./styles/index.scss"

const TagCell: React.ElementType = ({ rowData, manageProfile, ...props }:
   {
     rowData: Fleet,
     manageProfile: (profile: string, id: string, action: "add" | "remove") => void, 
    }) => {
  const { Cell } = Table
  const [editing, setEditing] = useState<boolean>(false)
  const [posibleProfiles, setPosibleProfiles] = useState<string[]>(["loading"])

  useEffect(() => {
    async function loadFiles() {
      const rawProfiles = await getFiles(PROFILES_FOLDER)
      const allProfiles = rawProfiles.map(profile => profile.slice(0, profile.indexOf(".json")))
      setPosibleProfiles(allProfiles.filter(profile => !rowData.profiles.includes(profile)))
    }
    loadFiles()
  }, [rowData])

  useEffect(() => {
    rowData.profiles.length === 0 && setEditing(true)
  }, [rowData])

  return (
    <Cell {...props}>
      <TagGroup>
        {rowData.profiles.map(profile => 
          <Tag 
            key={rowData.id + profile} 
            color="violet"
            closable
            onClose={() => manageProfile(profile, rowData.id, "remove")}
          >
            {profile}
          </Tag>
        )}
        {editing && posibleProfiles.length !== 0
          ? <InputPicker
            style={{marginTop: rowData.profiles.length === 0 ? "8px" : ""}}
            onChange={val => {
              manageProfile(val, rowData.id, "add")
              setEditing(false)
            }}
            appearance={"subtle"}
            size={"xs"}
            cleanable={false}
            placeholder="Perfil"
            locale={{ noResultsText: "No se encontraron resultados" }}
            data={posibleProfiles.map(
              (item: string) => ({ value: item, label: item })
            )}
            renderMenu={menu => {
              if (posibleProfiles[0] === "loading") {
                return (
                  <p style={{ padding: 4, color: "#999", textAlign: "center" }}>
                    <Icon icon="spinner" spin /> 
                    <p style={{fontSize: "10px", display: "inline-block", paddingLeft: "4px"}}>Cargando...</p>
                  </p>
                )
              }
              return menu
            }}
          />
          : posibleProfiles.length !== 0 && 
            <IconButton 
              style={{marginLeft: "10px"}}
              appearance={"ghost"}
              size={"xs"}
              icon={<Icon icon="plus" />}
              onClick={() => setEditing(true)}
            />
        }
      </TagGroup>
    </Cell>
  )
}

export default TagCell
