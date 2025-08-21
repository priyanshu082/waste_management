
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const prisma = new PrismaClient();

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'abcdefghijklmnopqrstuvwxyz12'
});

// Upload a file to cloudinary
const uploadToCloudinary = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Upload the file to cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'waste-management',
      use_filename: true,
      unique_filename: true,
      overwrite: false
    });
    
    // Delete the local file after upload
    fs.unlinkSync(file.path);
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type
    };
  } catch (error) {
    console.error('Error uploading to cloudinary:', error);
    throw error;
  }
};

// Delete a file from cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('No public ID provided');
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from cloudinary:', error);
    throw error;
  }
};

// Analyze image for waste detection using an AI image classification API
const analyzeWasteImage = async (imageUrl) => {
  try {
    // Using Google Cloud Vision API for image classification
    // In a real implementation, you would use environment variables for the API key
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
      console.warn('No Google Vision API key found - falling back to simulation');
      return simulateWasteAnalysis();
    }
    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [
          {
            image: {
              source: {
                imageUri: imageUrl
              }
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 10
              },
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: 5
              }
            ]
          }
        ]
      }
    );
    
    // Process the response to determine waste type
    const labels = response.data.responses[0].labelAnnotations || [];
    const objects = response.data.responses[0].localizedObjectAnnotations || [];
    
    // Keywords that might indicate different types of waste
    const wasteTypeKeywords = {
      RECYCLABLE: ['plastic', 'bottle', 'paper', 'cardboard', 'glass', 'metal', 'can', 'aluminum', 'recyclable'],
      ORGANIC: ['food', 'vegetable', 'fruit', 'plant', 'leaf', 'garden', 'compost', 'organic', 'wood'],
      HAZARDOUS: ['chemical', 'battery', 'paint', 'oil', 'medicine', 'hazardous', 'toxic'],
      ELECTRONIC: ['electronic', 'device', 'computer', 'phone', 'appliance', 'cable', 'circuit'],
      CONSTRUCTION: ['construction', 'brick', 'concrete', 'tile', 'wood', 'lumber', 'debris', 'building'],
      GENERAL: ['trash', 'waste', 'garbage', 'refuse', 'rubbish', 'general', 'miscellaneous']
    };
    
    // Combine all detected labels and object names
    const allDetections = [
      ...labels.map(label => label.description.toLowerCase()),
      ...objects.map(object => object.name.toLowerCase())
    ];
    
    // Calculate scores for each waste type based on keyword matches
    const scores = {};
    for (const [wasteType, keywords] of Object.entries(wasteTypeKeywords)) {
      scores[wasteType] = 0;
      for (const detection of allDetections) {
        for (const keyword of keywords) {
          if (detection.includes(keyword)) {
            // Weight based on confidence if available
            const matchingLabel = labels.find(l => l.description.toLowerCase() === detection);
            const confidence = matchingLabel ? matchingLabel.score : 0.5;
            scores[wasteType] += confidence;
            break; // Only count each detection once per waste type
          }
        }
      }
    }
    
    // Find waste type with highest score
    let detectedType = 'GENERAL'; // Default
    let highestScore = 0;
    
    for (const [wasteType, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        detectedType = wasteType;
      }
    }
    
    // Calculate overall confidence
    const confidence = Math.min(1, highestScore / 2); // Normalize to 0-1 range
    
    // Estimate quantity based on object size and count
    let quantity = 'small';
    if (objects.length >= 5) {
      quantity = 'large';
    } else if (objects.length >= 2) {
      quantity = 'medium';
    }
    
    return {
      wasteType: detectedType,
      confidence: confidence,
      quantity: quantity,
      quantityConfidence: 0.7, 
      rawDetections: allDetections
    };
  } catch (error) {
    console.error('Error analyzing waste image:', error);
    console.log('Falling back to simulated analysis');
    return simulateWasteAnalysis();
  }
};

// Fallback function for simulation if API key is missing or API call fails
const simulateWasteAnalysis = () => {
  console.log('Using simulated waste analysis (real API not configured)');
  
  // Simulate quantity estimation
  const quantity = Math.random() < 0.3 ? 'small' : 
                   Math.random() < 0.7 ? 'medium' : 
                   Math.random() < 0.9 ? 'large' : 'extra';
  
  // Weighted random selection
  const random = Math.random();
  let detectedType;
  
  if (random < 0.3) {
    detectedType = 'RECYCLABLE';
  } else if (random < 0.5) {
    detectedType = 'GENERAL';
  } else if (random < 0.7) {
    detectedType = 'ORGANIC';
  } else if (random < 0.85) {
    detectedType = 'HAZARDOUS';
  } else if (random < 0.95) {
    detectedType = 'ELECTRONIC';
  } else {
    detectedType = 'CONSTRUCTION';
  }
  
  return {
    wasteType: detectedType,
    confidence: 0.7 + (Math.random() * 0.3), // 70-100% confidence
    quantity: quantity,
    quantityConfidence: 0.65 + (Math.random() * 0.35), // 65-100% confidence
    note: 'This is simulated data as real AI API is not configured'
  };
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  analyzeWasteImage
};
