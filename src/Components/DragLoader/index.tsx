/* eslint-disable react/prop-types */
// eslint-disable-next-line no-use-before-define
import React, { useState } from "react"
import { CSVReader } from "react-papaparse"
import Alert from "rsuite/lib/Alert"
import Animation from "rsuite/lib/Animation"
import Preview from "../Preview"

import * as T from "./types"
import type { PreviewData } from "../Preview"

import { ReaderStyle } from "./styles"
import { Header, Dimension } from "./enums"
import { normalize } from "../../Scripts/utils"
import { getSubstractions } from "../../Scripts/substraction"

const { Bounce } = Animation

const BOGIES_PER_VEHICLE = 2
const GAUGES_PER_BOGIE = 2
const WHEELS_PER_GAUGES = 2

export const PARSED_DATA_INITIAL_VALUES = {
  header: [],
  wheels: [],
  substractions: {
    width: [],
    shaft: [],
    bogie: [],
    vehicle: [],
    unit: []
  }
}
const readerConfig = {
  skipEmptyLines: true,
}

const DragLoader: React.FC<T.IDragLoader> = ({ handleIsLoaded, handleParsedData }) => {
  const [previewData, setPreviewData] = useState<PreviewData[]>([])

  const handleOnDrop = (data: T.ILoadedData[]) => {
    const getPosition = (headerName: string) => (
      data.find(
        (val) => val.data.find(
          (val) => val === headerName
        )
      )!.data.indexOf(headerName)
    )
    const positions: T.IPositions = {
      vehicleName: getPosition(Header.VehicleName),
      vehicleValue: getPosition(Header.VehicleValue),
      bogie1: getPosition(Header.Bogie1),
      bogie2: getPosition(Header.Bogie2),
      profile: getPosition(Header.Profile),
      type: getPosition(Header.Type)
    }

    const parseDimension = (dimension: string) => {
      const posDimensionName = getPosition(Header.DimensionName)
      const posDimensionValue = getPosition(Header.DimensionValue)
      return (
        data.filter(
          (arr) => arr.data[posDimensionName] === dimension
        ).map(
          (marr) => marr.data[posDimensionValue]
        )
      )
    }
    const parseFlangeExtraData = (posExtraData: number) => (
      data.filter(
        (arr, index) => arr.data[positions.vehicleName] === Dimension.Vehicle && arr.data[posExtraData] !== "" && index % 3 === 0
      ).map(
        (marr) => marr.data[posExtraData]
      )
    )

    const parsedPreview: PreviewData[] = data.filter(
      (arr) => (arr.data[2] === "" || arr.data.length === 2) && arr.data[0] !== "MeasPlan.Name" // elimino el primer valor del csv
    ).map(
      (marr) => ({ [marr.data[0]]: marr.data[1] })
    )

    const parsedVehicle = data.filter(
      (arr) => arr.data[positions.vehicleName] === Dimension.Vehicle
    ).map(
      (marr) => marr.data[positions.vehicleValue]
    ).filter(
      (arr, index, self) => self.indexOf(arr) === index
    )

    const parsedBogie = data.filter(
      (arr) => arr.data[positions.vehicleName] === Dimension.Vehicle
    ).flatMap(
      (marr) => [marr.data[positions.bogie1], marr.data[positions.bogie2]]
    ).filter(
      (arr, index, self) => self.indexOf(arr) === index
    )

    const rawParsedData: T.IRawParsedData = {
      widths: parseDimension(Dimension.Width),
      heights: parseDimension(Dimension.Height),
      qrs: parseDimension(Dimension.Qr),
      diameters: parseDimension(Dimension.Diameter),
      gauges: parseDimension(Dimension.Gauge),
      vehicles: parsedVehicle,
      bogies: parsedBogie,
      profiles: parseFlangeExtraData(positions.profile),
      types: parseFlangeExtraData(positions.type)
    }

    const fleet = parsedPreview.find(item => Object.keys(item)[0] === "Flota")?.Flota
    const substractions = getSubstractions(rawParsedData, fleet || "-")

    const parsedWheels: T.Wheel[] = []
    let gaugeIndex = 0
    let vehicleIndex = 0
    let bogieIndex = 0
    rawParsedData.widths.forEach((_, wheelIndex) => {
      if (wheelIndex % 2 === 0 && wheelIndex !== 0) gaugeIndex += 1
      if (wheelIndex % 4 === 0 && wheelIndex !== 0) bogieIndex += 1
      if (wheelIndex % 8 === 0 && wheelIndex !== 0) vehicleIndex += 1
      console.log(bogieIndex)
      parsedWheels.push(
        {
          width: normalize(rawParsedData.widths[wheelIndex]),
          height: normalize(rawParsedData.heights[wheelIndex]),
          qr: normalize(rawParsedData.qrs[wheelIndex]),
          diameter: normalize(rawParsedData.diameters[wheelIndex]),
          gauge: normalize(rawParsedData.gauges[gaugeIndex]),
          vehicle: rawParsedData.vehicles[vehicleIndex],
          bogie: rawParsedData.bogies[bogieIndex],
          profile: rawParsedData.profiles[wheelIndex],
          type: rawParsedData.types[wheelIndex]
        }
      )
    })
    setPreviewData(parsedPreview)
    handleParsedData({
      header: parsedPreview,
      wheels: parsedWheels,
      substractions: substractions
    })
    handleIsLoaded(true)
    Alert.success("Archivo cargado !")
  }

  const handleOnError = (err: T.CSVErrors[]) => {
    setPreviewData([])
    handleIsLoaded(false)
    Alert.error("No se pudo cargar el archivo", 7000)
    console.log(err)
  }

  const handleOnRemoveFile = () => {
    handleParsedData(PARSED_DATA_INITIAL_VALUES)
    setPreviewData([])
    handleIsLoaded(false)
  }

  return (
    <>
      <CSVReader
        onDrop={handleOnDrop}
        onError={handleOnError}
        addRemoveButton
        onRemoveFile={handleOnRemoveFile}
        style={ReaderStyle}
        config={readerConfig}
      >
        <span><p>Arrastra aquí el archivo .CSV</p>
          <p>O hace click para seleccionarlo</p></span>
      </CSVReader>
      <Bounce in={previewData.length > 0} >
        {(props, ref) =>
          <Preview
            {...props}
            data={previewData}
            ref={ref}
            style={previewData.length > 0 ? { display: "initial" } : { display: "none" }}
          />}
      </Bounce>
    </>
  )
}

export default DragLoader
