const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Debug log
    console.log('[Email] EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.log('[Email] EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET');

    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // or use 'host', 'port' etc.
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Define email options
    const mailOptions = {
        from: '"EnglishHub Support" <no-reply@englishhub.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // 3. Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
