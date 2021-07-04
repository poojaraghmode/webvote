const mongoose = require('mongoose');

const voterCollegesSchema = new mongoose.Schema({
    checkedGEC: Boolean,
    checkedAITD: Boolean,
    checkedPCCE: Boolean,
    checkedRIT: Boolean,
    checkedDBCE: Boolean
});

const elections = new mongoose.Schema({
    type: String, 
    electionAddress: String,
    adminUsername: String,
    college:String,
    votingStartDateTime: Date,
    votingEndDateTime: Date,
    registrationStartDateTime: Date,
    registrationEndDateTime: Date,
    state: String,
    voterColleges: [voterCollegesSchema]
});

module.exports = mongoose.model("Elections", elections);