const assert = require('assert')
const axios = require('axios')

const CAT = {
	name: 'snowball',
	age: 3,
	birth_date: new Date().toISOString(),
	likes_yarn: true,
	aptitude: 8.9,
}

execute()
async function execute() {
	// Fetch current cats
	const response0 = await axios.get('http://localhost:8080/api/v1/cats')
	const cats0 = response0.data.cats
	console.log('response0:', cats0)

	// Insert new cat
	await axios.post('http://localhost:8080/api/v1/cats', CAT)
	const response1 = await axios.get('http://localhost:8080/api/v1/cats')
	const cats1 = response1.data.cats
	console.log('response1:', cats1)

	// Check collection length increased
	assert.equal(cats0.length+1, cats1.length)

	// Check latest cat name
	const latestCat = cats1[cats1.length-1]
	assert.equal(latestCat.name, 'snowball')
	
	console.log('Tests complete!')
}