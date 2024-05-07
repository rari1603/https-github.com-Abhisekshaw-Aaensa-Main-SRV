// Check empty filed while adding data in EnterpriseAdmin 
exports.adminEmptyCheck = async (req, res, next) => {
    const { EnterpriseName, Email, Name, Phone, OnboardingDate } = req.body;
    try {
        if (!EnterpriseName) {
            return res.status(400).send({ success: false, message: 'Enterprise name is required!', key: "EnterpriseName" });
        }
        if (!Email) {
            return res.status(400).send({ success: false, message: 'Email address is required!', key: "Email" });
        }
        if (!Name) {
            return res.status(400).send({ success: false, message: 'Name is required!', key: "Name" });
        }
        if (!Phone) {
            return res.status(400).send({ success: false, message: 'Phone number is required!', key: "Phone" });
        }
        if (Phone.length !== 10) {
            return res.status(400).send({ success: false, message: 'Phone number should be 10 digits!', key: "Phone" });
        }
        if (!OnboardingDate) {
            return res.status(400).send({ success: false, message: 'Onboarding date is required!', key: "OnboardingDate" });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.adminEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}

// Check empty filed while adding data in EnterpriseUser 
exports.userEmptyCheck = async (req, res, next) => {
    const { username, email, EnterpriseID, phone } = req.body;
  
    const trimmedEmail = email.trim();
  
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  
    try {
      if (!username) {
        return res
          .status(400)
          .send({
            success: false,
            message: "Username is required!",
            key: "username",
          });
      }
      if (!email) {
        return res
          .status(400)
          .send({ success: false, message: "Email is required!", key: "email" });
      }
      if (!isValidEmail) {
        return res
          .status(400)
          .send({
            success: false,
            message: "Invalid email format!",
            key: "email",
          });
      }
      if (!EnterpriseID) {
        return res
          .status(400)
          .send({
            success: false,
            message: "Enterprise is required!",
            key: "EnterpriseID",
          });
      }
      if (!phone) {
        return res
          .status(400)
          .send({
            success: false,
            message: "Phone number is required!",
            key: "phone",
          });
      }
      if (!/^\d+$/.test(phone)) {
          return res.status(400).send({
            success: false,
            message: "Phone number should contain only digits!",
            key: "phone",
          });
        }
        
      if (phone.length !== 10) {
        return res
          .status(400)
          .send({
            success: false,
            message: "Phone number should be 10 digits!",
            key: "phone",
          });
      }
      next();
    } catch (error) {
      console.log("enterprise.middleware.userEmptyCheck===>", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Something went wrong. Please try again later.",
          err: error.message,
        });
    }
}

exports.SetNewPasswordValidation = (req, res, next) => {

    const { password, confirmPassword } = req.body;
    const errors = [];

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  
    // Check if password is provided
    if (!password || password.trim().length === 0) {
        errors.push("Password is required");
    }

    // Check if confirmPassword is provided
    if (!confirmPassword || confirmPassword.trim().length === 0) {
        errors.push("Confirm Password is required");
    }

    // Check if password and confirmPassword match
    if (password && confirmPassword && password !== confirmPassword) {
        errors.push("Passwords do not match");
    }

    // Check if password meets complexity requirements
    if (password && !regex.test(password)) {
        errors.push("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character");
    }

    if (errors.length > 0) {
      return res.render("auth/set_password", {
        title: "Set New Password",
        DATA: {
          message: "Validation error",
          valid: false,
          errors: errors,
          token: req.params.hashValue,
          backend_url:
            process.env.HOST +
            "/api/enterprise/set/new/password/" +
            req.params.hashValue,
          perpose: "Set New Password",
        },
      });
    }
  
    req.validationErrors = errors; // Attach validation errors to request object
    next();
};