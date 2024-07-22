const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path');
var cors = require('cors');

const allowedOrigins = ['https://192.168.0.152', 'https://192.168.0.152:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(bodyParser.json());

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

const data = JSON.stringify({
  merchantIdentifier: 'merchant.de.nanogiants.payonedemo',
  domainName: 'https://payone-apple-pay-demo-server.nanogiants-services.de',
  displayName: 'PayOne Apple Pay Demo Server',
});

// Validate merchant
app.post('/validate-merchant', (req, res) => {
  const validationURL = new URL(req.body.validationURL);

  // Options for the validation request
  const options = {
    hostname: validationURL.hostname,
    port: 443,
    path: validationURL.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': data.length,
    },
    cert: certificate,
    key: privateKey,
  };

  const validationRequest = https.request(options, (validationResponse) => {
    let responseData = '';
    validationResponse.on('data', (chunk) => {
      responseData += chunk;
    });

    validationResponse.on('end', () => {
      res.status(200).send(responseData);
    });
  });

  validationRequest.on('error', (error) => {
    console.log('Error:', error.message);
    res.status(500).send({ error: error.message });
  });

  validationRequest.write(data);

  validationRequest.end();
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
