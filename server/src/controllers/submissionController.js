import mongoose from "mongoose";
import ContactMessage from "../models/ContactMessage.js";
import Subscriber from "../models/Subscriber.js";

export async function listContactMessages(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const [messages, total] = await Promise.all([
    ContactMessage.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ContactMessage.countDocuments(),
  ]);

  return res.json({
    success: true,
    data: messages,
    pagination: { page, limit, total },
  });
}

export async function updateContactStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid contact message id.",
    });
  }

  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Contact message not found.",
    });
  }

  return res.json({ success: true, data: message });
}

export async function createContactMessage(req, res) {
  await ContactMessage.create(req.body);

  return res.status(201).json({
    success: true,
    message: "Thank you. Your message has been received.",
  });
}

export async function subscribeToNewsletter(req, res) {
  await Subscriber.updateOne(
    { email: req.body.email.toLowerCase() },
    { $setOnInsert: { email: req.body.email.toLowerCase() } },
    { upsert: true }
  );

  return res.status(200).json({
    success: true,
    message: "You are subscribed to Everlast updates.",
  });
}
