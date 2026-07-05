const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
})
// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Functions to send email

const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Banking Transaction System" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to Banking Transaction System'
    const text = `Hello ${name},\n\nThank you for registering a Welcome to Banking Transaction System. We are excited to have you on board!\n\nBest Regards,\nThe Banking Transaction System Teams`
    const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Hello ${name},</p>

    <p>
      Thank you for registering a Welcome to Banking Transaction System.
      We are excited to have you on board!
    </p>

    <br>

    <p>Best Regards,<br>
    The Welcome to Banking Transaction System Team</p>
  </div>
`;
    await sendEmail(userEmail, subject, text, html)
}

async function sendTransactionEmail(userEmail, name, amoutn, toAccount) {
    const subject = "Transaction Successful"

    const text = `Hello ${name},

Your transaction has been completed successfully.

An amount of ${amount} has been transferred from your account to account ${toAccount}.

Thank you for using Banking Transaction System.

Best Regards,
The Banking Transaction System Team`

    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>Hello ${name},</p>

  <p>Your transaction has been completed successfully.</p>

  <p>
    <strong>Amount:</strong> ${amount}<br>
    <strong>Transferred To:</strong> ${toAccount}
  </p>

  <p>Thank you for using Banking Transaction System.</p>

  <br>

  <p>
    Best Regards,<br>
    The Banking Transaction System Team
  </p>
</div>
`;
    await sendEmail(userEmail, subject, text, html)
}

async function sendTransactionFailedEmail(userEmail, name, amoutn, toAccount) {
    const subject = "Transaction Failed"

    const text = `Hello ${name},

Your transaction could not be completed.

We were unable to transfer ${amount} from your account to account ${toAccount}.

No amount has been deducted from your account. Please try again later or contact support if the problem continues.

Best Regards,
The Banking Transaction System Team`

    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>Hello ${name},</p>

  <p>Your transaction could not be completed.</p>

  <p>
    <strong>Amount:</strong> ${amount}<br>
    <strong>Recipient Account:</strong> ${toAccount}
  </p>

  <p>
    No amount has been deducted from your account. Please try again later or contact support if the problem continues.
  </p>

  <br>

  <p>
    Best Regards,<br>
    The Banking Transaction System Team
  </p>
</div>
`;
    await sendEmail(userEmail, subject, text, html)

}
module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailedEmail
}