// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from "react"
import Modal from "rsuite/lib/Modal"
import Button from "rsuite/lib/Button"
import Icon from "rsuite/lib/Icon"
import Nav from "rsuite/lib/Nav"
import Table from "rsuite/lib/Table"
import InputModal from "../InputModal"
import ActionEditCell, { EditableValues } from "../ActionEditCell"
import EditCell, { DataKey } from "../EditCell"
import ManageCell from "../ManageCell"
import confirmService from "../confirmService/index"
import AddItemModal from "../AddItemModal"
import Alert from "rsuite/lib/Alert"

import { normalize } from "../../Scripts/utils"
import { load, save, deleteFile, getFiles } from "../../Scripts/storage"
import { TEMPLATE, Dimension } from "./template"
import "./styles/index.scss"

import { FLEET_FILE } from "../FleetPanel"
import { Fleet } from "../FleetPanel/template"


export const PROFILES_FOLDER = "perfiles"
const ITEMS_WITH_FLEET = [
  "Diametro",
  "Dif. Diametro de Rueda - Mismo Eje",
  "Dif. Diametro de Rueda - Mismo Bogie",
  "Dif. Diametro de Rueda - Mismo Coche",
  "Dif. Diametro de Rueda - Mismo Modulo",
]


interface IProfilePanel {
  profilePanelHandler: (value: boolean) => void,
  isProfilePanelOpen: boolean,
}

function trimmedId(string: string, substring: string, position: number) {
  const arrString = string.split(substring)
  return arrString.slice(0, position).join("-")
}

function getNewId(activeItem: Dimension) {
  if (activeItem.children?.length === 0) {
    const arrId = activeItem.id.split("-")
    arrId.push("1")
    const newIndex = arrId.join("-")
    return newIndex
  } else {
    const arrId = activeItem.children!.flatMap(val => {
      const subArrId = val.id.split("-")
      while (subArrId.length > 1) {
        subArrId.splice(0, 1)
      }
      return subArrId
    }) // Get new array of index last number
    
    // Find empty space in the index chain and save the number
    let newLastIndex = arrId.findIndex((val, index) => parseInt(val) !== index + 1) + 1 
    if (newLastIndex === -1 || newLastIndex === 0) {
      // If there is no empty space, add a newLastIndex to the end of the array
      newLastIndex = parseInt(arrId[arrId.length - 1]) + 1 
    }
    // Save a template index to get the firsts numbers (if it has)
    const nextIndex = activeItem.children![0].id.split("-") 
    // Remove the last item and replace it with the newLastIndex
    nextIndex.splice(nextIndex.length - 1, 1, newLastIndex.toString()) 
    return nextIndex.join("-")
  }
}

const ProfilePanel: React.FC<IProfilePanel> = ({ profilePanelHandler, isProfilePanelOpen }) => {
  const [profiles, setProfiles] = useState<string[]>(["ORE"])
  const [activeProfile, setActiveProfile] = useState<string>(profiles[0])
  const [showAddProfile, setshowAddProfile] = useState<boolean>(false)
  const [showRemoveProfile, setshowRemoveProfile] = useState<boolean>(false)
  const { Column, Cell, HeaderCell } = Table
  const [activeData, setActiveData] = useState<Dimension[]>(TEMPLATE)
  const [activeItem, setActiveItem] = useState<Dimension>(TEMPLATE[0])
  const [showAddItem, setShowAddItem] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // load all profiles on folder to display names
  useEffect(() => {
    const loadProfiles = async() => {
      setLoading(true)
      const files = await getFiles(PROFILES_FOLDER)
      if (files.length !== 0) {
        setProfiles(files.map((file: string) => file.replace(".json", "").toUpperCase()))
      } else {
        await save(profiles[0], getActiveDataWithoutParent(), PROFILES_FOLDER) && 
          Alert.info(`Se creo un archivo de configuración para perfil ${profiles[0]}`, 7000)
      }
      setLoading(false)
    }
    loadProfiles()
  }, [])

  // load profile data
  useEffect(() => {
    const dataLoad = async() => {
      setLoading(true)
      const nextData = await load(activeProfile, PROFILES_FOLDER)
      setLoading(false)
      nextData
        ? setActiveData(nextData)
        : Alert.error(`No se pudo cargar la configuración del perfil ${activeProfile}`, 7000)
    }
    dataLoad()
  }, [activeProfile])

  function getActiveDataWithoutParent(data = activeData) {
    const dataWithoutParent: Dimension[] = Object.assign([], data)
    dataWithoutParent.forEach((val, index) => {
      delete dataWithoutParent[index]._parent
      dataWithoutParent[index].status = null
      val.children?.forEach((childVal, childIndex) => {
        delete dataWithoutParent[index].children[childIndex]._parent
        dataWithoutParent[index].children[childIndex].status = null
        childVal.children?.forEach((subChildVal, subChildIndex) => {
          delete dataWithoutParent[index].children[childIndex].children[subChildIndex]?._parent
          dataWithoutParent[index].children[childIndex].children[subChildIndex].status = null
        })
      })
    }) // delete _parent property from object (which I didn't create)
    return dataWithoutParent
  }

  function findActiveItem(id: string) : [Dimension, Dimension[]] {
    const nextData: Dimension[] = Object.assign([], activeData)
    let activeItem = nextData.find(item => item.id === id)
    if (!activeItem) {
      const activeParentItem = nextData.find(item => item.id === trimmedId(id, "-", 1))
      activeItem = activeParentItem!.children!.find(item => item.id === id)
      if (!activeItem) {
        activeItem = activeParentItem!.children!.find(item => item.id === trimmedId(id, "-", 2))
        activeItem = activeItem!.children!.find(item => item.id === id)
      }
    }
    return [activeItem!, nextData]
  }

  function closeEditCells() {
    activeData.forEach(item => {
      item.status = null
      item.children.forEach(subItem => {
        subItem.status = null
        subItem.children.forEach(subSubItem => {
          subSubItem.status = null
        })
      })
    })
  }

  // get profile fleets
  useEffect(() => {
    if (isProfilePanelOpen) {
      const loadFleets = async() => {
        setLoading(true)
        const loadedFleets: Fleet[] | false = await load(FLEET_FILE)
        if (loadedFleets) {
          const activeFleets = loadedFleets.filter(fleet => fleet.profiles.includes(activeProfile))
          activeFleets.length === 0 &&
            Alert.warning(`No se encontraron flotas asociadas al perfil ${activeProfile}. Asignelas desde el panel de Flotas`, 10000) 
          const nextData: Dimension[] = Object.assign([], activeData)
          nextData.forEach((dim, index) => {
            if (ITEMS_WITH_FLEET.includes(dim.name)) {
              const childFleet: Dimension[] = activeFleets.map((fleet, fleetIndex) => {
                const currentChild = dim.children.find(item => item.name.toUpperCase() === fleet.fleet.toUpperCase())
                currentChild?.children.forEach((_, childIndex) => {
                  currentChild.children[childIndex].id = `${dim.id}-${fleetIndex + 1}-${childIndex + 1}`
                })
                return (
                  {
                    id: `${dim.id}-${fleetIndex + 1}`,
                    name: fleet.fleet,
                    minVal: currentChild?.minVal || null,
                    maxVal: currentChild?.maxVal || null,
                    status: null,
                    children: currentChild?.children || [],
                  }
                )})
              nextData[index].children = []
              nextData[index].children = childFleet
            }
          })
          setActiveData(nextData)
          // TODO: need to save data here without crashing 
        }
        setLoading(false)
      }
      loadFleets()
    }
  }, [isProfilePanelOpen, activeProfile])

  const handleManage = async(id: string, action: "remove" | "add") => {
    const [activeItem, nextData] = findActiveItem(id)
    switch (action) {
    case "remove": {
      const confirm = await confirmService.show({
        message: `Seguro que desea eliminar el item ${activeItem.name}? ${activeItem.children.length !== 0 ? "También se eliminaran todos los sub-items" : ""}`
      })
      confirm &&
        nextData.forEach((val, index) =>
          val.children?.forEach((childVal, childIndex) =>
            childVal.id === id
              ? nextData[index].children?.splice(childIndex, 1)
              : childVal.children?.includes(activeItem) && nextData[index].children![childIndex].children?.splice(childVal.children?.findIndex(val => val.id === id), 1)
          )
        )
      const parentIndex = nextData.findIndex(val => val.id === id.split("-")[0])
      if (nextData[parentIndex].children.length === 0) {
        nextData[parentIndex].maxVal = "-"
        nextData[parentIndex].minVal = "-"
      } else {
        const itemIndex = nextData[parentIndex].children.findIndex(val => {
          const childrenId = id.split("-")
          childrenId.pop()
          return val.id === childrenId.join("-")
        })
        if (nextData[parentIndex].children[itemIndex]?.children.length === 0) {
          nextData[parentIndex].children[itemIndex].maxVal = "-"
          nextData[parentIndex].children[itemIndex].minVal = "-"
        }
      }
      setActiveData(nextData)
      break
    }
    case "add": {
      setActiveItem(activeItem)
      setShowAddItem(true)
      break
    }
    }
  }

  const handleAddItem = (itemName: string, values: {min: string | null, max: string | null}) => {
    const nextData: Dimension[] = Object.assign([], activeData)
    const newId = getNewId(activeItem)
    const newSubItem: Dimension = {
      id: newId,
      name: itemName,
      maxVal: values.max ? normalize(values.max) : "-",
      minVal: values.min ? normalize(values.min) : "-",
      status: null,
      children: []
    }
    let activeIndex = nextData.findIndex(val => val.id === activeItem.id)
    if (activeIndex !== -1) {
      nextData[activeIndex].children.push(newSubItem)
      nextData[activeIndex].maxVal = null
      nextData[activeIndex].minVal = null
    } else {
      nextData.some(val => {
        activeIndex = val.children.findIndex(val => val.id === activeItem.id)
        return activeIndex !== -1
      })
      const parentIndex = parseInt(newId.split("-")[0], 10) - 1
      nextData[parentIndex].children[activeIndex].children.push(newSubItem)
      nextData[parentIndex].children[activeIndex].maxVal = null
      nextData[parentIndex].children[activeIndex].minVal = null
    }
    setActiveData(nextData)
    setActiveItem(activeData[0])
  }

  const handleEditValue = (id: string, key: DataKey, value: string) => {
    const [activeItem, nextData] = findActiveItem(id)
    activeItem[key] = !value ? "-" : normalize(value)
    setActiveData(nextData)
  }

  const handleEditState = (id: string, discard: boolean, unchangedValues: EditableValues) => {
    const [activeItem, nextData] = findActiveItem(id)
    if (discard) {
      activeItem!.maxVal = unchangedValues.maxVal
      activeItem!.minVal = unchangedValues.minVal
    }
    activeItem!.status = activeItem!.status ? null : "EDIT"
    setActiveData(nextData)
  }

  const handleAddProfile = async(profileName: string) => {
    setLoading(true)
    const saved = await save(profileName, getActiveDataWithoutParent(), PROFILES_FOLDER)
    if (saved) {
      profiles.push(profileName.toUpperCase())
      setActiveProfile(profileName.toUpperCase())
      Alert.success(`Perfil ${profileName.toUpperCase()} creado!`, 7000)
    } else {
      Alert.error(`No se pudo crear el perfil ${profileName.toUpperCase()}`, 7000)
    }
    setLoading(false)
  }

  const handleRemoveProfile = async(profileName: string) => {
    const confirm = await confirmService.show({
      message: `Seguro que desea eliminar el perfil ${profileName}?`,
      actionIcon: "eraser",
      actionMessage: "Eliminar",
      iconColor: "#f44336",
    })
    if (confirm) {
      const deleted = await deleteFile(profileName, PROFILES_FOLDER)
      if (deleted) {
        const removeIndex = profiles.indexOf(profileName.toUpperCase())
        removeIndex > -1 && profiles.splice(removeIndex, 1)
        setProfiles([...profiles])
        setActiveProfile(profiles[0])
        Alert.info(`Se elimino el perfil ${profileName}`, 7000)
      } else {
        Alert.error(`No se pudo eliminar el perfil ${profileName}`, 7000)
      }
    }
  }

  const handleSave = async() => {
    const dataToSave = getActiveDataWithoutParent()
    const confirm = await confirmService.show({
      message: `Seguro que desea guardar los cambios realizados al perfil ${activeProfile}?`,
      actionIcon: "save",
      actionMessage: "Guardar"
    })
    if (confirm) {
      setLoading(true)
      const saved = await save(activeProfile, dataToSave, PROFILES_FOLDER)
      setLoading(false)
      saved ? Alert.success("Cambios Guardados!", 7000) : Alert.error("No se pudieron guardar los cambios", 7000)
      profilePanelHandler(false)
    }
  }

  const handleDiscard = async(event: React.SyntheticEvent | string) => {
    setLoading(true)
    const savedData = await load(activeProfile, PROFILES_FOLDER)
    setLoading(false)
    if (savedData && JSON.stringify(savedData) !== JSON.stringify(getActiveDataWithoutParent())) {
      const confirm = await confirmService.show({
        message: `Seguro que desea descartar los cambios realizados al perfil ${activeProfile}?`,
        actionIcon: "trash2",
        actionMessage: "Descartar",
        iconColor: "#f44336",
      })
      if (confirm) {
        closeEditCells()
        typeof event !== "string"
          ? profilePanelHandler(false)
          : setActiveProfile(event)
        setActiveData(savedData)
      }
    } else {
      typeof event !== "string"
        ? profilePanelHandler(false)
        : setActiveProfile(event)
    }
  }

  return (
    <Modal size="lg" show={isProfilePanelOpen} className="config-form">
      <Modal.Header closeButton={false}>
        <Modal.Title>Perfiles de Rueda</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Nav justified appearance="subtle" activeKey={activeProfile} onSelect={handleDiscard}>
          {profiles.map(
            item => <Nav.Item key={item} eventKey={item}>{item}</Nav.Item>
          )}
        </Nav>
        <Table
          isTree
          loading={loading}
          shouldUpdateScroll={false}
          rowKey="id"
          height={600}
          data={activeData}
          renderTreeToggle={(icon, rowData) => {
            if (rowData.children && rowData.children.length === 0) {
              return null
            }
            return icon
          }}
        >
          <Column width={85} align="center" >
            <HeaderCell></HeaderCell>
            <ManageCell dataKey="id" onClick={handleManage} />
          </Column>
          <Column flexGrow={4} fixed treeCol>
            <HeaderCell>Parámetro</HeaderCell>
            <Cell dataKey="name" className="parameter-cell" />
          </Column>
          <Column flexGrow={2} align="center">
            <HeaderCell>Mínimo</HeaderCell>
            <EditCell dataKey="minVal" onChange={handleEditValue} onPressEnter={handleEditState}/>
          </Column>
          <Column flexGrow={2} align="center">
            <HeaderCell>Máximo</HeaderCell>
            <EditCell dataKey="maxVal" onChange={handleEditValue} onPressEnter={handleEditState}/>
          </Column>
          <Column width={120} align="center" fixed="right">
            <HeaderCell>Editar</HeaderCell>
            <ActionEditCell dataKey="id" onClick={handleEditState}/>
          </Column>
        </Table>
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={() => setshowAddProfile(true)} appearance="ghost" className="btn-left">
          <Icon icon="plus" size="lg"/>
          Nuevo Perfil
        </Button>
        <Button onClick={() => setshowRemoveProfile(true)} appearance="ghost" className="btn-left">
          <Icon icon="minus" size="lg"/>
          Eliminar Perfil
        </Button>
        <Button onClick={handleSave} appearance="primary">
          <Icon icon="save" size="lg"/>
          Guardar
        </Button>
        <Button onClick={handleDiscard} appearance="subtle">
          <Icon icon="trash-o" size="lg"/>
          Descartar
        </Button>
      </Modal.Footer>
      <InputModal
        setShow={setshowRemoveProfile}
        onSubmit={handleRemoveProfile}
        show={showRemoveProfile}
        actionMessage="Eliminar"
        actionIcon="minus"
        title="Eliminar Perfil"
        validationMessage="Seleccionar un perfil"
        type={"delete"}
        data={profiles}
      />
      <InputModal
        setShow={setshowAddProfile}
        onSubmit={handleAddProfile}
        show={showAddProfile}
        actionMessage="Crear"
        actionIcon="plus"
        title="Crear Perfil"
        validationMessage="Ese perfil ya existe"
        type={"add"}
        data={profiles}
      />
      <AddItemModal
        setShow={setShowAddItem}
        onSubmit={handleAddItem}
        data={activeItem!}
        show={showAddItem}
        title="Agregar Item"
        validationMessage="Ese item ya existe"
      />
    </Modal>
  )
}

export default ProfilePanel
