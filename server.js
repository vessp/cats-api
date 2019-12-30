const express = require('express')

const app = express()
// parse application/json
app.use(require('body-parser').json())

const cat = {
	name: 'snowball',
	age: 3,
	birthDate: new Date().toISOString(),
	likesYarn: true,
	aptitude: 8.9,
}

app.get('/api/v1/cats', (req, res) => {
	res.json(cat)
})

app.post('/api/v1/cats', (req, res) => {
	console.log(req.body, req.body.name)
	res.send('cat saved successfully')
})

const port = 8080
app.listen(port, () => {
	console.log(`Cats API listening on port ${port}!`)
})
