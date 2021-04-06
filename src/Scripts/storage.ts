/* eslint-disable no-undef */
import { Dimension } from "../Components/ConfigPanel/template"

type ReadData = {
  files: [
    {
      name: string,
      type: string
    }
  ]
}

interface ISave {
  (name: string, data: {} | []) : Promise<boolean>
}

interface ILoad {
  (name: string) : Promise<false | Dimension[]>
}

interface IDelete {
  (name: string) : Promise<boolean>
}
interface IGetFiles {
  (folderName?: string) : Promise<false | ReadData>
}

interface IDeleteData {
  success?: boolean,
  error?: string
}

export const save: ISave = (name, data) => {
  return new Promise((resolve, reject) => {resolve(true)})
}

export const load: ILoad = (name) => {
  return new Promise((resolve, reject) => {resolve(true)})
}

export const getFiles: IGetFiles = (folderName = "storage") => {
  return new Promise((resolve, reject) => {resolve({files: [{name: "caca", type:"cacona"}]})})
}

export const deleteFile: IDelete = (name) => {
  return new Promise((resolve, reject) => {resolve(true)})
}
