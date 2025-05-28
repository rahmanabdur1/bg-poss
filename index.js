const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const todoRoutes = require('./routes/todoRoutes');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/todos', todoRoutes);

const port = process.env.PORT || 3000;
app.get('/', async (req, res) => {
  res.send('Pos portal server is running');
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
