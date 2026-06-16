const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const NIM_API_BASE =
  process.env.NIM_API_BASE ||
  'https://integrate.api.nvidia.com/v1';

const NIM_API_KEY =
  process.env.NIM_API_KEY;

// Home
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NVIDIA NIM Proxy'
  });
});

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

// OpenAI-compatible models endpoint
app.get('/v1/models', async (req, res) => {
  try {
    const response = await axios.get(
      `${NIM_API_BASE}/models`,
      {
        headers: {
          Authorization: `Bearer ${NIM_API_KEY}`
        }
      }
    );

    const models =
      response.data.data?.map(model => ({
        id: model.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'nvidia'
      })) || [];

    res.json({
      object: 'list',
      data: models
    });

  } catch (error) {
    res.status(500).json({
      error: {
        message:
          error.response?.data ||
          error.message
      }
    });
  }
});

// Shared chat handler
async function handleChat(req, res) {
  try {
    const {
      model,
      messages,
      temperature,
      max_tokens,
      stream
    } = req.body;

    const nimRequest = {
      model:
        model ||
        'minimaxai/minimax-m3',
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 4096,
      stream: stream ?? false
    };

    const response = await axios.post(
      `${NIM_API_BASE}/chat/completions`,
      nimRequest,
      {
        headers: {
          Authorization: `Bearer ${NIM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);

  } catch (error) {

  console.error(
    'STATUS:',
    error.response?.status
  );

  console.error(
    'DATA:',
    JSON.stringify(
      error.response?.data,
      null,
      2
    )
  );

  res.status(
    error.response?.status || 500
  ).json(

// OpenAI endpoint
app.post('/v1/chat/completions', handleChat);

// JanitorAI fallback
app.post('/', handleChat);

// 404
app.all('*', (req, res) => {
  res.status(404).json({
    error: {
      message: `Endpoint ${req.path} not found`,
      code: 404
    }
  });
});

app.listen(PORT, () => {
  console.log(
    `Proxy running on port ${PORT}`
  );
});
