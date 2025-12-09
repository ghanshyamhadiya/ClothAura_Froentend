import React, { createContext, useContext, useEffect, useState } from 'react';
import Loading from '../components/Loading';
import socketManager from '../utils/socket';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socketInitialized, setSocketInitialized] = useState(false);
    const [socketError, setSocketError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [initializationAttempted, setInitializationAttempted] = useState(false);

    useEffect(() => {
        const initializeSocket = async () => {
            if (initializationAttempted) return;
            setInitializationAttempted(true);

            try {
                // Get token from localStorage if available
                const token = localStorage.getItem('accessToken');
                
                console.log('🔌 Initializing socket connection...');
                
                // Initialize socket connection
                await socketManager.initialize(token);
                
                console.log('✅ Socket initialized successfully');
                setSocketInitialized(true);
                setSocketError(null);
            } catch (error) {
                console.error('❌ Failed to initialize socket:', error);
                setSocketError(error.message);
                setSocketInitialized(true); // Still set to true to render app
            }
        };

        // Socket event listeners for status updates
        const handleConnect = () => {
            console.log('🟢 Socket connected');
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            console.log('🔴 Socket disconnected');
            setIsConnected(false);
            setIsAuthenticated(false);
        };

        const handleAuthenticated = () => {
            console.log('🔐 Socket authenticated');
            setIsAuthenticated(true);
        };

        const handleAuthError = () => {
            console.log('🚫 Socket authentication failed');
            setIsAuthenticated(false);
        };

        // Initialize socket
        initializeSocket();

        // Set up status update listeners
        socketManager.on('connect', handleConnect);
        socketManager.on('disconnect', handleDisconnect);
        
        // Listen to custom auth events
        const handleSocketAuth = (event) => handleAuthenticated(event.detail);
        const handleSocketAuthError = (event) => handleAuthError(event.detail);
        
        window.addEventListener('socket:authenticated', handleSocketAuth);
        window.addEventListener('socket:authError', handleSocketAuthError);

        // Get initial status
        const initialStatus = socketManager.getStatus();
        setIsConnected(initialStatus.connected);
        setIsAuthenticated(initialStatus.authenticated);

        // Cleanup on unmount
        return () => {
            socketManager.off('connect', handleConnect);
            socketManager.off('disconnect', handleDisconnect);
            window.removeEventListener('socket:authenticated', handleSocketAuth);
            window.removeEventListener('socket:authError', handleSocketAuthError);
            // Don't cleanup socketManager here as other components might need it
        };
    }, [initializationAttempted]);

    // Helper methods for components
    const emit = (event, data) => {
        return socketManager.emit(event, data);
    };

    const on = (event, callback) => {
        return socketManager.on(event, callback);
    };

    const off = (event, callback) => {
        return socketManager.off(event, callback);
    };

    const authenticate = (token) => {
        return socketManager.authenticate(token);
    };

    // Context value
    const value = {
        socketManager,
        socketInitialized,
        socketError,
        isConnected,
        isAuthenticated,
        emit,
        on,
        off,
        authenticate,
        getStatus: () => socketManager.getStatus(),
    };

    // Show minimal loading screen only very briefly
    if (!socketInitialized && !socketError) {
        return (
            <Loading />
        );
    }

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};