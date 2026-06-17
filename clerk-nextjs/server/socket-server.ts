import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Message from "../models/Message";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Socket server connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("send-message", async (data) => {
    try {
      // Persist message to MongoDB
      const newMessage = await Message.create({
        roomId: data.roomId,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.message,
      });

      // Broadcast message including its created timestamp
      io.to(data.roomId).emit("receive-message", {
        _id: newMessage._id.toString(),
        roomId: data.roomId,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.message,
        createdAt: newMessage.createdAt,
      });
    } catch (err: any) {
      console.error("Error saving/sending message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});

const PORT = 3005;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO Server listening on port ${PORT}`);
});
