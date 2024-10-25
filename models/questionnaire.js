const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for the demographic field
const demographicSchema = new Schema({
  age: { type: String, default: '' },
  gender: { type: String, default: '' },
});

// Define the schema for the knowledge field
const knowledgeSchema = new Schema({
  graduationDate: { type: Date },
  training_education_analytics: { type: [Number], default: undefined },
  firstJobAnalytics: { type: String, default: '' },
  projectsPortfolio: { type: String, default: '' },
  informationalInterviews: { type: String, default: '' },
});

// Define the schema for the softSkills field
const softSkillsSchema = new Schema({
  present: { type: Number, default: 0 },
  story: { type: Number, default: 0 },
  convey: { type: Number, default: 0 },
  simplify: { type: Number, default: 0 },
  narrative: { type: Number, default: 0 },
  jobSatisfaction: { type: Number, default: 0 },
  goalAbility: { type: Number, default: 0 },
  maxEffort: { type: Number, default: 0 },
  hardWorkSuccess: { type: Number, default: 0 },
  goalWorry: { type: Number, default: 0 },
  minWork: { type: Number, default: 0 },
  smallTalkTopics: {
    politics: { type: Boolean, default: false },
    weather: { type: Boolean, default: false },
    hobbies: { type: Boolean, default: false },
    movies: { type: Boolean, default: false },
    sports: { type: Boolean, default: false },
    healthIssues: { type: Boolean, default: false },
    jobIssues: { type: Boolean, default: false },
    salary: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    stress: { type: Boolean, default: false },
    cooking: { type: Boolean, default: false },
    travel: { type: Boolean, default: false },
    family: { type: Boolean, default: false },
  },
});

// Define the schema for the technicalSkills field
const technicalSkillsSchema = new Schema({
  python: { type: Number, default: 0 },
  sql: { type: Number, default: 0 },
  excel: { type: Number, default: 0 },
  BI: { type: Number, default: 0 },
  r: { type: Number, default: 0 },
});


// Define the schema for the work experience field
const workExperienceSchema = new Schema({
  non_analytics_canada: { type: Number, default: 0 },
  analytics_canada: { type: Number, default: 0 },
  analytics_abroad: { type: Number, default: 0 },
  first_job_date: { type: String, default: '' },
  interview_offers: { type: Number, default: 0 },
});

// Define the schema for the personality field
const personalitySchema = new Schema({
  persona: { type: String, default: '' },
  self_determination: { type: [Number], default: undefined },
  proactivity: { type: [Number], default: undefined },
  strategic_thinking: { type: [Number], default: undefined },
  strategic_planning: { type: [Number], default: undefined },
  self_awareness: { type: [Number], default: undefined },
});

// Define the schema for the networking field
const networkingSchema = new Schema({
  linkedin_reaching_out: { type: Number, default: 0 },
  understanding_networking: { type: [Number], default: [] },
});

// Define the schema for the resume field
const resumeSchema = new Schema({
  job_posting_effectiveness: { type: [Number], default: undefined },
  length: { type: Number, default: 0 },
  customization: { type: [Number], default: undefined },
});

// Define the schema for the LinkedIn profile field
const linkedinProfileSchema = new Schema({
  persona: { type: Number, default: 0 },
  recommendations: { type: Number, default: 0 },
  connections: { type: Number, default: 0 },
  approach: { type: Number, default: 0 },
  behavioral:{ type: [Number], default: undefined}
});

// Define the schema for the interviewing field
const interviewingSchema = new Schema({
  behavioral: { type: [Number], default: undefined },
  technical: { type: [Number], default: undefined },
  platforms_used: {
    type: {
      none: { type: Boolean, default: false },
      leetcode: { type: Boolean, default: false },
      coderbyte: { type: Boolean, default: false },
      formation: { type: Boolean, default: false },
      algoExpert: { type: Boolean, default: false },
      strataScratch: { type: Boolean, default: false },
      hackerRank: { type: Boolean, default: false },
      interviewQuery: { type: Boolean, default: false },
      other: { type: Boolean, default: false },
    },
    default: {
      none: false,
      leetcode: false,
      coderbyte: false,
      formation: false,
      algoExpert: false,
      strataScratch: false,
      hackerRank: false,
      interviewQuery: false,
      other: false,
    }
  },
});

// Define the schema for the cultural intelligence field
const culturalIntelligenceSchema = new Schema({
  small_talk_topics: {
    what_is_small_talk: { type: Boolean, default: false },
    politics: { type: Boolean, default: false },
    weather: { type: Boolean, default: false },
    hobbies: { type: Boolean, default: false },
    movies_performances_books: { type: Boolean, default: false },
    cooking_meals_cuisines: { type: Boolean, default: false },
    family_personal_issues: { type: Boolean, default: false },
    health_issues: { type: Boolean, default: false },
    job_issues: { type: Boolean, default: false },
    pets: { type: Boolean, default: false },
    salary: { type: Boolean, default: false },
    sport_events: { type: Boolean, default: false },
    stress_problems: { type: Boolean, default: false },
    travel: { type: Boolean, default: false },
  },
  culture: { type: Number, default: 0 },
  comfortable: { type: Number, default: 0 },
});

// Define the main schema
const questionnaireSchema = new Schema({
  demographic: demographicSchema,
  knowledge: knowledgeSchema,
  soft_skills: softSkillsSchema,
  technical_skills: technicalSkillsSchema,
  work_experience: workExperienceSchema,
  personality: personalitySchema,
  networking: networkingSchema,
  resume: resumeSchema,
  linkedin_profile: linkedinProfileSchema,
  interviewing: interviewingSchema,
  cultural_intelligence: culturalIntelligenceSchema,
  email: { type: String, default: '' },
  dateCreated: { type: Date, default: Date.now },
});

// Create the model
const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema);

module.exports = Questionnaire;
