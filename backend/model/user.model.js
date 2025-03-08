import mongoose from 'mongoose'

const userScheam = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'provde name'],
    },
    email: {
      type: String,
      required: [true, 'Provide email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Provide password'],
    },
    role: {
      type: String,
      enum: ['teacher', 'student'], // Restricting role values
      required: [true, 'Provide user role'],
    },
    profile_pic: {
      type: String,
      default: '',
    },
  },
  {
    timestamp: true,
  }
)
//  modexl wiith User-->table name of it
const User = mongoose.model('User', userScheam)
export default User
