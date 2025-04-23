const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Message = require('./models/Message');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth Routes
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.status(201).json({ token, userId: user._id, username });
  } catch (error) {
    res.status(500).json({ error: 'Error signing up' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, userId: user._id, username });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log('User connected:', socket.userId);
  
  // Send previous messages on connection
  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('userId', 'username')
      .lean();
    
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      userId: msg.userId._id,
      username: msg.userId.username,
      text: msg.text,
      timestamp: msg.timestamp
    }));
    
    socket.emit('previousMessages', formattedMessages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
  }

  socket.on('message', async (data) => {
    try {
      const user = await User.findById(socket.userId);
      const newMessage = new Message({
        userId: socket.userId,
        text: data.text
      });
      await newMessage.save();

      const messageData = {
        id: newMessage._id,
        userId: socket.userId,
        username: user.username,
        text: data.text,
        timestamp: newMessage.timestamp
      };
      
      io.emit('message', messageData);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});