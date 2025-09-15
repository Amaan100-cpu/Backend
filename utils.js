const nodemailer=require("nodemailer")
const otpGenrator = require("otp-generator")
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = (email, message) => {
    const msg = {
        to: email,
        from: 'amaanahmad8616@gmail.com',  // Must be a verified sender in SendGrid
        subject: 'Verify your email',
        html: message,
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('✅ Email sent successfully');
        })
        .catch((error) => {
            console.error('❌ Failed to send email:', error.response?.body || error);
        });
};

const otpGenrate=()=>{
   return otpGenrator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false, digits: true })
}

module.exports={sendEmail,otpGenrate}
