const assert = require('assert')
const db = require('../psql')
class Cat extends db {}

const CAT = {
	name: 'snowball',
	age: 3,
	birthDate: new Date().toISOString(),
	likesYarn: true,
	aptitude: 8.9,
}

execute()
async function execute() {
	await Cat.ensureTable()
	await Cat.clearTable()
	let cats = await Cat.all()
	assert.equal(cats.length, 0)

	const cat = await Cat.push(CAT)
	cats = await Cat.all()
	assert.equal(cats.length, 1)
	assert.equal(cats[0].name, 'snowball')

	console.log('Tests complete!')
}