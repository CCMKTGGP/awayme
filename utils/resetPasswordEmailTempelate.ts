export const resetPasswordEmailTemplate = (verificationLink: string) => {
  return `
          <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f2f2f2;
          margin: 0;
          padding: 0;
        }
  
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          margin-top: 50px;
        }
  
        h1 {
          color: #333333;
          text-align: center;
        }
  
        p {
          color: #666666;
          line-height: 1.5;
        }
  
        .button {
          display: block;
          margin: 0 auto;
          padding: 10px 20px;
          background-color: #ddd;
          color: #333;
          text-decoration: none;
          border-radius: 5px;
          text-align: center; /* Added to center the button */
        }

        a {
          color: "#333";
          max-width: 200px;
          margin: 0 auto;
        }
  
        .expire-time {
          text-align: center;
          margin-top: 10px;
          color: #999999;
        }
  
        .button:hover {
          background-color: #333;
          color: #fff;
        }

        .message {
          text-align: center;
          font-size: 16px;
          color: #555555;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reset Your Password</h1>
        <p class="message">
            You requested a password reset. Click the link below:
        </p>
        <a href=${verificationLink} class="button">Reset Password</a>
        <p class="expire-time">This link will expire in 30 minutes.</p>
      </div>
    </body>
  </html>
  
      `;
};
