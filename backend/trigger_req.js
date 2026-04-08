const http = require('http');

const data = JSON.stringify({
  prompt: "5 hacks de produtividade no VS Code",
  numSlides: 5,
  imageMode: 'none'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/generate/carousel',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let responseBody = '';
  res.on('data', (d) => {
    responseBody += d;
  });
  res.on('end', () => {
    console.log('Response:', responseBody);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
