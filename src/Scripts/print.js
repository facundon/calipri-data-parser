const prepareData = (evaluatedData, header, vehicleSchema, stations, ers) => {
  const findInHeader = (item) => Object.values(header.find(val => val[item]))[0]

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
    const anotherRowStations = `<div class="estaciones"><p>${stations[0]}</p><p>${stations[1]}</p></div>`
    return (
      `<div class=formacion>
        ${vehiclesAmount < 5 ? `<p>${stations[0]}</p>` : ""}
        ${schema}
        ${vehiclesAmount < 5 ? `<p>${stations[1]}</p>` : ""}
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
          minVal = index === 0 ? `Min: ${minVal}` : ""
        }
        if (!maxVal && !minVal && ref !== "Diametro") {
          minVal = ""
          maxVal = [
            "Motriz" + ": " + profileRef[ref]["MOTRIZ"]?.maxVal?.toString(),
            "Remolque" + ": " + profileRef[ref]["REMOLQUE"]?.maxVal?.toString()
          ]
        }
        if (typeof maxVal === "string" && ref !== "Diametro") {
          return { [ref]: `${arr.length !== 1 ? profile + ": " : ""}${minVal}-${maxVal}` }
        } else {
          return { [ref]: maxVal || minVal }
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
          refObj[Object.keys(item)[0]] = `<div>${Object.values(prev[index])}</div><div>${Object.values(item)}</div>`
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
        getObj("gauge", wheel.gauge.toFixed(2)),
        getObj("index", index + 1),
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

  return ({
    FLOTA: findInHeader("Flota"),
    LINEA: findInHeader("Linea"),
    FORMACION: findInHeader("Formacion"),
    FECHA: findInHeader("Fecha"),
    PERFILES: findProfiles(),
    HEADERS: getHeaders(),
    DATA: getTable(),
    ESQUEMA: getVehicleSchema(),
  })
}

export default prepareData
