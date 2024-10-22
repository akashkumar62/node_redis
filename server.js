const express = require('express')
const axios = require('axios')
const rateLimit = require('express-rate-limit')
const app = express()
const client = require('./client')

// Define rate limiting middleware
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 10, // Limit each IP to 10 requests per minute
    message: 'Too many requests from this IP, please try again later.',
    headers: true, // Send rate limit info in headers
})

// Apply rate limiting middleware to all routes
app.use(limiter)

// Your existing cache route
app.get('/', async (req, res) => {
    try {
        const cacheValue = await client.get('todos')
        if (cacheValue) {
            console.log('Cache hit, returning cached data')
            return res.json(JSON.parse(cacheValue))
        }

        console.log('Cache miss, fetching from API')
        const { data } = await axios.get('https://jsonplaceholder.typicode.com/todos')
        
        await client.set('todos', JSON.stringify(data))
        await client.expire('todos', 30)
        
        return res.json(data)
    } catch (error) {
        console.error('Error in / route:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
})

// Add a basic health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is healthy!' })
})

// Start the server
app.listen(9000, () => {
    console.log('Server is running on port 9000')
})
