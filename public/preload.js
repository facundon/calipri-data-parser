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
    async load(name, folder) {
      const data = await ipcRenderer.invoke("load", name, folder)
      return data
    },
    async getFiles(folder) {
      const data = await ipcRenderer.invoke("getFiles", folder)
      return data
    }
  },
})