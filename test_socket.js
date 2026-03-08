import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { transports: ['websocket'] });

socket.on("connect", () => {
    console.log("Connected with id", socket.id);
    socket.emit("createRoom", { playerName: "TestHost", teamChoice: "CSK" });
});

socket.on("roomCreated", (data) => {
    console.log("Room Created Successfully:", data);
    process.exit(0);
});

socket.on("error", (err) => {
    console.error("Error from server:", err);
    process.exit(1);
});

setTimeout(() => {
    console.log("Timeout");
    process.exit(1);
}, 3000);
