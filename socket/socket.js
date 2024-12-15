import { Server } from "socket.io"; 

const initializeSocket = (server) => {
    const io = new Server(server, {
      cors: {
        // origin: ["http://localhost:3000", "http://localhost:5173", "https://ghulam-dev.me"],
        origin: ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
      },
    });
  
    io.on("connection", (socket) => {
      console.log("WebSocket verbunden:", socket.id);
  
      socket.on("disconnect", () => {
        console.log("WebSocket getrennt:", socket.id);
      });
    });
  
    return io;
  };
  

export default initializeSocket;
