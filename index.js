const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const credentials = require('./private/credentials.json');

const app = express();

// Load env variables
dotenv.config({ path: './.env' });
const port = process.env.port || 8080;
const ip = process.env.ip || '0.0.0.0';

const publicPath = path.join(__dirname, './public');
app.use(express.static(publicPath));
app.use( (req, res, next) => {
  if (req.originalUrl && req.originalUrl.split("/").pop() === 'favicon.ico') {
    return res.sendStatus(204);
  }
  return next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'hbs');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/', async (req, res) => {

  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  await sheet.loadCells('A2:B2');
  console.log(sheet.cellStats);


  const { material, size, task, qty } = req.body;
  console.log(req.body);

  if (material === undefined || size === undefined || task === undefined || qty === '0') {
    return res.render('index', {
        message: 'Please select all entities',
        color: 'danger'
    });
  } else {
    try {
      let A2 = Number(sheet.getCellByA1('A2').value);
      A2 += Number(qty);
      sheet.getCellByA1('A2').value = A2;
      await sheet.saveUpdatedCells();
    }
    catch {
      
    } finally {
      return res.render('index');
    }

  }
});

app.listen(port, ip, () => {
  console.log(`listening on http://127.0.0.1:${port}`);
});