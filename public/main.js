const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const fs = require("fs")
const fsp = require("fs").promises

function getRelativePath(folder) {
  return path.join(__dirname, "storage", folder)
}

let win
function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    }
  })

  win.loadURL("http://localhost:3000/")
}

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.handle("save", async (_, name, data, folder) => {
  const dir = getRelativePath(folder)
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, {recursive: true})
  }
  const err = await fsp.writeFile(path.join(dir, name), data)
  return err ? false : true
})

ipcMain.handle("load", async (_, name, folder) => {
  const dir = getRelativePath(folder)
  try {
    const data = await fsp.readFile(path.join(dir, name))
    return data
  } catch (error) {
    return false
  }  
})

ipcMain.handle("getFiles", async (_, folder) => {
  const dir = getRelativePath(folder)
  try {
    const data = await fsp.readdir(folder)
    return data
  } catch (error) {
    fs.mkdirSync(dir, {recursive: true})
    return []
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
