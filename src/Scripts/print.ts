import { PreviewData } from "../Components/Preview"
import { EvaluatedWheel, EvaluatedSubstractions, Profiles } from "./evaluate"

type EvaluatedData = {
  wheels: EvaluatedWheel[],
  substractions: EvaluatedSubstractions,
  references: Profiles,
}

type References = {
  [x: string]: string | string[];
}[]

const prepareData = (evaluatedData: EvaluatedData, header: PreviewData[]) => {
  const findInHeader = (item: string) => Object.values(header.find(val => val[item])!)[0]
  const getProfiles = () => evaluatedData.wheels.map(wheel => wheel.profile)
    .filter((profile, index, arr) => index === arr.indexOf(profile))

  const getOrderedRefValues = () => {
    let allReferences: References[] = []
    getProfiles().forEach((profile, index, arr) => {
      const references = Object.keys(evaluatedData.references[profile]).map(ref => {
        let maxVal: string | string[] | null = ""
        let minVal = ""
        maxVal = evaluatedData.references[profile][ref].maxVal?.toString()
        minVal = evaluatedData.references[profile][ref].minVal?.toString()
        if (ref === "Diametro") {
          maxVal = null
          minVal = index === 0 ? `Min: ${minVal}` : ""
        }
        if (!maxVal && !minVal && ref !== "Diametro") {
          minVal = ""
          maxVal = [
            "Motriz" + ": " + evaluatedData.references[profile][ref]["MOTRIZ"]?.maxVal?.toString(),
            "Remolque" + ": " + evaluatedData.references[profile][ref]["REMOLQUE"]?.maxVal?.toString()
          ]
        }
        if (typeof maxVal === "string" && ref !== "Diametro") {
          return { [ref]: `${arr.length !== 1 ? profile + ": " : ""}${minVal}-${maxVal}` }
        } else {
          return { [ref]: maxVal || minVal }
        }
      })
      console.log(references)
      allReferences.push(references)
    })
    const orderedRefs = allReferences.reduce((prev: any, current: any) => {
      let refObj = {}
      current.forEach((item: any, index: number) => {
        refObj[Object.keys(item)[0]]=  (Object.values(prev[index]) + " " + Object.values(item)).trim()
      })
      return refObj
    })
    return orderedRefs
  }

  const findProfiles = () => {
    const profiles = getProfiles()
    let message = ""
    profiles.forEach(profile => {
      message += `Ruedas con perfil <strong>${profile}</strong> evaluadas según <strong>$ER$</strong>`
    })
    return message
  }

  const getTable = () => {
    const getObj = (name: any, value: string | number) => ({ damnationName: name, value })
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
              >${subItem.value}</td>` 
            : newData = ""
          : newData = `<td
            ${isDamn ? "class=damned" : ""}
            ${subItem.damnationName === "index" ? "id=index" : ""}
            >${subItem.value}</td>`
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
    let subData = ""
    const refValues = getOrderedRefValues()
    const itemsToDelete = Object.keys(refValues).filter(item => !reorderedHeaders.includes(item))
    console.log(refValues)
    itemsToDelete.forEach((item: any) => delete refValues[item])
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
    CABECERA: "",
    PERFILES: findProfiles(),
    HEADERS: getHeaders(),
    DATA: getTable(),
  })
}

export default prepareData
