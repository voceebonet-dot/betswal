const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/betswal';
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected successfully`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
};

// ── Schemas ────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  phone:      { type: String, required: true, unique: true },
  name:       { type: String, default: '' },
  balance:    { type: Number, default: 0 },
  totalWon:   { type: Number, default: 0 },
  totalBets:  { type: Number, default: 0 },
  role:       { type: String, enum: ['user', 'admin'], default: 'user' },
  countryId:  { type: String, default: 'KE' },
  createdAt:  { type: Date, default: Date.now },
});

const betSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone:      { type: String },
  ticketRef:  { type: String, required: true, unique: true },
  stake:      { type: Number, required: true },
  totalOdds:  { type: Number, required: true },
  possibleWin:{ type: Number, required: true },
  bets:       { type: Array, required: true },
  status:     { type: String, enum: ['Pending', 'Won', 'Lost', 'CashedOut'], default: 'Pending' },
  createdAt:  { type: Date, default: Date.now },
});

const transactionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone:     { type: String },
  type:      { type: String, enum: ['deposit', 'withdrawal', 'bet_stake', 'winnings'], required: true },
  amount:    { type: Number, required: true },
  ref:       { type: String },
  createdAt: { type: Date, default: Date.now },
});

const sharedBetslipSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true },
  bets:      { type: Array, required: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' },
});

const withdrawalSchema = new mongoose.Schema({
  reqId:     { type: String, required: true, unique: true },
  phone:     { type: String, required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount:    { type: Number, required: true },
  status:    { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

const jackpotTicketSchema = new mongoose.Schema({
  ticketRef:  { type: String, required: true, unique: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone:      { type: String },
  jackpotKey: { type: String, required: true }, // 'mega', 'mid', 'liga'
  jackpotName:{ type: String },
  stake:      { type: Number, required: true },
  selections: { type: Array, required: true }, // [{ gameId, type: '1'/'X'/'2' }]
  games:      { type: Array, required: true },  // snapshot of games
  status:     { type: String, enum: ['Pending', 'Won', 'Lost'], default: 'Pending' },
  createdAt:  { type: Date, default: Date.now },
});

const User           = mongoose.model('User',           userSchema);
const Bet            = mongoose.model('Bet',            betSchema);
const Transaction    = mongoose.model('Transaction',    transactionSchema);
const SharedBetslip  = mongoose.model('SharedBetslip',  sharedBetslipSchema);
const Withdrawal     = mongoose.model('Withdrawal',     withdrawalSchema);
const JackpotTicket  = mongoose.model('JackpotTicket',  jackpotTicketSchema);

module.exports = { connectDB, User, Bet, Transaction, SharedBetslip, Withdrawal, JackpotTicket };
