const db = require('./psql')
class Cat extends db {

   /* Example Cat:
    {
      name: 'snowball',
      age: 3,
      birth_date: new Date().toISOString(),
      likes_yarn: true,
      aptitude: 8.9,
    }
  */
  static get createTableQuery() { 
    return `CREATE TABLE ${this.tableName}`
      + `(`
      + `id SERIAL PRIMARY KEY,`
      + `name VARCHAR (255) NOT NULL,`
      + `birth_date timestamptz NOT NULL,`
      + `age INTEGER NOT NULL CHECK (age >= 0),`
      + `likes_yarn BOOLEAN NOT NULL,`
      + `aptitude FLOAT NOT NULL`
      + `);`
  }

  // Get All Cats
  static async all() {
    try {
      await this.setup()
      let q = `SELECT * FROM ${this.tableName};`
      const { rows } = await this.pool.query(q)
      console.log(`[DB] (all - ${this.tableName}):`, rows)
      return rows
    }
    catch (err) {
      console.log(err)
      throw err
    }
  }

  // Insert New Cat
  static async insert(cat) {
    try {
      await this.setup()
      const q = ` INSERT INTO ${this.tableName}`
        + ` (name, age, birth_date, likes_yarn, aptitude)`
        + ` VALUES ($1, $2, $3, $4, $5)`
        + ` RETURNING id;`
      const { rows, rowCount } = await this.pool.query(q, [
        cat.name, cat.age, cat.birth_date, cat.likes_yarn, cat.aptitude,
      ])
      const insertedId = rows[0]['id']
      console.log(`[DB] (insert - ${this.tableName}) rowCount: ${rowCount}, insertedId: ${insertedId}`)
      return insertedId
    }
    catch (err) {
      console.log(err)
      throw err
    }
  }
}
module.exports = Cat
