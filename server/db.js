const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Falls back to a local database if MONGODB_URI is not provided
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/betswal';
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected successfully`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Do not exit process here, otherwise the server crashes if DB is down on startup
  }
};

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: { type: String }, // For easy querying without populate
  ticketRef: { type: String, required: true, unique: true },
  stake: { type: Number, required: true },
  totalOdds: { type: Number, required: true },
  possibleWin: { type: Number, required: true },
  bets: { type: Array, required: true }, // Array of individual bet selections
  status: { type: String, enum: ['Pending', 'Won', 'Lost', 'CashedOut'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const sharedBetslipSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  bets: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' } // Automatically delete after 7 days
});

const withdrawalSchema = new mongoose.Schema({
  reqId: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Bet = mongoose.model('Bet', betSchema);
const SharedBetslip = mongoose.model('SharedBetslip', sharedBetslipSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = {
  connectDB,
  User,
  Bet,
  SharedBetslip,
  Withdrawal
};
