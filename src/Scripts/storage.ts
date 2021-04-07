import { Dimension } from "../Components/ConfigPanel/template"

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
  (folder: string) : Promise<[]>
}

export const save: ISave = async (name, data, folder) => {
  const success: boolean = await electron.storage.save(`${name}.json`, JSON.stringify(data), folder)
  return success
}

export const load: ILoad = async (name, folder) => {
  const data: BufferSource | false = await electron.storage.load(`${name}.json`, folder)
  if (data) {
    return JSON.parse(new TextDecoder().decode(data))
  } else {
    return data
  }
}

export const getFiles: IGetFiles = async (folder) => {
  const data = await electron.storage.getFiles(folder) 
  return data
}

export const deleteFile: IDelete = (name) => {
  return new Promise((resolve, reject) => {resolve(true)})
}
