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
	await Cat.removeTable()
	await Cat.ensureTable()
	await Cat.clearTable()
	let cats = await Cat.all()
	assert.equal(cats.length, 0)

	const id = await Cat.insert(CAT)
	cats = await Cat.all()
	assert.equal(cats.length, 1)
	assert.equal(cats[0].name, 'snowball')

	console.log('Tests complete!')
}