import Customer from "../models/customer.model.js";
import bcrypt from "bcrypt";
import gentoken from "../utils/generateToken.js";

const cokkieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
};

export const registerCustomer = async (req, res) => {
  try {
    const fullname = req.body.fullname?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const phone = req.body.phone?.trim();

    if (!fullname || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields required" });
    }

    const emailexists = await Customer.findOne({ email });

    if (emailexists) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    if (password.length < 7) {
      return res.status(400).json({
        message: "Password must be at least 7 characters",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = bcrypt.hashSync(password, salt);

    //all checks done now create Customer
    const newCustomer = await Customer.create({
      fullname,
      password: hashedPassword,
      email,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: newCustomer._id,
        fullname: newCustomer.fullname,
        email: newCustomer.email,
        phone: newCustomer.phone,
        role: newCustomer.role,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Please check the account details and try again" });
    }
    res.status(500).json({ message: "Unable to register Customer" });
  }
};

export const LoginCustomer = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ message: "All fields are required" });
    }
    const Customerexists = await Customer.findOne({ email });

    if (!Customerexists) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const correctPassword = bcrypt.compareSync(
      password,
      Customerexists.password,
    );
    if (!correctPassword) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }
    const token = gentoken(Customerexists._id);
    // console.log(token);
    res.cookie("token", token, cokkieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: {
        _id: Customerexists._id,
        fullname: Customerexists.fullname,
        email: Customerexists.email,
        phone: Customerexists.phone,
        role: Customerexists.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to Login Customer" }, error);
  }
};

export const getCustomer = (req, res) => {
  return res.status(200).json({
    success: true,
    customer: {
      _id: req.user._id,
      fullname: req.user.fullname,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    },
  });
};

export const logoutCustomer = (req, res) => {
  res.clearCookie("token");

  return res.status(200).json({
    success: true,
    message: "Logged Out Successfully",
  });
};

export const changedPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old Password and new Password",
      });
    }

    const isCorrect = bcrypt.compareSync(oldPassword, req.user.password);

    if (!isCorrect) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "password length must be 6 characters or more" });
    }
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = bcrypt.hashSync(newPassword, salt);

    //update original password
    req.user.password = newHashedPassword;
    await req.user.save();

    return res.status(200).json({ message: "Password updated succesfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Unable to change password",
    });
  }
};
