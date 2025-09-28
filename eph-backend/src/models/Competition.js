const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Competition = sequelize.define('Competition', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    source_type: {
      type: DataTypes.ENUM('company', 'hackathon', 'university'),
      allowNull: false
    },
    sponsor: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: function(value) {
          if (this.start_date && value <= this.start_date) {
            throw new Error('End date must be after start date');
          }
        }
      }
    },
    registration_deadline: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
        isBefore: function(value) {
          if (this.start_date && value > this.start_date) {
            throw new Error('Registration deadline must be before start date');
          }
        }
      }
    },
    max_team_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 10
      }
    },
    total_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    seats_remaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    stages: {
      type: DataTypes.TEXT,
      defaultValue: [],
      allowNull: false
    },
    location: { type: DataTypes.STRING(255), allowNull: true },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false
    },
    prize_pool: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    banner_image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    eligibility_criteria: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    contact_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled'),
      defaultValue: 'draft',
      allowNull: false
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_active: {
  type: DataTypes.BOOLEAN,
  defaultValue: true,
  allowNull: false
},
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'competitions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['source_type']
      },
      {
        fields: ['start_date', 'end_date']
      },
      {
        fields: ['registration_deadline']
      },
      {
        fields: ['tags'],
        using: 'gin'
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['created_by']
      }
    ],
    hooks: {
      beforeSave: async (competition) => {
        // Auto-update status based on dates
        const now = new Date();
        if (competition.start_date > now && competition.status === 'published') {
          // Competition is published but hasn't started yet
        } else if (competition.start_date <= now && competition.end_date > now) {
          competition.status = 'ongoing';
        } else if (competition.end_date <= now && competition.status !== 'cancelled') {
          competition.status = 'completed';
        }
      }
    }
  });

  // Instance methods
  Competition.prototype.isRegistrationOpen = function() {
    const now = new Date();
    const deadline = this.registration_deadline || this.start_date;
    return this.status === 'published' && 
           now < deadline && 
           this.seats_remaining > 0;
  };

  Competition.prototype.canUserRegister = function(userId) {
    // Add custom logic for user eligibility
    return this.isRegistrationOpen();
  };

  Competition.prototype.reserveSeat = async function(teamSize = 1) {
    if (this.seats_remaining >= teamSize) {
      this.seats_remaining -= teamSize;
      await this.save(['seats_remaining']);
      return true;
    }
    return false;
  };

  Competition.prototype.releaseSeat = async function(teamSize = 1) {
    this.seats_remaining = Math.min(this.total_seats, this.seats_remaining + teamSize);
    await this.save(['seats_remaining']);
    return this;
  };

  Competition.prototype.getDaysRemaining = function() {
    const now = new Date();
    const end = new Date(this.end_date);
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Class methods
  Competition.findActive = function() {
    return this.findAll({
      where: {
        status: ['published', 'ongoing']
      },
      order: [['start_date', 'ASC']]
    });
  };

  Competition.findUpcoming = function() {
    const now = new Date();
    return this.findAll({
      where: {
        status: 'published',
        start_date: {
          [sequelize.Sequelize.Op.gt]: now
        }
      },
      order: [['start_date', 'ASC']]
    });
  };

  Competition.findOngoing = function() {
    const now = new Date();
    return this.findAll({
      where: {
        status: 'ongoing',
        start_date: {
          [sequelize.Sequelize.Op.lte]: now
        },
        end_date: {
          [sequelize.Sequelize.Op.gt]: now
        }
      },
      order: [['end_date', 'ASC']]
    });
  };

  Competition.findByTags = function(tags) {
    return this.findAll({
      where: {
        status: ['published', 'ongoing'],
        tags: {
          [sequelize.Sequelize.Op.overlap]: tags
        }
      },
      order: [['start_date', 'ASC']]
    });
  };

  Competition.findFeatured = function() {
    return this.findAll({
      where: {
        status: ['published', 'ongoing'],
        is_featured: true
      },
      order: [['start_date', 'ASC']]
    });
  };

  return Competition;
};