const ROLES = Object.freeze({
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
});

const isValidRole = (name) => Object.values(ROLES).includes(name);

module.exports = { 
  ROLES, 
  isValidRole 
};
