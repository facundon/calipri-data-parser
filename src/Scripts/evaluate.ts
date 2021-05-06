import Alert from "rsuite/lib/Alert"
import { IParsedData, Wheel } from "../Components/DragLoader/types"
import { FLEET_FILE } from "../Components/FleetPanel"
import { Fleet } from "../Components/FleetPanel/template"
import { PROFILES_FOLDER } from "../Components/ProfilePanel"
import { Dimension } from "../Components/ProfilePanel/template"
import { load } from "./electron-bridge"
import { SubstractionKinds, SubstractionStructure, ModuleSubstractionStructure } from "./substraction"
import { toTitleCase } from "./utils"

export type Profiles = {
  [profile: string]: {
    Alto: {
      minVal: number | "-",
      maxVal: number | "-",
    }
    Ancho: {
      minVal: number | "-",
      maxVal: number | "-",
    }
    qR: {
      minVal: number | "-",
      maxVal: number | "-",
    }
    Diametro: {
      minVal: number | "-",
      maxVal: number | "-",
    }
    Trocha: {
      minVal: number | "-",
      maxVal: number | "-",
    }
    "Dif. Ancho de Pestaña": {
      minVal: number | "-",
      maxVal: number | "-",
    }
    "Dif. Diametro de Rueda - Mismo Eje": {
      minVal: number | "-",
      maxVal: number | "-",
    }
    "Dif. Diametro de Rueda - Mismo Bogie": {
      minVal: number | "-",
      maxVal: number | "-",
    }
    "Dif. Diametro de Rueda - Mismo Coche": {
      minVal: number | "-",
      maxVal: number | "-",
    }
    "Dif. Diametro de Rueda - Mismo Modulo": {
      minVal: number | "-",
      maxVal: number | "-",
    }
  }
}

export type Damnation = ("width" | "height" | "qr" | "diameter" | "gauge")[]
type EvaluatedDimension = ({
    value: string,
    damnation: boolean,
    bogie: string,
    vehicle: string,
    type: string | null,
    profile: string,
  } | null)

export interface EvaluatedWheel extends Wheel {
  damnation: Damnation
}

export interface EvaluatedSubstractions {
  width: EvaluatedDimension[]
  shaft: EvaluatedDimension[]
  bogie: EvaluatedDimension[]
  vehicle: EvaluatedDimension[]
  module: EvaluatedDimension[] | undefined
}

interface IEvaluate {
  (parsedData: IParsedData): Promise<{
    wheels: EvaluatedWheel[],
    substractions: EvaluatedSubstractions,
    references: Profiles,
  } | null>
}

interface IEvaluateWheel {
  (wheels: Wheel[], profilesReferences: Profiles) : EvaluatedWheel[]
}

interface IEvaluateSubstractions {
  (substractions: SubstractionKinds, profilesReferences: any, fleet: string) : Promise<EvaluatedSubstractions | null>
}

const getProfilesReferences = async(profiles: string[], fleet: string): Promise<Profiles | null> => {
  const loadedProfiles: any = {}
  for (const profile of profiles) {
    const loadedData: Dimension[] = await load(profile, PROFILES_FOLDER)
    if (loadedData) {
      const fleetExists = loadedData.some(item => item.children.find(child => child.name.toUpperCase() === fleet.toUpperCase()))
      if (!fleetExists) {
        Alert.error(`No se encontraron valores de referencia para la flota ${fleet} en el perfil ${profile}`, 7000)
        return null
      }
      loadedProfiles[profile] = {
        Trocha: {maxVal: "-", minVal: "-"},
        Diametro: {},
        Alto: {maxVal: "-", minVal: "-"},
        Ancho: {maxVal: "-", minVal: "-"},
        qR: {maxVal: "-", minVal: "-"},
        "Dif. Ancho de Pestaña": {minVal: "-", maxVal: "-"},
        "Dif. Diametro de Rueda - Mismo Bogie": {},
        "Dif. Diametro de Rueda - Mismo Coche": {},
        "Dif. Diametro de Rueda - Mismo Eje": {},
        "Dif. Diametro de Rueda - Mismo Modulo": {},
      }
      loadedData.forEach(item => {
        const fleetData = item.children.filter(child => child.name.toUpperCase() === fleet.toUpperCase())
        if (fleetData.length && !fleetData[0].maxVal && !fleetData[0].minVal) {
          loadedProfiles[profile][item.name] = {}
          fleetData[0].children.forEach(child => {
            loadedProfiles[profile][item.name][child.name.toUpperCase()] = { maxVal: child.maxVal, minVal: child.minVal }
          })
        } else {
          const maxVal = item.maxVal ? item.maxVal : fleetData[0].maxVal
          const minVal = item.minVal ? item.minVal : fleetData[0].minVal
          loadedProfiles[profile][item.name] = { maxVal, minVal }
        }
      })
    } else {
      Alert.error(`Error al cargar valores de referencia del perfil ${profile}`, 7000)
      return null
    }
  }
  return loadedProfiles
}

const getVehicleTypeByFleet = (vehicle: string, fleet: string, loadedFleets: Fleet[]) => {
  const fleetObj = loadedFleets.find(item => item.fleet.toUpperCase() === fleet.toUpperCase())
  if (!fleetObj) {
    Alert.error(`No se encontro la flota ${fleet} en las flotas listadas`, 10000)
    return null
  }
  if (fleet.toUpperCase() === "CAF6000") {
    if (vehicle.length > 4) {
      const vehicles = vehicle.split("-")
      const result = vehicles.map(car => car[1] !== fleetObj.reference ? "REMOLQUE" : "MOTRIZ")
      return result.includes("REMOLQUE") ? "MOTRIZ - REMOLQUE" : "MOTRIZ"
    } 
    return vehicle[1] !== fleetObj.reference ? "REMOLQUE" : "MOTRIZ"
  }
  return vehicle?.includes(fleetObj.reference) ? (vehicle.includes("-") ? "MOTRIZ - REMOLQUE" : "REMOLQUE") : "MOTRIZ"
}

type SubRef = {[x: string]: {minVal: number | "-", maxVal: number | "-"}}
type MainRef = {minVal: number | null, maxVal: number | null}
type Reference = MainRef | SubRef 

const checkSubItems = (reference: any, refType: string, profile: string, item: string): number | null => {
  let newReference = reference?.maxVal
  if (!newReference) {
    newReference = reference[refType]?.maxVal
    if (!newReference) {
      Alert.warning(`Falta valor de referencia "${toTitleCase(refType)}" en "${item}" para perfil ${profile}`, 10000)
      return null
    }
    if (newReference === "-") return 0
  }
  return newReference
}

const evaluateSubstractions: IEvaluateSubstractions = async(substractions, profilesReferences, fleet) => {
  const loadedFleets: Fleet[] = await load(FLEET_FILE)
  const evaluateItem = (dimension: SubstractionStructure | ModuleSubstractionStructure | null, subItem: string) => {
    let damnation = false
    let reference = profilesReferences[dimension!.profile][subItem]
    if (!reference) {
      Alert.error(`No se encontro referencia para "${subItem}" en el perfil ${dimension!.profile}`)
    }
    const refType: string | null = getVehicleTypeByFleet(dimension?.vehicle!, fleet, loadedFleets)
    if (!refType) return null
    reference = checkSubItems(reference, refType, dimension!.profile, subItem)
    if (reference === null) return null
    if (dimension!.value > reference && reference !== 0) damnation = true
    return ({
      value: dimension!.value.toFixed(2) || "-",
      damnation: damnation,
      bogie: "bogie" in dimension! ? dimension!.bogie : "-",
      vehicle: dimension!.vehicle,
      type: refType,
      profile: dimension!.profile,
    })
  }
  const width = substractions.width.map(dimension => evaluateItem(dimension, "Dif. Ancho de Pestaña"))
  const shaft = substractions.shaft.map(dimension => evaluateItem(dimension, "Dif. Diametro de Rueda - Mismo Eje"))
  const bogie = substractions.bogie.map(dimension => evaluateItem(dimension, "Dif. Diametro de Rueda - Mismo Bogie"))
  const vehicle = substractions.vehicle.map(dimension => evaluateItem(dimension, "Dif. Diametro de Rueda - Mismo Coche"))
  const module = substractions.module?.map(dimension => evaluateItem(dimension, "Dif. Diametro de Rueda - Mismo Modulo"))
  if (width.includes(null) || shaft.includes(null) || bogie.includes(null) || vehicle.includes(null) || module?.includes(null)) return null
  return ({ width, shaft, bogie, vehicle, module })
}

const evaluateWheels: IEvaluateWheel = (wheels, profilesReferences: any) => {
  const isDamned = (reference: string, value: number, profile: string) => (
    profilesReferences[profile][reference].maxVal < value || value < profilesReferences[profile][reference].minVal
      ? true
      : false
  )
  const evaluatedWheels: EvaluatedWheel[] = wheels.map(wheel => {
    const damnation: Damnation = []
    if (isDamned("Alto", wheel.height, wheel.profile)) damnation.push("height")
    if (isDamned("Ancho", wheel.width, wheel.profile)) damnation.push("width")
    if (isDamned("qR", wheel.qr, wheel.profile)) damnation.push("qr")
    if (isDamned("Trocha", wheel.gauge, wheel.profile)) damnation.push("gauge")
    if (wheel.diameter < profilesReferences[wheel.profile].Diametro.minVal) damnation.push("diameter")
    return ({ ...wheel, damnation })
  })
  return evaluatedWheels
}

const evaluate: IEvaluate = async(parsedData) => {
  const { wheels, header, substractions } = parsedData
  const profilesInWheels = wheels.map(wheel => wheel.profile).filter((profile, index, arr) => arr.indexOf(profile) === index)
  const fleetObject = header.find(item => Object.keys(item)[0] === "Flota")
  if (!fleetObject) {
    Alert.error("No se encontro el parámetro 'Flota' en los datos de la medición", 10000)
    return null
  }
  const fleet = Object.values(fleetObject)[0]
  const profilesReferences = await getProfilesReferences(profilesInWheels, fleet.toUpperCase())
  if (!profilesReferences) return null
  const evaluatedSubstractions = await evaluateSubstractions(substractions, profilesReferences, fleet)
  if (!evaluatedSubstractions) return null
  return ({
    wheels: evaluateWheels(wheels, profilesReferences),
    substractions: evaluatedSubstractions ,
    references: profilesReferences,
  })
}

export default evaluate
