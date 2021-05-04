import { chunk } from "lodash"
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

export type SubstractionKinds = {
  width: (SubstractionStructure | null)[],
  shaft: (SubstractionStructure | null)[],
  bogie: (SubstractionStructure | null)[],
  vehicle: (SubstractionStructure | null)[],
  module?: (SubstractionStructure | null)[],
}

interface ISubstraction {
  (data: T.IRawParsedData, preview: string) : SubstractionKinds
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

const moduleSubstraction = (data: string[], profiles: string[], vehicles: string[], fleet: string) => {
  load(FLEET_FILE).then((val: Fleet[]) => {
    let vehiclesPerModule: number | string | undefined = val.find(loadedFleet => loadedFleet.fleet.toUpperCase() === fleet.toUpperCase())?.module
    if (!vehiclesPerModule) return null
    vehiclesPerModule = parseInt(vehiclesPerModule)
    let vehicleChunk
    switch (vehicles.length) { 
    // units of 6 vehicles can have: 2 triple modules || 3 duo modules || 1 unique module
    // units of 5 vehicles can ONLY have 1 duo module && 1 triple module
    // units of 4 vehicles can ONLY have 2 duo modules
    // units of 1 vehicle can ONLY have 1 unique module
    case 6:
      if (vehiclesPerModule === 1) {
        vehicleChunk = vehicles
      } else {
        // need condition to check if 2 triple modules || 3 duo modules
        vehicleChunk = chunk(vehicles, 3)
      }
      break

    case 5:
      vehicleChunk = chunk(vehicles, 3)
      break

    case 4:
      vehicleChunk = chunk(vehicles, 2)
      break
    
    default:
      vehicleChunk = vehicles
      break
    }
    // for (let index = 1; index < vehiclesPerModule; index++) { 
    // }
    console.log(vehicleChunk)
  })
}

export const getSubstractions: ISubstraction = (data, fleet) => (
  {
    width: substraction(data.widths, data.profiles, 2, data.vehicles, data.bogies),
    shaft: substraction(data.diameters, data.profiles, 2, data.vehicles, data.bogies),
    bogie: substraction(data.diameters, data.profiles, 4, data.vehicles, data.bogies),
    vehicle: substraction(data.diameters, data.profiles, 8, data.vehicles, data.bogies),
    // module: moduleSubstraction(data.diameters, data.profiles, data.vehicles, fleet),
  }
)
