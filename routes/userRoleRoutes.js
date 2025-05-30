const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/userRoleController');

router.post('/super-new-user-role', userRoleController.createRole);
router.get('/super-user-role-list', userRoleController.getUserRoleList);
router.put('/super-user-role/:id', userRoleController.editRole);
router.delete('/super-user-role/:id', userRoleController.deleteRole);

module.exports = router;
