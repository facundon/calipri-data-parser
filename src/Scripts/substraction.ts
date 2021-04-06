import * as T from "../Components/DragLoader/types"
import { normalize } from "./utils"

type SubstractionStructure = {
  value: number,
  profile: string,
  type: string | null,
}

export type SubstractionKinds = {
  width: (SubstractionStructure | null)[],
  shaft: (SubstractionStructure | null)[],
  bogie: (SubstractionStructure | null)[],
  vehicle: (SubstractionStructure | null)[],
  unit?: (SubstractionStructure | null)[],
}

interface ISubstraction {
  (data: T.IRawParsedData) : SubstractionKinds
}

const substraction = (data: string[], profiles: string[], step: number, vehicles?: string[]) => (
  data.map(
    (val, index, arr) => {
      if (index % step === 0) {
        const dataArr = arr.slice(index, index + step).map(val => normalize(val))
        const rawSubstraction = Math.max.apply(null, dataArr) - Math.min.apply(null, dataArr)
        return ({
          value: Math.abs(Math.round(rawSubstraction * 100) / 100),
          profile: profiles[index],
          type: vehicles ? vehicles[index] : null
        })
      } else { return (null) }
    }
  ).filter(val => val !== null)
)

export const getSubstractions: ISubstraction = (data) => (
  {
    width: substraction(data.widths, data.profiles, 2),
    shaft: substraction(data.diameters, data.profiles, 2),
    bogie: substraction(data.diameters, data.profiles, 4, data.vehicles),
    vehicle: substraction(data.diameters, data.profiles, 8, data.vehicles),
  }
)
