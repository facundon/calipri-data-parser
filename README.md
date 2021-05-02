# Calipri Data Parser

A parser for CSV files emited by the wheel laser meter [Calipri](https://www.nextsense-worldwide.com/en/industries/railway.html). Once parsed, the app emits a report in pdf format with all the values evaluated against the corresponding profile configuration.

This project is used in [Buenos Aires Subway](https://www.metrovias.com.ar/) by the QC department.

## Features

- Built with Electron, React, Typescript and Sass
- Application Auto Update 

### `Profiles Panel`
- Posibility to add or remove wheel profiles
- Repair specification tag for each profile
- Loaded data for each profile depends on the profile of each fleet
- The fleets profiles can be assigned from the Fleet Panel

### `Fleet Panel`
- Posibility to add or remove fleets
- Asigment of profiles only declared in the Profile Panel
- Assigment of a reference to identify trailer cars

### `Terminals Panel`
- Posibility to add or remove lines
- Assigment of both terminals for each line
- Posibility to change color of existing lines

### `Export`
Posibility to export, one or more, already emited reports back to csv for other uses (for ex. data analysis). The exported csv file only has redundant data

### `Configuration`
The default configuration file schema is:
- **templates**
  - **report.html** -> *the report template with placeholders*
  - **report.css** -> *the report styling*
  - **unit_schema.html** -> *a html drawed car to insert in the report*
  - **footer.html** -> *footer of each pdf page*
- **profiles** -> *one file per profile that holds the repair especification data*
  - **ore.json** 
  - **cde.json**
  - **lb.json**
- **lines.json** -> *holds all the lines with its respective terminals and line color*
- **fleets.json** -> *holds all the fleets with its respective profiles and references*
- **ers.json** -> *holds the specification tags*
- **calipri.db** -> *historical data from all emited reports*

from the options, the user can:
- Posibility to select a folder from where the configuration is loaded
- Posibility to overwrite existing configuration to default.

There is one more file (config_path.txt), saved in appData folder, that contains the path to the configuration folder.
If the folder doesn't exists, the app asks wether to **chose the path** to the configuration folder or to **create** the folder with the default configuration in `/Documents/Calipri Parser Config`
