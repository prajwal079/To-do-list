const http = require('http');
const url = require('url');
const { MongoClient, ObjectId } = require('mongodb');

const port = 3000;
const mongoUri = 'mongodb://localhost:27017';
const dbName = 'task-manager';
const client = new MongoClient(mongoUri);

async function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    const db = client.db(dbName);
    const tasksCollection = db.collection('tasks');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (path === '/tasks' && method === 'GET') {
        try {
            const tasks = await tasksCollection.find().toArray();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(tasks));
        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch tasks' }));
        }
    } else if (path === '/tasks' && method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const task = JSON.parse(body);
                await tasksCollection.insertOne(task);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(task));
            } catch (error) {
                console.error('Error adding task:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to add task' }));
            }
        });
    } else if (path.startsWith('/tasks/') && method === 'PUT') {
        const id = path.split('/')[2];
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const updates = JSON.parse(body);
                await tasksCollection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(updates));
            } catch (error) {
                console.error('Error updating task:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to update task' }));
            }
        });
    } else if (path.startsWith('/tasks/') && method === 'DELETE') {
        const id = path.split('/')[2];
        try {
            await tasksCollection.deleteOne({ _id: new ObjectId(id) });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Task deleted' }));
        } catch (error) {
            console.error('Error deleting task:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to delete task' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
}

async function startServer() {
    try {
        await client.connect();
        const server = http.createServer(handleRequest);
        server.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}

startServer();
