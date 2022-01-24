const mongoose = require('./dbConfig')
const Schema = mongoose.Schema
const moment = require('moment')

const bookingSchema = new Schema({
  bookingId: Schema.Types.ObjectId,
  user: String,
  bookingStart: String,
  bookingEnd: String,
  startHour: Number,
  duration: Number,
  bookingType: String,
  roomId: { type: Schema.ObjectId, ref: 'Room' },
  parkingRequired: { type: Boolean, default: false },
  plannedArrivalTime: Number,
  specialNotes: String
})

// Validation to check booking conflicts
bookingSchema.path('bookingStart').validate(function(value) {
  let roomId = this.roomId
  
  let newBookingStart = new Date(value).getTime()
  let newBookingEnd = new Date(this.bookingEnd).getTime()
  
  // Function to check for booking conflicts
  let conflictsWithExisting = (existingBookingStart, existingBookingEnd, newBookingStart, newBookingEnd) => {
    if (newBookingStart >= existingBookingStart && newBookingStart < existingBookingEnd || 
      existingBookingStart >= newBookingStart && existingBookingStart < newBookingEnd) {
      
      throw new Error(
        `Booking request can't be process. There is a existing booking from ${moment(existingBookingStart).format('HH:mm')} to ${moment(existingBookingEnd).format('HH:mm on LL')}`
      )
    }
    return false
  }
  
  // Locate the room document containing the bookings
  return Room.findById(roomId)
    .then(room => {
      // check each existing booking and return false if there is a conflict
      return room.bookings.every(booking => {
        
        // Convert existing booking Date objects into number values
        let existingBookingStart = new Date(booking.bookingStart).getTime()
        let existingBookingEnd = new Date(booking.bookingEnd).getTime()

        // Check whether there is a clash between the new booking and the existing booking
        return !conflictsWithExisting(
          existingBookingStart, 
          existingBookingEnd, 
          newBookingStart, 
          newBookingEnd
        )
      })
    })
}, `{REASON}`)


const roomSchema = new Schema({
  name: { type: String, index: true, required: true },
  property: { type: String, required: true },
  occupancy: String,
  bbRate: Number,
  fullboardRate: Number,
  halfboardRate: Number,
  amenities: {
    seaView: { type: Boolean, default: false },
    lakeView: { type: Boolean, default: false },
    mountainView: { type: Boolean, default: false },
    bathtub: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    floorArea: Number
  },
  bookings: [bookingSchema]
})

const Room = (module.exports = mongoose.model('Room', roomSchema))