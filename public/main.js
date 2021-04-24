const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const fs = require("fs")
const fsp = require("fs").promises

const puppeteer = require("puppeteer")
const Database = require("better-sqlite3")


function getRelativePath(folder) {
  const homedir = require("os").homedir()
  return path.join(homedir, "OneDrive", "Documentos", "Calipri Parser Config", folder)
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

let mainWindow
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
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

  mainWindow.loadURL("http://localhost:3000/")
  // mainWindow.removeMenu()
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
  loading.once("show", () => {
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
  const dir = getRelativePath(folder)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  try {
    const err = await fsp.writeFile(path.join(dir, name), data)
    return !err
  } catch (error) {
    return false
  }
})

ipcMain.handle("load", async(_, name, folder) => {
  const dir = getRelativePath(folder)
  try {
    const data = await fsp.readFile(path.join(dir, name))
    return data
  } catch (error) {
    return false
  }
})

ipcMain.handle("delete", async(_, name, folder) => {
  const dir = getRelativePath(folder)
  try {  
    const err = await fsp.rm(path.join(dir, name))
    return !err
  } catch (error) {
    console.log(error)
    return false
  }
})

ipcMain.handle("getFiles", async(_, folder) => {
  const dir = getRelativePath(folder)
  try {
    const data = await fsp.readdir(dir)
    return data
  } catch (error) {
    fs.mkdirSync(dir, { recursive: true })
    return []
  }
})

ipcMain.handle("createPdf", async(_, html, name) => {
  const footer = await fsp.readFile(getRelativePath("templates/footer.html"), {encoding: "utf-8"})
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
            path: `${name}.pdf`,
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
          createMeasurementsTable(table).run()
        } catch (err) { 
          console.log(err)
          return false
        }
      } 
    }

  case "fetchLines":
    try {
      const stmt = db.prepare(`SELECT DISTINCT line FROM ${table} ORDER BY line`)
      const data = stmt.all()
      db.close()
      return data
    } catch (error) {
      console.log(error)
      return false
    }

  default:
    console.error("wrong action")
    return(false)
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
