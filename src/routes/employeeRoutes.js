const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

const router = express.Router();

// Employee routes with authentication middleware
router.get('/', authenticateToken, getEmployees);
router.get('/:id', authenticateToken, getEmployeeById);
router.post('/', authenticateToken, createEmployee);
router.put('/:id', authenticateToken, updateEmployee);
router.delete('/:id', authenticateToken, deleteEmployee);

module.exports = router;
