import mongoose from 'mongoose'

const classSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    subject: { type: String },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classCode: { type: String }, // Unique class code
    isPublic: { type: Boolean, default: false }, // Public or private class
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    classCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Generate a unique class code before saving
classSchema.pre('save', async function (next) {
  if (!this.classCode) {
    let uniqueCode
    let isUnique = false
    while (!isUnique) {
      uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase() // Example: 'A1B2C3D4'
      const existingClass = await mongoose
        .model('Class')
        .findOne({ classCode: uniqueCode })
      if (!existingClass) isUnique = true
    }
    this.classCode = uniqueCode
  }
  next()
})

export default mongoose.model('Class', classSchema)
