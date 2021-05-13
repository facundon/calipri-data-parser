/* eslint-disable react-hooks/rules-of-hooks */
import { PreviewData } from "../Components/Preview"
import Alert from "rsuite/lib/Alert"
import { forIn } from "lodash"
import { load, useDb } from "./electron-bridge"
import evaluate from "./evaluate"

import { 
  Damnation,
  DamnationName,
  DifferenceTables,
  ERs,
  EvaluatedData,
  References,
  AwaitType
} from "./types"
import { TLine } from "../Components/StationPanel/template"
import { IParsedData } from "../Components/DragLoader/types"

export const getItemInHeader = (item: string, header: PreviewData[]) => (
  header.find((val: {}) => Object.keys(val)[0] === item)![item]
)
 
const findStations = async(header: PreviewData[]) => {
  const lines: TLine[] = await load("lineas")
  if (lines){
    const line = lines.find(line => (
      line.name === getItemInHeader("Linea", header)
    ))
    if (!line) throw Error("No se encontro el parámetro 'Linea' en los datos de la medición")
    return [line.station1, line.station2, line.color]
  } else {
    throw Error("No se pudieron cargar las cabeceras")
  }
}

const getPreparedData = async(
  evaluatedData: NonNullable<AwaitType<ReturnType<typeof evaluate>>>,
  header: PreviewData[]
) => {
  const vehicleSchema: string = await load("esquema", "templates", ".html")
  const stations = await findStations(header)
  const ers: {[x: string]: string} = await load("ers")
  const lastDate: {date: string} = await useDb("fetchLastDate", { 
    line: getItemInHeader("Linea", header),
    fleet: getItemInHeader("Flota", header),
    unit: getItemInHeader("Formacion", header)
  })
  if (!stations) throw Error("No se pudieron cargar las estaciones cabeceras")
  return prepareData(
    evaluatedData,
    header,
    vehicleSchema, stations,
    ers,
    lastDate
  )
}

const getReplacedTemplate = async(
  preparedData: ReturnType<typeof prepareData>
) => {
  const loadedHtml: string = await load("report", "templates", ".html")
  if (!loadedHtml) throw Error("No se pudo cargar la plantilla para crear PDF")
  let replacedHtml = loadedHtml
  forIn(preparedData, (val, key) => {
    replacedHtml = replacedHtml.replaceAll(`$${key}$`, val)
  })
  return replacedHtml.replace(/\r?\n|\r/g, "")
}

const preparePrint = (parsedData: IParsedData, callback: (val: string) => void) => (
  evaluate(parsedData).then(val => (
    getPreparedData(val, parsedData.header).then(val => (
      getReplacedTemplate(val).then(val => callback(val))
    ))
  )).catch(reason => {
    Alert.error(reason.message, 10000)
  })
)

const prepareData = (
  evaluatedData: EvaluatedData,
  header: PreviewData[],
  vehicleSchema: string,
  stations: string[],
  ers: ERs,
  lastDate: {date: string}
) => {
  const findInHeader = (item: string) => Object.values(header.find(val => val[item])!)[0]

  const getLastDate = () => {
    if (lastDate?.date) {
      return `<li>Ultima medición: <strong>${lastDate?.date}</strong></li>`
    } else {
      return ""
    }
  }

  const getProfiles = () => evaluatedData.wheels.map(wheel => wheel.profile)
    .filter((profile, index, arr) => index === arr.indexOf(profile))

  const getVehicleSchema = () => {
    let schema = ""
    let vehiclesAmount = 0
    evaluatedData.substractions.vehicle.forEach((_, index) => {
      schema += vehicleSchema
      vehiclesAmount = index
    })
    for (let wheelIndex = 1; wheelIndex <= evaluatedData.wheels.length ; wheelIndex++) {
      let auxIndex: number
      if (wheelIndex % 2 === 0) {
        auxIndex = wheelIndex - 1
      } else {
        auxIndex = wheelIndex + 1
      }
      const isDamn = evaluatedData.wheels[auxIndex-1].damnation.length
      schema = schema.replace("$NRO$", auxIndex.toString())
      schema = schema.replace("$CONDENADA$", isDamn ? "condenada" : "")
    }
    const anotherRowStations = `<div class="estaciones"><p>${stations[1]}</p><p>${stations[0]}</p></div>`
    return (
      `<div class=formacion>
        ${vehiclesAmount < 5 ? `<p>${stations[1]}</p>` : ""}
        ${schema}
        ${vehiclesAmount < 5 ? `<p>${stations[0]}</p>` : ""}
      </div>
      ${vehiclesAmount >= 5 ? anotherRowStations : ""}`
    )
  }

  const getOrderedRefValues = () => {
    let allReferences: References[] = []
    getProfiles().forEach((profile, index, arr) => {
      let references = {} as References
      const profileRef = evaluatedData.references[profile]
      Object.keys(profileRef).forEach(ref => {
        const refName = ref as DamnationName
        const refObj = profileRef[refName]
        let maxVal: string | null | (string | null)[] = ""
        let minVal: string | null | (string | null)[] = ""
        if ("maxVal" in refObj || "minVal" in refObj) {
          maxVal = refObj.maxVal?.toString()
          minVal = refObj.minVal?.toString()
          if (refName === "Diametro") {
            maxVal = ""
            minVal = index === 0 ? `Mín: ${refObj.minVal}` : ""
          }
        } else {
          minVal = ""
          maxVal = [
            refObj.Motriz?.maxVal
              ? `Motriz ${profile}: ` + refObj.Motriz?.maxVal?.toString()
              : null,
            refObj.Remolque?.maxVal
              ? `Remolque ${profile}: ` + refObj.Remolque?.maxVal?.toString()
              : null
          ]
          if (maxVal.includes(null)) {
            const changeIndex = maxVal.indexOf(null)
            maxVal[changeIndex] = refObj["Motriz - Remolque"]?.maxVal
              ? `Motriz-Remolque ${profile}: ` + refObj["Motriz - Remolque"]?.maxVal?.toString()
              : null
          }
        }
        if (typeof maxVal === "string" && refName !== "Diametro") {
          references[refName] = `${arr.length !== 1 ? profile + ": " : ""}${minVal || ""}-${maxVal || ""}`
        } else {
          references[refName] = maxVal || minVal || ""
        }
      })
      allReferences.push(references)
    })
    let orderedRefs = allReferences[0]
    if (allReferences.length > 1) {
      orderedRefs = allReferences.reduce((prev, current) => {
        let refObj = {} as References
        Object.values(current).forEach((currentVal, currentIndex) => {
          const prevValues = Object.values(prev)[currentIndex]
          if (typeof prevValues === "object") {
            let nextRef = ""
            prevValues.forEach((prevVal, prevIndex) => {
              nextRef += `
                  ${prevVal ? `<div>${prevVal}</div>` : ""}
                  ${currentVal[prevIndex] ? `<div>${currentVal[prevIndex]}</div>` : ""}`
            })
            refObj[Object.keys(current)[currentIndex] as DamnationName] = nextRef
          } else {
            refObj[Object.keys(current)[currentIndex] as DamnationName] = `<div>${Object.values(prev)[currentIndex]}</div><div>${currentVal}</div>`
          }
        })
        return refObj
      })
    }
    return orderedRefs
  }

  const findProfiles = () => {
    const profiles = getProfiles()
    let message = ""
    profiles.forEach(profile => {
      message += `<li>Ruedas con perfil <strong>${profile}</strong> evaluadas según <strong>${ers[profile]}</strong></li>`
    })
    return message
  }

  const getTable = () => {
    const getObj = (name: Damnation[number], value: string) => ({ damnationName: name, value })
    const reorderedWheels = evaluatedData.wheels.map((wheel, index) => 
      [
        getObj("", wheel.vehicle),
        getObj("", wheel.bogie) ,
        getObj("index", Math.round((index + 1) / 2).toString()),
        getObj("gauge", isNaN(wheel.gauge) ? "-" : wheel.gauge.toFixed(2)),
        getObj("index", (index + 1).toString()),
        getObj("diameter", isNaN(wheel.diameter) ? "-" : wheel.diameter.toFixed(2)),
        getObj("height", isNaN(wheel.height) ? "-" : wheel.height.toFixed(2)),
        getObj("width", isNaN(wheel.width) ? "-" : wheel.width.toFixed(2)),
        getObj("qr", isNaN(wheel.qr) ? "-" : wheel.qr.toFixed(2)),
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
          ? index % rowSpan === 0 
            ? newData = `<td 
              ${isDamn ? "damned" : ""} 
              ${subItem.damnationName === "index" ? "id=index" : ""}
              rowspan='${rowSpan}'
              >${subItem.value || "-"}</td>` 
            : newData = ""
          : newData = `<td
            ${isDamn ? "class=damned" : ""}
            ${subItem.damnationName === "index" ? "id=index" : ""}
            >${subItem.value || "-"}</td>`
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
      noSubHeader ? data += `<th rowspan=2>${item}</th>` : data += `<th>${item}<span> [mm]</span></th>`
    })
    data = `<tr>${data}</tr>`
    let subData = ""
    const refValues = getOrderedRefValues()
    const itemsToDelete = Object.keys(refValues).filter((item) => !reorderedHeaders.includes(item)) as DamnationName[] 
    itemsToDelete.forEach(item => delete refValues[item])
    Object.values(refValues).forEach(val => {
      val ? subData += `<th class=references>${val}</th>` : null
    })
    data = `${data}<tr class=references-row>${subData}</tr>`
    return data
  }

  const getDifTable = (type: DifferenceTables) => {
    let data = ""
    evaluatedData.substractions[type]!.forEach((item, index) => {
      switch (type) {
      case "width":
      case "shaft":
        data += `
        <tr>
          ${index % 4 === 0 ? `<td rowspan=4>${item!.vehicle || "-"}</td>` : ""}
          ${index % 2 === 0 ? `<td rowspan=2>${item!.bogie || "-"}</td>` : ""}
          <td id=index>${index + 1}</td>
          <td>${item!.profile}</td>
          <td ${item!.damnation ? "class=damned" : ""}>${item!.value}</td>
        </tr>`
        break
      case "bogie":
        data += `
        <tr>
          ${index % 2 === 0 ? `<td rowspan=2>${item!.vehicle || "-"}</td>` : ""}
          <td id=index>${item!.bogie || "-"}</td>
          <td>${item!.type}</td>
          <td>${item!.profile}</td>
          <td ${item!.damnation ? "class=damned" : ""}>${item!.value}</td>
        </tr>`
        break
      case "vehicle":
      case "module":
        data += `
        <tr>
          <td id=index>${item!.vehicle || "-"}</td>
          <td>${item!.type}</td>
          <td>${item!.profile}</td>
          <td ${item!.damnation ? "class=damned" : ""}>${item!.value}</td>
        </tr>`
        break
      default:
        break
      }
    })
    return data
  }

  const getDifHeaders = (headers: string[], ref: string) => {
    let data = ""
    headers.map((item) => {
      data += `<th ${item !== "Diferencia" ? "rowspan=2" : ""}>${item}${item === "Diferencia" ? "<span> [mm]</span>" : ""}</th>`
    })
    data = `<tr>${data}</tr>`
    const refValues = getOrderedRefValues()
    const currentRef = Object.keys(refValues).find(item => item === ref) as DamnationName
    let value = refValues[currentRef]
    if (typeof value === "string") {
      value = value.replaceAll("-", "")
    } else {
      let newVal = ""
      value.forEach(val => newVal += `<div>${val}</div>`)
      value = newVal
    }
    const subData = `<th class=diff-references><div>Max: </div><div>${value}</th>`
    data = `${data}<tr class=references-row>${subData}</tr>`
    return data
  } 

  return ({
    FLOTA: findInHeader("Flota"),
    LINEA: findInHeader("Linea"),
    FORMACION: findInHeader("Formacion"),
    FECHA: findInHeader("Fecha"),
    PERFILES: findProfiles(),
    COLOR: stations[2],
    ESQUEMA: getVehicleSchema(),
    HEADERS: getHeaders(),
    WIDTH_HEADERS: getDifHeaders(["Coche", "Bogie", "Eje",  "Perfil", "Diferencia"], "Dif. Ancho de Pestaña"),
    SHAFT_HEADERS: getDifHeaders(["Coche", "Bogie", "Eje",  "Perfil", "Diferencia"], "Dif. Diametro de Rueda - Mismo Eje"),
    BOGIE_HEADERS: getDifHeaders(["Coche", "Bogie", "Tipo", "Perfil", "Diferencia"], "Dif. Diametro de Rueda - Mismo Bogie"),
    VEHICLE_HEADERS: getDifHeaders(["Coche", "Tipo", "Perfil", "Diferencia"], "Dif. Diametro de Rueda - Mismo Coche"),
    MODULE_HEADERS: getDifHeaders(["Modulo", "Tipo", "Perfil", "Diferencia"], "Dif. Diametro de Rueda - Mismo Modulo"),
    DATA: getTable(),
    WIDTH_DATA: getDifTable("width"),
    SHAFT_DATA: getDifTable("shaft"),
    BOGIE_DATA: getDifTable("bogie"),
    VEHICLE_DATA: getDifTable("vehicle"),
    MODULE_DATA: getDifTable("module"),
    OPERADORES: findInHeader("Operador"),
    CABECERA: stations[1],
    FIRST_VEHICLE: evaluatedData.wheels[0].vehicle,
    LAST_DATE: getLastDate(),
  })
}

export default preparePrint
