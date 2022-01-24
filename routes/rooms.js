const express = require('express')
const moment = require('moment')
const momentTimezone = require('moment-timezone')
const Room = require('../models/Room')

const router = new express.Router()

router.get('/rooms', (req, res) => {
  Room.find()
    .then(rooms => {
      res.json(rooms)
    })
    .catch(error => {
      res.json({ error })
    })
})

// UTC to IST converter
const dateIST = date => {
  return momentTimezone(date).tz('Asia/Colombo')
}

// Calculate the duration of the hours between the start and end of the booking
const durationHours = (bookingStart, bookingEnd) => {
  // convert the UTC to IST
  let startDateLocal = dateIST(bookingStart)
  let endDateLocal = dateIST(bookingEnd)
  // calculate the duration of the difference between the two times
  let difference = moment.duration(endDateLocal.diff(startDateLocal))
  // return the difference in decimal format
  return difference.hours() + difference.minutes() / 60
}

// Get room details
router.get('/rooms/:id', (req, res) => {
  const { id } = req.params

  Room.findById(
    id
  )
    .then(room => {
      res.status(201).json(room)
    })
    .catch(error => {
      res.status(400).json({ error })
    })
})

// Make a booking
router.post('/reservation/rooms/:id', (req, res) => {
  const { id } = req.params

  Room.findByIdAndUpdate(
    id,
    {
      $addToSet: {
        bookings: {
          user: '',
          // The hour on which the booking starts, calculated from 12:00AM as time = 0
          startHour: dateIST(req.body.bookingStart).format('H.mm'),
          // The duration of the booking in decimal format
          duration: durationHours(req.body.bookingStart, req.body.bookingEnd),
          // Spread operator for remaining attributes
          ...req.body
        }
      }
    },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(room => {
      res.status(201).json(room)
    })
    .catch(error => {
      res.status(400).json({ error })
    })
})

// Delete a booking
router.delete('/rooms/:id/:bookingId', (req, res) => {
  const { id } = req.params
  const { bookingId } = req.params
  Room.findByIdAndUpdate(
    id,
    { $pull: { bookings: { _id: bookingId } } },
    { new: true }
  )
    .then(room => {
      res.status(201).json(room)
    })
    .catch(error => {
      res.status(400).json({ error })
    })
})

module.exports = router