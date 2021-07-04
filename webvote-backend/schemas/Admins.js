const mongoose = require('mongoose');

const admins = new mongoose.Schema({
    fullname: String,
    username: String,
    college: String,
    password: String,
    isAdmin: Boolean
});

module.exports = mongoose.model("Admins", admins);