const { Client, Pool } = require('pg')

if(process.env.NODE_ENV == 'development') {
  require('dotenv').config()
}

let logv = () => {}
if(process.env.PG_VERBOSE=='1' || process.env.DB_VERBOSE=='1')
  logv = (...args) => console.log(logTimestamp(), '[DB]', ...args)
const logi = (...args) => console.log(logTimestamp(), '[DB]', ...args)
const loge = (...args) => console.log(logTimestamp(), '[DB Error]', ...args)

const CODE_DB_EXISTS = '42P04'
const CODE_DB_NO_EXISTS = '3D000'
const CODE_TABLE_EXISTS = '42P07'
const CODE_TABLE_NO_EXISTS = '42P01'
const ROOT_DB_NAME = 'postgres'

module.exports = class JTable {

  static get tableName() {
    //use class name to determine table name
    const className = this.name
    return className.toLowerCase()+'s'
  }

  static get rootConfig() {
    const config = this.config
    if(typeof config == 'object')
      config.database = ROOT_DB_NAME
    else
      throw new Error('Unable to determine rootConfig')
    return config
  }

  static get config() {
    if(process.env.PG_HOST || process.env.DB_HOST)
      return {
        host: process.env.PG_HOST || process.env.DB_HOST,
        port: process.env.PG_PORT || process.env.DB_PORT,
        user: process.env.PG_USER || process.env.DB_USER,
        password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
        database: process.env.PG_DATABASE || process.env.DB_DATABASE,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    return process.env.PG_URL || process.env.DB_URL
  }

  static async createDatabase(database) {
    console.log(this.config)
    try {
      const client = new Client(this.config)
      await client.connect()
      const q = `CREATE DATABASE ${database};`
      const res = await client.query(q)
      logi(`database '${database}' created`)
      await client.end()
      return res.rows
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

  static async listTables() {
    try {
      await this.setup()
      const q = `SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`
      const res = await this.pool.query(q)
      const tableNames = res.rows.map(row => row.tablename)
      logi('(listTables):', tableNames)
      return res.rows
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

/*****************************************************************************************
** SETUP                                                                                **
*****************************************************************************************/
  static async setup() {
    if(!this.pool) {
      this.pool = new Pool(this.config)
    }

    await this.pool.connect()
  }

  static async close() {
    if(this.pool)
      this.pool.end()
  }

  static async ensureTable() {
    try {
      await this.setup()
      const q = `CREATE TABLE ${this.tableName}`
        + `(`
        + `_id SERIAL UNIQUE,`
        + `jdata jsonb `
        + `)`
      const res = await this.pool.query(q)
      logi('(ensureTable):', this.tableName)
      return res.rows
    }
    catch (err) {
      if(err.code == CODE_TABLE_EXISTS) {
        logi('(ensureTable):', this.tableName)
      }
      else {
        loge(err)
        throw err
      }
    }
  }

  static async removeTable() {
    try {
      await this.setup()
      const q = `DROP TABLE ${this.tableName}`
      const res = await this.pool.query(q)
      logi('(removeTable):', this.tableName)
      return res.rows
    }
    catch (err) {
      if(err.code == CODE_TABLE_NO_EXISTS) {
        logi('(removeTable):', this.tableName)
      }
      else {
        loge(err)
        throw err
      }
    }
  }

/*****************************************************************************************
** GETTERS                                                                              **
*****************************************************************************************/
  static async all(matchObject) {
    try {
      await this.setup()
      let q = ` SELECT * FROM ${this.tableName} `
      if(matchObject)
        q += ` WHERE jdata @> $1 `
      const { rows } = await this.pool.query(q, matchObject ? [ matchObject ] : [])
      const items = rows.map(row => rowToJson(row))
      logv('(all):', items)
      return items
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

  static async one(matchObject={}) {
    try {
      await this.setup()
      let q = ` SELECT * FROM ${this.tableName} `
      if(matchObject)
        q += ` WHERE jdata @> $1 `
      q += ` LIMIT 1 `
      const { rows } = await this.pool.query(q, [ matchObject ])
      const item = rows.length > 0 ? rowToJson(rows[0]) : null
      logv('(one):', item)
      return item
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

  static async query(queryString, vars=[]) {
    try {
      await this.setup()
      const { rows } = await this.pool.query(queryString, vars)
      const items = rows.map(row => rowToJson(row))
      logv('(query):', items)
      return items
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

  static async queryOne(queryString, vars=[]) {
    try {
      await this.setup()
      const { rows } = await this.pool.query(queryString, vars)
      const item = rows.length > 0 ? rowToJson(rows[0]) : null
      logv('(queryOne):', item)
      return item
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

  static async numItems() {
    try {
      await this.setup()
      const result = await this.pool.query(`SELECT COUNT(*) FROM ${this.tableName};`)
      const numItems = parseInt(result.rows[0].count)
      logv('(numItems):', numItems)
      return numItems
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

/*****************************************************************************************
** SETTERS                                                                              **
*****************************************************************************************/
  static async push(item) {
    try {
      await this.setup()
      // Clone item
      item = JSON.parse(JSON.stringify(item))
      delete item['_id'] // don't want this row id to infiltrate our jdata
      item['updatedAt'] = nowTimestampJst()

      // --SELECT-------
      const selectQuery =
          ` SELECT * FROM ${this.tableName} `
        + ` WHERE jdata @> $1 `
      const selectResult = await this.pool.query(selectQuery, [ { id: item.id } ])
      // console.log('select', selectResult.rowCount)
      const isNewItem = selectResult.rowCount == 0
      if(!isNewItem) {
        const dbItem = rowToJson(selectResult.rows[0])
        // Overwrite createdAt from DB to ensure it remains unchanged from outside
        item['createdAt'] == dbItem['createdAt']
        // --UPDATE----------------------------------------------
        const updateQuery = ` UPDATE ${this.tableName} `
        + ` SET jdata = $1 `
        + ` WHERE _id = $2 `
        const updateResult = await this.pool.query(updateQuery, [ item, dbItem['_id'] ])
        if(updateResult.rowCount != 1)
          loge('update should have changed a row but it didnt')
        item['_id'] = dbItem['_id']
        logv(`(push - update - ${this.tableName}):`, item)
        return item
      }
      // --INSERT----------------------------------------------
      // Insert if we didn't find a row to update
      item['createdAt'] = item['updatedAt'] // updatedAt and createdAt should be same
      const q = ` INSERT INTO ${this.tableName} (jdata) VALUES ($1) RETURNING _id `
      const insertResult = await this.pool.query(q, [ item ])
      item['_id'] = insertResult.rows[0]['_id']
      logv(`(push - insert - ${this.tableName}):`, item)
      return item
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

  static async remove(matchObject) {
    try {
      await this.setup()
      let q = ` DELETE FROM ${this.tableName} `
      if(matchObject)
        q += ` WHERE jdata @> $1 `
      const result = await this.pool.query(q, [ matchObject ])
      logv('(remove):', matchObject, 'rowCount:', result.rowCount)
      return result.rowCount
    }
    catch (err) {
      loge(err)
      throw err
    }
  }

  static async clearTable() {
    try {
      await this.setup()
      const result = await this.pool.query(`DELETE FROM ${this.tableName};`)
      logi('(clearTable):', this.tableName)
      return result.rowCount
    }
    catch (err) {
      loge(err)
      throw err
    }
  }
}

/*****************************************************************************************
** HELPERS                                                                              **
*****************************************************************************************/
function rowToJson(row) {
  const { _id, jdata } = row
  const item = jdata
  item['_id'] = _id
  return item
}

const moment = require('moment')
function nowTimestampJst(offsetMillis=0, outputFormat='YYYY-MM-DD[T]HH:mm:ss.SSSZZ') {
  return moment(moment.now() + offsetMillis).utcOffset(9).format(outputFormat)
}

function logTimestamp() {
  var jstOffset = 9 * 3600 * 1000
  var d = new Date(Date.now() + jstOffset)
  return '[' + d.toISOString().substr(0, 19).replace('T', ' ') + ']'
}