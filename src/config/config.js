const conf = ({
    baseUrl: String(import.meta.env.VITE_BASE_URL || "http://localhost:8000/api"),
    socketUrl: String(import.meta.env.VITE_SOCKET_URL || "http://localhost:8000")
})
 
export default conf;
