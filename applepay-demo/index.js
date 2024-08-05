/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/apple-pay-button-demo', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
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
  path.join(__dirname, 'certificates', 'your-certificate.crt.pem'),
  'utf8',
);
const privateKey = fs.readFileSync(
  path.join(__dirname, 'certificates', 'your-certificate.key.pem'),
  'utf8',
);

// Validate merchant
app.post('/validate-merchant', (req, res) => {
  const validationURL = new URL(req.body.validationURL);

  const data = JSON.stringify({
    merchantIdentifier: process.env.APPLE_PAY_MERCHANT_IDENTIFIER,
    displayName: 'Demo',
    initiative: 'web',
    initiativeContext: process.env.MERCHANT_DOMAIN_WITHOUT_PROTOCOL_OR_WWW,
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

  const httpsReq = https.request(options, (httpsRes) => {
    let responseData = '';

    httpsRes.on('data', (chunk) => {
      responseData += chunk;
    });

    httpsRes.on('end', () => {
      res.writeHead(httpsRes.statusCode, {
        'Content-Type': 'application/json',
      });
      res.end(responseData);
    });
  });

  httpsReq.on('error', (error) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error.message,
      }),
    );
  });

  httpsReq.write(data);

  httpsReq.end();
});

// Handle Apple Pay payment token
app.post('/process-payment', async (req, res) => {
  console.log('Payment token:', req.body.token);
  console.log('Billing contact:', req.body.billingContact);
  console.log('Shipping contact:', req.body.shippingContact);
  const body = req.body;

  // Process the payment with Payone here

  res.status(200).send({ success: true, body });
});

app.listen(80, () => {
  console.log('Express listening on port 80');
});
