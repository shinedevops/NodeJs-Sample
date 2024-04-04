const express = require('express');
const router = express.Router();
const controller = require('./controller');
const validator = require('./validator');
const { permissionNames } = require('../../../constants/permissions');
const { hasPermission } = require('../../../middleware/hasPermission');

/**
 * @description Upcoming appoinments for GP
 */
router.post('/upcoming',
    (rq, rs, next) => {
        hasPermission(rq, rs, next, permissionNames.listAppointment)
    },
    validator.upcoming, validator.validator, controller.upcomingAppointments
);

/**
 * @description View Appointment Details
 */
router.get('/detail/:id',
    (rq, rs, next) => {
        hasPermission(rq, rs, next, permissionNames.viewAppointment)
    },
    validator.detail, validator.validator, controller.viewAppointment
)

/**
 * @description Accept or Decline Appointment
 */
router.post('/update/status',
    (rq, rs, next) => {
        hasPermission(rq, rs, next, permissionNames.updateAppointment)
    },
    validator.acceptOrDecline, validator.validator, controller.acceptOrDeclineAppointment

)



module.exports = router;