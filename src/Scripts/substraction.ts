import { chunk, findLastIndex, max, min } from "lodash"
import * as T from "../Components/DragLoader/types"
import { FLEET_FILE } from "../Components/FleetPanel"
import { Fleet } from "../Components/FleetPanel/template"
import { load } from "./electron-bridge"
import { normalize } from "./utils"

type SubstractionStructure = {
  value: number,
  profile: string,
  vehicle: string,
  bogie: string,
}

type ModuleSubstractionStructure = {
  value: number,
  profile: string,
  vehicle: string[],
}

export type SubstractionKinds = {
  width: (SubstractionStructure | null)[],
  shaft: (SubstractionStructure | null)[],
  bogie: (SubstractionStructure | null)[],
  vehicle: (SubstractionStructure | null)[],
  module?: ModuleSubstractionStructure[] | null,
}

interface ISubstraction {
  (data: T.IRawParsedData, preview: string) : Promise<SubstractionKinds>
}

const substraction = (data: string[], profiles: string[], step: number, vehicles: string[], bogies: string[]) => {
  let adaptedVehicles: string[] = []
  vehicles.forEach(item => {
    for (let index = 0; index < data.length / vehicles.length; index++) {
      adaptedVehicles.push(item)
    }
  })
  let adaptedBogies: string[] = []
  bogies.forEach(bogie => {
    for (let index = 0; index < data.length / bogies.length; index++) {
      adaptedBogies.push(bogie)
    }
  })
  return (
    data.map((_, index, arr) => {
      if (index % step === 0) {
        const dataArr = arr.slice(index, index + step).map(val => normalize(val))
        const rawSubstraction = Math.max.apply(null, dataArr) - Math.min.apply(null, dataArr)
        return ({
          value: Math.abs(Math.round(rawSubstraction * 100) / 100),
          profile: profiles[index],
          vehicle: adaptedVehicles[index],
          bogie: adaptedBogies[index],
        })
      } else { return (null) }
    }).filter(val => val !== null)
  )}

const moduleSubstraction = async(data: string[], profiles: string[], vehicles: string[], fleet: string): Promise<ModuleSubstractionStructure[] | null> => {
  const getCurrentFleetData = () => loadedFleets.find(loadedFleet => loadedFleet.fleet.toUpperCase() === fleet.toUpperCase())

  const loadedFleets: Fleet[] = await load(FLEET_FILE)
  let modulesQty: number | string | undefined = getCurrentFleetData()?.module
  const trailerReference: string | undefined = getCurrentFleetData()?.reference
  if (!modulesQty || !trailerReference) return null
  modulesQty = parseInt(modulesQty)
  const firstTrailerIndex = vehicles.findIndex(vehicle => vehicle.includes(trailerReference))
  const lastTrailerIndex = findLastIndex(vehicles, (vehicle => vehicle.includes(trailerReference)))
  let modules = chunk(vehicles, 3)
  if (vehicles.length === 4) modules = chunk(vehicles, 2)
  if (firstTrailerIndex === lastTrailerIndex && vehicles.length !== 4 && firstTrailerIndex > 1) modules = [[vehicles[0], vehicles[1]], [vehicles[2], vehicles[3], vehicles[4]]]   
  if (modulesQty === 1) modules = [vehicles]

  let prevVehiclesQty = 0
  const returnList = modules.map((module, index) => {
    if (index > 0) index = index * 2
    const vehiclesQty = module.length
    const firstWheel = index
    const chunkedWheels = chunk(data.map(d => parseFloat(d.replaceAll(",", "."))), 8)
    
    let maxMin: number[][] = []
    for (let vehicleNumber = 0; vehicleNumber < vehiclesQty; vehicleNumber++) {
      maxMin.push([max(chunkedWheels[vehicleNumber+ prevVehiclesQty])!, min(chunkedWheels[vehicleNumber + prevVehiclesQty])!])
    }

    if (vehiclesQty === 1 && modules.length === 1) {
      return({
        value: Math.abs(Math.round((maxMin[0][0] - maxMin[0][1]) * 100) / 100),
        profile: profiles[firstWheel],
        vehicle: module,
      })
    }
    let difference: number[] = []
    maxMin.forEach((val, i) => {
      const prevVal = maxMin[i - 1]
      if (i === 0) {
        difference.push(max([val[0] - maxMin[maxMin.length - 1][1], val[1] - maxMin[maxMin.length - 1][0]])!)
      } else {
        difference.push(max([val[0] - prevVal[1], val[1] - prevVal[0]])!)
      }
    })
    const maxDifference = max(difference)!
    prevVehiclesQty = vehiclesQty
    return({
      value: Math.abs(Math.round(maxDifference * 100) / 100),
      profile: profiles[firstWheel],
      vehicle: module,
    })
  })
  return returnList
}

export const getSubstractions: ISubstraction = async(data, fleet) => {
  const module = await moduleSubstraction(data.diameters, data.profiles, data.vehicles, fleet)
  return (
    {
      width: substraction(data.widths, data.profiles, 2, data.vehicles, data.bogies),
      shaft: substraction(data.diameters, data.profiles, 2, data.vehicles, data.bogies),
      bogie: substraction(data.diameters, data.profiles, 4, data.vehicles, data.bogies),
      vehicle: substraction(data.diameters, data.profiles, 8, data.vehicles, data.bogies),
      module,
    }
  )
}
