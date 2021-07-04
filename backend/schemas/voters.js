const mongoose = require('mongoose');

const voters = new mongoose.Schema({
    firstname: String,
    lastname: String,
    middlename: String,
    gender: String,
    dob: String,
    mobile: Number,
    email: String,
    college: String,
    department: String,
    prNumber: String,
    rollNumber: String,
    year: String,
    password: String,
    walletAddress: String,
    privateKey: String,
    isAdmin: Boolean
});

module.exports = mongoose.model("Voters", voters);