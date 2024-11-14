const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require('cors');
app.use(cors()); // turn on CORS

const mongoUrl =
  "mongodb+srv://hieumai1507:Hieumai1507!@cluster0.she0k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const JWT_SECRET =
  "EmHiuDemaciaCupKhongTheThuaConVoNao";
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((e) => {
    console.log(e);
  });

  //Import the User Details
require("./UserDetails");
const User = mongoose.model("UserInfo");

// Import the LeaveRequest model
require("./LeaveRequest"); 
const LeaveRequest = mongoose.model("LeaveRequest");

app.get("/", (req, res) => {
  res.send({ status: "Started" });
});

app.post("/register", async (req, res) => {
  const { name, email, mobile, password, userType } = req.body;
  console.log(req.body);

  const oldUser = await User.findOne({ email: email });

  if (oldUser) {
    return res.status(400).send({ data: "User already exists!!" });
  }
  const encryptedPassword = await bcrypt.hash(password, 10);

  try {
    await User.create({
      name: name,
      email: email,
      mobile,
      password: encryptedPassword,
      userType,
    });
    res.send({ status: "ok", data: "User Created" });
  } catch (error) {
    res.send({ status: "error", data: error });
  }
});

app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  const oldUser = await User.findOne({ email: email });

  if (!oldUser) {
    return res.send({status:"error", data: "User doesn't exists!!" }); //COnsistent status: "error"
  }

  if (await bcrypt.compare(password, oldUser.password)) {
    const token = jwt.sign({ email: oldUser.email }, JWT_SECRET);
    console.log(token);
      return res.status(200).send({
        status: "ok",
        data: token,
        userType: oldUser.userType,
      });
  
  } 
  // Crucial: Send a response for incorrect password. Use 401 Unauthorized
  else {
    return res.status(401).send({ status: "error", data: "Invalid Password"});
  }
});

app.post("/userdata", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;

    User.findOne({ email: useremail }).then((data) => {
      return res.send({ status: "Ok", data: data });
    });
  } catch (error) {
    return res.send({ error: error });
  }
});

app.post("/update-user", async (req, res) => {
  const { name, email, mobile, image, gender, department } = req.body;
  console.log(req.body);
  try {
    await User.updateOne(
      { email: email },
      {
        $set: {
          name,
          mobile,
          image,
          gender,
          department,
        },
      }
    );
    res.send({ status: "Ok", data: "Updated" });
  } catch (error) {
    return res.send({ error: error });
  }
});

app.get("/get-all-user", async (req, res) => {
  try {
    const data = await User.find({});
    res.send({ status: "Ok", data: data });
  } catch (error) {
    console.error("Error fetching all users", error);
    return res.send({ error: error });
  }
});

app.post("/delete-user",async (req, res) => {
 const {id}=req.body;
 try {
  await User.deleteOne({_id:id});
  res.send({status:"Ok",data:"User Deleted"});
 } catch (error) {
  return res.send({ error: error });
  
 }
})
// post /create-leave-request
app.post("/create-leave-request", async (req, res) => {
  console.log("Request body:", req.body);
  const { token, type, time, date, reason, thoiGianVangMat, timeOfDay } = req.body;
  if(!token || !type || !date || !reason) {
    return res.status(400).send({status: "error", data:"Missing required fields"});
  }
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    //Log the data before saving
    console.log("Creating request with data:", { /* ... data to be saved ...*/ })
    const newRequest = await LeaveRequest.create({
      userEmail,
      type,
      //store time as string if it's "Buổi sáng/ chiều/ Cả ngày"
      time: type === 'Xin nghỉ' ? null : time,// only store time ì not "Xin nghỉ"
      timeOfDay: type === 'Xin nghỉ' ? timeOfDay: null,//only store timeOfDay if 'Xin nghỉ'
      date,
      reason,
      thoiGianVangMat,
      status: "Pending",
    });
    console.log("Request created successfully", newRequest);
    res.send({ status: "ok", data: newRequest });
  } catch (error) {
    res.status(500).send({ status: "error", data: error.message });
    console.log("Error creating request", error);
  }
});

// get /get-leave-request
app.get("/get-leave-requests", async (req, res) => {
  const { token } = req.query; // Use query parameters for GET requests

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;

    const requests = await LeaveRequest.find({ userEmail });
    res.send({ status: "ok", data: requests });
  } catch (error) {
    res.send({ status: "error", data: error });
  }
});

// post /update-leave-request-status
app.post("/update-leave-request-status", async (req, res) => {
  const { requestId, status } = req.body;

  try {
    const updatedRequest = await LeaveRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true } // Return the updated document
    );

    res.send({ status: "ok", data: updatedRequest });
  } catch (error) {
    res.send({ status: "error", data: error });
  }
});

// get /get-all-leave-requests
app.get("/get-all-leave-requests", async (req, res) => {
  try {
    const requests = await LeaveRequest.find({});
    res.send({ status: "ok", data: requests });
  } catch (error) {
    console.error("Error detching all leave requests: ", error);
    res.status(500).send({ status: "error", data: "Error fetching leave requests" }); // Send a 500 error message
  }
});



app.listen(5001, () => {
  console.log("Node js server started.");
});