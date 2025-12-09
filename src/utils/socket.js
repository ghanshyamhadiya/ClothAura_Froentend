import { io } from 'socket.io-client';
import conf from '../config/config';

class SocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.authenticated = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.eventListeners = new Map();
        this.pendingListeners = new Map(); // Store listeners until socket is ready
        this.initPromise = null; // Promise to track initialization
        
        // Make available globally for auth service
        window.socketManager = this;
    }

    // Initialize socket connection - should be called once during app startup
    async initialize(token = null) {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            try {
                this.connect(token);
                
                // Wait for connection or connection error
                const timeout = setTimeout(() => {
                    reject(new Error('Socket connection timeout'));
                }, 10000);

                const onConnect = () => {
                    clearTimeout(timeout);
                    this.socket.off('connect', onConnect);
                    this.socket.off('connect_error', onError);
                    this.setupPendingListeners(); // Setup any pending listeners
                    resolve(this.socket);
                };

                const onError = (error) => {
                    clearTimeout(timeout);
                    this.socket.off('connect', onConnect);
                    this.socket.off('connect_error', onError);
                    reject(error);
                };

                if (this.socket) {
                    this.socket.on('connect', onConnect);
                    this.socket.on('connect_error', onError);
                    
                    // If already connected, resolve immediately
                    if (this.connected) {
                        onConnect();
                    }
                }
            } catch (error) {
                reject(error);
            }
        });

        return this.initPromise;
    }

    connect(token = null) {
        if (this.socket && this.connected) {
            console.log('Socket already connected');
            return this.socket;
        }

        console.log('Connecting to socket server...');

        const socketOptions = {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            auth: {}
        };

        // ✅ Always attach token if present
        const storedToken = token || localStorage.getItem("accessToken");
        if (storedToken) {
            socketOptions.auth = { token: storedToken };
        }

        this.socket = io(conf.socketUrl || conf.baseUrl, socketOptions);
        this.setupEventHandlers();

        return this.socket;
    }

    setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✓ Socket connected:', this.socket.id);
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Setup any pending listeners
            this.setupPendingListeners();
            
            // Authenticate if we have a token
            const token = localStorage.getItem('accessToken');
            if (token) {
                this.authenticate(token);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.connected = false;
            this.authenticated = false;
            
            // Emit custom event for auth context
            this.emitAuthEvent('disconnect', { reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.emitAuthEvent('connectionFailed', { error: 'Unable to establish connection' });
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('✓ Socket reconnected after', attemptNumber, 'attempts');
            this.reconnectAttempts = 0;
            
            // Re-setup listeners and authenticate
            this.setupPendingListeners();
            
            const token = localStorage.getItem('accessToken');
            if (token) {
                this.authenticate(token);
            }
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Reconnection failed:', error);
        });

        // Handle authentication responses
        this.socket.on('auth:success', (data) => {
            console.log('✓ Socket authentication successful');
            this.authenticated = true;
            this.emitAuthEvent('authenticated', data);
        });

        this.socket.on('auth:error', (error) => {
            console.error('❌ Socket authentication failed:', error);
            this.authenticated = false;
            this.emitAuthEvent('authError', error);
        });

        // Handle server-side logout
        this.socket.on('auth:logout', () => {
            console.log('Server initiated logout');
            this.authenticated = false;
            localStorage.removeItem('accessToken');
            this.emitAuthEvent('serverLogout');
        });

        // Handle token refresh requirement
        this.socket.on('auth:refreshRequired', () => {
            console.log('Server requesting token refresh');
            this.emitAuthEvent('refreshRequired');
        });
    }

    // Setup pending listeners when socket becomes available
    setupPendingListeners() {
        if (!this.socket || !this.connected) return;

        this.pendingListeners.forEach((callbacks, eventName) => {
            callbacks.forEach(callback => {
                this.socket.on(eventName, callback);
                
                // Store for cleanup
                if (!this.eventListeners.has(eventName)) {
                    this.eventListeners.set(eventName, []);
                }
                this.eventListeners.get(eventName).push(callback);
            });
        });
        
        // Clear pending listeners
        this.pendingListeners.clear();
    }

    authenticate(token) {
        if (!this.socket || !this.connected) {
            console.warn('Cannot authenticate: socket not connected');
            return false;
        }

        console.log('Authenticating socket connection...');
        this.socket.emit('auth:authenticate', { token });
        return true;
    }

    disconnect() {
        if (this.socket) {
            console.log('Disconnecting socket...');
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.authenticated = false;
            this.initPromise = null; // Reset initialization promise
        }
    }

    // Emit custom events for auth context
    emitAuthEvent(eventType, data = {}) {
        const event = new CustomEvent(`socket:${eventType}`, { detail: data });
        window.dispatchEvent(event);
    }

    // Subscribe to socket events with automatic queuing
    on(eventName, callback) {
        // If socket is ready, add listener immediately
        if (this.socket && this.connected) {
            this.socket.on(eventName, callback);
            
            // Store for cleanup
            if (!this.eventListeners.has(eventName)) {
                this.eventListeners.set(eventName, []);
            }
            this.eventListeners.get(eventName).push(callback);
        } else {
            // Queue the listener for when socket is ready
            console.log(`Queuing listener for event: ${eventName}`);
            if (!this.pendingListeners.has(eventName)) {
                this.pendingListeners.set(eventName, []);
            }
            this.pendingListeners.get(eventName).push(callback);
        }
    }

    // Unsubscribe from socket events
    off(eventName, callback) {
        // Remove from active listeners
        if (this.socket) {
            this.socket.off(eventName, callback);
        }
        
        // Remove from stored listeners
        if (this.eventListeners.has(eventName)) {
            const listeners = this.eventListeners.get(eventName);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
        
        // Remove from pending listeners
        if (this.pendingListeners.has(eventName)) {
            const listeners = this.pendingListeners.get(eventName);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    // Emit events to server
    emit(eventName, data) {
        if (!this.socket || !this.connected) {
            console.warn(`Cannot emit event ${eventName}: socket not connected`);
            return false;
        }

        this.socket.emit(eventName, data);
        return true;
    }

    // Join a room (useful for user-specific notifications)
    joinRoom(roomName) {
        if (this.authenticated) {
            this.emit('join:room', { room: roomName });
        }
    }

    // Leave a room
    leaveRoom(roomName) {
        if (this.authenticated) {
            this.emit('leave:room', { room: roomName });
        }
    }

    // Get connection status
    getStatus() {
        return {
            connected: this.connected,
            authenticated: this.authenticated,
            socketId: this.socket?.id || null,
            reconnectAttempts: this.reconnectAttempts,
            hasPendingListeners: this.pendingListeners.size > 0
        };
    }

    // Wait for socket to be ready
    async waitForConnection(timeout = 5000) {
        if (this.connected) {
            return Promise.resolve();
        }

        if (this.initPromise) {
            try {
                await this.initPromise;
                return;
            } catch (error) {
                throw error;
            }
        }

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Socket connection timeout'));
            }, timeout);

            const checkConnection = () => {
                if (this.connected) {
                    clearTimeout(timeoutId);
                    resolve();
                } else {
                    setTimeout(checkConnection, 100);
                }
            };

            checkConnection();
        });
    }

    // Cleanup method
    cleanup() {
        // Remove all custom listeners
        this.eventListeners.forEach((callbacks, eventName) => {
            callbacks.forEach(callback => {
                if (this.socket) {
                    this.socket.off(eventName, callback);
                }
            });
        });
        
        this.eventListeners.clear();
        this.pendingListeners.clear();
        this.disconnect();
        
        // Remove global reference
        if (window.socketManager === this) {
            delete window.socketManager;
        }
    }
}

// Create and export singleton instance
const socketManager = new SocketManager();
export default socketManager;