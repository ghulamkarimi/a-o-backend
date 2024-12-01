import { Server } from "socket.io"; 

const initializeSocket = (server) => {
    console.log('🚀 Initialisiere WebSocket-Server...');  

    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:3000", "http://localhost:5173"],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('✅ WebSocket-Verbindung hergestellt mit:', socket.id);
        socket.on('customEvent', (data) => {
            console.log('📨 Nachricht "customEvent" vom Client empfangen:', data);
            socket.emit('serverResponse', { message: 'Nachricht erfolgreich empfangen' });
        });
        socket.on('disconnect', () => {
            console.log('❌ WebSocket-Verbindung getrennt von:', socket.id);
        });
    });
    return io;
};

export default initializeSocket;
