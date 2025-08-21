const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  try {
    console.log("Cleaning database...");
    await prisma.rewardRedemption.deleteMany({});
    await prisma.reward.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.pickupRequest.deleteMany({});
    await prisma.binStatus.deleteMany({});
    await prisma.collectionSchedule.deleteMany({});
    await prisma.recyclingCenter.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("Database cleaned");
  } catch (error) {
    console.error("Error cleaning database:", error);
  }

  // Create users
  console.log("Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
      points: 0,
      address: "123 Admin St, Aligarh, India",
      phoneNumber: "+91 9876543210",
      preferredPickupTime: "Morning",
      profileImageUrl: "https://randomuser.me/api/portraits/men/1.jpg",
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: "Staff Member",
      email: "staff@example.com",
      password: hashedPassword,
      role: "STAFF",
      points: 0,
      address: "456 Staff Ave, Aligarh, India",
      phoneNumber: "+91 9876543211",
      preferredPickupTime: "Afternoon",
      profileImageUrl: "https://randomuser.me/api/portraits/women/2.jpg",
    },
  });

  const citizenUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: "John Citizen",
        email: "john@example.com",
        password: hashedPassword,
        role: "CITIZEN",
        points: 120,
        address: "789 Citizen Blvd, Aligarh, India",
        phoneNumber: "+91 9876543212",
        preferredPickupTime: "Evening",
        profileImageUrl: "https://randomuser.me/api/portraits/men/3.jpg",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jane Citizen",
        email: "jane@example.com",
        password: hashedPassword,
        role: "CITIZEN",
        points: 85,
        address: "101 Resident Lane, Aligarh, India",
        phoneNumber: "+91 9876543213",
        preferredPickupTime: "Morning",
        profileImageUrl: "https://randomuser.me/api/portraits/women/4.jpg",
      },
    }),
    prisma.user.create({
      data: {
        name: "Mike Resident",
        email: "mike@example.com",
        password: hashedPassword,
        role: "CITIZEN",
        points: 65,
        address: "202 Community Rd, Aligarh, India",
        phoneNumber: "+91 9876543214",
        preferredPickupTime: "Afternoon",
        profileImageUrl: "https://randomuser.me/api/portraits/men/5.jpg",
      },
    }),
  ]);

  console.log(`Created ${3 + citizenUsers.length} users`);

  // Create recycling centers
  console.log("Creating recycling centers...");
  const centers = await Promise.all([
    prisma.recyclingCenter.create({
      data: {
        name: "Aligarh Municipal Recycling Center",
        address: "Civil Lines, Aligarh, Uttar Pradesh",
        latitude: 27.8974,
        longitude: 78.088,
        wasteTypes: ["RECYCLABLE", "ELECTRONIC", "HAZARDOUS"],
      },
    }),
    prisma.recyclingCenter.create({
      data: {
        name: "Gandhi Park Waste Collection",
        address: "Gandhi Park, Aligarh, Uttar Pradesh",
        latitude: 27.8845,
        longitude: 78.0705,
        wasteTypes: ["GENERAL", "RECYCLABLE", "ORGANIC"],
      },
    }),
    prisma.recyclingCenter.create({
      data: {
        name: "AMU Campus Eco Hub",
        address: "Aligarh Muslim University, Aligarh",
        latitude: 27.9154,
        longitude: 78.0681,
        wasteTypes: ["RECYCLABLE", "ORGANIC"],
      },
    }),
    prisma.recyclingCenter.create({
      data: {
        name: "Ramghat Road Collection Point",
        address: "Ramghat Road, Aligarh, Uttar Pradesh",
        latitude: 27.8851,
        longitude: 78.0992,
        wasteTypes: ["GENERAL", "CONSTRUCTION"],
      },
    }),
  ]);

  console.log(`Created ${centers.length} recycling centers`);

  // Create collection schedules
  console.log("Creating collection schedules...");
  const schedules = await Promise.all([
    prisma.collectionSchedule.create({
      data: {
        area: "Civil Lines",
        dayOfWeek: 1, // Monday
        startTime: "08:00",
        endTime: "12:00",
        wasteTypes: ["GENERAL", "RECYCLABLE"],
        isActive: true,
      },
    }),
    prisma.collectionSchedule.create({
      data: {
        area: "University Area",
        dayOfWeek: 2, // Tuesday
        startTime: "09:00",
        endTime: "13:00",
        wasteTypes: ["GENERAL", "ORGANIC"],
        isActive: true,
      },
    }),
    prisma.collectionSchedule.create({
      data: {
        area: "Ramghat Road",
        dayOfWeek: 3, // Wednesday
        startTime: "08:30",
        endTime: "11:30",
        wasteTypes: ["HAZARDOUS", "ELECTRONIC"],
        isActive: true,
      },
    }),
    prisma.collectionSchedule.create({
      data: {
        area: "Marris Road",
        dayOfWeek: 4, // Thursday
        startTime: "10:00",
        endTime: "14:00",
        wasteTypes: ["GENERAL", "ORGANIC", "RECYCLABLE"],
        isActive: true,
      },
    }),
    prisma.collectionSchedule.create({
      data: {
        area: "Gandhi Park",
        dayOfWeek: 5, // Friday
        startTime: "09:30",
        endTime: "12:30",
        wasteTypes: ["CONSTRUCTION", "GENERAL"],
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${schedules.length} collection schedules`);

  // Create bin statuses
  console.log("Creating bin statuses...");
  const bins = await Promise.all([
    prisma.binStatus.create({
      data: {
        binId: "BIN-001",
        location: "Civil Lines Market",
        fullnessLevel: 75,
        status: "NORMAL",
        latitude: 27.8971,
        longitude: 78.0879,
      },
    }),
    prisma.binStatus.create({
      data: {
        binId: "BIN-002",
        location: "AMU Circle",
        fullnessLevel: 90,
        status: "FULL",
        latitude: 27.9153,
        longitude: 78.0685,
      },
    }),
    prisma.binStatus.create({
      data: {
        binId: "BIN-003",
        location: "Gandhi Park",
        fullnessLevel: 45,
        status: "NORMAL",
        latitude: 27.8842,
        longitude: 78.0702,
      },
    }),
    prisma.binStatus.create({
      data: {
        binId: "BIN-004",
        location: "Railway Station",
        fullnessLevel: 85,
        status: "FULL",
        latitude: 27.8963,
        longitude: 78.0728,
      },
    }),
    prisma.binStatus.create({
      data: {
        binId: "BIN-005",
        location: "District Hospital",
        fullnessLevel: 30,
        status: "NORMAL",
        latitude: 27.8831,
        longitude: 78.0784,
      },
    }),
    prisma.binStatus.create({
      data: {
        binId: "BIN-006",
        location: "Marris Road",
        fullnessLevel: 60,
        status: "NORMAL",
        latitude: 27.9025,
        longitude: 78.0776,
      },
    }),
    prisma.binStatus.create({
      data: {
        binId: "BIN-007",
        location: "Ramghat Road",
        fullnessLevel: 20,
        status: "NORMAL",
        latitude: 27.8855,
        longitude: 78.0995,
      },
    }),
    prisma.binStatus.create({
      data: {
        binId: "BIN-008",
        location: "Dodhpur",
        fullnessLevel: 10,
        status: "MAINTENANCE",
        latitude: 27.9043,
        longitude: 78.0588,
      },
    }),
  ]);

  console.log(`Created ${bins.length} bin statuses`);

  // Create rewards
  console.log("Creating rewards...");
  const rewards = await Promise.all([
    prisma.reward.create({
      data: {
        name: "Eco-Friendly Shopping Bag",
        description: "Reusable cloth shopping bag made from recycled materials",
        pointsCost: 50,
        imageUrl: "https://example.com/images/shopping-bag.jpg",
        isActive: true,
        updatedAt: new Date(),
      },
    }),
    prisma.reward.create({
      data: {
        name: "Water Bottle",
        description: "Stainless steel water bottle to reduce plastic waste",
        pointsCost: 75,
        imageUrl: "https://example.com/images/water-bottle.jpg",
        isActive: true,
        updatedAt: new Date(),
      },
    }),
    prisma.reward.create({
      data: {
        name: "Composting Kit",
        description: "Home composting starter kit for organic waste",
        pointsCost: 150,
        imageUrl: "https://example.com/images/composting-kit.jpg",
        isActive: true,
        updatedAt: new Date(),
      },
    }),
    prisma.reward.create({
      data: {
        name: "Waste Reduction Workshop",
        description: "Free workshop on waste reduction techniques",
        pointsCost: 100,
        imageUrl: "https://example.com/images/workshop.jpg",
        isActive: true,
        updatedAt: new Date(),
      },
    }),
    prisma.reward.create({
      data: {
        name: "Recycled Notebook",
        description: "Notebook made from 100% recycled paper",
        pointsCost: 30,
        imageUrl: "https://example.com/images/notebook.jpg",
        isActive: true,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${rewards.length} rewards`);

  // Create pickup requests with correct date handling
  console.log("Creating pickup requests...");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const pickupRequests = await Promise.all([
    prisma.pickupRequest.create({
      data: {
        address: citizenUsers[0].address,
        wasteType: "RECYCLABLE",
        notes: "Mostly paper and cardboard",
        status: "COMPLETED",
        userId: citizenUsers[0].id,
        createdAt: lastWeek,
        updatedAt: yesterday,
        scheduledDate: yesterday,
      },
    }),
    prisma.pickupRequest.create({
      data: {
        address: citizenUsers[1].address,
        wasteType: "ORGANIC",
        notes: "Food waste and garden trimmings",
        status: "SCHEDULED",
        userId: citizenUsers[1].id,
        createdAt: yesterday,
        updatedAt: today,
        scheduledDate: nextWeek,
      },
    }),
    prisma.pickupRequest.create({
      data: {
        address: citizenUsers[2].address,
        wasteType: "ELECTRONIC",
        notes: "Old TV and some electronics",
        status: "PENDING",
        userId: citizenUsers[2].id,
        createdAt: today,
        updatedAt: today,
      },
    }),
    prisma.pickupRequest.create({
      data: {
        address: citizenUsers[0].address,
        wasteType: "HAZARDOUS",
        notes: "Old paint and batteries",
        status: "PENDING",
        userId: citizenUsers[0].id,
        createdAt: today,
        updatedAt: today,
      },
    }),
  ]);

  console.log(`Created ${pickupRequests.length} pickup requests`);

  // Create redemptions
  console.log("Creating reward redemptions...");
  const redemptions = await Promise.all([
    prisma.rewardRedemption.create({
      data: {
        userId: citizenUsers[0].id,
        rewardId: rewards[0].id,
        pointsCost: rewards[0].pointsCost,
        redeemedAt: lastWeek,
      },
    }),
    prisma.rewardRedemption.create({
      data: {
        userId: citizenUsers[1].id,
        rewardId: rewards[2].id,
        pointsCost: rewards[2].pointsCost,
        redeemedAt: yesterday,
      },
    }),
    prisma.rewardRedemption.create({
      data: {
        userId: citizenUsers[0].id,
        rewardId: rewards[4].id,
        pointsCost: rewards[4].pointsCost,
        redeemedAt: today,
      },
    }),
  ]);

  console.log(`Created ${redemptions.length} redemptions`);

  // Create notifications
  console.log("Creating notifications...");
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: citizenUsers[0].id,
        title: "Pickup Completed",
        message: "Your waste pickup has been completed successfully!",
        type: "PICKUP",
        read: true,
        createdAt: yesterday,
      },
    }),
    prisma.notification.create({
      data: {
        userId: citizenUsers[1].id,
        title: "Pickup Scheduled",
        message: "Your pickup has been scheduled for next week.",
        type: "PICKUP",
        read: false,
        createdAt: today,
      },
    }),
    prisma.notification.create({
      data: {
        userId: citizenUsers[2].id,
        title: "Points Earned",
        message: "You earned 10 points for your recent eco-friendly activity!",
        type: "POINTS",
        read: false,
        createdAt: today,
      },
    }),
    prisma.notification.create({
      data: {
        userId: citizenUsers[0].id,
        title: "New Reward Available",
        message: "A new reward is now available in the rewards store!",
        type: "REWARD",
        read: false,
        createdAt: today,
      },
    }),
  ]);

  console.log(`Created ${notifications.length} notifications`);

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma Client at the end
    await prisma.$disconnect();
  });
