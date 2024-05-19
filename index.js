const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3030;

// Enable CORS for all requests
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL query parameter is required' });
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
  console.log(`Proxy server is running on port ${PORT}`);
});
