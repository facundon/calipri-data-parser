import { 
  EvaluatedSubstractionsKinds
} from "./types"

const prepareData = (
  evaluatedData,
  header,
  vehicleSchema,
  stations,
  ers,
  lastDate
) => {
  const findInHeader = (item) => Object.values(header.find(val => val[item]))[0]

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
      let auxIndex
      if (wheelIndex % 2 === 0) {
        auxIndex = wheelIndex - 1
      } else {
        auxIndex = wheelIndex + 1
      }
      const isDamn = evaluatedData.wheels[auxIndex-1].damnation.length
      schema = schema.replace("$NRO$", auxIndex)
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
    let allReferences = []
    getProfiles().forEach((profile, index, arr) => {
      const profileRef = evaluatedData.references[profile]
      const references = Object.keys(evaluatedData.references[profile]).map(ref => {
        let maxVal = ""
        let minVal = ""
        maxVal = profileRef[ref].maxVal?.toString()
        minVal = profileRef[ref].minVal?.toString()
        if (ref === "Diametro") {
          maxVal = null
          minVal = index === 0 ? `Mín: ${minVal}` : ""
        }
        if (!maxVal && !minVal && ref !== "Diametro") {
          minVal = ""
          maxVal = [
            profileRef[ref]["Motriz"]?.maxVal ? `Motriz ${profile}: ` + profileRef[ref]["Motriz"]?.maxVal?.toString() : null,
            profileRef[ref]["Remolque"]?.maxVal ? `Remolque ${profile}: ` + profileRef[ref]["Remolque"]?.maxVal?.toString() : null
          ]
          if (maxVal.includes(null)) {
            const changeIndex = maxVal.indexOf(null)
            maxVal[changeIndex] = profileRef[ref]["Motriz - Remolque"]?.maxVal ? `Motriz-Remolque ${profile}: ` + profileRef[ref]["Motriz - Remolque"]?.maxVal?.toString() : null
          }
        }
        if (typeof maxVal === "string" && ref !== "Diametro") {
          return { [ref]: `${arr.length !== 1 ? profile + ": " : ""}${minVal || ""}-${maxVal || ""}` }
        } else {
          return { [ref]: maxVal || minVal || ""}
        }
      })
      allReferences.push(references)
    })
    let orderedRefs
    if (allReferences.length === 1) {
      allReferences.forEach(item => {
        let refObj = {}
        item.forEach(item => {
          refObj[Object.keys(item)[0]] = Object.values(item)[0]
        })
        orderedRefs = refObj
      })
    } else {
      orderedRefs = allReferences.reduce((prev, current) => {
        let refObj = {}
        current.forEach((item, index) => {
          if (typeof Object.values(prev[index])[0] === "object") {
            let nextRef = ""
            Object.values(prev[index])[0].forEach((val, i) => {
              nextRef += `
                ${val ? `<div>${val}</div>` : ""}
                ${Object.values(item)[i] ? `<div>${Object.values(item)[i][0]}</div>` : ""}`
            })
            refObj[Object.keys(item)[0]] = nextRef
          } else {
            refObj[Object.keys(item)[0]] = `<div>${Object.values(prev[index])}</div><div>${Object.values(item)}</div>`
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
    const getObj = (name, value) => ({ damnationName: name, value })
    const reorderedWheels = evaluatedData.wheels.map((wheel, index) => 
      [
        getObj("", wheel.vehicle),
        getObj("", wheel.bogie) ,
        getObj("index", Math.round((index + 1) / 2)),
        getObj("gauge", isNaN(wheel.gauge) ? "-" : wheel.gauge.toFixed(2)),
        getObj("index", index + 1),
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
    const itemsToDelete = Object.keys(refValues).filter(item => !reorderedHeaders.includes(item))
    itemsToDelete.forEach(item => delete refValues[item])
    Object.values(refValues).forEach(val => {
      val ? subData += `<th class=references>${val}</th>` : null
    })
    data = `${data}<tr class=references-row>${subData}</tr>`
    return data
  }

  const getDifTable = (type) => {
    let data = ""
    evaluatedData.substractions[type].forEach((item, index) => {
      switch (type) {
      case "width":
      case "shaft":
        data += `
        <tr>
          ${index % 4 === 0 ? `<td rowspan=4>${item.vehicle || "-"}</td>` : ""}
          ${index % 2 === 0 ? `<td rowspan=2>${item.bogie || "-"}</td>` : ""}
          <td id=index>${index + 1}</td>
          <td>${item.profile}</td>
          <td ${item.damnation ? "class=damned" : ""}>${item.value}</td>
        </tr>`
        break
      case "bogie":
        data += `
        <tr>
          ${index % 2 === 0 ? `<td rowspan=2>${item.vehicle || "-"}</td>` : ""}
          <td id=index>${item.bogie || "-"}</td>
          <td>${item.type}</td>
          <td>${item.profile}</td>
          <td ${item.damnation ? "class=damned" : ""}>${item.value}</td>
        </tr>`
        break
      case "vehicle":
      case "module":
        data += `
        <tr>
          <td id=index>${item.vehicle || "-"}</td>
          <td>${item.type}</td>
          <td>${item.profile}</td>
          <td ${item.damnation ? "class=damned" : ""}>${item.value}</td>
        </tr>`
        break
      default:
        break
      }
    })
    return data
  }

  const getDifHeaders = (headers, ref) => {
    let data = ""
    headers.map((item) => {
      data += `<th ${item !== "Diferencia" ? "rowspan=2" : ""}>${item}${item === "Diferencia" ? "<span> [mm]</span>" : ""}</th>`
    })
    data = `<tr>${data}</tr>`
    const refValues = getOrderedRefValues()
    const currentRef = Object.keys(refValues).find(item => item === ref)
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

export default prepareData
