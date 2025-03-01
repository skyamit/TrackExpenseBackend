require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // `true` for port 465, `false` for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const contactUs = async (req, res) =>{
  const {email, name, body} = req.body;
  mailToTrackExpense(email, name, body);
  thanksForContactingUs(email, name);
  res.json({ message: "We have received your mail." });
}

const mailToTrackExpense = async (email, name, body) => {
  try {
    console.log("Inside send registration mail");
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4000";

    const mailOptions = {
      from:  process.env.SUPPORT_EMAIL, 
      to:  process.env.SUPPORT_EMAIL, 
      replyTo: process.env.SUPPORT_EMAIL, 
      subject: "Contacted through support : Email -"  + email + ", Name - " + name,
      html: body,
    };

    await transporter.sendMail(mailOptions);
    console.log("Mail sent");
  } catch (error) {
    console.log(error);
  }
}

const thanksForContactingUs = async (email, name) => {
  try {
    console.log("Inside thanksForContactingUs");
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4000";

    const mailOptions = {
      from: `"TrackXpense" <no-reply@trackxpense.com>`, 
      to: email,
      replyTo: process.env.SUPPORT_EMAIL, 
      subject: "Thanks for contacting us",
      html: `
        <p>Hello <b> ${name} </b> </p>
        <p>Thank you for sending your valuable thoughts to us via contact us.</p>
        <p>We will definately check your mail and get back to you in case it is needed.</p>
        <p>
          Click on 
          <a href="${frontendUrl}" >
            TrackXpense
          </a>
          to continue to app.
        </p>
        // <p>For support, reach out to <a href="mailto:${process.env.SUPPORT_EMAIL}">${process.env.SUPPORT_EMAIL}</a></p>
        <p>Cheers,<br>TrackXpense Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Mail sent");
  } catch (error) {
    console.log(error);
  }
}

const sendRegistrationEmail = async (email, name) => {
  try {
    console.log("Inside send registration mail");
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4000";

    const mailOptions = {
      from: `"TrackXpense" <no-reply@trackxpense.com>`, 
      to: email,
      replyTo: process.env.SUPPORT_EMAIL, 
      subject: "Welcome to TrackXpense!",
      html: `
        <p>Hello <b> ${name} </b> </p>
        <p>Thank you for registering with <strong>TrackXpense</strong>.</p>
        <p>Start tracking your finances today and take control of your expenses.</p>
        <p>
          Click on 
          <a href="${frontendUrl}" >
            TrackXpense
          </a>
          to continue to app.
        </p>
        <p>For support, reach out to <a href="mailto:${process.env.SUPPORT_EMAIL}">${process.env.SUPPORT_EMAIL}</a></p>
        <p>Cheers,<br>TrackXpense Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Mail sent");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {sendRegistrationEmail, contactUs};
