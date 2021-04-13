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
    const getObj = (name: any, value: string | number) => ({ damnationName: name, value })
    const reorderedWheels = evaluatedData.wheels.map((wheel, index) => 
      [
        getObj("", wheel.vehicle),
        getObj("", wheel.bogie) ,
        getObj("", Math.round((index + 1) / 2)) ,
        getObj("gauge", wheel.gauge.toFixed(2)),
        getObj("", index + 1),
        getObj("diameter", wheel.diameter.toFixed(2)),
        getObj("height", wheel.height.toFixed(2)),
        getObj("width", wheel.width.toFixed(2)),
        getObj("qr", wheel.qr.toFixed(2)),
        getObj("", wheel.type),
        getObj("", wheel.profile),
      ]
    )
    let data = ""
    let row = ""
    reorderedWheels.forEach((item, index) => {
      item.forEach((subItem, subIndex) => {
        let rowSpan = 0
        let newData = ""
        const isDamn = evaluatedData.wheels[index].damnation.includes(subItem.damnationName)
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
          rowSpan = 0
          break
        }
        rowSpan
          ? index % rowSpan === 0 ? newData = `<td ${isDamn ? "damned" : ""} rowspan='${rowSpan}'>${subItem.value}</td>` : newData = ""
          : newData = `<td ${isDamn ? "class=damned" : ""}>${subItem.value}</td>`
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
    reorderedHeaders.forEach((item, index) => {
      let noSubHeader = false
      if (index == 0 || index == 1 || index == 2 || index == 4 || index == 9 || index == 10) noSubHeader = true
      noSubHeader ? data += `<th rowspan=2>${item}</th>` : data += `<th>${item}</th>`
    })
    data = `<tr>${data}</tr>`
    const refValues = [
      "", "", "", "1359-1363", "", "Min 790", "36/26", "26/33", "6.5/15", "", ""
    ]
    refValues.forEach(val => {
      val ? data += `<th class=references>${val}</th>` : "<th></th>"
    })
    data = `<tr>${data}</tr>`
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
