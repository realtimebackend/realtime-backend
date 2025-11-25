const express = require('express');
const app = express();
const cors = require("cors")
const scanRoutes = require('./routes/scanRoutes');

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use('/api', scanRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
