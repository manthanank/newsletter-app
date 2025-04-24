const Subscribers = require("../models/subscribers.js");
const { sendNewsletter } = require("../utils/newsletter.js");

exports.createSubscribers = async (req, res, next) => {
  const { email, name, groups } = req.body;

  try {
    // Check if the email already exists in the database
    const existingSubscriber = await Subscribers.findOne({ email });

    if (existingSubscriber) {
      // Email already exists, send a message
      return res
        .status(200)
        .json({
          message:
            "Email already subscribed. Check your email for the welcome newsletter.",
        });
    }

    // Email doesn't exist, save to the database
    const newSubscriber = new Subscribers({
      email,
      name: name || "",
      groups: groups || [],
    });
    const savedSubscriber = await newSubscriber.save();

    // Send a welcome newsletter
    const welcomeSubject = "Welcome to Our Newsletter!";
    let welcomeContent = "<p>Thank you for subscribing to our newsletter!</p>";
    // unsubscribe link
    const apiBaseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    welcomeContent += `<p><a href="${apiBaseUrl}/unsubscribe?email=${email}">Unsubscribe</a></p>`;
    sendNewsletter(email, welcomeSubject, welcomeContent);

    res.status(201).json({
      message:
        "Subscription successful! Check your email for a welcome newsletter.",
      subscriber: savedSubscriber,
    });
  } catch (error) {
    // Handle database or other errors
    console.error("Error creating subscription:", error);
    next(error);
  }
};

exports.deleteSubscribers = async (req, res, next) => {
  const email = req.body.email;

  try {
    // Check if the email exists in the database
    const existingSubscriber = await Subscribers.findOne({ email });

    if (!existingSubscriber) {
      // Email doesn't exist, send a message
      return res
        .status(404)
        .json({ message: "Email not found. No action taken." });
    }

    // Email exists, delete from the database
    await Subscribers.deleteOne({ email });

    res.status(200).json({ message: "Unsubscription successful!" });
  } catch (error) {
    // Handle database or other errors
    console.error("Error deleting subscription:", error);
    next(error);
  }
};

// Get all subscribers
exports.getAllSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Subscribers.find().sort({ subscriptionDate: -1 });
    res.status(200).json(subscribers);
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    next(error);
  }
};

// Get subscribers by group
exports.getSubscribersByGroup = async (req, res, next) => {
  const { group } = req.params;

  try {
    const subscribers = await Subscribers.find({
      groups: group,
      subscribed: true,
    });
    res.status(200).json(subscribers);
  } catch (error) {
    console.error("Error fetching subscribers by group:", error);
    next(error);
  }
};

// Update subscriber
exports.updateSubscriber = async (req, res, next) => {
  const { email } = req.params;
  const { name, groups, subscribed } = req.body;

  try {
    const subscriber = await Subscribers.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    if (name !== undefined) subscriber.name = name;
    if (groups !== undefined) subscriber.groups = groups;
    if (subscribed !== undefined) subscriber.subscribed = subscribed;

    subscriber.lastActivityDate = new Date();

    const updatedSubscriber = await subscriber.save();
    res.status(200).json(updatedSubscriber);
  } catch (error) {
    console.error("Error updating subscriber:", error);
    next(error);
  }
};

// Get all available subscriber groups
exports.getAllGroups = async (req, res, next) => {
  try {
    // Aggregate unique groups across all subscribers
    const groups = await Subscribers.aggregate([
      { $unwind: "$groups" },
      { $group: { _id: "$groups" } },
      { $project: { _id: 0, name: "$_id" } },
    ]);

    res.status(200).json(groups.map((g) => g.name));
  } catch (error) {
    console.error("Error fetching subscriber groups:", error);
    next(error);
  }
};

// Add subscriber to group
exports.addToGroup = async (req, res, next) => {
  const { email } = req.params;
  const { group } = req.body;

  try {
    const subscriber = await Subscribers.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    if (!subscriber.groups.includes(group)) {
      subscriber.groups.push(group);
      subscriber.lastActivityDate = new Date();
      await subscriber.save();
    }

    res.status(200).json(subscriber);
  } catch (error) {
    console.error("Error adding subscriber to group:", error);
    next(error);
  }
};

// Remove subscriber from group
exports.removeFromGroup = async (req, res, next) => {
  const { email, group } = req.params;

  try {
    const subscriber = await Subscribers.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    subscriber.groups = subscriber.groups.filter((g) => g !== group);
    subscriber.lastActivityDate = new Date();
    await subscriber.save();

    res.status(200).json(subscriber);
  } catch (error) {
    console.error("Error removing subscriber from group:", error);
    next(error);
  }
};
