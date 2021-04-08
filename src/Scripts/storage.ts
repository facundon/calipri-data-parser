import { Dimension } from "../Components/ConfigPanel/template"

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
  (name: string, data: {} | [], storage: string) : Promise<boolean>
}

interface ILoad {
  (name: string, folder: string) : Promise<false | Dimension[]>
}

interface IDelete {
  (name: string, folder: string) : Promise<boolean>
}
interface IGetFiles {
  (folder: string) : Promise<string[]>
}

export const save: ISave = async(name, data, folder) => {
  const success = await window.electron.storage.save(`${name.toUpperCase()}.json`, JSON.stringify(data), folder)
  return success
}

export const load: ILoad = async(name, folder) => {
  const data = await window.electron.storage.load(`${name.toUpperCase()}.json`, folder)
  if (data) {
    return JSON.parse(new TextDecoder().decode(data))
  } else {
    return data
  }
}

export const deleteFile: IDelete = async(name, folder) => {
  const success = await window.electron.storage.delete(`${name.toUpperCase()}.json`, folder)
  return success
}

export const getFiles: IGetFiles = async(folder) => {
  const data = await window.electron.storage.getFiles(folder)
  return data
}
