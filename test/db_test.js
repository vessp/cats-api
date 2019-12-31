const assert = require('assert')
const Cat = require('../src/Cat')

const CAT = {
	name: 'snowball',
	age: 3,
	birth_date: new Date().toISOString(),
	likes_yarn: true,
	aptitude: 8.9,
}

execute()
async function execute() {
	await Cat.createDatabase('cats')
	await Cat.removeTable()
	await Cat.ensureTable()
	await Cat.clearTable()
	let cats = await Cat.all()

	// Check cats table is empty
	assert.equal(cats.length, 0)

	// Insert cat
	const id = await Cat.insert(CAT)

	// Fetch all cats
	cats = await Cat.all()

	// Check cat was added
	assert.equal(cats.length, 1)

	// Check cat name is correct
	assert.equal(cats[0].name, 'snowball')

	console.log('Tests complete!')
}