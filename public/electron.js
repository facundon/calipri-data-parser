const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { autoUpdater } = require("electron-updater")
const path = require("path")
const fs = require("fs-extra")

const Database = require("better-sqlite3")

const isDev = true
autoUpdater.autoDownload = false

// const CHECK_UPDATES_INTERVAL = 600000  // in ms
const CONFIG_PATH_FILE = "config_path.txt"
const SOURCE_CONFIG_PATH = path.join(__dirname, "config")
const MY_DOCUMENTS_PATH = app.getPath("documents")
const USER_DATA_PATH = app.getPath("userData")
let configPath = path.join(MY_DOCUMENTS_PATH, "Calipri Parser Config")

const PATH_SELECT_DIALOG_OPTION = {
  title: "Seleccionar Carpeta",
  defaultPath: configPath,
  buttonLabel: "Seleccionar",
  properties: ["openDirectory"]
}

async function getFilePath() {
  try {
    configPath = await fs.readFile(path.join(USER_DATA_PATH, CONFIG_PATH_FILE), {encoding: "utf-8"})
  } catch (error) {
    try {
      await fs.writeFile(path.join(USER_DATA_PATH, CONFIG_PATH_FILE), configPath)
      fs.chmod(path.join(USER_DATA_PATH, CONFIG_PATH_FILE), 0666, (error) => {
        console.log("Changed file permissions")
      })
    } catch (err) {
      throw err
    }
  }
}

function getRelativePath(folder) {
  return path.join(configPath, folder)
}

async function selectConfigPath() {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, PATH_SELECT_DIALOG_OPTION)
  if (canceled) throw {name: "Minor Error", message: "Por favor vuelva a abrir el programa y elija una opción"}
  configPath = filePaths[0]
  try {
    await fs.writeFile(path.join(USER_DATA_PATH, CONFIG_PATH_FILE), configPath)
    fs.chmod(path.join(USER_DATA_PATH, CONFIG_PATH_FILE), 0666, (error) => {
      console.log("Changed file permissions")
    })
    return
  } catch (error) {
    console.log(error)
    throw new Error("Error al crear archivo de configuración")
  }
}

async function createConfigPath() {
  try {
    const origin = path.join(SOURCE_CONFIG_PATH)
    const destiny = path.join(configPath)
    await fs.ensureDir(destiny)
    await fs.copy(origin, destiny)
    return
  } catch (error) {
    console.log(error)
    throw new Error("Error al crear directorio de configuración")
  }
}

async function selectOrCreateConfigFolder() {
  const FILEPATH_WARN_DIALOG_OPT = {
    message: `No se encontraron archivos de configuración.
Puede elegír la ubicación de la carpeta donde se encuentran dichos archivos, o puede dejar que creemos una por usted en ${configPath}`,
    type: "warning",
    buttons: ["Elegir Ubicación", "Crear"],
    defaultId: 0,
    title: "No se encontro configuración",
  }
  try {
    await fs.readdir(configPath)
    return
  } catch (error) {
    const { response } = await dialog.showMessageBox(mainWindow, FILEPATH_WARN_DIALOG_OPT)
    switch (response) {
    case 0:  //seleccionar ubicacion
      await selectConfigPath()
      break
    case 1:  //crear directorio
      await createConfigPath()
    }
  }
}

// setInterval(() => {
//   autoUpdater.checkForUpdates().catch(err => console.log(err))
// }, CHECK_UPDATES_INTERVAL)

let mainWindow
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    minWidth: 750,
    height: 1000,
    minHeight: 600,
    center: true,
    show: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    }
  })

  mainWindow.loadURL(isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`)
  mainWindow.removeMenu()
  // mainWindow.webContents.openDevTools()
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.on("ready", () => {
  let loading = new BrowserWindow({
    show: false,
    frame: false,
    transparent: true,
    center: true,
    minimizable: false,
    width: 350,
    height: 350,
    opacity: 0.85,
  })
  loading.once("show", async() => {
    try {
      await getFilePath()
      await selectOrCreateConfigFolder()
    } catch (err) {
      dialog.showErrorBox("Error de Configuración", err.message)
      app.exit(1)
    }
    createMainWindow()
    mainWindow.webContents.once("dom-ready", () => {
      mainWindow.show()
      autoUpdater.checkForUpdates().catch(err => console.log(err))
      loading.hide()
      loading.close()
    })
  })
  loading.loadFile(path.join(__dirname, "loading.html"))
  loading.show()
})

ipcMain.handle("selectDirectory", async() => {
  try {
    await selectConfigPath()
    return true
  } catch (error) {
    if (error.name === "Minor Error") return false
    console.log(error)
    return error.message
  }
})

ipcMain.handle("resetConfig", async() => {
  try {
    await createConfigPath()
    return true
  } catch (error) {
    console.log(error)
    return error.message
  }
})

ipcMain.handle("save", async(_, name, data, folder) => {
  let dir = getRelativePath(folder)
  try {
    const err = await fs.writeFile(path.join(dir, name), data)
    fs.chmod(path.join(dir, name), 0666, (error) => {
      console.log("Changed file permissions")
    })
    return !err
  } catch (error) {
    console.log(error)
    return false
  }
})

ipcMain.handle("saveBulk", async(_, names, data, folder) => {
  let dir = getRelativePath(folder)
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, PATH_SELECT_DIALOG_OPTION)
    if (canceled) return "canceled"
    dir = path.join(filePaths[0], folder)
    fs.mkdirSync(dir, { recursive: true })
    let index = 0
    for (const name of names) {
      await fs.writeFile(path.join(dir, name), data[index])
      fs.chmod(path.join(dir, name), 0666, (error) => {
        console.log("Changed file permissions")
      })
      index++
    }
    return true
  } catch (error) {
    console.log(error)
    return false
  }
})

ipcMain.handle("load", async(_, name, folder) => {
  const dir = getRelativePath(folder)
  try {
    const data = await fs.readFile(path.join(dir, name))
    return data
  } catch (error) {
    console.log(error)
    return false
  }
})

ipcMain.handle("delete", async(_, name, folder) => {
  const dir = getRelativePath(folder)
  try {  
    const err = await fs.rm(path.join(dir, name))
    return !err
  } catch (error) {
    console.log(error)
    return false
  }
})

ipcMain.handle("getFiles", async(_, folder) => {
  const dir = getRelativePath(folder)
  try {
    const data = await fs.readdir(dir)
    return data
  } catch (error) {
    return []
  }
})

ipcMain.handle("createPdf", async(_, html, name) => {
  const SAVE_PDF_DIALOG_OPT = {
    title: "Guardar Reporte",
    buttonLabel: "Guardar",
    filters: [{name: "Reporte", extensions: ["pdf"]}],
    defaultPath: name,
  }
  const css = await fs.readFile(getRelativePath("templates/report.css"), { encoding: "utf-8" })
  const printWindow = new BrowserWindow({
    show: false,
    frame: false,
  })
  printWindow.loadURL("data:text/html;charset=UTF-8," + encodeURIComponent(html.replace("$STYLES$", css)))

  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, SAVE_PDF_DIALOG_OPT)
  if (canceled) return new Promise(resolve => resolve("canceled"))
  if (!css) return new Promise(resolve => resolve(false))
  try {
    const pdf = await printWindow.webContents.printToPDF({})
    printWindow.destroy()
    const error = await fs.writeFile(filePath, pdf)
    return !error
  } catch (err) {
    console.log(err)
    return false
  }
})

ipcMain.handle("dbHandler", async(_, action, data, table) => {
  function createMeasurementsTable() {
    try {
      const stmt = db.prepare(`CREATE TABLE IF NOT EXISTS ${table}(
        date TEXT NOT NULL,
        line TEXT NOT NULL,
        fleet TEXT NOT NULL,
        unit TEXT NOT NULL,
        data BLOB NOT NULL UNIQUE)`
      )
      stmt.run()
    } catch (err) {
      throw new Error(err)
    }
  }
  function executeAll(query) {
    try {
      const stmt = db.prepare(query)
      const data = stmt.all()
      db.close()
      return data
    } catch (error) {
      console.log(error)
      db.close()
      return false
    }
  }

  const db = new Database(getRelativePath("calipri.db"))

  switch (action) {
  case "add":
    let count = 0
    const maxTries = 1
    while (true) {
      try {
        const stmt = db.prepare(`INSERT INTO ${table} VALUES ($date, $line, $fleet, $unit, $data)`)
        stmt.run({
          date: data.date,
          line: data.line,
          fleet: data.fleet,
          unit: data.unit,
          data: data.data,
        })
        db.close()
        return true
      } catch (error) {
        console.log(error)
        if (error.message.includes("UNIQUE")) return "unique"
        if (count === maxTries) return false
        count++
        try {
          createMeasurementsTable()
        } catch (err) { 
          console.log(err)
          db.close()
          return false
        }
      } 
    }

  case "fetchLines":
    return executeAll(`SELECT DISTINCT line FROM ${table} ORDER BY line`)
  
  case "fetchUnitsByLine":
    return executeAll(`SELECT DISTINCT unit FROM ${table} WHERE line = '${data}' ORDER BY unit`)
  
  case "fetchDatesByUnitAndLine":
    return executeAll(`SELECT date FROM ${table} WHERE unit = '${data?.unit}' AND line = '${data?.line}' ORDER BY date`)
  
  case "fetchLastDate":
    try {
      const stmt = db.prepare(`SELECT date from ${table} WHERE unit = '${data?.unit}' AND line = '${data?.line}' AND fleet = '${data?.fleet}' ORDER BY rowid DESC`)
      const result = stmt.get()
      db.close()
      return result
    } catch (error) {
      console.log(error)
      db.close()
      return false
    }
  
  case "fetchData":
    return executeAll(`SELECT data FROM ${table} 
      WHERE unit = '${data?.unit}'
      AND line = '${data?.line}'
      ${data?.date ? `AND date = '${data?.date}'` : ""}`)

  case "update":
    try {
      const stmt = db.prepare(`UPDATE ${table} SET date = '${data.date}', line = '${data.line}', fleet = '${data.fleet}', unit = '${data.unit}' WHERE data = '${data.data}'`)
      stmt.run()
      db.close()
      return true
    } catch (error) {
      console.log(error)
      db.close()
      return false
    }
  default:
    console.error("wrong action")
    return false
  }
})

ipcMain.on("start-update", () => {
  autoUpdater.downloadUpdate()
})

ipcMain.on("close", () => {
  app.quit()
})

ipcMain.on("minimize", () => {
  mainWindow.minimize()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

autoUpdater.on("update-available", (info) => {
  console.log(info)
  mainWindow.webContents.send("update-available", info)
})

let updating = false
autoUpdater.on("error", (err) => {
  if (updating){
    updating = false
    dialog.showErrorBox("Error de actualización", err?.message)
  }
})

autoUpdater.on("download-progress", (progressObj) => {
  updating = true
  mainWindow.webContents.send("download-progress", progressObj.percent, updating)
})

autoUpdater.on("update-downloaded", async(info) => {
  const UPDATE_DIALOG_OPTIONS = {
    message: "Se descargó la actualización. ¿Desea salir y actualizar ahora?",
    type: "question",
    buttons: ["Salir y Actualizar", "Más Tarde"],
    defaultId: 0,
    title: "Actualización",
  }
  updating = false
  const { response } = await dialog.showMessageBox(mainWindow, UPDATE_DIALOG_OPTIONS)
  if (response === 0) autoUpdater.quitAndInstall()
  if (response === 1) mainWindow.webContents.send("update-downloaded", info)
})