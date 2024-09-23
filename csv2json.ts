import { writeFileSync } from 'fs'
const csvToJson = require('convert-csv-to-json');

const fileInputName = `tixplus.csv`;
const fileOutputName = `tixplus.json`;

const json = csvToJson.fieldDelimiter(',').getJsonFromCsv(fileInputName);

writeFileSync(fileOutputName, JSON.stringify(json, null, 2))