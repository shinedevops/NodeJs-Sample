const { body, validationResult, param } = require('express-validator');
const { appointmentStatus } = require('../../../constants/global');

function validator(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors?.errors[0]?.msg || "", status: 0 });
    }
    next();
}

module.exports = {
    validator,
    upcoming: [
        body('limit')
            .not()
            .isEmpty()
            .withMessage("Please provide limit")
            .isInt({ min: 1 }),
        body('page')
            .not()
            .isEmpty()
            .withMessage("Please provide page")
            .isInt({ min: 1 }),
        body('search')
            .optional({ values: 'falsy' })
            .isLength({ max: 50 }),
        body('from')
            .optional({ values: 'falsy' })
            .isDate({ format: 'YYYY-MM-DD' }),
        body('to')
            .optional({ values: 'falsy' })
            .isDate({ format: 'YYYY-MM-DD' }),

    ],
    detail: [
        param('id')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Please provide id')
            .isMongoId()
            .withMessage("Invalid id"),
    ],
    acceptOrDecline: [
        body('id')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Please provide id')
            .isMongoId()
            .withMessage("Invalid id"),
        body('status')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Please provide status')
            .isIn([appointmentStatus.ACCEPTED, appointmentStatus.DECLINED])
            .withMessage("Invalid status"),

    ]
}