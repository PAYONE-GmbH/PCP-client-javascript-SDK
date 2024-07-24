/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path');
var cors = require('cors');

// const allowedOrigins = ['https://192.168.0.152', 'https://192.168.0.152:5173'];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
// };

app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the Vite build output directory
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/apple-pay-button-demo', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get(
  '/.well-known/apple-developer-merchantid-domain-association.txt',
  (req, res) => {
    res.sendFile(
      __dirname +
        '/.well-known/apple-developer-merchantid-domain-association.txt',
    );
  },
);

// Paths to merchant identity certificate and private key
const certificate = fs.readFileSync(
  path.join(__dirname, 'certificates', 'PayOneApplePay.crt.pem'),
  'utf8',
);
const privateKey = fs.readFileSync(
  path.join(__dirname, 'certificates', 'PayOneApplePay.key.pem'),
  'utf8',
);

// Validate merchant
app.post('/validate-merchant', (req, res) => {
  const validationURL = new URL(req.body.validationURL);

  const data = JSON.stringify({
    merchantIdentifier: req.body.merchantIdentifier,
    displayName: 'Payone Demo',
    initiative: 'web',
    initiativeContext: 'payone-apple-pay-demo-server.nanogiants-services.de',
  });

  // Options for the validation request
  const options = {
    hostname: validationURL.hostname,
    port: 443,
    path: validationURL.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
    cert: certificate,
    key: privateKey,
  };

  // Create the HTTPS request
  const httpsReq = https.request(options, (httpsRes) => {
    let responseData = '';

    // Collect the response data
    httpsRes.on('data', (chunk) => {
      responseData += chunk;
    });

    // Handle the end of the response
    httpsRes.on('end', () => {
      res.writeHead(httpsRes.statusCode, {
        'Content-Type': 'application/json',
      });
      res.end(responseData);
    });
  });

  // Handle any errors with the request
  httpsReq.on('error', (error) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error.message,
      }),
    );
  });

  // Write the data to the request body
  httpsReq.write(data);

  // End the request
  httpsReq.end();
});

// Handle Apple Pay payment token
app.post('/process-payment', async (req, res) => {
  const token = req.body.token;
  const billingContact = req.body.billingContact;
  const shippingContact = req.body.shippingContact;

  // TODO: Process the payment with Payone

  res.status(200).send({ success: true });
});

app.listen(80, () => {
  console.log('Express listening on port 80');
});
