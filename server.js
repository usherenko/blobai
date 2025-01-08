import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';

// Set up the server and API key
const app = express();
const API_KEY = 'msy_W4FJFnTkXyiSoXPs0GO2Udg2HUJBW84HHUna'; // Replace with your actual API key
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Allow cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Function to send request to Meshy.ai for model generation
async function generateModel(prompt) {
  try {
    const response = await axios.post(
      'https://api.meshy.ai/openapi/v2/text-to-3d',
      {
        mode: 'preview',
        prompt: prompt,
        art_style: 'realistic',
        should_remesh: true
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const taskId = response.data.result;
    console.log('Meshy.ai response:', response.data);

    return taskId;
  } catch (error) {
    console.error('Error generating 3D model from Meshy.ai:', error);
    throw new Error('Error generating model');
  }
}

// Function to check the status of the model
async function checkModelStatus(taskId) {
  try {
    const response = await axios.get(
      `https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        }
      }
    );

    const status = response.data.status;
    console.log(`Current status: ${status}`);
    
    if (status === 'FINISHED' || status === 'SUCCEEDED') {
      // Model is ready, return the model URL
      console.log('Model is ready!');
      if (response.data.model_urls && response.data.model_urls.glb) {
        return response.data.model_urls.glb; // Return the model URL (e.g., GLB file)
      } else {
        console.error('Model URL not found in the response.');
        return null;
      }
    } else if (status === 'ERROR') {
      // Handle error
      console.error('Error occurred during model generation:', response.data.task_error);
      return null;
    }

    // If the model is still processing, wait and check again
    console.log('Model is still processing. Waiting for completion...');
    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve(await checkModelStatus(taskId)); // Recursively check again
      }, 5000); // Check again in 5 seconds
    });

  } catch (error) {
    console.error('Error checking model status:', error);
    return null;
  }
}

// API endpoint to handle chat messages
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Received message:', message);

    // Generate model from the received message
    const taskId = await generateModel(message);

    // Check the status of the generated model
    const modelUrl = await checkModelStatus(taskId);

    if (modelUrl) {
      res.json({ modelUrl });
    } else {
      res.status(500).json({ error: 'Unable to retrieve model URL from Meshy.ai' });
    }

  } catch (error) {
    console.error('Error during the /api/chat request:', error);
    res.status(500).json({ error: 'Error during model generation or retrieval' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
