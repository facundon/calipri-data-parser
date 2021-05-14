export interface IExportPanel {
  isExportPanelOpen: boolean,
  exportPanelHandler: (val: boolean) => void
}

export type CascaderData = {
  value: string,
  label: string,
  children?: CascaderData[],
  parent?: CascaderData | null,
}

export type FetchedData = {
  ["data"]: string
}

export type MeasurementCallback = (
  allData: FetchedData[],
  item: CascaderData | undefined
) => Promise<{
  fileNames: string[],
  data: string[]
} | void>