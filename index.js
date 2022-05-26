const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const credentials = require('./private/credentials.json');
const async = require('hbs/lib/async');

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

app.get('/', async (req, res) => {
  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  const rows = await sheet.getRows();
  // Render the index page
  res.render('index', {rows});
});

app.post('/', async (req, res) => {

  const { Code, size, task, qty } = req.body;

  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  const rows = await sheet.getRows();
  // Check if all entries are valid
  if (Code === 'selected' || size === undefined || task === undefined || qty === '0') {
    return res.render('index', {
        rows,
        message: 'Please select all entities',
        color: 'danger'
    });
  }
  // Find the row with the code
  if (rows.length) {
    rows.forEach( async(item) => {
      if (item.Code === Code) {
        if (task === 'return' && size === 'Full') { item.Full = parseInt(item.Full) + parseInt(qty); }
        if (task === 'return' && size === 'Half') { item.Half = parseInt(item.Half) + parseInt(qty); }
        if (task === 'consume' && size === 'Full') { item.Full = parseInt(item.Full) - parseInt(qty); }
        if (task === 'consume' && size === 'Half') { item.Half = parseInt(item.Half) - parseInt(qty); }
        await item.save();
        return res.render('index', rows);
      }
    });
  } else {
    return res.render('index', {
      rows,
      message: 'Empty database',
      color: 'danger'
    });
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
  const rows = await sheet.getRows();

  return res.render('stock', {rows});
});

app.post('/stock/refresh', async (req, res) => {
    return res.redirect('/stock');
});

app.post('/stock/new', async (req, res) => {
  
  const { Code, Material, Price, size, qty } = req.body;

  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  const rows = await sheet.getRows();
  // Check if all entries are valid
  if (Code === '' || Material === '' || Price === undefined || size === undefined || qty === undefined) {
    return res.render('stock', {
        rows,
        message: 'Please select correct entities and quantity',
        color: 'danger'
    });
  }
  // Append rows
  try {
    if (size === 'Full') {
      await sheet.addRow({Code, Material, Price, Full: qty, Half: 0});
    } else {
      await sheet.addRow({Code, Material, Price, Full: 0, Half: qty});
    }
  } catch (error) {
    return res.render('stock', {
      rows,
      message: 'Error while adding new row',
      color: 'danger'
    });
  } finally{
    return res.render('stock', {
      rows,
      message: 'New row added',
      color: 'success'
    });
  }

});

app.post('/stock/add', async (req, res) => {

  const { Code, size, qty } = req.body;

  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  const rows = await sheet.getRows();
  // Check if all entries are valid
  if (Code === 'selected' || size === undefined) {
    return res.render('stock', {
        rows,
        message: 'Please select correct entities and quantity',
        color: 'danger'
    });
  }
    // Find the row with the code
    if (rows.length) {
      rows.forEach( async(item) => {
        if (item.Code === Code) {
          if (size === 'Full') { item.Full = parseInt(item.Full) + parseInt(qty); }
          if (size === 'Half') { item.Half = parseInt(item.Half) + parseInt(qty); }
          await item.save();
          return res.render('stock', {
            message: 'Stock Replenished',
            color: 'success'
          });
        }
      });
    } else {
      return res.render('stock', {
        rows,
        message: 'Empty database',
        color: 'danger'
      });
    }
});

app.post('/stock/edit', async (req, res) => {

  const { Code, size, qty } = req.body;
  console.log(req.body);
  // Initialize the spreadsheet
  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
  // Authenticate with the Google Spreadsheet
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  // Get the first sheet
  const sheet = doc.sheetsByTitle[process.env.SHEET_NAME];
  // Get all the rows
  const rows = await sheet.getRows();
  // Check if all entries are valid
  if (Code === 'selected' || Code === '' || size === undefined) {
    return res.render('stock', {
        rows,
        message: 'Please select correct entities and quantity',
        color: 'danger'
    });
  }
    // Find the row with the code
    if (rows.length) {
      rows.forEach( async(item) => {
        if (item.Code === Code) {
          if (size === 'Full') { item.Full = parseInt(qty); }
          if (size === 'Half') { item.Half = parseInt(qty); }
          await item.save();
          return res.render('stock', {
            rows,
            message: 'Stock Changed',
            color: 'success'
          });
        }
      });
    } else {
      return res.render('stock', {
        rows,
        message: 'Empty database',
        color: 'danger'
      });
    }
});

app.listen(port, ip, () => {
  console.log(`listening on http://127.0.0.1:${port}`);
});