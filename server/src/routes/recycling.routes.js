
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');
const { analyzeWasteImage } = require('../controllers/cloudinary.controller');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});

// Create upload directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/');
}

// AI Waste Guide endpoint
router.get('/waste-guide', async (req, res) => {
  try {
    const { item } = req.query;
    
    if (!item) {
      return res.status(400).json({ message: 'No item specified' });
    }
    
    // Waste item database (simplified for demo)
    const wasteItems = {
      'plastic bottle': {
        type: 'RECYCLABLE',
        instructions: 'Rinse, remove cap, and place in recycling bin. Caps can be recycled separately.',
        additionalInfo: 'PET and HDPE plastics are widely recycled. Check the bottom of the bottle for the recycling symbol.',
      },
      'cardboard': {
        type: 'RECYCLABLE',
        instructions: 'Flatten boxes and remove any tape or packing materials. Place in recycling bin.',
        additionalInfo: 'Cardboard can be recycled multiple times. Keep it dry and clean for better recycling quality.',
      },
      'battery': {
        type: 'HAZARDOUS',
        instructions: 'Do not put in regular trash. Take to dedicated battery recycling points or hazardous waste collection.',
        additionalInfo: 'Batteries contain chemicals that can be harmful to the environment if not properly disposed of.',
      },
      'banana peel': {
        type: 'ORGANIC',
        instructions: 'Place in compost bin or green waste collection.',
        additionalInfo: 'Banana peels decompose quickly and add valuable nutrients to compost.',
      },
      'electronics': {
        type: 'ELECTRONIC',
        instructions: 'Take to electronics recycling center or retailer with e-waste programs.',
        additionalInfo: 'Many electronics contain valuable materials that can be recovered, as well as hazardous components.',
      },
      'paper': {
        type: 'RECYCLABLE',
        instructions: 'Place clean, dry paper in recycling bin. Shred confidential documents.',
        additionalInfo: 'Paper can be recycled 5-7 times before fibers become too short to be useful.',
      },
      'glass bottle': {
        type: 'RECYCLABLE',
        instructions: 'Rinse, remove caps, and place in glass recycling bin.',
        additionalInfo: 'Glass is 100% recyclable and can be recycled endlessly without loss of quality.',
      },
      'food waste': {
        type: 'ORGANIC',
        instructions: 'Place in compost bin or food waste collection.',
        additionalInfo: 'Food waste in landfills produces methane, a potent greenhouse gas.',
      },
      'aluminum can': {
        type: 'RECYCLABLE',
        instructions: 'Rinse and place in recycling bin. No need to remove labels.',
        additionalInfo: 'Recycling aluminum uses 95% less energy than making new aluminum from raw materials.',
      },
      'plastic bag': {
        type: 'GENERAL',
        instructions: 'Many recycling programs don\'t accept plastic bags. Return to grocery store collection points.',
        additionalInfo: 'Plastic bags can jam recycling machinery if put in regular recycling.',
      },
      'light bulb': {
        type: 'HAZARDOUS',
        instructions: 'Incandescent bulbs go in regular trash. CFLs and LEDs need special recycling.',
        additionalInfo: 'CFLs contain small amounts of mercury and should never go in regular trash.',
      },
      'paint': {
        type: 'HAZARDOUS',
        instructions: 'Never pour down drain. Take to hazardous waste collection or donate usable paint.',
        additionalInfo: 'Water-based paints are less hazardous than oil-based paints.',
      },
      'clothing': {
        type: 'GENERAL',
        instructions: 'Donate usable items. Some textile recycling programs accept worn-out clothing.',
        additionalInfo: 'Textile waste is a growing problem. Consider repairing or repurposing old clothes.',
      },
      'furniture': {
        type: 'CONSTRUCTION',
        instructions: 'Donate usable items. For broken items, check local bulk waste collection rules.',
        additionalInfo: 'Wood furniture can often be refurbished or broken down for other uses.',
      },
      'computer': {
        type: 'ELECTRONIC',
        instructions: 'Take to electronics recycling center. Many manufacturers offer takeback programs.',
        additionalInfo: 'Wipe personal data before recycling. Many components can be recovered for reuse.',
      }
    };
    
    // Try to find an exact match
    let suggestion = wasteItems[item.toLowerCase()];
    
    // If no exact match, try to find a partial match
    if (!suggestion) {
      const itemLower = item.toLowerCase();
      for (const [key, value] of Object.entries(wasteItems)) {
        if (key.includes(itemLower) || itemLower.includes(key)) {
          suggestion = value;
          break;
        }
      }
    }
    
    if (suggestion) {
      res.status(200).json({
        query: item,
        suggestion
      });
    } else {
      // Generate a response for unknown items (simplified AI simulation)
      // In a real app, you would call an AI API here
      const randomType = Math.random() < 0.5 ? 'GENERAL' : 'RECYCLABLE';
      
      res.status(200).json({
        query: item,
        suggestion: {
          type: randomType,
          instructions: `For ${item}, it's generally recommended to ${randomType === 'RECYCLABLE' ? 'check if it has a recycling symbol and place in appropriate recycling bin' : 'place in general waste if not recyclable or hazardous'}`,
          additionalInfo: 'When in doubt, check with your local waste management guidelines for specific instructions.'
        }
      });
    }
  } catch (error) {
    console.error('Waste guide error:', error);
    res.status(500).json({ message: 'Failed to get waste guidance', error: error.message });
  }
});

// Analyze waste image endpoint using real AI integration
router.post('/analyze-waste', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }
    
    // Analyze the image using the cloud vision API
    const analysis = await analyzeWasteImage(req.file.path);
    
    res.status(200).json({
      message: 'Image analyzed successfully',
      analysis
    });
  } catch (error) {
    console.error('Analyze waste image error:', error);
    res.status(500).json({ message: 'Failed to analyze waste image', error: error.message });
  }
});

// Get all recycling centers in Aligarh
router.get('/centers', async (req, res) => {
  try {
    // In a real app, this would come from a database
    const centers = [
      {
        id: '1',
        name: 'Aligarh Municipal Recycling Center',
        address: 'Civil Lines, Aligarh, Uttar Pradesh, India',
        phone: '(555) 123-4567',
        email: 'info@amrc.gov.in',
        hours: 'Mon-Sat: 8am-6pm',
        acceptedMaterials: ['RECYCLABLE', 'ORGANIC', 'GENERAL'],
        latitude: 27.8974,
        longitude: 78.0880,
        description: 'Main municipal recycling facility handling most types of household waste.',
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
        wasteTypes: ['RECYCLABLE', 'ORGANIC', 'GENERAL']
      },
      {
        id: '2',
        name: 'AMU Environmental Hub',
        address: 'Aligarh Muslim University, Aligarh, India',
        phone: '(555) 987-6543',
        email: 'environment@amu.ac.in',
        hours: 'Mon-Fri: 9am-5pm',
        acceptedMaterials: ['RECYCLABLE', 'ELECTRONIC'],
        latitude: 27.9139,
        longitude: 78.0744,
        description: 'University-sponsored recycling center with focus on paper and electronic waste.',
        imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f',
        wasteTypes: ['RECYCLABLE', 'ELECTRONIC']
      },
      {
        id: '3',
        name: 'Green Aligarh Initiative',
        address: 'Ramghat Road, Aligarh, India',
        phone: '(555) 234-5678',
        email: 'info@greenaligarh.org',
        hours: 'Tue-Sun: 10am-4pm',
        acceptedMaterials: ['ORGANIC', 'RECYCLABLE'],
        latitude: 27.8827,
        longitude: 78.0729,
        description: 'Community-run center focused on composting and organic waste management.',
        imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9',
        wasteTypes: ['ORGANIC', 'RECYCLABLE']
      },
      {
        id: '4',
        name: 'Aligarh E-Waste Collection',
        address: 'Centre Point, Aligarh, India',
        phone: '(555) 456-7890',
        email: 'ewaste@aligarh.com',
        hours: 'Mon, Wed, Fri: 11am-7pm',
        acceptedMaterials: ['ELECTRONIC', 'HAZARDOUS'],
        latitude: 27.9068,
        longitude: 78.0757,
        description: 'Specialized center for electronic and hazardous waste disposal.',
        imageUrl: 'https://images.unsplash.com/photo-1620772601491-d2e04ed1e7f0',
        wasteTypes: ['ELECTRONIC', 'HAZARDOUS']
      },
      {
        id: '5',
        name: 'Sasni Gate Waste Management',
        address: 'Sasni Gate, Aligarh, India',
        phone: '(555) 876-5432',
        email: 'info@sasniwaste.com',
        hours: 'Tue-Sat: 8am-5pm',
        acceptedMaterials: ['GENERAL', 'CONSTRUCTION'],
        latitude: 27.8920,
        longitude: 78.0610,
        description: 'Facility handling general waste and construction debris.',
        imageUrl: 'https://images.unsplash.com/photo-1568990545613-aa37e9353eb6',
        wasteTypes: ['GENERAL', 'CONSTRUCTION']
      }
    ];
    
    res.status(200).json({ centers });
  } catch (error) {
    console.error('Get recycling centers error:', error);
    res.status(500).json({ message: 'Failed to get recycling centers', error: error.message });
  }
});

module.exports = router;
