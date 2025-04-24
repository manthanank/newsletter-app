// src/newsletter.js
const nodemailer = require("nodemailer");
const ScheduledNewsletter = require("../models/scheduledNewsletters");
const Subscribers = require("../models/subscribers");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send a single newsletter to one recipient
const sendNewsletter = (email, subject, content) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: content,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};

// Process scheduled newsletters that are due
const processScheduledNewsletters = async () => {
  const apiBaseUrl = process.env.BASE_URL || 'http://localhost:3000';

  try {
    const now = new Date();

    // Find newsletters that are scheduled for now or in the past and still have 'scheduled' status
    const dueNewsletters = await ScheduledNewsletter.find({
      scheduledDate: { $lte: now },
      status: "scheduled",
    });

    for (const newsletter of dueNewsletters) {
      // Find subscribers matching the target groups (if any)
      let subscriberQuery = { subscribed: true };
      if (newsletter.targetGroups && newsletter.targetGroups.length > 0) {
        subscriberQuery.groups = { $in: newsletter.targetGroups };
      }

      const subscribers = await Subscribers.find(subscriberQuery);

      if (subscribers.length === 0) {
        newsletter.status = "failed";
        await newsletter.save();
        continue;
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const subscriber of subscribers) {
        try {
          // Add unsubscribe link and tracking pixel
          const unsubscribeLink = `${apiBaseUrl}/unsubscribe?email=${subscriber.email}`;
          let emailContent =
            newsletter.content +
            `<p><a href="${unsubscribeLink}">Unsubscribe</a></p>`;

          // Add tracking pixel for open rate tracking
          const trackingPixel = `<img src="${apiBaseUrl}/api/track-open?id=${newsletter._id}&email=${subscriber.email}" width="1" height="1" />`;
          emailContent += trackingPixel;

          // Replace any personalization tokens with subscriber data
          emailContent = emailContent
            .replace(/{{name}}/g, subscriber.name || "Subscriber")
            .replace(/{{email}}/g, subscriber.email);

          await sendNewsletter(
            subscriber.email,
            newsletter.subject,
            emailContent
          );
          sentCount++;
        } catch (error) {
          failedCount++;
        }
      }

      // Update newsletter status and analytics
      newsletter.status =
        failedCount === subscribers.length ? "failed" : "sent";
      newsletter.sentAt = new Date();
      newsletter.analytics.sent = sentCount;
      await newsletter.save();
    }
  } catch (error) {
    console.error("Error processing scheduled newsletters:", error);
  }
};

// Track newsletter opens by subscriber
const trackNewsletterOpen = async (newsletterId, subscriberEmail) => {
  try {
    const newsletter = await ScheduledNewsletter.findById(newsletterId);
    if (!newsletter) return;

    // Increment open count
    newsletter.analytics.opened += 1;
    await newsletter.save();

    // Update subscriber's last activity
    const subscriber = await Subscribers.findOne({ email: subscriberEmail });
    if (subscriber) {
      subscriber.lastActivityDate = new Date();
      await subscriber.save();
    }
  } catch (error) {
    console.error("Error tracking newsletter open:", error);
  }
};

// Track link clicks in newsletters
const trackLinkClick = async (newsletterId, subscriberEmail, linkUrl) => {
  try {
    const newsletter = await ScheduledNewsletter.findById(newsletterId);
    if (!newsletter) return;

    // Increment click count
    newsletter.analytics.clicked += 1;
    await newsletter.save();

    // Update subscriber's last activity
    const subscriber = await Subscribers.findOne({ email: subscriberEmail });
    if (subscriber) {
      subscriber.lastActivityDate = new Date();
      await subscriber.save();
    }

    return linkUrl;
  } catch (error) {
    console.error("Error tracking link click:", error);
    return linkUrl;
  }
};

module.exports = {
  sendNewsletter,
  processScheduledNewsletters,
  trackNewsletterOpen,
  trackLinkClick,
};
