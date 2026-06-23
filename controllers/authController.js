import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '1h' }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
  return { accessToken, refreshToken };
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = generateTokens(user);
    sendSuccess(res, {
      ...tokens,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new AppError('User not found', 401);
    }

    const tokens = generateTokens(user);
    sendSuccess(res, {
      ...tokens,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError('Invalid refresh token', 401));
  }
};

export const getMe = async (req, res) => {
  sendSuccess(res, req.user);
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, null, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: 'Staff' }).sort({ createdAt: -1 });
    sendSuccess(res, staff);
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      throw new AppError('Email already in use', 400);
    }

    const staff = await User.create({ name, email, password, phone, role: 'Staff' });
    sendSuccess(res, staff, 201, 'Staff created successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteStaff = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw new AppError('Staff not found', 404);
    }
    sendSuccess(res, null, 200, 'Staff removed successfully');
  } catch (error) {
    next(error);
  }
};
