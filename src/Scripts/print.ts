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

  const getTable = () => {
    const reorderedWheels = evaluatedData.wheels.map((wheel, index) => 
      [
        wheel.vehicle,
        wheel.bogie,
        Math.round((index + 1) / 2),
        wheel.gauge,
        index + 1,
        wheel.diameter,
        wheel.height,
        wheel.width,
        wheel.qr,
        wheel.type,
        wheel.profile
      ]
    )
    let data = ""
    let row = ""
    reorderedWheels.forEach((item, index) => {
      item.forEach((subitem, subIndex) => {
        let rowSpan = 1
        let newData = ""
        switch (subIndex) {
        case 0:
          rowSpan = 8
          break
        case 1:
          rowSpan = 4
          break
        case 2:
          rowSpan = 2
          break
        case 3:
          rowSpan = 2
          break
        default:
          rowSpan = 1
          break
        }
        index % rowSpan === 0 ? newData = `<td rowspan='${rowSpan}'>${subitem}</td>` : newData = ""
        data += newData
      })
      row += `<tr>${data}</tr>`
      data = "" 
    })
    return row
  }

  const getHeaders = () => {
    const reorderedHeaders = [
      "Coche",
      "Bogie",
      "Eje",
      "Trocha",
      "Rueda",
      "Diametro",
      "Alto",
      "Ancho",
      "qR",
      "Tipo de Rueda",
      "Perfil"
    ]
    let data = ""
    reorderedHeaders.forEach(item => {
      data += `<th>${item}</th>`
    })
    return data
  }

  return ({
    FLOTA: findInHeader("Flota"),
    LINEA: findInHeader("Linea"),
    FORMACION: findInHeader("Formacion"),
    FECHA: findInHeader("Fecha"),
    CABECERA: "",
    PERFILES: findProfiles(),
    HEADERS: getHeaders(),
    DATA: getTable(),
  })
}

export default prepareData
