import Alert from "rsuite/lib/Alert"
import { IParsedData, Wheel } from "../Components/DragLoader/types"
import { FLEET_FILE } from "../Components/FleetPanel"
import { Fleet } from "../Components/FleetPanel/template"
import { PROFILES_FOLDER } from "../Components/ProfilePanel"
import { Dimension } from "../Components/ProfilePanel/template"
import { load } from "./storage"
import { SubstractionKinds } from "./substraction"

type Profiles = {
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

type Damnation = ("width" | "height" | "qr" | "diameter" | "gauge")[]

interface EvaluatedWheel extends Wheel {
  damnation: Damnation
}

interface EvaluatedSubstractions {
  width: {
    value: number,
    damnation: boolean,
  }[]
  shaft: {
    value: number,
    damnation: boolean,
  }[]
  bogie: {
    value: number,
    damnation: boolean,
  }[]
  vehicle: {
    value: number,
    damnation: boolean,
  }[]
  unit?: {
    value: number,
    damnation: boolean,
  }[]
}

interface IEvaluate {
  (parsedData: IParsedData): Promise<{
    wheels: EvaluatedWheel[],
    substractions: EvaluatedSubstractions,
  } | null>
}

interface IEvaluateWheel {
  (wheels: Wheel[], profilesReferences: Profiles) : EvaluatedWheel[]
}

interface IEvaluateSubstractions {
  (substractions: SubstractionKinds, profilesReferences: Profiles, fleet: string) : Promise<EvaluatedSubstractions>
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
        "Dif. Ancho de Pestaña": {minVal: "-", maxVal: "-"},
        "Dif. Diametro de Rueda - Mismo Bogie": {},
        "Dif. Diametro de Rueda - Mismo Coche": {},
        "Dif. Diametro de Rueda - Mismo Eje": {},
        "Dif. Diametro de Rueda - Mismo Modulo": {},
        Alto: {maxVal: "-", minVal: "-"},
        Ancho: {maxVal: "-", minVal: "-"},
        Diametro: {},
        Trocha: {maxVal: "-", minVal: "-"},
        qR: {maxVal: "-", minVal: "-"},
      }
      loadedData.forEach(item => {
        const fleetData = item.children.filter(child => child.name.toUpperCase() === fleet.toUpperCase())
        if (fleetData.length && typeof fleetData[0].maxVal === "string"  && typeof fleetData[0].minVal === "string") {
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
  return (
    vehicle?.includes(fleetObj.reference) ? "REMOLQUE" : "MOTRIZ"
  )
}

type SubRef = {[x: string]: {minVal: number | "-", maxVal: number | "-"}}
type MainRef = {minVal: number | null, maxVal: number | null}
type Reference = MainRef | SubRef 

const checkSubItems = (reference: any, refType: string | null, profile: string, item: string) => {
  let newReference = reference?.maxVal
  if (!newReference) {
    if (!refType) return 0
    newReference = reference[refType]?.maxVal
    if (newReference = "-" || !newReference) {
      Alert.warning(`Falta valor de referencia "${item}" para perfil ${profile}`, 10000)
      newReference = 0
    }
  }
  return newReference
}

const evaluateSubstractions: IEvaluateSubstractions = async(substractions, profilesReferences: any, fleet) => {
  const loadedFleets: Fleet[] = await load(FLEET_FILE)
  const evaluateItem = (item: any, subItem: any) => {
    let damnation = false
    let reference: any = profilesReferences[item!.profile][subItem]
    const refType: string | null = getVehicleTypeByFleet(item?.vehicle!, fleet, loadedFleets)
    reference = checkSubItems(reference, refType, item!.profile, subItem)
    if (item!.value > reference) {
      damnation = true
    }
    return ({
      value: item!.value,
      damnation: damnation,
    })
  }
  const evaluatedWidth: {value: number, damnation: boolean}[] = substractions.width.map(item =>
    evaluateItem(item, "Dif. Ancho de Pestaña")
  )
  const evaluatedShaft: {value: number, damnation: boolean}[] = substractions.shaft.map(item => 
    evaluateItem(item, "Dif. Diametro de Rueda - Mismo Eje")
  )
  const evaluatedBogie: {value: number, damnation: boolean}[] = substractions.bogie.map(item =>
    evaluateItem(item, "Dif. Diametro de Rueda - Mismo Bogie")
  )
  const evaluatedVehicle: {value: number, damnation: boolean}[] = substractions.vehicle.map(item => 
    evaluateItem(item, "Dif. Diametro de Rueda - Mismo Coche")
  )
  return ({
    width: evaluatedWidth,
    shaft: evaluatedShaft,
    bogie: evaluatedBogie,
    vehicle: evaluatedVehicle,
  })
}

const evaluateWheels: IEvaluateWheel = (wheels, profilesReferences) => {
  const evaluatedWheels: EvaluatedWheel[] = wheels.map(wheel => {
    const damnation: Damnation = []
    if (profilesReferences[wheel.profile].Alto.maxVal < wheel.height || wheel.height < profilesReferences[wheel.profile].Alto.minVal) {
      damnation.push("height")
    }
    if (profilesReferences[wheel.profile].Ancho.maxVal < wheel.width || wheel.width < profilesReferences[wheel.profile].Ancho.minVal) {
      damnation.push("width")
    }
    if (profilesReferences[wheel.profile].qR.maxVal < wheel.qr || wheel.qr < profilesReferences[wheel.profile].qR.minVal) {
      damnation.push("qr")
    }
    if (profilesReferences[wheel.profile].Trocha.maxVal < wheel.gauge || wheel.gauge < profilesReferences[wheel.profile].Trocha.minVal) {
      damnation.push("gauge")
    }
    if (wheel.diameter < profilesReferences[wheel.profile].Diametro.minVal) {
      damnation.push("diameter")
    }
    return ({ ...wheel, damnation })
  })
  return evaluatedWheels
}

export const evaluate: IEvaluate = async(parsedData) => {
  const { wheels, header, substractions } = parsedData
  const profilesInWheels = wheels.map(wheel => wheel.profile).filter((profile, index, arr) => arr.indexOf(profile) === index)
  const fleetObject = header.find(item => Object.keys(item)[0] === "Flota")
  if (!fleetObject) {
    Alert.error("No se encontro el parámetro 'Flota' en los datos de la medición", 7000)
    return null
  }
  const fleet = Object.values(fleetObject)[0]
  const profilesReferences = await getProfilesReferences(profilesInWheels, fleet.toUpperCase())
  if (profilesReferences) {
    return ({
      wheels: evaluateWheels(wheels, profilesReferences),
      substractions: await evaluateSubstractions(substractions, profilesReferences, fleet)
    })
  } else {
    return null
  }
}
