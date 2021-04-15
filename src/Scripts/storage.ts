import { Dimension } from "../Components/ProfilePanel/template"

declare global {
  interface Window { 
    electron: {
      storage: {
        save: (name: string, data: {}, folder: string) => Promise<boolean>
        load: (name: string, folder: string) => Promise<BufferSource | false>
        delete: (name: string, folder: string) =>Promise<boolean>
        getFiles: (folder: string) => Promise<string[]>
      }
    }
  }
}

interface ISave {
  (name: string, data: {} | [], folder?: string, extension?: string) : Promise<boolean>
}

interface ILoad {
  (name: string, folder?: string, extension?: string) : Promise<false | any>
}

interface IDelete {
  (name: string, folder?: string, extension?: string) : Promise<boolean>
}
interface IGetFiles {
  (folder?: string) : Promise<string[]>
}

export const save: ISave = async(name, data, folder = "", extension = ".json") => {
  let dataToSave = data
  if (extension === ".json") {
    dataToSave = JSON.stringify(data)
  }
  const success = await window.electron.storage.save(`${name.toLowerCase()}${extension}`, dataToSave, folder)
  return success
}

export const load: ILoad = async(name, folder = "", extension = ".json") => {
  const data = await window.electron.storage.load(`${name.toLowerCase()}${extension}`, folder)
  if (data) {
    const decodedData = new TextDecoder().decode(data)
    return extension === ".json" ? JSON.parse(decodedData) : decodedData
  } else {
    return data
  }
}

export const deleteFile: IDelete = async(name, folder = "", extension = ".json") => {
  const success = await window.electron.storage.delete(`${name.toLowerCase()}${extension}`, folder)
  return success
}

export const getFiles: IGetFiles = async(folder = "") => {
  const data = await window.electron.storage.getFiles(folder)
  return data
}
