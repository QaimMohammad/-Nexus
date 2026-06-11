const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['entrepreneur', 'investor'],
      required: [true, 'Role is required']
    },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 1000 },
    isOnline: { type: Boolean, default: false },

    // Entrepreneur profile
    startupName: { type: String, default: '', maxlength: 200 },
    pitchSummary: { type: String, default: '', maxlength: 2000 },
    fundingNeeded: { type: String, default: '' },
    industry: { type: String, default: '' },
    location: { type: String, default: '' },
    foundedYear: { type: Number, min: 1900, max: 2100 },
    teamSize: { type: Number, min: 0 },

    // Investor profile
    investmentInterests: { type: [String], default: [] },
    investmentStage: { type: [String], default: [] },
    portfolioCompanies: { type: [String], default: [] },
    totalInvestments: { type: Number, default: 0 },
    minimumInvestment: { type: String, default: '' },
    maximumInvestment: { type: String, default: '' },

    // Payments (mock wallet)
    walletBalance: { type: Number, default: 10000, min: 0 },

    // Security
    twoFactorEnabled: { type: Boolean, default: false },
    otpCode: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password;
        delete ret.otpCode;
        delete ret.otpExpires;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      }
    }
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
