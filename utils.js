const nodemailer=require("nodemailer")
const otpGenrator = require("otp-generator")

const sendEmail=(email,message)=>{
    const transport=nodemailer.createTransport({
        host:"smtp.gmail.com",
        port: 465,          
        secure: true,
        auth:{
            user:"amnahmd888@gmail.com",
            pass:"qbtxeziutbybkyqv"
        }
    })

    const mailOption={
        from:"amnahmd888@gmail.com",
        to:email,
        subject:"verify your email",
        html:message
    }

    transport.sendMail(mailOption,(err,result)=>{
        if(err){
            console.log(err)
        }
        else{
            console.log(result)
        }
    })
}

const otpGenrate=()=>{
   return otpGenrator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false, digits: true })
}

module.exports={sendEmail,otpGenrate}

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
