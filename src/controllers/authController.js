const { User } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authController = {
  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await User.findOne({
        where: { email },
        include: ['employeeProfile']
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          error: 'Account is disabled'
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);

      if (!isValidPassword) {
        // Update failed login attempts
        await user.increment('failed_login_attempts');
        await user.update({ last_failed_login: new Date() });

        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Reset failed login attempts on successful login
      await user.update({
        failed_login_attempts: 0,
        last_successful_login: new Date()
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          is_sysadmin: user.is_sysadmin,
          tenant_id: user.tenant_id
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const userResponse = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        is_sysadmin: user.is_sysadmin,
        tenant_id: user.tenant_id,
        employee_id: user.employee_id,
        employeeProfile: user.employeeProfile
      };

      res.json({
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  },

  // Register user
  register: async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        password,
        role = 'employee',
        tenant_id
      } = req.body;

      // Validate input
      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
          error: 'All fields are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: 'User with this email already exists'
        });
      }

      // Create user
      const user = await User.create({
        first_name,
        last_name,
        email,
        password, // Will be hashed by the model hook
        role,
        tenant_id,
        is_active: true
      });

      // Remove password from response
      const userResponse = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        tenant_id: user.tenant_id
      };

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  },

  // Get current user
  me: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        include: ['employeeProfile'],
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({ user });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  },

  // Logout user
  logout: async (req, res) => {
    try {
      // In a stateless JWT setup, logout is handled client-side
      // by removing the token from storage
      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
};

module.exports = authController;