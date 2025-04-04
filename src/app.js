import express from 'express';
import cors from 'cors'; // For handling Cross-Origin Resource Sharing
import morgan from 'morgan'; // For HTTP request logging
import apiRouter from './routes/index.js'; // Import the main router

// Create Express app instance
const app = express();

// --- Middleware ---
// Enable CORS for all origins (adjust for production)
app.use(cors());

// Log HTTP requests (e.g., 'dev' format)
app.use(morgan('dev'));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
// Mount the main API router under the /api path
app.use('/api', apiRouter);

// --- Basic Error Handling ---
// Catch 404s for routes not handled above
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

// Basic error handler (consider a more robust one for production)
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        // Optionally include stack trace in development
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});


// Export the app instance
export default app; 