const express = require('express')
const Cat = require('./Cat')

// Initialize DB
Cat.createDatabase('cats')
Cat.ensureTable()

const app = express()
app.use(require('body-parser').json()) // parse application/json

// Get All Cats Endpoint
app.get('/api/v1/cats', async (req, res) => {
	try {
		console.log('GET /api/v1/cats')
		const cats = await Cat.all()
		res.json({ cats })
	} catch(e) {
		res.status(500).json({ message: e.message })
	}
})

// Insert Cat Endpoint
app.post('/api/v1/cats', async (req, res) => {
	try {
		const cat = req.body
		console.log('POST /api/v1/cats', cat)
		await Cat.insert(cat)
		res.send('cat saved successfully')
	} catch(e) {
		res.status(500).json({ message: e.message })
	}
})

const port = 8080
app.listen(port, () => {
	console.log(`Cats API listening on port ${port}! Navigate to http://localhost:8080/api/v1/cats`)
})
