const axios = require('axios')

const cat = {
	name: 'snowball',
	age: 3,
	birthDate: new Date().toISOString(),
	likesYarn: true,
	aptitude: 8.9,
}

axios.get('http://localhost:8080/api/v1/cats')
	.then(res => {
		console.log('get res', res.data)
	}, error => {
		console.log('get error', error)
	})

axios.post('http://localhost:8080/api/v1/cats', cat)
	.then(res => {
		console.log('post res', res.data)
	}, error => {
		console.log('post error', error)
	})