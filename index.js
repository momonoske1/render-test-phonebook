/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const Person = require('./models/person')

morgan.token('object', function (request, response) {
  return `${JSON.stringify(request.body)}`
})

app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))
app.use(express.static('dist'))
app.use(morgan(':object'))

const unknownEndpoint = (request, response) => {
  return response.status(404).send({
    error: 'unknown endpoint',
  })
}

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}


app.get('/api', (request, response) => {
  response.send('<h1>LA ILAHA ILLA ALLAH</h1>')
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  if (!person.name || !person.number) {
    console.log('missing name or number')
    return response.status(400).json({
      error: 'missing name or number',
    })
  } else {
    console.log('successful')
    person
      .save()
      .then((savedPerson) => {
        response.json(savedPerson)
      })
      .catch((error) => next(error))
    // eslint-disable-next-line linebreak-style
  }
})

app.get('/api/info', (request, response, next) => {
  Person.countDocuments(request.params.id)
    .then((count) => {
      const date = new Date()
      response.send(`
    <p>Phonebook has info for ${count} persons</p>
    <br />
    <p>${date}</p>
    `)
    })
    .catch((error) => next(error))
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((result) => {
      console.log('deleted', result)
      response.status(204).end()
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then((updatePerson) => {
      console.log('updated', updatePerson)
      response.json(updatePerson)
    })
    .catch((error) => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT)
console.log(`Server is running on port ${PORT}`)
