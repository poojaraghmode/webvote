const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const passportlocal = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const Voters = require("./schemas/voters");
const Admins = require("./schemas/Admins");
const Elections = require("./schemas/elections");
const Candidaterequests = require("./schemas/candidateRequests");
const Candidates = require("./schemas/candidates");
const fast2sms = require("fast-two-sms");

require('dotenv').config();

/*
-----------------------------------Server Configuration File------------------------------------------------------
DataBase: Mongodb, AWS Mumbai (ap-south-1)

Routes are sorted based on the schemas present in the 'schemas' folder.

Sections: - Database Connection
                :- Connect the express server to the remote mongodb database, so that all the requests 
                   passed through routes will be addressed.
          - Basic Configuration
                :- Basic configurations for express server including setting up CORS policy to access the
                   react application front-end at port 3000, setting up sessions and cookieparser.
          - Passport Local configuration for login
                :- Defining where to find the passport local strategies (passportConfig.js file) to be used 
                   for login, and returning session user. 
                   Passport local are used for both voter and admin login.
          - Server Startup
                :- Starts the express server at port 4000.
          - Routes for Schemas
              |--> Common Routes/Requests
              |     |--> Voter Login
              |     |     :- Uses passport authentication module, specifically the local strategy present in
              |     |        passportConfig.js file. If credentials passed are successfully verified, then 
              |     |        a result with login is sent back to react front-end.
              |     |
              |     |--> Admin Login
              |     |     :- Uses 2nd passport local authentication strategy written in passportConfig.js file.
              |     |        The strategy for voter login and admin login are not the same.
              |     |
              |     |--> Get information of logged in user
              |     |     :- This request will access the serialize and deserialize methods mentioned in 
              |     |        passportConfig.js file and will return the user with a set of details who is 
              |     |        currently successfully logged in using the passport local strategy provided
              |     |        for specific type of user(voter/admin).
              |     |
              |     |--> Clear the session (logout)
              |     |     :- This request clears the details of logged in user from the current session. This will
              |     |        basically prevent further access to specific web urls at front-end.
              |     |
              |     |--> Send OTP
              |     |     :- This request serves sole purpose to send an sms containing a message of otp for the 
              |     |        user(voter), which is to be entered at the time of login.
              |     |        
              |--> Schema: Elections
              |     |--> Get elections based on state
              |     |     :- This request fetches and returns all the elections based on the condition provided, 
              |     |        that is, state which is being requested from the react front-end.
              |     |        3 Types of states: registration / voting / results
              |     |
              |     |--> Get all elections
              |     |     :- This request fetches and returns all the elections irrespective of their state.
              |     |
              |     |--> Register New Election
              |     |     :- This request basically tries to find an election with an empty election address, which
              |     |        always returns no matches. This no match condition is further used to create a new 
              |     |        election entry with all its details.
              |     |
              |     |--> Delete Election
              |     |     :- This request deletes a particular election entry based on the electionAddress sent from 
              |     |        react front-end.
              |     |
              |     |--> Update Election state based on electionAddress
              |     |     :- This request is used to update the state of a particular election based on its
              |     |        electionAddress field. 
              |     |
              |--> Schema: Candidates
              |     |--> Get all Candidates
              |     |     :- Returns all the candidates present in the database with voteCount field set to 0. 
              |     |         
              |     |--> Register Candidates
              |     |     :- This request basically tries to find an candidate with an empty election address, which
              |     |        always returns no matches. This no match condition is further used to create a new 
              |     |        candidate entry with all its details.
              |     |
              |     |--> Get candidates of particular election
              |     |     :- Returns list of all candidates associated with a particular electionAddress received 
              |     |        from react front-end.
              |     |
              |     |--> Delete Candidates of particular election once that election is deleted
              |     |     :- This request removes all the candidates assiciated with the electionAddress specified 
              |     |        and received from react front-end.
              |     |
              |     |--> Delete one Candidate
              |     |     :- This request is used to remove a particular candidate entry from the specified 
              |     |        electionAddress using the candidateId assigned to it during its registration.
              |     |        Note that this function only removes one candidate from the election and not the entire 
              |     |        election details.
              |     |
              |     |--> Update Vote Count after voting
              |     |     :- This request updates the voteCount of specified candidate using its candidateId and 
              |     |        electionAddress for which it belongs.
              |     |
              |--> Schema: CandidateRequests
              |     |--> Register new CandidateRequest
              |     |     :- This request basically tries to find an candidaterequest with an empty election address, 
              |     |        which always returns no matches. This no match condition is further used to create a new 
              |     |        candidaterequest entry with all its details.
              |     |
              |     |--> Get all requested candidates
              |     |     :- This request fetches all the candidaterequests having the field isReq set to true.
              |     |
              |     |--> Change the status of accepted/rejected candidates to accepted
              |     |     :- This request is used to update the status of a particular candidaterequest located 
              |     |        using the provided electionAddress and candidatePrNumber.
              |     |        3 types of status: pending / accepted / rejected 
              |     |
              |     |--> Delete all requests once the election is cancelled
              |     |     :- This request removes all the candidaterequests assiciated with the electionAddress  
              |     |        specified and received from react front-end.
              |     |
              |--> Schema: Voters
              |     |--> Voter Registration
              |     |     :- Registers a voter into the database by first checking if the same prNumber is already
              |     |        present in the database.
              |     |
              |     |--> Search for email based on username entered during voter login for OTP
              |     |     :- Searches for a user with a specified prNumber in order to get Email associated with the 
              |     |        same prNumber.
              |     |
              |--> Schema: Admins
              |     |--> Admin Registration
              |     |     :- Registers a admin into the database by first checking if the same username is already
              |     |        present in the database.
--------------------------------------------------------------------------------------------------------------------------
*/

const f2s_apiKey = process.env.F2S_API_KEY;

//-----------------------------------------------------Database Connection----------------------------------------------//

mongoose.connect(
  process.env.MONGO_DB_API_KEY,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("Mongoose is connected");
  }
);

//-----------------------------------------------------Basic Configuration----------------------------------------------//

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.REACT_FRONT_END_ORIGIN, //<-- location of react app
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SECRET_CODE,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser(process.env.SECRET_CODE));

//-----------------------------------------------------Passport Local configuration for login-------------------------//

app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

//-----------------------------------------------------Server Startup-------------------------------------------------//
app.listen(4000, () => {
  console.log("Server has started.");
});

//------------------------------------------------------Routes for Schemas--------------------------------------------//

//------------------------------------------------------Common Routes/Requests----------------------------------------//

// Voter Login
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send("No User Exists or Invalid Credentials Entered!!!");
    else {
      req.login(user, (err) => {
        res.send("Successfully authenticated");
      });
    }
  })(req, res, next);
});

// Admin Login
app.post("/admin/login", (req, res, next) => {
  passport.authenticate("admin-local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send("No Admin Exists or Invalid Credentials Entered!!!");
    else {
      req.login(user, (err) => {
        res.send("Successfully authenticated");
      });
    }
  })(req, res, next);
});

// Get information of logged in user
app.get("/user", (req, res) => {
  res.send(req.user);
});

// Clear the session (logout)
app.get("/logout", function (req, res) {
  req.logout();
  res.send();
});

// Send OTP
app.post("/sendOTP", async (req, res) => {
  var options = {
    authorization: f2s_apiKey,
    message: "Your OTP is: " + req.body.message,
    numbers: [req.body.number],
  };
  const response = await fast2sms.sendMessage(options);
  res.send(response);
});

//-----------------------------------------------------Schema: Elections---------------------------------------------//

// Get elections based on state
app.post("/getElections", (req, res) => {
  Elections.find({ state: req.body.status }, async (err, doc) => {
    if (err) throw err;
    if (!doc) res.send("No upcoming elections!");
    if (doc) res.send(doc);
  });
});

// Get all elections
app.get("/getAllElections", (req, res) => {
  Elections.find(async (err, doc) => {
    if (doc) res.send(doc);
    if (!doc) res.send("No Elections!");
  });
});

// Register New Election
app.post("/admin/registerElection", (req, res) => {
  Elections.findOne({ electionAddress: "" }, async (err, doc) => {
    if (doc) res.send("Wrong way!!!");
    if (!doc) {
      const newElection = new Elections({
        type: req.body.type,
        electionAddress: req.body.electionAddress,
        adminUsername: req.body.adminUsername,
        college: req.body.college,
        votingStartDateTime: req.body.votingStartDateTime,
        votingEndDateTime: req.body.votingEndDateTime,
        registrationStartDateTime: req.body.registrationStartDateTime,
        registrationEndDateTime: req.body.registrationEndDateTime,
        state: req.body.state,
        voterColleges: {
          checkedGEC: req.body.voterColleges.checkedGEC,
          checkedAITD: req.body.voterColleges.checkedAITD,
          checkedPCCE: req.body.voterColleges.checkedPCCE,
          checkedRIT: req.body.voterColleges.checkedRIT,
          checkedDBCE: req.body.voterColleges.checkedDBCE,
        },
      });
      await newElection.save();
      res.send("Election Created Successfully!");
    }
  });
});

// Delete Election
app.delete("/deleteElection", (req, res) => {
  Elections.deleteOne(
    { electionAddress: req.body.electionAddress },
    async (err, doc) => {
      if (err) throw err;
      if (!doc) res.send("Election not present!");
      if (doc) {
        res.send("Election Deleted Succesfully.");
      }
    }
  );
});

// Update Election state based on electionAddress
app.post("/updateElection", (req, res) => {
  Elections.updateOne(
    {
      electionAddress: req.body.electionAddress,
    },
    { $set: { state: req.body.status } },
    function (err, doc) {
      if (err) res.send(err);
      if (!doc) res.send("No doc");
      if (doc) res.send("Election Updated Successfully!");
    }
  );
});

//-----------------------------------------------------Schema: Candidates--------------------------------------------//

// Get all Candidates
app.get("/getAllCandidates", (req, res) => {
  Candidates.find({ voteCount: 0 }, async (err, doc) => {
    if (doc) res.send(doc);
    if (!doc) res.send("No Candidates!");
  });
});

// Register Candidates
app.post("/registerCandidate", (req, res) => {
  Candidates.findOne({ electionAddress: "" }, async (err, doc) => {
    if (doc) res.send("Wrong way!!!");
    if (!doc) {
      const newCandidate = new Candidates({
        electionAddress: req.body.electionAddress,
        candidateId: req.body.candidateId,
        candidateName: req.body.candidateName,
        candidatePrNumber: req.body.candidatePrNumber,
        gender: req.body.gender,
        college: req.body.college,
        department: req.body.department,
        voteCount: req.body.voteCount,
        description: req.body.description,
      });
      await newCandidate.save();
      res.send("Candidate Registered Successfully!");
    }
  });
});

// Get candidates of particular election
app.post("/getCandidates", (req, res) => {
  Candidates.find(
    { electionAddress: req.body.electionAddress },
    async (err, doc) => {
      if (err) throw err;
      if (!doc) res.send("No!");
      if (doc) res.send(doc);
    }
  );
});

// Delete Candidates of particular election once that election is deleted
app.delete("/deleteElectionCandidates", (req, res) => {
  Candidates.deleteMany(
    { electionAddress: req.body.electionAddress },
    async (err, doc) => {
      if (err) throw err;
      if (!doc) res.send("Election not present!");
      if (doc) {
        res.send("Candidates Deleted Succesfully.");
      }
    }
  );
});

// Delete one Candidate
app.delete("/deleteCandidate", (req, res) => {
  Candidates.deleteOne(
    {
      electionAddress: req.body.electionAddress,
      candidateId: req.body.candidateId,
    },
    async (err, doc) => {
      if (err) throw err;
      if (!doc) res.send("Candidate not present!");
      if (doc) {
        res.send("Candidates Deleted Succesfully.");
      }
    }
  );
});

// Update Vote Count after voting
app.post("/updateVoteCount", (req, res) => {
  Candidates.updateOne(
    {
      electionAddress: req.body.electionAddress,
      candidateId: req.body.candidateId,
    },
    { $set: { voteCount: req.body.voteCount } },
    function (err, doc) {
      if (err) res.send(err);
      if (!doc) res.send("No doc");
      if (doc) res.send("Vote Casted Successfully!");
    }
  );
});

//-----------------------------------------------------Schema: CandidateRequests-----------------------------------------//

// Register new CandidateRequest
app.post("/registerCandidateRequest", (req, res) => {
  Candidaterequests.findOne({ electionAddress: "" }, async (err, doc) => {
    if (doc) res.send("Wrong way!!!");
    if (!doc) {
      const candidateRequest = new Candidaterequests({
        electionAddress: req.body.electionAddress,
        candidateName: req.body.candidateName,
        candidatePrNumber: req.body.prNumber,
        gender: req.body.gender,
        college: req.body.college,
        department: req.body.department,
        description: req.body.description,
        status: req.body.status,
        isReq: true,
      });
      await candidateRequest.save();
      res.send("Application Submitted Successfully!");
    }
  });
});

// Get all requested candidates
app.get("/getCandidateRequest", (req, res) => {
  Candidaterequests.find({ isReq: true }, async (err, doc) => {
    if (err) throw err;
    if (!doc) res.send("No!");
    if (doc) res.send(doc);
  });
});

// Change the status of accepted/rejected candidates to accepted
app.post("/updateCandidateRequests", (req, res) => {
  Candidaterequests.updateOne(
    {
      electionAddress: req.body.electionAddress,
      candidatePrNumber: req.body.candidatePrNumber,
    },
    { $set: { status: req.body.status } },
    function (err, doc) {
      if (doc) res.send("Updated Successfully!");
    }
  );
});

// Delete all requests once the election is cancelled
app.delete("/deleteElectionCandidateRequests", (req, res) => {
  Candidaterequests.deleteMany(
    { electionAddress: req.body.electionAddress },
    async (err, doc) => {
      if (err) throw err;
      if (!doc) res.send("Election not present!");
      if (doc) {
        res.send("Election & candidates Deleted Succesfully.");
      }
    }
  );
});

//----------------------------------------------------------Schema: Voters--------------------------------------------//

// Voter Registration
app.post("/register", (req, res) => {
  Voters.findOne({ prNumber: req.body.prNumber }, async (err, doc) => {
    if (err) throw err;
    if (doc) res.send("User Alerady exists");
    if (!doc) {
      //password hasing
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const newUser = new Voters({
        password: hashedPassword,
        prNumber: req.body.prNumber,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        middlename: req.body.middlename,
        gender: req.body.gender,
        dob: req.body.dob,
        mobile: req.body.mobile,
        email: req.body.email,
        college: req.body.college,
        department: req.body.department,
        rollNumber: req.body.rollNumber,
        year: req.body.year,
        walletAddress: req.body.walletAddress,
        privateKey: req.body.privateKey,
        isAdmin: req.body.isAdmin,
      });
      await newUser.save();
      res.send("User Created Successfully");
    }
  });
});

// Search for email based on username entered during voter login for OTP
app.post("/getEmail", (req, res) => {
  Voters.findOne({ prNumber: req.body.username }, async (err, doc) => {
    if (err) throw err;
    if (doc) res.send(doc);
  });
});

//-------------------------------------------------------Schema: Admins----------------------------------------------//

// Admin Registration
app.post("/admin/register", (req, res) => {
  Admins.findOne({ username: req.body.username }, async (err, doc) => {
    if (err) throw err;
    if (doc) res.send("Admin Alerady exists");
    if (!doc) {
      //password hasing
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const newAdmin = new Admins({
        password: hashedPassword,
        fullname: req.body.fullname,
        username: req.body.username,
        college: req.body.college,
        isAdmin: req.body.isAdmin,
      });

      await newAdmin.save();
      res.send("Admin Created Successfully");
    }
  });
});
