/**
 * Seeds the database with the demo users that previously lived in the
 * frontend mock data (src/data/users.ts), plus sample collaboration
 * requests and messages so dashboards are not empty on first login.
 *
 * All seeded accounts share the password: password123
 * (matches the demo-account buttons on the login page)
 *
 * Run via `npm run seed` (src/seed.js), or automatically on server boot
 * when using the in-memory development database.
 */
const User = require('./models/User');
const CollaborationRequest = require('./models/CollaborationRequest');
const Message = require('./models/Message');

const PASSWORD = 'password123';

const entrepreneurs = [
  {
    name: 'Sarah Johnson',
    email: 'sarah@techwave.io',
    bio: 'Serial entrepreneur with 10+ years of experience in SaaS and fintech.',
    avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    startupName: 'TechWave AI',
    pitchSummary: 'AI-powered financial analytics platform helping SMBs make data-driven decisions.',
    fundingNeeded: '$1.5M',
    industry: 'FinTech',
    location: 'San Francisco, CA',
    foundedYear: 2021,
    teamSize: 12
  },
  {
    name: 'David Chen',
    email: 'david@greenlife.co',
    bio: 'Environmental scientist turned entrepreneur. Passionate about sustainable solutions.',
    avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
    startupName: 'GreenLife Solutions',
    pitchSummary: 'Biodegradable packaging alternatives for consumer goods and food industry.',
    fundingNeeded: '$2M',
    industry: 'CleanTech',
    location: 'Portland, OR',
    foundedYear: 2020,
    teamSize: 8
  },
  {
    name: 'Maya Patel',
    email: 'maya@healthpulse.com',
    bio: 'Former healthcare professional with an MBA. Building tech to improve patient care.',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    startupName: 'HealthPulse',
    pitchSummary: 'Mobile platform connecting patients with mental health professionals in real-time.',
    fundingNeeded: '$800K',
    industry: 'HealthTech',
    location: 'Boston, MA',
    foundedYear: 2022,
    teamSize: 5
  },
  {
    name: 'James Wilson',
    email: 'james@urbanfarm.io',
    bio: 'Agricultural engineer focused on urban farming solutions and food security.',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    startupName: 'UrbanFarm',
    pitchSummary: 'IoT-enabled vertical farming systems for urban environments and food deserts.',
    fundingNeeded: '$3M',
    industry: 'AgTech',
    location: 'Chicago, IL',
    foundedYear: 2019,
    teamSize: 14
  }
];

const investors = [
  {
    name: 'Michael Rodriguez',
    email: 'michael@vcinnovate.com',
    bio: 'Early-stage investor with focus on B2B SaaS and fintech. Previously founded and exited two startups.',
    avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
    investmentInterests: ['FinTech', 'SaaS', 'AI/ML'],
    investmentStage: ['Seed', 'Series A'],
    portfolioCompanies: ['PayStream', 'DataSense', 'CloudSecure'],
    totalInvestments: 12,
    minimumInvestment: '$250K',
    maximumInvestment: '$1.5M'
  },
  {
    name: 'Jennifer Lee',
    email: 'jennifer@impactvc.org',
    bio: 'Impact investor focused on climate tech, sustainable agriculture, and clean energy.',
    avatarUrl: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
    investmentInterests: ['CleanTech', 'AgTech', 'Sustainability'],
    investmentStage: ['Seed', 'Series A', 'Series B'],
    portfolioCompanies: ['SolarFlow', 'EcoPackage', 'CleanWater Solutions'],
    totalInvestments: 18,
    minimumInvestment: '$500K',
    maximumInvestment: '$3M'
  },
  {
    name: 'Robert Torres',
    email: 'robert@healthventures.com',
    bio: 'Healthcare-focused investor with medical background. Looking for innovations in patient care and biotech.',
    avatarUrl: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg',
    investmentInterests: ['HealthTech', 'BioTech', 'Medical Devices'],
    investmentStage: ['Series A', 'Series B'],
    portfolioCompanies: ['MediTrack', 'BioGenics', 'Patient+'],
    totalInvestments: 9,
    minimumInvestment: '$1M',
    maximumInvestment: '$5M'
  }
];

/** Inserts demo data. Assumes a mongoose connection is already open. */
async function seedDatabase() {
  const emails = [...entrepreneurs, ...investors].map((u) => u.email);
  const existing = await User.countDocuments({ email: { $in: emails } });
  if (existing > 0) {
    console.log('Seed users already exist - skipping. Drop the collection to re-seed.');
    return;
  }

  const created = {};
  for (const data of entrepreneurs) {
    created[data.email] = await User.create({ ...data, role: 'entrepreneur', password: PASSWORD });
  }
  for (const data of investors) {
    created[data.email] = await User.create({ ...data, role: 'investor', password: PASSWORD });
  }
  console.log(`Created ${Object.keys(created).length} users (password: ${PASSWORD})`);

  await CollaborationRequest.create([
    {
      investorId: created['michael@vcinnovate.com']._id,
      entrepreneurId: created['sarah@techwave.io']._id,
      message:
        "I'm impressed by TechWave AI's growth. Your fintech analytics aligns with my portfolio focus - I'd love to discuss your Series A plans.",
      status: 'pending'
    },
    {
      investorId: created['jennifer@impactvc.org']._id,
      entrepreneurId: created['david@greenlife.co']._id,
      message:
        'GreenLife fits perfectly with our impact thesis. Can we set up a call about your packaging line?',
      status: 'accepted'
    },
    {
      investorId: created['robert@healthventures.com']._id,
      entrepreneurId: created['maya@healthpulse.com']._id,
      message:
        'HealthPulse addresses a real gap in mental healthcare delivery. Interested in learning more about your traction.',
      status: 'pending'
    }
  ]);
  console.log('Created sample collaboration requests');

  await Message.create([
    {
      senderId: created['michael@vcinnovate.com']._id,
      receiverId: created['sarah@techwave.io']._id,
      content: 'Hi Sarah, thanks for connecting! Do you have a deck you could share?'
    },
    {
      senderId: created['sarah@techwave.io']._id,
      receiverId: created['michael@vcinnovate.com']._id,
      content: 'Absolutely - uploading it to the document chamber now. Happy to walk you through it on a call.'
    }
  ]);
  console.log('Created sample messages');
  console.log('Seeding complete.');
}

module.exports = seedDatabase;
