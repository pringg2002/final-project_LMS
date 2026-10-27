const router = require('express').Router();

const controller = require('../controllers/users.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

router.use(auth);
router.get('/',
  asyncHandler(controller.getAll)
);

router.get('/:id',
  asyncHandler(controller.getById)
);

router.post('/',
  role(ROLES.ADMIN),
  asyncHandler(controller.create)
);

router.put('/:id',
  role(ROLES.ADMIN),
  asyncHandler(controller.update)
);

router.delete('/:id',
  role(ROLES.ADMIN),
  asyncHandler(controller.remove)
);

module.exports = router;