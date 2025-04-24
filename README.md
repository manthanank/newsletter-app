# Newsletter Management System

A full-featured newsletter management system built with Node.js, Express, and MongoDB. This application allows you to manage subscribers, create email templates, schedule newsletter campaigns, and track engagement metrics.

## Features

- **Subscriber Management**
  - Add and remove subscribers
  - Organize subscribers in groups
  - Track subscriber activity

- **Email Templates**
  - Create and store reusable email templates
  - Rich text editor for content creation
  - Preview templates before sending

- **Campaign Scheduling**
  - Schedule newsletters for future delivery
  - Target specific subscriber groups
  - Send newsletters immediately or on a schedule

- **Analytics**
  - Track open rates and click-through rates
  - Monitor campaign performance
  - Analyze subscriber engagement

- **User-friendly Interfaces**
  - Admin dashboard for managing all aspects of newsletters
  - Public subscription form with interest selection
  - Easy unsubscribe process for recipients

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB Atlas account or local MongoDB installation
- Gmail account for sending emails (or another SMTP provider)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/newsletter-nodejs.git
    cd newsletter-nodejs
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add your environment variables:

    ```env
    EMAIL_USER="your_email@gmail.com"
    EMAIL_PASSWORD="your_app_password"
    PORT=3000
    MONGODB_USER="your_mongodb_username"
    MONGODB_PASSWORD="your_mongodb_password"
    BASE_URL=http://localhost:3000
    ```

4. Start the application:

    ```bash
    npm start
    ```

5. Open your browser and navigate to `http://localhost:3000`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
