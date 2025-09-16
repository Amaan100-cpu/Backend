const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

// Generate a 6-digit numeric OTP
const generateOtp = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
};

const sendEmail = (email, otp) => {
  const transport = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey", // literally 'apikey' for SendGrid
      pass: "YOUR_SENDGRID_API_KEY",
    },
  });

  const message = `
    <h1>Your OTP is ${otp}</h1>
    <p>This code is valid for 10 minutes.</p>
  `;

  const mailOptions = {
    from: "noreply@amacloth.shop",
    to: email,
    subject: "Verify your email",
    html: message,
    text: `Your OTP is ${otp}. This code is valid for 10 minutes.`,
  };

  transport.sendMail(mailOptions, (err, result) => {
    if (err) {
      console.error("Error sending email:", err);
    } else {
      console.log("Email sent:", result.response);
    }
  });
};

// Example usage:
const otp = generateOtp();
sendEmail("user@example.com", otp);

module.exports = { sendEmail, generateOtp };
