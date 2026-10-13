const express = require('express');
const router = express.Router();
const {
    getAllLoans,
    getLoanById,
    createLoan,
    updateLoan,
    deleteLoan
} = require('../controllers/loanController');

router.route('/').get(getAllLoans).post(createLoan);

router.route('/:id').get(getLoanById).put(updateLoan).delete(deleteLoan);

module.exports = router;

