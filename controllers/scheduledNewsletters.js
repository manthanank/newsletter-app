const ScheduledNewsletter = require("../models/scheduledNewsletters");
const Subscribers = require("../models/subscribers");
const { sendNewsletter } = require("../utils/newsletter");

// Get all scheduled newsletters
exports.getAllScheduledNewsletters = async (req, res, next) => {
  try {
    const newsletters = await ScheduledNewsletter.find().sort({
      scheduledDate: 1,
    });
    res.status(200).json(newsletters);
  } catch (error) {
    console.error("Error fetching scheduled newsletters:", error);
    next(error);
  }
};

// Get a scheduled newsletter by ID
exports.getScheduledNewsletterById = async (req, res, next) => {
  try {
    const newsletter = await ScheduledNewsletter.findById(req.params.id);
    if (!newsletter) {
      return res
        .status(404)
        .json({ message: "Scheduled newsletter not found" });
    }
    res.status(200).json(newsletter);
  } catch (error) {
    console.error("Error fetching scheduled newsletter:", error);
    next(error);
  }
};

// Create a new scheduled newsletter
exports.createScheduledNewsletter = async (req, res, next) => {
  try {
    const { name, subject, content, scheduledDate, targetGroups } = req.body;

    if (!name || !subject || !content || !scheduledDate) {
      return res
        .status(400)
        .json({
          message: "Please provide name, subject, content, and scheduledDate",
        });
    }

    const newNewsletter = new ScheduledNewsletter({
      name,
      subject,
      content,
      scheduledDate: new Date(scheduledDate),
      targetGroups: targetGroups || [],
    });

    const savedNewsletter = await newNewsletter.save();
    res.status(201).json(savedNewsletter);
  } catch (error) {
    console.error("Error creating scheduled newsletter:", error);
    next(error);
  }
};

// Update a scheduled newsletter
exports.updateScheduledNewsletter = async (req, res, next) => {
  try {
    const { name, subject, content, scheduledDate, targetGroups, status } =
      req.body;

    const updatedNewsletter = await ScheduledNewsletter.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          subject,
          content,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
          targetGroups,
          status,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedNewsletter) {
      return res
        .status(404)
        .json({ message: "Scheduled newsletter not found" });
    }

    res.status(200).json(updatedNewsletter);
  } catch (error) {
    console.error("Error updating scheduled newsletter:", error);
    next(error);
  }
};

// Delete a scheduled newsletter
exports.deleteScheduledNewsletter = async (req, res, next) => {
  try {
    const deletedNewsletter = await ScheduledNewsletter.findByIdAndDelete(
      req.params.id
    );

    if (!deletedNewsletter) {
      return res
        .status(404)
        .json({ message: "Scheduled newsletter not found" });
    }

    res
      .status(200)
      .json({ message: "Scheduled newsletter deleted successfully" });
  } catch (error) {
    console.error("Error deleting scheduled newsletter:", error);
    next(error);
  }
};

// Send a scheduled newsletter immediately
exports.sendScheduledNewsletter = async (req, res, next) => {
  const apiBaseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
  try {
    const newsletter = await ScheduledNewsletter.findById(req.params.id);

    if (!newsletter) {
      return res
        .status(404)
        .json({ message: "Scheduled newsletter not found" });
    }

    // Query to find subscribers based on target groups
    let subscriberQuery = { subscribed: true };
    if (newsletter.targetGroups && newsletter.targetGroups.length > 0) {
      subscriberQuery.groups = { $in: newsletter.targetGroups };
    }

    const subscribers = await Subscribers.find(subscriberQuery);

    if (subscribers.length === 0) {
      return res
        .status(400)
        .json({ message: "No subscribers found for this newsletter" });
    }

    let sentCount = 0;

    for (const subscriber of subscribers) {
      // Add unsubscribe link to the content
      const unsubscribeLink = `${apiBaseUrl}/unsubscribe?email=${subscriber.email}`;
      let emailContent =
        newsletter.content +
        `<p><a href="${unsubscribeLink}">Unsubscribe</a></p>`;

      // Replace any personalization tokens with subscriber data
      emailContent = emailContent
        .replace(/{{name}}/g, subscriber.name || "Subscriber")
        .replace(/{{email}}/g, subscriber.email);

      // Add tracking pixel for open rate tracking (implementation would require additional setup)
      const trackingPixel = `<img src="${apiBaseUrl}/api/track-open?id=${newsletter._id}&email=${subscriber.email}" width="1" height="1" />`;
      const emailContentWithTracking = emailContent + trackingPixel;

      // Send email
      sendNewsletter(
        subscriber.email,
        newsletter.subject,
        emailContentWithTracking
      );
      sentCount++;
    }

    // Update newsletter status
    newsletter.status = "sent";
    newsletter.sentAt = new Date();
    newsletter.analytics.sent = sentCount;
    await newsletter.save();

    res.status(200).json({
      message: `Newsletter sent to ${sentCount} subscribers`,
      newsletter,
    });
  } catch (error) {
    console.error("Error sending scheduled newsletter:", error);
    next(error);
  }
};
