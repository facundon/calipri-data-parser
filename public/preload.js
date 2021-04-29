const {
  contextBridge,
  ipcRenderer
} = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  storage: {
    async save(name, data, folder) {
      const success = await ipcRenderer.invoke("save", name, data, folder)
      return success
    },
    async saveBulk(names, data, folder) {
      const success = await ipcRenderer.invoke("saveBulk", names, data, folder)
      return success
    },
    async load(name, folder) {
      const data = await ipcRenderer.invoke("load", name, folder)
      return data
    },
    async delete(name, folder) {
      const success = await ipcRenderer.invoke("delete", name, folder)
      return success
    },
    async getFiles(folder) {
      const data = await ipcRenderer.invoke("getFiles", folder)
      return data
    },
    async createPdf(html, name) {
      const success = await ipcRenderer.invoke("createPdf", html, name)
      return success
    },
  },
  database: {
    async useDb(action, data, table) {
      const success = await ipcRenderer.invoke("dbHandler", action, data, table)
      return success
    }
  },
  config: {
    async selectConfigDirectory() {
      const success = await ipcRenderer.invoke("selectDirectory")
      return success
    },
    async resetConfig() {
      const success = await ipcRenderer.invoke("resetConfig")
      return success
    }
  },
  window: {
    close: () => ipcRenderer.send("close"),
    minimize: () => ipcRenderer.send("minimize")
  }
})
