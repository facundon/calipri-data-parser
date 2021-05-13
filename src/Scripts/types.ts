import { Wheel } from "../Components/DragLoader/types"
import evaluate from "./evaluate"


/* Evaluate */

type AwaitType<T> = T extends PromiseLike<infer U> ? U : T
export type EvaluatedData = NonNullable<AwaitType<ReturnType<typeof evaluate>>>
export type DamnationName = "Alto"
  | "Ancho"
  | "qR"
  | "Diametro"
  | "Trocha"
  | "Dif. Ancho de Pestaña"
  | "Dif. Diametro de Rueda - Mismo Eje"
  | "Dif. Diametro de Rueda - Mismo Bogie"
  | "Dif. Diametro de Rueda - Mismo Coche"
  | "Dif. Diametro de Rueda - Mismo Modulo"

export type NoSubItemDamnation = "Alto" | "Ancho" | "qR" | "Trocha" | "Diametro"

export type DamnationRef = {
  minVal: number | "-",
  maxVal: number | "-",
}

export type DamnationSubItem = "Motriz" | "Remolque" | "Motriz - Remolque"

export type SubItem = Partial<Record<DamnationSubItem, DamnationRef>>

export type Profiles = {
  [profile: string]: Record<DamnationName, DamnationRef | SubItem>
}
  
export type Damnation = ("width" | "height" | "qr" | "diameter" | "gauge" | "index" | "")[]

type EvaluatedDimension = (Omit<Substraction, "value"> & {
  value: string,
  type: string | null,
  damnation: boolean,
} | null)

export interface EvaluatedWheel extends Wheel {
  damnation: Damnation
}

export type EvaluatedSubstractionsKinds = Record<keyof SubstractionKinds, EvaluatedDimension[]>


/* Substractions */

export type Substraction = {
  value: number,
  profile: string,
  vehicle: string,
  bogie: string,
}

export type ModuleSubstraction = Pick<Substraction, "value" | "profile" | "vehicle">

export type SubstractionKinds = {
  width: Substraction[],
  shaft: Substraction[],
  bogie: Substraction[],
  vehicle: Substraction[],
  module: ModuleSubstraction[] | null,
}

/* Print */

export type DifferenceTables = NonNullable<keyof EvaluatedSubstractionsKinds>
export type ERs = {[x: string]: string}

export type References = {
  [T in DamnationName]: string | (string | null)[]
}
  