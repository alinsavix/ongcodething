import axios from 'axios';
import { io } from 'socket.io-client';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:1077`;

export interface Song {
    song_id: number;
    title: string;
    body: string;
    status: 'PENDING' | 'DONE' | 'SKIPPED';
    created_at: string;
}

const api = axios.create({
    baseURL: API_URL,
    withCredentials: false,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
    console.log('Starting Request:', {
        url: request.url,
        method: request.method,
        headers: request.headers
    });
    return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
    response => {
        console.log('Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers
        });
        return response;
    },
    error => {
        console.error('API Error:', {
            message: error.message,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            } : 'No response',
            config: {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers
            }
        });
        return Promise.reject(error);
    }
);

export const socket = io(API_URL, {
    withCredentials: false,
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnection: true,
    timeout: 2000,            // Detect disconnection after 2 seconds of no response
    reconnectionDelay: 1000,  // Try to reconnect after 1 second
    reconnectionAttempts: 5   // Try to reconnect 5 times before giving up
});

// Add socket event listeners
socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

// Export a function to manually reconnect
export const reconnectSocket = () => {
    socket.connect();
};

export const getSongs = async (): Promise<Song[]> => {
    const response = await api.get('/songs/');
    console.log('getSongs response:', {
        status: response.status,
        data: response.data,
        isArray: Array.isArray(response.data),
        type: typeof response.data
    });
    return response.data;
};

export const getSongById = async (id: number): Promise<Song> => {
    const response = await api.get(`/songs/${id}`);
    return response.data;
};

export const updateSongStatus = async (id: number, status: 'DONE' | 'SKIPPED'): Promise<Song> => {
    const response = await api.put(`/songs/${id}`, { status });
    return response.data;
};
