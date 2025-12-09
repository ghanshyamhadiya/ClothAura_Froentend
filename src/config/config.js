const conf = ({
    baseUrl: String(import.meta.env.VITE_BASEURL),
    socketUrl: String(import.meta.env.VITE_SOCKETURL) || 'http://localhost:8000'
})
 
export default conf;