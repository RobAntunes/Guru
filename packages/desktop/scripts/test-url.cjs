#!/usr/bin/env node

const https = require('https');

const testUrl = 'https://huggingface.co/microsoft/Phi-4-mini-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/config.json';

console.log('Testing URL:', testUrl);

https.get(testUrl, { 
  headers: { 
    'User-Agent': 'Mozilla/5.0' 
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  if (res.statusCode === 301 || res.statusCode === 302) {
    console.log('Redirect to:', res.headers.location);
  }
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response length:', data.length);
    if (data.length < 1000) {
      console.log('Response:', data);
    }
  });
}).on('error', (e) => {
  console.error('Error:', e);
});