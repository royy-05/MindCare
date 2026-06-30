const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  anonymousId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  }
});

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['anxiety', 'depression', 'stress', 'relationships', 'work', 'family', 'self-care', 'recovery', 'other']
  },
  tags: [{
    type: String,
    maxlength: 30,
    trim: true
  }],
  anonymousId: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String // Store IP addresses or session IDs
  }],
  replies: [replySchema],
  reported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  reportReasons: [{
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    reporterIP: String
  }],
  approved: {
    type: Boolean,
    default: true // Auto-approve for now, can be changed to false for moderation
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add virtual for time ago
storySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffInSeconds = Math.floor((now - created) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
});

// Add virtual for reply time ago
replySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffInSeconds = Math.floor((now - created) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
});

// Ensure virtuals are included in JSON output
storySchema.set('toJSON', { virtuals: true });
replySchema.set('toJSON', { virtuals: true });

// Index for better query performance
storySchema.index({ category: 1, createdAt: -1 });
storySchema.index({ approved: 1, reported: 1 });
storySchema.index({ tags: 1 });

// Pre-save middleware to update timestamp
storySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to generate anonymous ID
storySchema.statics.generateAnonymousId = function() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Method to clean content (basic content filtering)
storySchema.statics.cleanContent = function(content) {
  // Remove potentially harmful content patterns
  const harmfulPatterns = [
    /suicide|kill myself|end it all|want to die/gi,
    /self.harm|cut myself|hurt myself/gi,
    /<script|javascript:|on\w+=/gi // XSS prevention
  ];
  
  let cleanedContent = content;
  harmfulPatterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '[content moderated]');
  });
  
  return cleanedContent;
};

module.exports = mongoose.model('Story', storySchema);