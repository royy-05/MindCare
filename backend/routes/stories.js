const express = require('express');
const router = express.Router();
const Story = require('../models/story');
const rateLimit = require('express-rate-limit');

// Rate limiting for story creation
const createStoryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 story creations per hour
  message: {
    success: false,
    error: 'Too many stories submitted. Please wait before sharing another story.'
  }
});

// Rate limiting for replies
const replyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 replies per 15 minutes
  message: {
    success: false,
    error: 'Too many replies submitted. Please wait before replying again.'
  }
});

// Helper function to get client IP
const getClientIP = (req) => {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Helper function to validate and sanitize content
const sanitizeContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  // Remove HTML tags and scripts
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
};

// GET /api/stories - Get all stories with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 per page
    const skip = (page - 1) * limit;
    
    const category = req.query.category && req.query.category !== 'all' ? req.query.category : null;
    const sort = req.query.sort || 'recent';
    const search = req.query.search || '';

    // Build query
    let query = { approved: true, reported: { $ne: true } };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { content: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(escapedSearch, 'i')] } }
      ];
    }

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'popular':
        sortQuery = { likes: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      default: // recent
        sortQuery = { createdAt: -1 };
    }

    // Execute query
    const [stories, totalCount] = await Promise.all([
      Story.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .select('-likedBy -reportReasons -__v')
        .lean(),
      Story.countDocuments(query)
    ]);

    // Add time ago to stories and replies
    const storiesWithTimeAgo = stories.map(story => ({
      ...story,
      timeAgo: getTimeAgo(story.createdAt),
      replies: story.replies.map(reply => ({
        ...reply,
        timeAgo: getTimeAgo(reply.createdAt)
      }))
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      stories: storiesWithTimeAgo,
      pagination: {
        page,
        pages: totalPages,
        limit,
        total: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stories'
    });
  }
});

// POST /api/stories - Create a new story
router.post('/', createStoryLimiter, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    // Validation
    if (!title || title.trim().length < 5 || title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Title must be between 5 and 100 characters'
      });
    }

    if (!content || content.trim().length < 20 || content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Story content must be between 20 and 2000 characters'
      });
    }

    const validCategories = ['anxiety', 'depression', 'stress', 'relationships', 'work', 'family', 'self-care', 'recovery', 'other'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid category'
      });
    }

    // Sanitize content
    const sanitizedTitle = sanitizeContent(title);
    const sanitizedContent = sanitizeContent(content);
    
    // Clean content for harmful patterns
    const cleanedContent = Story.cleanContent(sanitizedContent);

    // Process tags
    let processedTags = [];
    if (tags && Array.isArray(tags)) {
      processedTags = tags
        .map(tag => sanitizeContent(tag))
        .filter(tag => tag.length > 0 && tag.length <= 30)
        .slice(0, 5); // Max 5 tags
    }

    // Generate anonymous ID
    const anonymousId = Story.generateAnonymousId();

    // Create story
    const story = new Story({
      title: sanitizedTitle,
      content: cleanedContent,
      category,
      tags: processedTags,
      anonymousId
    });

    await story.save();

    res.status(201).json({
      success: true,
      message: 'Story shared successfully!',
      story: {
        id: story._id,
        anonymousId: story.anonymousId,
        createdAt: story.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share your story. Please try again.'
    });
  }
});

// POST /api/stories/:id/like - Toggle like on a story
router.post('/:id/like', async (req, res) => {
  try {
    const storyId = req.params.id;
    const clientIP = getClientIP(req);

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    const hasLiked = story.likedBy.includes(clientIP);
    
    if (hasLiked) {
      // Unlike
      story.likedBy = story.likedBy.filter(ip => ip !== clientIP);
      story.likes = Math.max(0, story.likes - 1);
      await story.save();

      res.json({
        success: true,
        message: 'Like removed',
        likes: story.likes,
        hasLiked: false
      });
    } else {
      // Like
      story.likedBy.push(clientIP);
      story.likes += 1;
      await story.save();

      res.json({
        success: true,
        message: 'Story liked!',
        likes: story.likes,
        hasLiked: true
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update like'
    });
  }
});

// POST /api/stories/:id/reply - Add reply to a story
router.post('/:id/reply', replyLimiter, async (req, res) => {
  try {
    const storyId = req.params.id;
    const { content } = req.body;

    // Validation
    if (!content || content.trim().length < 1 || content.trim().length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Reply must be between 1 and 500 characters'
      });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Sanitize and clean content
    const sanitizedContent = sanitizeContent(content);
    const cleanedContent = Story.cleanContent(sanitizedContent);

    // Generate anonymous ID for reply
    const anonymousId = Story.generateAnonymousId();

    // Add reply
    const newReply = {
      content: cleanedContent,
      anonymousId,
      createdAt: new Date()
    };

    story.replies.push(newReply);
    await story.save();

    // Return the new reply with time ago
    const savedReply = story.replies[story.replies.length - 1];
    const replyWithTimeAgo = {
      ...savedReply.toObject(),
      timeAgo: getTimeAgo(savedReply.createdAt)
    };

    res.status(201).json({
      success: true,
      message: 'Reply added successfully!',
      reply: replyWithTimeAgo
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reply. Please try again.'
    });
  }
});

// POST /api/stories/:id/report - Report a story
router.post('/:id/report', async (req, res) => {
  try {
    const storyId = req.params.id;
    const { reason } = req.body;
    const clientIP = getClientIP(req);

    const validReasons = [
      'Inappropriate content',
      'Spam',
      'Harassment or bullying',
      'False information',
      'Self-harm content',
      'Other'
    ];

    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid reason for reporting'
      });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Check if already reported by this IP
    const alreadyReported = story.reportReasons.some(report => report.reporterIP === clientIP);
    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this story'
      });
    }

    // Add report
    story.reportReasons.push({
      reason,
      reporterIP: clientIP,
      reportedAt: new Date()
    });
    story.reportCount += 1;

    // Auto-hide if too many reports
    if (story.reportCount >= 5) {
      story.reported = true;
    }

    await story.save();

    res.json({
      success: true,
      message: 'Thank you for reporting. We will review this content.'
    });
  } catch (error) {
    console.error('Error reporting story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report story'
    });
  }
});

// GET /api/stories/stats - Get community stats
router.get('/stats', async (req, res) => {
  try {
    const [totalStories, totalReplies, categoryCounts] = await Promise.all([
      Story.countDocuments({ approved: true, reported: { $ne: true } }),
      Story.aggregate([
        { $match: { approved: true, reported: { $ne: true } } },
        { $project: { replyCount: { $size: "$replies" } } },
        { $group: { _id: null, total: { $sum: "$replyCount" } } }
      ]),
      Story.aggregate([
        { $match: { approved: true, reported: { $ne: true } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalStories,
        totalReplies: totalReplies[0]?.total || 0,
        categories: categoryCounts
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community stats'
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const created = new Date(date);
  const diffInSeconds = Math.floor((now - created) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

module.exports = router;