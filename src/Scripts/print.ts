import { PreviewData } from "../Components/Preview"
import { EvaluatedWheel, EvaluatedSubstractions } from "./evaluate"

type EvaluatedData = {
  wheels: EvaluatedWheel[],
  substractions: EvaluatedSubstractions,
}

const prepareData = (evaluatedData: EvaluatedData, header: PreviewData[]) => {
  const findInHeader = (item: string) => Object.values(header.find(val => val[item])!)[0]
  const findProfiles = () => evaluatedData.wheels.map(wheel => wheel.profile)
    .filter((profile, index, arr) => index === arr.indexOf(profile))
  const reorderedWheels = () => evaluatedData.wheels.map((wheel, index) => 
    [
      wheel.vehicle,
      wheel.bogie,
      Math.round((index + 1) / 2),
      index + 1,
      wheel.gauge,
      wheel.diameter,
      wheel.height,
      wheel.width,
      wheel.qr,
      wheel.type,
      wheel.profile
    ]
  )

  return ({
    Flota: findInHeader("Flota"),
    Linea: findInHeader("Linea"),
    Formacion: findInHeader("Formacion"),
    Fecha: findInHeader("Fecha"),
    Cabecera: "",
    Perfiles: findProfiles(),
    Headers: [
      "Coche",
      "Bogie",
      "Eje",
      "Rueda",
      "Trocha",
      "Diametro",
      "Alto",
      "Ancho",
      "qR",
      "Tipo de Rueda",
      "Perfil"
    ],
    Valores: reorderedWheels(),
  })
}

export default prepareData
