const UserRole = require('../models/userRole');

exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions, createdBy } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required.' });
    }

    const newRole = new UserRole({
      name,
      description,
      permissions,
      createdBy,
      createdAt: new Date()
    });

    await newRole.save();

    res.status(201).json({ message: 'UserRole created successfully', data: newRole });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user role', error: error.message });
  }
};

exports.getUserRoleList = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const filter = buildRoleFilter(filters);

    const roles = await UserRole.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const data = roles.map(role => ({
      id: role._id,
      name: role.name,
      description: role.description,
      count: role.permissions.length,
      createdAt: role.createdAt,
      createdBy: role.createdBy,
      authorizedAt: role.authorizedAt,
      authorizedBy: role.authorizedBy,
      updatedAt: role.updatedAt,
      updatedBy: role.updatedBy,
      authorized: role.authorized,
      status: role.status
    }));

    const total = await UserRole.countDocuments(filter);

    res.status(200).json({ total, page: parseInt(page), limit: parseInt(limit), data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user roles', error: error.message });
  }
};

const buildRoleFilter = (filters) => {
  const filter = {};

  if (filters.createBy) filter.createdBy = filters.createBy;
  if (filters.authorizeBy) filter.authorizedBy = filters.authorizeBy;
  if (filters.updateBy) filter.updatedBy = filters.updateBy;
  if (filters.authorized) filter.authorized = filters.authorized;
  if (filters.status) filter.status = filters.status;

  if (filters.createDateFrom || filters.createDateTo) {
    filter.createdAt = {};
    if (filters.createDateFrom) filter.createdAt.$gte = new Date(filters.createDateFrom);
    if (filters.createDateTo) filter.createdAt.$lte = new Date(filters.createDateTo);
  }
  if (filters.authorizeDateFrom || filters.authorizeDateTo) {
    filter.authorizedAt = {};
    if (filters.authorizeDateFrom) filter.authorizedAt.$gte = new Date(filters.authorizeDateFrom);
    if (filters.authorizeDateTo) filter.authorizedAt.$lte = new Date(filters.authorizeDateTo);
  }
  if (filters.updateDateFrom || filters.updateDateTo) {
    filter.updatedAt = {};
    if (filters.updateDateFrom) filter.updatedAt.$gte = new Date(filters.updateDateFrom);
    if (filters.updateDateTo) filter.updatedAt.$lte = new Date(filters.updateDateTo);
  }

  return filter;
};

exports.editRole = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;

    const role = await UserRole.findById(id);
    if (!role) {
      return res.status(404).json({ message: 'UserRole not found.' });
    }

    Object.assign(role, update, { updatedAt: new Date() });
    await role.save();

    res.status(200).json({ message: 'UserRole updated successfully', data: role });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRole = await UserRole.findByIdAndDelete(id);
    if (!deletedRole) {
      return res.status(404).json({ message: 'UserRole not found.' });
    }
    res.status(200).json({ message: 'UserRole deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user role', error: error.message });
  }
};
