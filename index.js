const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

const app = express();

// Load env variables
dotenv.config({ path: './.env' });
const port = process.env.port || 8080;
const ip = process.env.ip || '0.0.0.0';

const publicPath = path.join(__dirname, './public');
app.use(express.static(publicPath));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'hbs');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/', (req, res) => {
    const { material, size, qty } = req.body;

    if (material !== undefined && size !== undefined && qty !== undefined) {
        res.render('index', {
            material: material,
            size: size,
            qty: qty
        });
    } else {
        res.render('index');
    }
});

app.listen(port, ip, () => {
  console.log(`listening on http://127.0.0.1:${port}`);
});