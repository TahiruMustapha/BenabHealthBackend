const express = require("express");
const router = express.Router();
const User = require("../models/userModels");
const Doctor = require("../models/doctorModels");
const Appointment = require("../models/appointmentModels");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const authMiddleware = require("../Middleware/authMiddleware");
router.post("/register", async (req, res) => {
  try {
    const userExist = await User.findOne({ email: req.body.email });
    if (userExist) {
      res.status(200).send({ message: "user already exist!", success: false });
    }
    const password = req.body.password;
    const saltround = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, saltround);
    req.body.password = hashedPassword;
    const newUser = new User(req.body);
    await newUser.save();
    res
      .status(200)
      .send({ message: "User created successfully!", success: true });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error creating user!", success: false, error });
  }
});
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(400)
        .send({ message: "Invalid credentials!", success: false });
    }
    const isMatch = await bcryptjs.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ message: "Invalid credentials!", success: false });
    } else {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.status(200).send({
        message: "Login Successfull",
        success: true,
        data: token,
        user,
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error loging in to home!", success: fales });
  }
});
router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res
        .status(200)
        .send({ message: "User doesn't exist!", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info!!", success: false, error });
  }
});
router.post("/get-doctor-info-by-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.body.userId });

    if (!doctor) {
      return res
        .status(200)
        .send({ message: "Doctor doesn't exist!", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: doctor,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting doctor info!!", success: false, error });
  }
});
router.get("/get-doctor-info", (req, res) => {
  Doctor.find()
    .then((doctors) => res.json(doctors))
    .catch((err) => res.json(err));
});
router.get("/get-user-info", (req, res) => {
  User.find()
    .then((user) => res.json(user))
    .catch((err) => res.json(err));
});
router.get("/get-user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const users = await User.findById(id);

    if (!users) {
      return res.status(404).json({ message: "User not found" });
    }
    if (users.isDoctor) {
      const doctor = await Doctor.findOne({ userId: id });

      if (!doctor) {
        return res.status(404).json({ message: "Doctor details not found" });
      }
      return res.status(200).json({ users, doctor });
    } else {
      return res.status(200).json({ users });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data", error });
  }
});
router.put("/doctors/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      {
        status: "Approved",
      },
      { new: true }
    );
    const approvedDoctor = await User.findOne({ _id: updatedDoctor?.userId });
    const unseenNotifications = approvedDoctor.unseenNotifications;
    unseenNotifications.push({
      type: "new-doctor-approved",
      message: `${approvedDoctor?.name}  your doctor account has been approved!`,
      data: {
        doctorId: updatedDoctor?._id,
        name: updatedDoctor?.name,
      },
      onClickPath: "/doctor-home",
    });
    await User.findByIdAndUpdate(approvedDoctor._id, { unseenNotifications });
    // console.log(approvedDoctor);
    res.status(200).json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ message: "Error updating doctor status", error });
  }
});
router.put("/approve-appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        status: "Approved",
      },
      { new: true }
    );

    res.status(200).json(updatedAppointment);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating appointment status", error });
  }
});
router.get("/doctors-home/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      res.status(404).json({ message: "Doctor not found!" });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctor!" });
  }
});
router.get("/approved-doctors", async (req, res) => {
  try {
    const approvedDoctors = await Doctor.find({ status: "Approved" });
    // const doctorUser = await User.findOne({ isDoctor: true });
    // const unseenNotifications = doctorUser.unseenNotifications;
    // unseenNotifications.push({
    //   type: "new-doctor-approved",
    //   message: `${doctorUser.name}  your doctor account has been approved!`,
    //   data: {
    //     doctorId: doctorUser._id,
    //     name: doctorUser.name,
    //   },
    //   onClickPath: "/doctor-home",
    // });
    // // console.log(doctorUser);
    // await User.findByIdAndUpdate(doctorUser._id, { unseenNotifications });
    res.status(200).json(approvedDoctors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching approved doctors!" });
  }
});
router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
  try {
    const newDoctor = new Doctor({ ...req.body, status: "Pending" });
    await newDoctor.save();
    const adminUser = await User.findOne({ isAdmin: true });
    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a doctor account!`,
      data: {
        doctorId: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
      },
      onClickPath: "/doctors",
    });
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res.status(200).send({
      success: true,
      message: "Doctor account applied successfully!",
    });
  } catch (error) {
    res.status(500).send({
      message: "Error applying doctor account!",
      success: false,
      error,
    });
  }
});
router.post(
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      //DOCTORS NOTIFICATIONS
      const doctor = await Doctor.findOne({ _id: req.body.doctorId });
      const doctorUnseenNotifications = doctor.unseenNotifications;
      const doctorSeenNotifications = doctor.seenNotifications;
      doctorSeenNotifications.push(...doctorUnseenNotifications);
      doctor.unseenNotifications = [];
      doctor.seenNotifications = doctorSeenNotifications;
      const updatedDoctor = await doctor.save();

      //NORMAL USER NOTIFICATIONS
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotifications = user.unseenNotifications;
      const seenNotifications = user.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen!",
        data: updatedUser,
        updatedDoctor,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error applying doctor account!",
        success: false,
        error,
      });
    }
  }
);
router.post(
  "/mark-all-doctor-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ _id: req.body.doctorId });
      const unseenNotifications = doctor.unseenNotifications;
      const seenNotifications = doctor.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      doctor.unseenNotifications = [];
      doctor.seenNotifications = seenNotifications;
      const updatedDoctor = await doctor.save();
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen!",
        data: updatedDoctor,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error with doctor notifications!",
        success: false,
        error,
      });
    }
  }
);
router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    //DOCTOR NOTIFICATIONS
    const doctor = await Doctor.findOne({ _id: req.body.doctorId });
    doctor.seenNotifications = [];
    doctor.unseenNotifications = [];
    const updatedDoctor = await doctor.save();
    //NORMAL USER NOTIFICATIONS
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotifications = [];
    user.unseenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications deleted!",
      data: updatedUser,
      updatedDoctor,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error applying doctor account!",
      success: false,
      error,
    });
  }
});
router.post(
  "/delete-all-doctor-notifications",
  authMiddleware,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ _id: req.body.doctorId });
      doctor.seenNotifications = [];
      doctor.unseenNotifications = [];
      const updatedDoctor = await doctor.save();
      res.status(200).send({
        success: true,
        message: "All notifications deleted!",
        data: updatedDoctor,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error applying doctor account!",
        success: false,
        error,
      });
    }
  }
);
router.put("/doctor-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDoctorProfile = await Doctor.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedDoctorProfile);
  } catch (error) {
    res.status(500).json({ message: "Error updating doctor profile", error });
  }
});
router.put("/user-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUserProfile = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedUserProfile);
  } catch (error) {
    res.status(500).json({ message: "Error updating user profile", error });
  }
});
// Fetch doctor's available timings
router.get("/doctors/:id/timings", async (req, res) => {
  const { id } = req.params;
  const doctor = Doctor.findById(id);
  if (doctor) {
    res.json(doctor.timings);
  } else {
    res.status(404).json({ message: "Doctor not found" });
  }
});
// Check doctor availability
router.post("/doctors/:id/check-availability", async (req, res) => {
  const { startTime, endTime } = req.body;
  const { id } = req.params;
  try {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Ensure timings is an array of date strings
    if (!Array.isArray(doctor.timings) || doctor.timings.length !== 2) {
      console.error(
        "Doctor timings is not an array or is not properly defined:",
        doctor.timings
      );
      return res.status(500).json({ error: "Invalid doctor timings data" });
    }

    // Convert timings to Date objects
    const [availableStartTime, availableEndTime] = doctor.timings.map(
      (time) => new Date(time)
    );

    // Parse incoming times from request
    const userStartTime = new Date(startTime);
    const userEndTime = new Date(endTime);

    // if (isNaN(userStartTime.getTime()) || isNaN(userEndTime.getTime())) {
    //   return res.status(400).json({ error: "Invalid start or end time" });
    // }

    // Check if the requested time range overlaps with doctor's availability
    const isAvailable =
      userStartTime >= availableStartTime && userEndTime <= availableEndTime;

    if (!isAvailable) {
      return res.json({ message: "Doctor  available!", available: true });
    } else {
      return res.json({ message: "Doctor not  available!", available: false });
    }
  } catch (error) {
    console.error("Error checking availability:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
// Handle appointment booking
router.post("/appointments", async (req, res) => {
  const { doctor, user, appointmentId, date, time } = req.body;

  try {
    const appointment = new Appointment({
      userId: appointmentId,
      doctor,
      user,
      date,
      time,
    });
    const savedAppointment = await appointment.save();
    const doctorUser = await Doctor.findOne({
      _id: savedAppointment.doctor?._id,
    });

    const userInfo = await User.findOne({ _id: savedAppointment.user?._id });
    // console.log("doctor Account", doctorUser, "User Account", userInfo);
    const unseenNotifications = doctorUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-appointment-request",
      message: `${userInfo.name} just booked an appointment!`,
      data: {
        userId: savedAppointment.user?._id,
        name: userInfo.name,
      },
      onClickPath: "/doctor-appointments",
    });
    await doctorUser.save();
    res.status(201).json({
      data: savedAppointment,
      success: true,
      message: "Appointment made successful!",
    });
  } catch (error) {
    res.status(500).json({ mssage: "Cannot make appointment!", error });
  }
});
router.get("/user-appointments/:userId", async (req, res) => {
  try {
    const appointment = await Appointment.find({ user: req.params.userId })
      .populate("doctor", "firstName lastName phoneNumber")
      .populate("user");

    if (!appointment) {
      return res
        .status(404)
        .json({ error: "No appointments found for this user" });
    }
    return res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch appointment!" });
  }
});
router.get("/doctor-appointments/:doctorId", async (req, res) => {
  try {
    const appointment = await Appointment.find({
      doctor: req.params.doctorId,
    })
      .populate("doctor")
      .populate("user");

    if (!appointment) {
      return res
        .status(404)
        .json({ error: "No appointments made for this docoter!" });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch doctor appointment!" });
  }
});

module.exports = router;
