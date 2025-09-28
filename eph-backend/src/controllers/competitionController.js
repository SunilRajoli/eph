// src/controllers/competitionController.js
const { Competition, Registration, User, Submission } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/* ----------------------------- helpers ------------------------------ */
const safeParseJSON = (val, fallback) => {
  try {
    if (val == null) return fallback;
    if (typeof val === 'string') return JSON.parse(val);
    return val; // already object/array
  } catch (_) {
    return fallback;
  }
};

const serializeJSONText = (val, fallbackStringified = 'null') => {
  try {
    if (val == null) return fallbackStringified;
    if (typeof val === 'string') {
      // If it's valid JSON text, keep it; otherwise wrap it
      try {
        JSON.parse(val);
        return val;
      } catch {
        return JSON.stringify(val);
      }
    }
    return JSON.stringify(val);
  } catch (_) {
    return fallbackStringified;
  }
};

// Stages can be array of strings or objects. Always store as TEXT(JSON).
const normalizeStagesForStorage = (stages) => {
  if (stages == null) return '[]';
  if (typeof stages === 'string') {
    // if already JSON keep; else split by comma to array of strings
    try {
      JSON.parse(stages);
      return stages;
    } catch {
      const arr = stages
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return JSON.stringify(arr);
    }
  }
  if (Array.isArray(stages)) return JSON.stringify(stages);
  return JSON.stringify([stages]); // single value -> array
};

const parseCompetitionTextFields = (compJson) => ({
  ...compJson,
  stages: safeParseJSON(compJson.stages, []),
  eligibility_criteria: safeParseJSON(compJson.eligibility_criteria, {}),
  contact_info: safeParseJSON(compJson.contact_info, {}),
});

/* --------------------------- controller ----------------------------- */
const competitionController = {
  // Get all competitions
  getAllCompetitions: async (req, res) => {
    try {
      const currentUserId = req.user?.id ?? null;
      const {
        page = 1,
        limit = 20,
        source_type,
        is_active = 'true',
        search,
        upcoming,
        ongoing,
        past
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (source_type) whereClause.source_type = source_type;
      if (is_active !== 'all') whereClause.is_active = is_active === 'true';

      const now = new Date();
      if (upcoming === 'true') {
        whereClause.start_date = { [Op.gt]: now };
      } else if (ongoing === 'true') {
        whereClause.start_date = { [Op.lte]: now };
        whereClause.end_date = { [Op.gt]: now };
      } else if (past === 'true') {
        whereClause.end_date = { [Op.lt]: now };
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { sponsor: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { rows: competitions, count } = await Competition.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Registration,
            as: 'registrations',
            attributes: ['id', 'type', 'status', 'leader_id'],
            required: false
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'name', 'email', 'college', 'profile_pic_url'],
            required: false
          },
          // Include submissions to check if user has submitted
          {
            model: Submission,
            as: 'submissions',
            attributes: ['id', 'leader_id', 'status', 'title'],
            required: false
          }
        ],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['start_date', 'ASC']],
        distinct: true
      });

      const competitionsWithStats = competitions.map(comp => {
        const compData = parseCompetitionTextFields(comp.toJSON());
        const totalRegistrations = compData.registrations?.length || 0;
        const confirmedRegistrations =
          compData.registrations?.filter(r => r.status === 'confirmed')?.length || 0;

        const postedBy = compData.createdBy
          ? {
              id: compData.createdBy.id,
              name: compData.createdBy.name,
              email: compData.createdBy.email,
              profile_pic_url: compData.createdBy.profile_pic_url
            }
          : null;

        // Check if current user has registered
        const user_registered = !!(
          currentUserId &&
          compData.registrations?.some(r => String(r.leader_id) === String(currentUserId))
        );

        // Check if current user has submitted
        const user_submitted = !!(
          currentUserId &&
          compData.submissions?.some(s => String(s.leader_id) === String(currentUserId))
        );

        // Clean up submissions data (don't send full list to frontend for privacy)
        const { submissions, ...compDataWithoutSubmissions } = compData;

        return {
          ...compDataWithoutSubmissions,
          posted_by: postedBy, // backward compatible for Flutter
          createdBy: compData.createdBy,
          user_registered,
          user_submitted,
          stats: {
            totalRegistrations,
            confirmedRegistrations,
            seatsRemaining: comp.seats_remaining,
            totalSubmissions: submissions?.length || 0
          }
        };
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          competitions: competitionsWithStats,
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalCompetitions: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get all competitions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch competitions',
        error: error.message
      });
    }
  },

  // Get competition by ID
  getCompetitionById: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id ?? null;

      const competition = await Competition.findByPk(id, {
        include: [
          {
            model: Registration,
            as: 'registrations',
            include: [
              {
                model: User,
                as: 'leader',
                attributes: ['id', 'name', 'email', 'college', 'profile_pic_url']
              },
              {
                model: User,
                as: 'teamMembers',
                attributes: ['id', 'name', 'email', 'college', 'profile_pic_url'],
                through: { attributes: [] }
              }
            ]
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'name', 'email', 'college', 'profile_pic_url'],
            required: false
          },
          {
            model: Submission,
            as: 'submissions',
            attributes: ['id', 'leader_id', 'status', 'title'],
            required: false
          }
        ]
      });

      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      const competitionData = parseCompetitionTextFields(competition.toJSON());

      const totalRegistrations = competitionData.registrations?.length || 0;
      const confirmedRegistrations =
        competitionData.registrations?.filter(r => r.status === 'confirmed')?.length || 0;

      // Check user status
      const user_registered = !!(
        currentUserId &&
        competitionData.registrations?.some(r => String(r.leader_id) === String(currentUserId))
      );

      const user_submitted = !!(
        currentUserId &&
        competitionData.submissions?.some(s => String(s.leader_id) === String(currentUserId))
      );

      const stats = {
        totalRegistrations,
        confirmedRegistrations,
        seatsRemaining: competition.seats_remaining,
        totalSubmissions: competitionData.submissions?.length || 0,
        isUpcoming: new Date() < new Date(competition.start_date),
        isOngoing:
          new Date() >= new Date(competition.start_date) &&
          new Date() <= new Date(competition.end_date),
        isPast: new Date() > new Date(competition.end_date)
      };

      const postedBy = competitionData.createdBy
        ? {
            id: competitionData.createdBy.id,
            name: competitionData.createdBy.name,
            email: competitionData.createdBy.email,
            profile_pic_url: competitionData.createdBy.profile_pic_url
          }
        : null;

      // Remove submissions from response for privacy (only show stats)
      const { submissions, ...responseData } = competitionData;

      res.json({
        success: true,
        data: {
          competition: {
            ...responseData,
            posted_by: postedBy,
            createdBy: competitionData.createdBy,
            user_registered,
            user_submitted,
            stats
          }
        }
      });
    } catch (error) {
      logger.error('Get competition by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch competition',
        error: error.message
      });
    }
  },

  // Create new competition (admin only)
  createCompetition: async (req, res) => {
    try {
      const {
        title,
        description,
        source_type = 'internal',
        sponsor,
        start_date,
        end_date,
        max_team_size = 1,
        seats_remaining = 100,
        stages = ['registration', 'submission', 'evaluation'],
        tags = [],
        eligibility_criteria,
        contact_info,
        banner_image_url,
        location
      } = req.body;

      // Validation
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Competition title is required'
        });
      }

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }

      const payload = {
        title: title.trim(),
        description: description?.trim() || null,
        source_type,
        sponsor: sponsor?.trim() || null,
        start_date,
        end_date,
        max_team_size: parseInt(max_team_size, 10),
        seats_remaining: parseInt(seats_remaining, 10),
        created_by: req.user.id, // Set the creator
        banner_image_url: banner_image_url?.trim() || null,
        location: location?.trim() || null,
        // TEXT fields
        stages: normalizeStagesForStorage(stages),
        tags: Array.isArray(tags) ? tags : [],
        eligibility_criteria: serializeJSONText(eligibility_criteria, '{}'),
        contact_info: serializeJSONText(contact_info, '{}')
      };

      const competition = await Competition.create(payload);
      const out = parseCompetitionTextFields(competition.toJSON());

      res.status(201).json({
        success: true,
        message: 'Competition created successfully',
        data: { competition: out }
      });
    } catch (error) {
      logger.error('Create competition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create competition',
        error: error.message
      });
    }
  },

  // Update competition (admin only)
  updateCompetition: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      const competition = await Competition.findByPk(id);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Only allow creator or admin to update
      const isCreator = String(competition.created_by) === String(req.user.id);
      const isAdmin = req.user.role?.toLowerCase() === 'admin';
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only update competitions you created'
        });
      }

      // Validation for date updates
      if (updateData.start_date || updateData.end_date) {
        const startDate = new Date(updateData.start_date || competition.start_date);
        const endDate = new Date(updateData.end_date || competition.end_date);
        
        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            message: 'Start date must be before end date'
          });
        }
      }

      // Serialize TEXT fields when provided
      if (Object.prototype.hasOwnProperty.call(updateData, 'stages')) {
        updateData.stages = normalizeStagesForStorage(updateData.stages);
      }
      if (Object.prototype.hasOwnProperty.call(updateData, 'eligibility_criteria')) {
        updateData.eligibility_criteria = serializeJSONText(updateData.eligibility_criteria, '{}');
      }
      if (Object.prototype.hasOwnProperty.call(updateData, 'contact_info')) {
        updateData.contact_info = serializeJSONText(updateData.contact_info, '{}');
      }

      // Clean up string fields
      if (updateData.title) updateData.title = updateData.title.trim();
      if (updateData.description) updateData.description = updateData.description.trim();
      if (updateData.sponsor) updateData.sponsor = updateData.sponsor.trim();
      if (updateData.location) updateData.location = updateData.location.trim();
      if (updateData.banner_image_url) updateData.banner_image_url = updateData.banner_image_url.trim();

      await competition.update(updateData);
      const out = parseCompetitionTextFields(competition.toJSON());

      res.json({
        success: true,
        message: 'Competition updated successfully',
        data: { competition: out }
      });
    } catch (error) {
      logger.error('Update competition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update competition',
        error: error.message
      });
    }
  },

  // Delete competition (admin only)
  deleteCompetition: async (req, res) => {
    try {
      const { id } = req.params;

      const competition = await Competition.findByPk(id);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Only allow creator or admin to delete
      const isCreator = String(competition.created_by) === String(req.user.id);
      const isAdmin = req.user.role?.toLowerCase() === 'admin';
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete competitions you created'
        });
      }

      // Check for existing registrations
      const registrationCount = await Registration.count({
        where: { competition_id: id }
      });

      if (registrationCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete competition with existing registrations'
        });
      }

      // Check for existing submissions
      const submissionCount = await Submission.count({
        where: { competition_id: id }
      });

      if (submissionCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete competition with existing submissions'
        });
      }

      await competition.destroy();

      res.json({
        success: true,
        message: 'Competition deleted successfully'
      });
    } catch (error) {
      logger.error('Delete competition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete competition',
        error: error.message
      });
    }
  },

  // Register for competition
  registerForCompetition: async (req, res) => {
    try {
      const { id: competitionId } = req.params;
      const { type = 'individual', team_name, member_emails = [], abstract } = req.body;
      const userId = req.user.id;

      const competition = await Competition.findByPk(competitionId);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Check if competition is active
      if (!competition.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Competition is not active'
        });
      }

      // Check if registration is still open
      const now = new Date();
      if (now > new Date(competition.end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Competition registration has ended'
        });
      }

      // Check if user already registered
      const existingRegistration = await Registration.findOne({
        where: { competition_id: competitionId, leader_id: userId }
      });

      if (existingRegistration) {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this competition'
        });
      }

      // Check seats availability
      if (competition.seats_remaining <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No seats remaining for this competition'
        });
      }

      // Validate team size
      const totalMembers = 1 + member_emails.length; // 1 for leader + members
      if (totalMembers > competition.max_team_size) {
        return res.status(400).json({
          success: false,
          message: `Team size cannot exceed ${competition.max_team_size} members`
        });
      }

      // For team registration, validate team members
      let memberUsers = [];
      if (type === 'team' && member_emails.length > 0) {
        memberUsers = await User.findAll({
          where: { email: { [Op.in]: member_emails }, is_active: true }
        });

        if (memberUsers.length !== member_emails.length) {
          return res.status(400).json({
            success: false,
            message: 'Some team members not found or inactive'
          });
        }

        // Check if any team member is already registered
        for (const member of memberUsers) {
          const memberRegistration = await Registration.findOne({
            where: { competition_id: competitionId, leader_id: member.id }
          });
          if (memberRegistration) {
            return res.status(400).json({
              success: false,
              message: `Team member ${member.name} is already registered for this competition`
            });
          }
        }
      }

      // Create registration
      const registration = await Registration.create({
        competition_id: competitionId,
        leader_id: userId,
        type,
        team_name: type === 'team' ? team_name : null,
        abstract: abstract?.trim() || null,
        status: 'confirmed'
      });

      // Add team members if it's a team registration
      if (type === 'team' && memberUsers.length > 0) {
        await registration.addTeamMembers(memberUsers);
      }

      // Update seats remaining
      await competition.update({
        seats_remaining: competition.seats_remaining - 1
      });

      // Send confirmation email
      try {
        const user = await User.findByPk(userId);
        await emailService.sendCompetitionRegistrationEmail(
          user.email,
          user.name,
          competition.title
        );
      } catch (emailError) {
        logger.warn('Registration email failed:', emailError.message);
        // Don't fail the registration if email fails
      }

      // Load registration with associations for response
      const registrationWithDetails = await Registration.findByPk(registration.id, {
        include: [
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] }
          },
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title', 'start_date', 'end_date']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          registration: registrationWithDetails.toJSON()
        }
      });
    } catch (error) {
      logger.error('Register for competition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register for competition',
        error: error.message
      });
    }
  },

  // Get user's registrations
  getUserRegistrations: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {
        [Op.or]: [
          { leader_id: userId },
          { '$teamMembers.id$': userId }
        ]
      };

      if (status) whereClause.status = status;

      const { rows: registrations, count } = await Registration.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title', 'source_type', 'start_date', 'end_date', 'sponsor', 'location']
          },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] }
          }
        ],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['created_at', 'DESC']],
        distinct: true
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          registrations,
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalRegistrations: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get user registrations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch registrations',
        error: error.message
      });
    }
  },

  // Cancel registration
  cancelRegistration: async (req, res) => {
    try {
      const { registrationId } = req.params;
      const userId = req.user.id;

      const registration = await Registration.findByPk(registrationId, {
        include: [{ model: Competition, as: 'competition' }]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      // Only leader can cancel registration
      if (registration.leader_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can cancel registration'
        });
      }

      // Check if competition hasn't started yet
      if (new Date() >= new Date(registration.competition.start_date)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel registration after competition has started'
        });
      }

      // Check if user has already submitted
      const existingSubmission = await Submission.findOne({
        where: { 
          competition_id: registration.competition_id,
          leader_id: userId
        }
      });

      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel registration after submitting project'
        });
      }

      // Update competition seats back
      await registration.competition.update({
        seats_remaining: registration.competition.seats_remaining + 1
      });

      await registration.destroy();

      res.json({
        success: true,
        message: 'Registration cancelled successfully'
      });
    } catch (error) {
      logger.error('Cancel registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel registration',
        error: error.message
      });
    }
  },

  // Get competition registrations (admin/hiring/investor only)
  getCompetitionRegistrations: async (req, res) => {
    try {
      const { id: competitionId } = req.params;
      const { status, page = 1, limit = 50 } = req.query;

      const competition = await Competition.findByPk(competitionId);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      const offset = (page - 1) * limit;
      const whereClause = { competition_id: competitionId };
      if (status) whereClause.status = status;

      const { rows: registrations, count } = await Registration.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email', 'college', 'branch', 'year', 'phone']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'name', 'email', 'college', 'branch', 'year', 'phone'],
            through: { attributes: [] }
          }
        ],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          competition: {
            id: competition.id,
            title: competition.title,
            start_date: competition.start_date,
            end_date: competition.end_date
          },
          registrations,
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalRegistrations: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get competition registrations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch competition registrations',
        error: error.message
      });
    }
  }
};

module.exports = competitionController;