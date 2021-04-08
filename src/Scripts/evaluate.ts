import Alert from "rsuite/lib/Alert"
import { IParsedData, Wheel } from "../Components/DragLoader/types"
import { load } from "./storage"
import { SubstractionKinds } from "./substraction"

type Profiles = {
  [profile: string]: {
    Alto: {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    }
    Ancho: {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    }
    qR: {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    }
    Diametro: {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    } | {
      [key: string]: {
        minVal: number | "-" | null,
        maxVal: number | "-" | null,
      }
    }
    Trocha: {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    }
    "Dif. Ancho de Pestaña": {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    }
    "Dif. Diametro de Rueda - Mismo Bogie": {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    }
    "Dif. Diametro de Rueda - Mismo Coche": {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    } | {
      [key: string]: {
        minVal: number | "-" | null,
        maxVal: number | "-" | null,
      }
    }
    "Dif. Diametro de Rueda - Mismo Eje": {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    } | {
      [key: string]: {
        minVal: number | "-" | null,
        maxVal: number | "-" | null,
      }
    }
    "Dif. Diametro de Rueda - Mismo Modulo": {
      minVal: number | "-" | null,
      maxVal: number | "-" | null,
    } | {
      [key: string]: {
        minVal: number | "-" | null,
        maxVal: number | "-" | null,
      }
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
  (parsedData: IParsedData): {
    wheels: EvaluatedWheel[],
    substractions: EvaluatedSubstractions,
  } | null
}

interface IEvaluateWheel {
  (wheels: Wheel[], profilesReferences: Profiles) : EvaluatedWheel[]
}

interface IEvaluateSubstractions {
  (substractions: SubstractionKinds, profilesReferences: Profiles) : EvaluatedSubstractions
}

const getProfilesReferences = async(profiles: string[], fleet: string): Promise<Profiles | null> => {
  const loadedProfiles: Profiles = {}
  for (const profile of profiles) {
    const loadedData = await load(profile, "perfiles")
    if (loadedData) {
      const fleetExists = loadedData.some(item => item.children.find(child => child.name.toUpperCase() === fleet))
      if (!fleetExists) {
        Alert.error(`No se encontraron valores de referencia para la flota ${fleet} en el perfil ${profile}`, 7000)
        return null
      }
      loadedProfiles[profile] = {}
      loadedData.forEach(item => {
        const fleetData = item.children.filter(child => child.name.toUpperCase() === fleet)
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

const evaluateSubstractions: IEvaluateSubstractions = (substractions, profilesReferences) => {
  const evaluatedShaft: {value: number, damnation: boolean}[] = substractions.shaft.map(item => {
    let damnation = false
    if (item!.value > profilesReferences[item!.profile]["Dif. Diametro de Rueda - Mismo Eje"].maxVal!) {
      damnation = true
    }
    return ({
      value: item!.value,
      damnation: damnation,
    })
  })
  const evaluatedWidth: {value: number, damnation: boolean}[] = substractions.width.map(item => {
    let damnation = false
    if (item!.value > profilesReferences[item!.profile]["Dif. Ancho de Pestaña"].maxVal!) {
      damnation = true
    }
    return ({
      value: item!.value,
      damnation: damnation,
    })
  })
  const evaluatedBogie: {value: number, damnation: boolean}[] = substractions.bogie.map(item => {
    let damnation = false
    const reference = profilesReferences[item!.profile]["Dif. Diametro de Rueda - Mismo Bogie"]
    // if (!reference.maxVal || reference.maxVal === "-") {
    //   reference = reference[].maxVal
    // }
    if (item!.value > reference) {
      damnation = true
    }
    return ({
      value: item!.value,
      damnation: damnation,
    })
  })
  const evaluatedVehicle: {value: number, damnation: boolean}[] = substractions.vehicle.map(item => {
    let damnation = false
    const reference = profilesReferences[item!.profile]["Dif. Diametro de Rueda - Mismo Coche"]
    // if (!reference.maxVal || reference.maxVal === "-") {
    //   reference = reference[].maxVal
    // }
    if (item!.value > reference) {
      damnation = true
    }
    return ({
      value: item!.value,
      damnation: damnation,
    })
  })
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
    if (profilesReferences[wheel.profile].Alto.maxVal! < wheel.height || wheel.height < profilesReferences[wheel.profile].Alto.minVal!) {
      damnation.push("height")
    }
    if (profilesReferences[wheel.profile].Ancho.maxVal! < wheel.width || wheel.width < profilesReferences[wheel.profile].Ancho.minVal!) {
      damnation.push("width")
    }
    if (profilesReferences[wheel.profile].qR.maxVal! < wheel.qr || wheel.qr < profilesReferences[wheel.profile].qR.minVal!) {
      damnation.push("qr")
    }
    if (profilesReferences[wheel.profile].Trocha.maxVal! < wheel.gauge || wheel.gauge < profilesReferences[wheel.profile].Trocha.minVal!) {
      damnation.push("gauge")
    }
    if (profilesReferences[wheel.profile].Diametro.minVal === "-" || !profilesReferences[wheel.profile].Diametro.minVal) {
      try {
        if (wheel.diameter < profilesReferences[wheel.profile].Diametro[wheel.type.toUpperCase()].minVal) {
          damnation.push("diameter")
        }
      } catch (error) {
        Alert.error(`No se encontro el tipo de rueda ${wheel.type} en la configuración del perfil ${wheel.profile}`, 7000)
      }
    } else {
      if (wheel.diameter < profilesReferences[wheel.profile].Diametro.minVal!) {
        damnation.push("diameter")
      }
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
      substractions: evaluateSubstractions(substractions, profilesReferences)
    })
  } else {
    return null
  }
}
