const express = require('express');
const mqtt = require('mqtt');
const path = require('path');

const app = express();
const port = 3000;

// MQTT client configuration
const mqttClient = mqtt.connect('mqtt://fluent-bit:1883');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// MQTT connection events
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
});

mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
});

// Helper function to get current date in YYYY-MM-DD format
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Routes
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IoT Device Data Input</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        .submit-btn {
            background-color: #007bff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 20px;
        }
        .submit-btn:hover {
            background-color: #0056b3;
        }
        .success-message {
            background-color: #d4edda;
            color: #155724;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #c3e6cb;
            display: none;
        }
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>IoT Device Data Input</h1>
        
        <div id="successMessage" class="success-message"></div>
        <div id="errorMessage" class="error-message"></div>
        
        <form id="sensorForm">
            <div class="form-group">
                <label for="device_id">Device ID:</label>
                <select id="device_id" name="device_id" required>
                    <option value="">Select Device</option>
                    <option value="device01">device01</option>
                    <option value="device02">device02</option>
                    <option value="device03">device03</option>
                    <option value="device04">device04</option>
                    <option value="device05">device05</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="date">Date:</label>
                <input type="date" id="date" name="date" value="${getCurrentDate()}" required>
            </div>
            
            <div class="form-group">
                <label for="temperature">Temperature (°C):</label>
                <input type="number" id="temperature" name="temperature" step="0.1" min="-50" max="100" placeholder="Enter temperature" required>
            </div>
            
            <div class="form-group">
                <label for="humidity">Humidity (%):</label>
                <input type="number" id="humidity" name="humidity" step="0.1" min="0" max="100" placeholder="Enter humidity" required>
            </div>
            
            <div class="form-group">
                <label for="status">Device Status:</label>
                <select id="status" name="status" required>
                    <option value="">Select Status</option>
                    <option value="OK">OK</option>
                    <option value="WARN">WARN</option>
                    <option value="ALERT">ALERT</option>
                </select>
            </div>
            
            <button type="submit" class="submit-btn">Send Data</button>
        </form>
    </div>

    <script>
        document.getElementById('sensorForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            // Add timestamp
            data.timestamp = new Date().toISOString();
            
            try {
                const response = await fetch('/submit-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage('successMessage', 'Data sent successfully!');
                    // Reset form
                    this.reset();
                    // Set current date again
                    document.getElementById('date').value = '${getCurrentDate()}';
                } else {
                    showMessage('errorMessage', result.error || 'Error sending data');
                }
            } catch (error) {
                showMessage('errorMessage', 'Network error: ' + error.message);
            }
        });
        
        function showMessage(elementId, message) {
            const successEl = document.getElementById('successMessage');
            const errorEl = document.getElementById('errorMessage');
            
            // Hide both messages first
            successEl.style.display = 'none';
            errorEl.style.display = 'none';
            
            // Show the appropriate message
            const targetEl = document.getElementById(elementId);
            targetEl.textContent = message;
            targetEl.style.display = 'block';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                targetEl.style.display = 'none';
            }, 3000);
        }
    </script>
</body>
</html>
    `);
});

// API endpoint to handle form submission
app.post('/submit-data', (req, res) => {
    try {
        const { device_id, date, temperature, humidity, status } = req.body;
        
        // Validate required fields
        if (!device_id || !date || !temperature || !humidity || !status) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate numeric values
        const tempNum = parseFloat(temperature);
        const humNum = parseFloat(humidity);
        
        if (isNaN(tempNum) || isNaN(humNum)) {
            return res.status(400).json({ error: 'Temperature and humidity must be valid numbers' });
        }
        
        if (humNum < 0 || humNum > 100) {
            return res.status(400).json({ error: 'Humidity must be between 0 and 100%' });
        }
        
        // Create sensor data object
        const sensorData = {
            device_id: device_id,
            date: date,
            temperature: tempNum,
            humidity: humNum,
            status: status,
            timestamp: new Date().toISOString()
        };
        
        // Publish to MQTT
        const topic = `sensors/${device_id}`;
        const message = JSON.stringify(sensorData);
        
        mqttClient.publish(topic, message, (error) => {
            if (error) {
                console.error('MQTT publish error:', error);
                return res.status(500).json({ error: 'Failed to publish to MQTT' });
            }
            
            console.log(`Data published to MQTT topic: ${topic}`, sensorData);
            res.json({ 
                success: true, 
                message: 'Data sent successfully',
                data: sensorData 
            });
        });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        mqtt_connected: mqttClient.connected
    });
});

// Start server
app.listen(port, () => {
    console.log(`IoT Data Input Web Server running at http://localhost:${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    mqttClient.end();
    process.exit(0);
});