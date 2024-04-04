const { AppointmentModel, UserExpertiseModel } = require("../../../databaseModels");
const { message } = require("../../../constants/messages");
const { appointmentStatus } = require("../../../constants/global");
const { default: mongoose } = require("mongoose");

module.exports = {
    /**
     * @description Accept or decline appointment
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    acceptOrDeclineAppointment: async (req, res) => {
        try {
            let { id, status } = req.body;
            let appointment = await AppointmentModel.findOne({ _id: id, status: appointmentStatus.BOOKED });
            if (appointment) {
                appointment.status = status;
                await appointment.save();
                return res.status(200).send({ message: status === appointmentStatus.ACCEPTED ? message.APPOINT_ACCEPTED : message.APPOINT_DECLINED })
            } else {
                return res.status(400).send({ message: message.APPOINT_NF })
            }
        } catch (error) {
            return res.status(400).send({ message: error.message || message.SMTHG_WRNG })
        }
    },

    /**
     * @description Doctor allocation
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    allocateDoctor: async (req, res) => {
        try {
            let { appointmentId, doctorId } = req.body;
            let appointment = await AppointmentModel.findOne(
                { _id: appointmentId, status: appointmentStatus.ACCEPTED },
                { status: 1, doctorId: 1, doctorExpertiseId: 1 }
            );
            if (appointment) {
                let doctorExpertise = await UserExpertiseModel.findOne({ userId: doctorId, expertiseId: appointment.doctorExpertiseId });
                if (doctorExpertise) {
                    appointment.doctorId = doctorId;
                    appointment.coordinatorId = req.decoded._id;
                    await appointment.save();
                    //notification to users for doc assignment
                    return res.status(200).send({ message: message.DOC_ALLOCATED })
                } else {
                    return res.status(400).send({ message: message.NOT_DOC_EXPERTISE })
                }
            } else {
                return res.status(400).send({ message: message.APPOINT_NF })
            }

        } catch (error) {
            return res.status(400).send({ message: error.message || message.SMTHG_WRNG });
        }
    },

    /**
     * @description upcoming appointments for Co-ordinator
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    upcomingAppointments: async (req, res) => {
        try {
            let { page, limit, datetime } = req.body;
            page = parseInt(page);
            limit = parseInt(limit);
            let query = { status: { $in: [appointmentStatus.BOOKED, appointmentStatus.ACCEPTED] } };
            if (datetime) {
                query.dateOfAppointment = new Date(datetime)
            }
            let totalCount = 0;
            if (page == 1) {
                totalCount = await AppointmentModel.countDocuments(query);
            }
            let list = await AppointmentModel.aggregate([
                { $match: query },
                {
                    $project: {
                        reason: 1,
                        dateOfAppointment: 1,
                        doctorExpertiseId: 1,
                        patientId: 1,
                        gpId: 1,
                        status: 1
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: limit * (page - 1) },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        let: { 'userId': '$patientId' },
                        as: 'patient',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$userId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    profilePic: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$patient'
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { 'userId': '$gpId' },
                        as: 'gp',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$userId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    profilePic: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$gp'
                },
                {
                    $lookup: {
                        from: 'expertise',
                        let: { 'doctorExpertiseId': '$doctorExpertiseId' },
                        as: 'expertise',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$doctorExpertiseId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$expertise'
                },
                {
                    $project: {
                        reason: 1,
                        dateOfAppointment: 1,
                        status: 1,
                        patient: 1,
                        gp: 1,
                        expertise: 1
                    }
                }

            ]);
            return res.status(200).send({
                data: list,
                total: totalCount
            });
        } catch (error) {
            return res.status(400).send({ message: error.message || message.SMTHG_WRNG })
        }
    },

    /**
     * @description View Appointment details
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    viewAppointment: async (req, res) => {
        try {
            let { id } = req.params;
            let appointment = await AppointmentModel.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $project: {
                        reason: 1,
                        dateOfAppointment: 1,
                        doctorExpertiseId: 1,
                        patientId: 1,
                        gpId: 1,
                        status: 1,
                        paId: 1,
                        shipId: 1
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { 'userId': '$patientId' },
                        as: 'patient',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$userId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    profilePic: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$patient'
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { 'userId': '$gpId' },
                        as: 'gp',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$userId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    profilePic: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$gp'
                },
                {
                    $lookup: {
                        from: 'expertise',
                        let: { 'doctorExpertiseId': '$doctorExpertiseId' },
                        as: 'expertise',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$doctorExpertiseId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$expertise'
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { 'userId': '$paId' },
                        as: 'pa',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$userId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    profilePic: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$pa'
                },
                {
                    $lookup: {
                        from: 'ships',
                        let: { 'shipId': '$shipId' },
                        as: 'ship',
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$shipId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    uid: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: '$ship'
                },
                {
                    $project: {
                        reason: 1,
                        dateOfAppointment: 1,
                        status: 1,
                        patient: 1,
                        gp: 1,
                        expertise: 1,
                        ship: 1,
                        pa: 1
                    }
                }
            ]);

            if (appointment && appointment.length) {
                return res.status(200).send({ data: appointment[0] })
            } else {
                return res.status(400).send({ message: message.APPOINT_NF })

            }
        } catch (error) {
            return res.status(400).send({ message: error.message || message.SMTHG_WRNG })
        }
    }
}