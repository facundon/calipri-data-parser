import { PreviewData } from "../Preview"
import { SubstractionKinds } from "../../Scripts/substraction"

export type Header = {

}

export type CSVMeta = {
  delimiter: string,
  linebreak: string,
  aborted: boolean,
  cursor: number,
  truncated: boolean,
}

export type CSVErrors = {
  type: string,
  code: string,
  message: string,
  row: number,
}

export type CSVData = string[]

export interface ILoadedData {
  data: CSVData,
  errors: CSVErrors[],
  metadata: CSVMeta,
}

export interface IRawParsedData {
  widths: string[],
  heights: string[],
  qrs: string[],
  diameters: string[],
  gauges: string[],
  vehicles: string[],
  bogies: string[],
  profiles: string[],
  types: string[]
}

export type Wheel = {
  width: number,
  height: number,
  qr: number,
  diameter: number,
  gauge: number,
  vehicle: string,
  bogie: string,
  profile: string,
  type: string,
}

export interface IPositions {
  vehicleName: number
  vehicleValue: number
  bogie1: number
  bogie2: number,
  profile: number,
  type: number
}

export interface IParsedData {
  header: PreviewData[],
  wheels: Wheel[],
  substractions: SubstractionKinds
}

export interface IDragLoader {
  handleIsLoaded: (loaded: boolean) => void,
  handleParsedData: (data: IParsedData) => void,
}
