const express = require('express');
const app = express();

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

app.listen(80, () => {
  console.log('Express listening on port 80');
});
