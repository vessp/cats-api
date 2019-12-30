const express = require('express')

const db = require('./psql')
class Cat extends db {}
Cat.ensureTable()

const app = express()
app.use(require('body-parser').json()) // parse application/json

app.get('/api/v1/cats', async (req, res) => {
	try {
		console.log('GET /api/v1/cats')
		const cats = await Cat.all()
		res.json({ cats })
	} catch(e) {
		res.status(500).json({ message: e.message })
	}
})

app.post('/api/v1/cats', async (req, res) => {
	try {
		const cat = req.body
		console.log('POST /api/v1/cats', cat)
		await Cat.push(cat)
		res.send('cat saved successfully')
	} catch(e) {
		res.status(500).json({ message: e.message })
	}
})

const port = 8080
app.listen(port, () => {
	console.log(`Cats API listening on port ${port}!`)
})
