const mongoose = require('mongoose');

const candidaterequests = new mongoose.Schema({
    electionAddress: String,
    candidateName: String,
    candidatePrNumber: String,
    gender: String,
    college: String,
    department: String,
    description: String,
    status: String,
    isReq: Boolean
});

module.exports = mongoose.model("Candidaterequests", candidaterequests);