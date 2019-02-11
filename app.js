const express = require("express")
const app = new express
const bodyparser = require("body-parser")
const path = require("path")
const jwt = require("jsonwebtoken")

const config = require("./dbconfig.json")
const secrets = require("./secret.json")

const nickname = secrets.user
const pass = secrets.password
const secret = secrets.secret

const pool = mysql.createPool({
  connectionLimit: 10,
  multipleStatements: true,
  ...config
})

app.use(bodyparser.json())
app.use("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With")
  next()
})

const authmiddleware = (req, res, next) => {
  const token = req.get("authorization")
  jwt.verify(token, secret, (err, data) => {
    if (err) {
      res.status(403).json({ message: err.message })
    } else {
      next()
    }
  })
}

app.post("/login", ({ body: { user, password } }, res) => {
  if (user == nickname && password == pass) {
    const token = jwt.sign({
      user,
      admin: true
    }, secret, { algorithm: "HS512" })

    res.json({ token })
  } else {
    res.status(401).json({ message: "wrong username or password"})
  }
})

app.post("/api/delegates", authmiddleware, ({ body }, res) => {
  connection.query("SELECT delegates.id, delegates.name, delegates.committee, delegates.school, delegates.speeches FROM delegates INNER JOIN schools ON delegates.school = schools.id ORDER BY schools.speeches ASC, delegates.speeches ASC LIMIT=50;", (err, result) => {
    if(err) {
      console.error(err)
      return res.status(500).json({ "error": true })
    }
    res.json(result)
  })
})

app.post("/api/delegates-only-comm", authmiddleware, ({ body }, res) => {
  connection.query(`SELECT delegates.id, delegates.name, delegates.committee, delegates.school, delegates.speeches FROM delegates INNER JOIN schools ON delegates.school = schools.id ORDER BY schools.speeches ASC, delegates.speeches ASC WHERE delegates.committee = ${pool.escape(body.committee)} LIMIT=50;`, (err, result) => {
    if(err) {
      console.error(err)
      return res.status(500).json({ "error": true })
    }
    res.json(result)
  })
})

app.post("/api/delegates-but-comm", authmiddleware, ({ body }, res) => {
  connection.query(`SELECT delegates.id, delegates.name, delegates.committee, delegates.school, delegates.speeches FROM delegates INNER JOIN schools ON delegates.school = schools.id ORDER BY schools.speeches ASC, delegates.speeches ASC WHERE delegates.committee != ${pool.escape(body.committee)} LIMIT=50;`, (err, result) => {
    if(err) {
      console.error(err)
      return res.status(500).json({ "error": true })
    }
    res.json(result)
  })
})

app.post("/api/add", authmiddleware, ({ body }, res) => { // it is body.IDE not ID
  console.log(body)
  pool.query(`UPDATE delegates SET speeches = speeches + 1 WHERE id = ${pool.escape(body.ide)};`, (err, result) => {
    if(err) {
        console.error(err)
        return res.status(500).json({"error":true})
      }
      res.json(result)
  })
  pool.query(`UPDATE committees SET speeches = speeches + 1 WHERE id = ${pool.escape(body.committee)};`, (err, result) => {
    if(err) {
        console.error(err)
        return res.status(500).json({"error":true})
      }
      res.json(result)
  })
  pool.query(`UPDATE schools SET speeches = speeches + 1 WHERE id = ${pool.escape(body.school)};`, (err, result) => {
    if(err) {
        console.error(err)
        return res.status(500).json({"error":true})
      }
      res.json(result)
  })
}

app.post("/api/rm", authmiddleware, ({ body }, res) => { // it is body.IDE not ID
  console.log(body)
  pool.query(`UPDATE delegates SET speeches = speeches - 1 WHERE id = ${pool.escape(body.ide)};`, (err, result) => {
    if(err) {
        console.error(err)
        return res.status(500).json({ "error": true })
      }
      res.json(result)
  })
  pool.query(`UPDATE committees SET speeches = speeches - 1 WHERE id = ${pool.escape(body.committee)};`, (err, result) => {
    if(err) {
        console.error(err)
        return res.status(500).json({ "error": true })
      }
      res.json(result)
  })
  pool.query(`UPDATE schools SET speeches = speeches - 1 WHERE id = ${pool.escape(body.school)};`, (err, result) => {
    if(err) {
        console.error(err)
        return res.status(500).json({ "error": true })
      }
      res.json(result)
  })
}

app.options("*", (req, res) => {
  res.sendStatus(200)
})

app.all("*", (req, res) => {
  res.status(404).send("page not found")
})

app.listen(8080, () => {
  console.log("server listening on port 8080")
})