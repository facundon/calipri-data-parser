const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const path = require("path")
const fs = require("fs-extra")

const puppeteer = require("puppeteer")
const Database = require("better-sqlite3")

const isDev = true

const SOURCE_CONFIG_PATH = path.join(__dirname, "config")
const HOMEDIR = require("os").homedir()
let configPath = path.join(HOMEDIR, "Calipri Parser Config")

async function getFilePath() {
  try {
    configPath = await fs.readFile(path.join(__dirname, "config", "config_path.txt"), {encoding: "utf-8"})
  } catch (error) {
    await fs.writeFile(path.join(__dirname, "config", "config_path.txt"), configPath)
  }
}

function getRelativePath(folder) {
  return path.join(configPath, folder)
}

function createMeasurementsTable(table) {
  return db.prepare(`CREATE TABLE IF NOT EXISTS ${table}(
    date TEXT NOT NULL,
    line TEXT NOT NULL,
    fleet TEXT NOT NULL,
    unit TEXT NOT NULL,
    data BLOB NOT NULL UNIQUE)`
  )
}

async function selectOrCreateConfigFolder() {
  try {
    await fs.readdir(configPath)
    return
  } catch (error) {
    const { response } = await dialog.showMessageBox(mainWindow, FILEPATH_WARN_DIALOG_OPT)

    switch (response) {
    case 0:  //seleccionar ubicacion
      const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, PATH_SELECT_DIALOG_OPTION)
      if (canceled) throw new Error("Por favor vuelva a abrir el programa y elija una opción")
      configPath = filePaths[0]
      try {
        await fs.writeFile(path.join(__dirname, "config", "config_path.txt"), configPath)
        return
      } catch (error) {
        console.log(error)
        throw new Error("Error al crear archivo de configuración")
      }

    case 1:  //crear directorio
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
  }
}

const SAVE_PDF_DIALOG_OPT = {
  title: "Guardar Reporte",
  buttonLabel: "Guardar",
  filters: [{name: "Reporte", extensions: ["pdf"]}]
}
const FILEPATH_WARN_DIALOG_OPT = {
  message: `No se encontraron archivos de configuración.
Puede elegír la ubicación de la carpeta donde se encuentran dichos archivos, o puede dejar que creemos una por usted en ${configPath}`,
  type: "warning",
  buttons: ["Elegir Ubicación", "Crear"],
  defaultId: 0,
  title: "No se encontro configuración",
}
const PATH_SELECT_DIALOG_OPTION = {
  title: "Seleccionar Carpeta",
  defaultPath: configPath,
  buttonLabel: "Seleccionar",
  properties: ["openDirectory"]
}

let mainWindow

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 1000,
    center: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    }
  })

  mainWindow.loadURL(isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`)
  // mainWindow.removeMenu()
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
    await getFilePath()
    try {
      await selectOrCreateConfigFolder()
    } catch (err) {
      dialog.showErrorBox("Error de Configuración", err.message)
      app.exit(1)
    }
    createMainWindow()
    mainWindow.webContents.once("dom-ready", () => {
      mainWindow.show()
      loading.hide()
      loading.close()
    })
  })
  loading.loadFile(path.join(__dirname, "loading.html"))
  loading.show()
})


ipcMain.handle("save", async(_, name, data, folder) => {
  let dir = getRelativePath(folder)
  try {
    const err = await fs.writeFile(path.join(dir, name), data)
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
    if (canceled) return false
    dir = path.join(filePaths[0], folder)
    fs.mkdirSync(dir, { recursive: true })
    let index = 0
    for (const name of names) {
      await fs.writeFile(path.join(dir, name), data[index])
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
  SAVE_PDF_DIALOG_OPT["defaultPath"] = name
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, SAVE_PDF_DIALOG_OPT)
  if (canceled) return "canceled"
  const footer = await fs.readFile(getRelativePath("templates/footer.html"), {encoding: "utf-8"})
  if (!footer) return(new Promise(resolve => resolve(false)))
  return(
    new Promise(resolve => {
      puppeteer.launch().then(async browser => {
        let page = await browser.newPage()
        try {
          await page.setContent(html, { waitUntil: ["networkidle2"] })
          await page.addStyleTag({path: getRelativePath("templates/report.css")})
          await page.evaluateHandle("document.fonts.ready")
          await page.pdf({
            path: filePath,
            format: "A4",
            preferCSSPageSize: true,
            displayHeaderFooter: true,
            footerTemplate: footer,
          })
          browser.close()
          resolve(true)
        } catch (error) {
          console.log(error)
          resolve(false)
        }
      })
    })
  )
})

ipcMain.handle("dbHandler", async(_, action, data, table) => {
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
        db.close()
        if (error.message.includes("UNIQUE")) return "unique"
        if (count === maxTries) return false
        count++
        try {
          createMeasurementsTable(table).run()
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
