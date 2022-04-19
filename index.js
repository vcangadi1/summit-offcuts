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
  await sheet.loadCells('B2:C3');

  const { material, size, task, qty } = req.body;
  console.log(req.body);

  if (material === undefined || size === undefined || task === undefined || qty === '0') {
    return res.render('index', {
        message: 'Please select all entities',
        color: 'danger'
    });
  } else {
    try {
      if (material === 'aluminium') {
        if (size === 'full') {
          if (task === 'return') {
            sheet.getCellByA1('B2').value = parseInt(sheet.getCellByA1('B2').value) + parseInt(qty);
          } else if (task === 'consume') {
            sheet.getCellByA1('B2').value = parseInt(sheet.getCellByA1('B2').value) - parseInt(qty);
          }
        } else if (size === 'half') {
          if (task === 'return') {
            sheet.getCellByA1('C2').value = parseInt(sheet.getCellByA1('C2').value) + parseInt(qty);
          } else if (task === 'consume') {
            sheet.getCellByA1('C2').value = parseInt(sheet.getCellByA1('C2').value) - parseInt(qty);
          }
        }
      } else if (material === 'wood') {
        if (size === 'full') {
          if (task === 'return') {
            sheet.getCellByA1('B3').value = parseInt(sheet.getCellByA1('B3').value) + parseInt(qty);
          } else if (task === 'consume') {
            sheet.getCellByA1('B3').value = parseInt(sheet.getCellByA1('B3').value) - parseInt(qty);
          }
        } else if (size === 'half') {
          if (task === 'return') {
            sheet.getCellByA1('C3').value = parseInt(sheet.getCellByA1('C3').value) + parseInt(qty);
          } else if (task === 'consume') {
            sheet.getCellByA1('C3').value = parseInt(sheet.getCellByA1('C3').value) - parseInt(qty);
          }
        }
      }
      // Save the changes
      await sheet.saveUpdatedCells();
    }
    catch {} 
    finally {
      return res.render('index');
    }

  }
});


app.get('/stock', async (req, res) => {
  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  await sheet.loadCells('B2:C3');

  // const stock = {
  //   aluminium: {
  //     full: sheet.getCellByA1('B2').value,
  //     half: sheet.getCellByA1('C2').value
  //   },
  //   wood: {
  //     full: sheet.getCellByA1('B3').value,
  //     half: sheet.getCellByA1('C3').value
  //   }
  // };

  return res.render('stock');
});

app.post('/stock/add', async (req, res) => {
  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  await sheet.loadCells('B2:C3');

  const { material, qty } = req.body;

  // Add the new stock
  if (material === 'aluminium') {
    sheet.getCellByA1('B2').value = parseInt(sheet.getCellByA1('B2').value) + parseInt(qty);
  } else if (material === 'wood') {
    sheet.getCellByA1('B3').value = parseInt(sheet.getCellByA1('B3').value) + parseInt(qty);
  } else {
    return res.render('stock', {
      message: 'Please select a material',
      color: 'danger'
    });
  }

  try {
    // Save the changes
    await sheet.saveUpdatedCells();
  } 
  catch {}
  finally {
    return res.render('stock', {
      message: `New ${material} stock added`,
      color: 'success'
    });
  }
});

app.post('/stock/edit', async (req, res) => {
  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  await sheet.loadCells('B2:C3');
  
  const { material, qty } = req.body;

  // Edit the new stock
  if (material === 'aluminium') {
    sheet.getCellByA1('B2').value = parseInt(qty);
  } else if (material === 'wood') {
    sheet.getCellByA1('B3').value = parseInt(qty);
  } else {
    return res.render('stock', {
      message: 'Please select a material',
      color: 'danger'
    });
  }

  try {
    // Save the changes
    await sheet.saveUpdatedCells();
  } 
  catch {}
  finally {
    return res.render('stock', {
      message: `Overwrite: ${material} stock edited`,
      color: 'danger'
    });
  }
  
});

app.listen(port, ip, () => {
  console.log(`listening on http://127.0.0.1:${port}`);
});