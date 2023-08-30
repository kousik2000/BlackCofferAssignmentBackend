require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: 'https://black-coffer-assignment-backend.vercel.app/'
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_KEY, {
  useUnifiedTopology: true,
  useNewUrlParser: true
})
.then(() => {
  console.log('DB connected');
})
.catch(err => {
  console.log('DB connection error:', err);
});

// Define the Insight schema
const InsightSchema = new mongoose.Schema({
  impact: String,
  intensity: Number,
  sector: String,
  topic: String,
  insight: String,
  url: String,
  region: String,
  start_year: Number,
  end_year: Number,   
  added: Date,
  published: Date,
  country: String,
  relevance: Number,
  pestle: String,
  source: String,
  title: String,
  likelihood: Number,
});

const Insight = mongoose.model('Insight', InsightSchema);


app.post('/postdata', async (req, res) => {
  const dataToSave = req.body; // Array of objects

  try {
    const savedData = await Insight.create(dataToSave); // Save the array of objects
    return res.json(savedData);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: "An error occurred while saving data." });
  }
});


app.get('/getdata', async (req, res) => {
  try {
    const allData = await Insight.find();
    return res.json(allData);
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

app.delete('/deletedata/:id', async (req, res) => {
    const dataIdToDelete = req.params.id;

    try {
        const deletedData = await Insight.findByIdAndDelete(dataIdToDelete);
        if (!deletedData) {
            return res.status(404).json({ error: "Data not found." });
        }
        return res.json({ message: "Data deleted successfully." });
    } catch (err) {
        console.error("Error deleting data:", err);
        return res.status(500).json({ error: "An error occurred while deleting data." });
    }
});


app.get('/getIntensity', async (req, res) => {
    try {
        const { country, sector, topic } = req.query;

        const apiUrl = `http://localhost:9000/getdata?country=${country}&sector=${sector}&topic=${topic}`;

        const response = await axios.get(apiUrl);
        const intensityData = response.data;

        const chartData = {};

        intensityData.forEach(entry => {
            if (entry.country === country && entry.sector === sector && entry.topic === topic) {
                
                if (entry.start_year !== null && entry.end_year !== null) {
                    const label = `${entry.start_year}-${entry.end_year}`;
                    chartData[label] = entry.intensity;     
                } else if (entry.start_year === null) {
                    const label = `Unknown-${entry.end_year}`;
                    chartData[label] = entry.intensity; 
                } else if (entry.end_year === null) {
                    const label = `${entry.start_year}-Unknown`;
                    chartData[label] = entry.intensity; 
                } else if (entry.start_year === null && entry.end_year === null) {
                    const label = "Unknown";
                    chartData[label] = entry.intensity; 
                }
            }
        });

        if (Object.keys(chartData).length > 0) {
            res.json(chartData);
        } else {
            res.status(404).json({ error: 'No matching data found' });
        }
    } catch (error) {
        console.error('Error fetching intensity data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


  


app.listen(9000, () => {
  console.log('Server running on port 9000');
});
