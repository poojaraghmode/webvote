const mongoose = require('mongoose');

const candidates = new mongoose.Schema({
    electionAddress: String,
    candidateId: Number,
    candidateName: String,
    candidatePrNumber: String,
    gender: String,
    college: String,
    department: String,
    voteCount: Number,
    description: String
});

module.exports = mongoose.model("Candidates", candidates);