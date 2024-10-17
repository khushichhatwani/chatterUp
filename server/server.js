// server/server.js
import express from "express"
import mongoose from "mongoose";
import http from "http"
import cors from "cors"
import { Message } from "./models/messages.schema.js";
import dotenv from "dotenv"
import { Server } from "socket.io";
dotenv.config()

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust accordingly
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatterup', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});
let onlineUsers = [];

io.on('connection', (socket) => {
    console.log('A user connected');


      // Send previous messages to the newly connected user
    Message.find().sort({ timestamp: 1 }).limit(50).then(previousMessages => {
        socket.emit('loadMessages', previousMessages)
    })

    // Handle user joining
  socket.on('join', (name) => {
        if (!name || name.trim() === "") {
        socket.emit('error', "Name is required to join the chat.");
        return;
    }
         socket.name = name; // Store the username in the socket
        onlineUsers.push({id:socket.id, name }); // Add user to online users
        console.log(`User joined: ${name}`); // Log the new user
        console.log("Current online users:", onlineUsers); // Log the online users list
        socket.broadcast.emit("notification", `${name} has joined the chat`);
                io.emit("onlineUser", onlineUsers); 

        io.emit("updateUserCount", onlineUsers.length); // Update user count
    });

    // Handle message sending
    socket.on('sendMessage', async (data) => {
        const message = new Message(data);
        await message.save();
        io.emit('receiveMessage', message);
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
          if (socket.userName) {
            onlineUsers = onlineUsers.filter(user => user !== socket.userName); // Remove user from online list
            socket.broadcast.emit('notification', `${socket.userName} has left the chat`);
            io.emit('updateUserCount', onlineUsers.length); // Update user count
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
