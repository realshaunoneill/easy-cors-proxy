const express = require('express');
const axios = require('axios');
const cors = require('cors');

const WHITELISTED_URLS = process.env.WHITELISTED_URLS?.split(',').filter(url => url.length > 0).map(url => url.trim());

if (!WHITELISTED_URLS || WHITELISTED_URLS.length === 0) {
  console.log('No whitelisted URLs are provided. All URLs will be proxied.');
} else {
  console.log('Whitelisted URLs:', WHITELISTED_URLS);
  console.log('All other URLs will be blocked.');
}

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all requests
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/status', (req, res) => {
  res.json({ status: 'OK' });
});

app.all('*', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL query parameter is required' });
  }

  if (WHITELISTED_URLS && WHITELISTED_URLS.length > 0 && !WHITELISTED_URLS.some(url => targetUrl.startsWith(url))) {
    return res.status(403).json({ error: 'URL is not whitelisted', whitelist: WHITELISTED_URLS, targetUrl});
  }

  console.log('Fetching target URL:', targetUrl);

  try {
    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: { ...req.headers, host: new URL(targetUrl).host },
      data: req.body
    };

    const response = await axios(axiosConfig);

    console.log('Response from target URL:', response.status);

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching target URL:', error.message);
    if (error.response) {
      res.status(error.response.status).set(error.response.headers).send(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to fetch the target URL' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on port - ${PORT}`);
});
