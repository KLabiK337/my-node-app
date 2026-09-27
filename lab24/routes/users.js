const Router = require('@koa/router');

const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    getStats,
    exportUsers
} = require('../controllers/users');

const router = new Router({
    prefix: '/api/users'
});

router.get('/search', searchUsers);

router.get('/stats', getStats);

router.get('/export', exportUsers);

router.get('/', getUsers);

router.get('/:id', getUser);

router.post('/', createUser);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

module.exports = router;