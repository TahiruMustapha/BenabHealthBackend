const mongoose = require("mongoose");
const { required } = require("nodemon/lib/config");

const AppointmentSchemah = new mongoose.Schema(
  {
    // appointmentId: {
    //   type: String,
    // },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      // required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctors",
      // required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: Array,
      required: true,
    },
  },
  { timestamps: true }
);
const appointmentModel = mongoose.model("appointments", AppointmentSchemah);
module.exports = appointmentModel;
