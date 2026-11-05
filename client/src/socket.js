import { io } from "socket.io-client";

const socket = io(
  import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, ""),
  {
    autoConnect: false,
    auth: (callback) => {
      callback({
        token: localStorage.getItem("token")
      });
    }
  }
);

export default socket;