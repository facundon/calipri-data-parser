import Alert from "rsuite/lib/Alert"
import { FLEET_FILE } from "../Components/FleetPanel"
import { Fleet } from "../Components/FleetPanel/template"
import { PROFILES_FOLDER } from "../Components/ProfilePanel"
import { Dimension } from "../Components/ProfilePanel/template"
import { load } from "./electron-bridge"
import { toTitleCase } from "./utils"
import {
  Substraction,
  ModuleSubstraction,
  SubstractionKinds,
  Profiles,
  Damnation,
  DamnationName,
  DamnationRef,
  DamnationSubItem,
  SubItem,
  NoSubItemDamnation,
} from "./types"
import { IParsedData, Wheel } from "../Components/DragLoader/types"

function isThirdItem(item: DamnationName | DamnationSubItem): item is DamnationSubItem {
  return item === "Motriz" || item === "Remolque" || item === "Motriz - Remolque"
}
function isRef(item: DamnationRef | SubItem): item is DamnationRef {
  return item === "minVal" || item === "maxVal"
}

const getProfilesReferences = async(profiles: string[], fleet: string) => {
  const loadedProfiles: Profiles = {}
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
        Diametro: {maxVal: "-", minVal: "-"},
        Alto: {maxVal: "-", minVal: "-"},
        Ancho: {maxVal: "-", minVal: "-"},
        qR: {maxVal: "-", minVal: "-"},
        "Dif. Ancho de Pestaña": {},
        "Dif. Diametro de Rueda - Mismo Bogie": {},
        "Dif. Diametro de Rueda - Mismo Coche": {},
        "Dif. Diametro de Rueda - Mismo Eje": {},
        "Dif. Diametro de Rueda - Mismo Modulo": {},
      }
      loadedData.forEach(firstItem => {
        const secondItem = firstItem.children.filter(thirdItem => thirdItem.name.toUpperCase() === fleet.toUpperCase())[0]
        if (!secondItem?.maxVal && !secondItem?.minVal && !isThirdItem(firstItem.name)) {
          loadedProfiles[profile][firstItem.name] = {}
          secondItem.children.forEach(thirdItem => {
            if (!isThirdItem(firstItem.name) && isThirdItem(thirdItem.name)) {
              const subItem = loadedProfiles[profile][firstItem.name]
              if (!isRef(subItem)) {
                subItem[thirdItem.name] = {
                  maxVal: thirdItem.maxVal!,
                  minVal: thirdItem.minVal!
                }
              }
            }
          })
        } else {
          const maxVal = firstItem?.maxVal || secondItem.maxVal!
          const minVal = firstItem?.minVal || secondItem.minVal!
          if (!isThirdItem(firstItem.name)) {
            loadedProfiles[profile][firstItem.name] = { maxVal, minVal }
          }
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
      const result = vehicles.map(car => car[1] !== fleetObj.reference ? "Remolque" : "Motriz")
      return result.includes("Remolque") ? "Motriz - Remolque" : "Motriz"
    } 
    return vehicle[1] !== fleetObj.reference ? "Remolque" : "Motriz"
  }
  return vehicle?.includes(fleetObj.reference) ? (vehicle.includes("-") ? "Motriz - Remolque" : "Remolque") : "Motriz"
}

const checkSubItems = (
  reference: DamnationRef | SubItem,
  refType: DamnationSubItem,
  profile: string,
  item: DamnationName
) => {
  let newReference: number | null | "-"
  if ("maxVal" in reference) {
    newReference = reference?.maxVal
  } else {
    newReference = reference[refType]?.maxVal!
    if (!newReference) {
      Alert.warning(`Falta valor de referencia "${toTitleCase(refType)}" en "${item}" para perfil ${profile}`, 10000)
      return null
    }
    if (newReference === "-") return 0
  }
  return newReference
}

const evaluateSubstractions = async(
  substractions: SubstractionKinds,
  profilesReferences: Profiles,
  fleet: string
) => {
  const loadedFleets: Fleet[] = await load(FLEET_FILE)
  const evaluateItem = (dimension: Substraction | ModuleSubstraction | null, subItem: DamnationName) => {
    let damnation = false
    const reference = profilesReferences[dimension!.profile][subItem]
    if (!reference) {
      Alert.error(`No se encontro referencia para "${subItem}" en el perfil ${dimension!.profile}`)
    }
    const refType = getVehicleTypeByFleet(dimension?.vehicle!, fleet, loadedFleets)
    if (!refType) return null
    const refValue = checkSubItems(reference, refType, dimension!.profile, subItem)
    if (refValue === null) return null
    if (dimension!.value > refValue && refValue !== 0) damnation = true
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
  if (width.includes(null)
   || shaft.includes(null)
   || bogie.includes(null)
   || vehicle.includes(null)
   || module?.includes(null)) return null
  return ({ width, shaft, bogie, vehicle, module })
}

const doesNotHaveSubItems = (ref: DamnationRef | SubItem): ref is DamnationRef => {
  return (ref as DamnationRef).minVal !== undefined
}

const evaluateWheels = (
  wheels: Wheel[],
  profilesReferences: Profiles
) => {
  const isDamned = (
    reference: NoSubItemDamnation,
    value: number,
    profile: string
  ) => {
    const ref = profilesReferences[profile][reference]
    if (doesNotHaveSubItems(ref)){
      return(ref.maxVal < value || value < ref.minVal
        ? true
        : false
      )
    }
  }
  const evaluatedWheels = wheels.map(wheel => {
    const damnation: Damnation = []
    if (isDamned("Alto", wheel.height, wheel.profile)) damnation.push("height")
    if (isDamned("Ancho", wheel.width, wheel.profile)) damnation.push("width")
    if (isDamned("qR", wheel.qr, wheel.profile)) damnation.push("qr")
    if (isDamned("Trocha", wheel.gauge, wheel.profile)) damnation.push("gauge")
    if (isDamned("Diametro",wheel.diameter, wheel.profile)) damnation.push("diameter")
    return ({ ...wheel, damnation })
  })
  return evaluatedWheels
}

const evaluate = async(parsedData: IParsedData) => {
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
