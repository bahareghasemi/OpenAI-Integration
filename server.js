const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
require('dotenv').config();
const connectDB = require("./config/connectDB");
const Questionnaire = require("./models/questionnaire");
const Probability = require("./models/probability");
const bodyParser = require('body-parser');
const model=require('./openaimodel');


const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

// Connect to MongoDB
connectDB();

// API endpoint to read form in login
app.post('/api/login', async (req, res) => {
  const formData = req.body;
  console.log('Received formData:', formData);
  const { email } = formData;
  try {
    const existingRecord = await Questionnaire.findOne({ email });
    if (existingRecord) {
      const completionStatus = checkCompletionStatus(existingRecord);
      res.status(200).json({ message: 'Responses:', data: existingRecord, completionStatus });
    } else {
      const completionStatus = {
          demographic: false,
          knowledge: false,
          softSkills: false,
          technicalSkills: false,
          workExperience: false,
          personality: false,
          networking: false,
          resume: false,
          linkedinProfile: false,
          culturalIntelligence: false,
          interviewing: false,
        };
      res.status(200).json({ message: 'No record found for this email.' ,completionStatus});
    }
  } 
  catch (err) {
    console.error('Failed to save form data', err);
    res.status(500).json({ message: 'Failed to save data', error: err.message });
  }
});


// API endpoint to receive form responses, save to MongoDB
app.post('/api/saveform', async (req, res) => {
  const formData = req.body;
  console.log('Received formData:', formData);
  
  const { email } = formData;
  const { part } = formData;
  if (part==null)
    res.status(400).json({ message: 'Part is empty!', error: err.message });
  const parsedData = parseFormData(formData);
  console.log('parse:', parsedData[part]);
  
  try {
    const existingRecord = await Questionnaire.findOne({ email });
    if (existingRecord) {
      if (!existingRecord[part]) {
        existingRecord[part] = {}; 
      }
      Object.assign(existingRecord[part], parsedData[part]);
      await existingRecord.save();
      console.log('Form data updated successfully', existingRecord[part]);
      res.status(200).json({ message: 'Data updated successfully', data: existingRecord });
    } else {
      // Create new record
      const result = await Questionnaire.create(parsedData);
      console.log('Form data inserted successfully', result);
      res.status(201).json({ message: 'Data received and saved', data: parsedData });
    }
  } catch (err) {
    console.error('Failed to save form data', err);
    res.status(500).json({ message: 'Failed to save data', error: err.message });
  }
});

//API to get probability
app.post('/api/probability', async (req, res) => {
  const formData = req.body;
  console.log('Received formData:', formData);
  const { email } = formData;
  try {
    const existingRecord = await Questionnaire.findOne({ email });
    if (existingRecord) {
      const completionStatus = checkCompletionStatus(existingRecord);
      if(completionStatus)
      {
        const prompt = model.getDescription(existingRecord);
        const aiResponse = await model.getProbabilityResponse(prompt);
        console.log(aiResponse);
        const probabilityData = JSON.parse(aiResponse);
        const updatedProbabilityRecord = await Probability.findOneAndUpdate(
          { email },
          {
            email,
            Probability3Months: probabilityData.Probability3Months,
            Probability6Months: probabilityData.Probability6Months,
            Probability9Months: probabilityData.Probability9Months,
            Probability9PlusMonths: probabilityData.Probability9PlusMonths,
            Suggestions: probabilityData.Suggestions,
            Skills: probabilityData.Skills
          },
          { upsert: true, new: true } 
        );
        console.log("response: "+updatedProbabilityRecord);
        res.status(200).json(updatedProbabilityRecord);
      }
      else
        res.status(404).json({ message: 'Complete all questions!!' });
    }
    else
        res.status(404).json({ message: 'No record found for this email.' });
  }
  catch(err)
  {
    console.error('Failed to retrieve data', err);
    res.status(500).json({ message: 'Failed to retrieve data', error: err.message });
  }
});

// API endpoint to read all form responses from MongoDB
app.get('/api/readform', async (req, res) => {
  try {
    const results = await Questionnaire.find({});
    res.status(200).json({ data: results });
  } catch (err) {
    console.error('Failed to retrieve data', err);
    res.status(500).json({ message: 'Failed to retrieve data', error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

//Helper function to check which parts has don.
const checkCompletionStatus = (record) => {
  const status = {
    demographic: Boolean(record.demographic?.age && record.demographic?.gender),
    knowledge: Boolean(record.knowledge?.graduationDate && record.knowledge?.training_education_analytics?.length > 0
      && record.knowledge?.projectsPortfolio && record.knowledge?.informationalInterviews
    ),
    softSkills: Boolean(record.soft_skills?.present && record.soft_skills?.story),
    technicalSkills: Boolean(record.technical_skills?.python || record.technical_skills?.sql
      || record.technical_skills?.r || record.technical_skills?.BI
      || record.technical_skills?.excel),
    workExperience: Boolean(record.work_experience?.non_analytics_canada && 
      record.work_experience?.analytics_abroad &&  
      record.work_experience?.analytics_canada && record.work_experience?.first_job_date &&
      record.work_experience?.interview_offers),
    personality: Boolean(record.personality?.persona && record.personality?.self_determination?.length > 0
      && record.personality?.proactivity?.length>0 && record.personality?.strategic_thinking?.length>0 
      && record.personality?.strategic_planning?.length>0 && record.personality?.self_awareness?.length>0),
    networking: Boolean(record.networking?.linkedin_reaching_out>0 && record.networking?.understanding_networking.length>0),
    resume: Boolean(record.resume?.job_posting_effectiveness?.length > 0 && record.resume?.length
      && record.resume?.customization?.length),
    linkedinProfile: Boolean(record.linkedin_profile?.persona && record.linkedin_profile?.recommendations),
    interviewing: Boolean(record.interviewing?.behavioral?.length > 0 && record.interviewing?.technical?.length > 0),
    culturalIntelligence: Boolean(record.cultural_intelligence?.small_talk_topics && record.cultural_intelligence?.culture && record.cultural_intelligence?.comfortable),
  };

  return status;
};


// Helper function to parse form data
const parseFormData = (formData) => {
  return {
    demographic: {
      age: formData.age || null,
      gender: formData.gender || null
    },
    knowledge: {
      graduationDate: formData?.graduationDate,
      training_education_analytics: formData?.training_education_analytics || [],
      firstJobAnalytics: formData?.firstJobAnalytics || '',
      projectsPortfolio: formData?.projectsPortfolio || '',
      informationalInterviews: formData?.informationalInterviews || '',
    },
    soft_skills: {
      present: formData.present || 0,
      story: formData.story || 0,
      convey: formData.convey || 0,
      simplify: formData.simplify || 0,
      narrative: formData.narrative || 0,
      jobSatisfaction: formData.jobSatisfaction || 0,
      goalAbility: formData.goalAbility || 0,
      maxEffort: formData.maxEffort || 0,
      hardWorkSuccess: formData.hardWorkSuccess || 0,
      goalWorry: formData.goalWorry || 0,
      minWork: formData.minWork || 0,    
      smallTalkTopics: {
        politics: formData.smallTalkTopics?.politics || false,
        weather: formData.smallTalkTopics?.weather || false,
        hobbies: formData.smallTalkTopics?.hobbies || false,
        movies: formData.smallTalkTopics?.movies || false,
        sports: formData.smallTalkTopics?.sports || false,
        healthIssues: formData.smallTalkTopics?.healthIssues || false,
        jobIssues: formData.smallTalkTopics?.jobIssues || false,
        salary: formData.smallTalkTopics?.salary || false,
        pets: formData.smallTalkTopics?.pets || false,
        stress: formData.smallTalkTopics?.stress || false,
        cooking: formData.smallTalkTopics?.cooking || false,
        travel: formData.smallTalkTopics?.travel || false,
        family: formData.smallTalkTopics?.family || false,
      },
    },
    technical_skills: {
      python: formData.python || 0,
      sql: formData.sql || 0,
      excel: formData.excel || 0,
      BI: formData.BI || 0,
      r: formData.r || 0,
    },
    work_experience: {
      non_analytics_canada: formData.workExperienceCanadaNonAnalytics || 0,
      analytics_canada: formData.workExperienceCanadaAnalytics || 0,
      analytics_abroad: formData.workExperienceAbroadAnalytics || 0,
      first_job_date: formData.first_job_date || '',
      interview_offers: formData.interview_offers || 0,
    },
    personality: {
      persona: formData.persona || '',
      proactivity: formData.proactivity || [],
      self_awareness: formData.self_awareness || [],
      self_determination: formData.self_determination || [],
      strategic_thinking: formData.strategic_thinking || [],
      strategic_planning: formData.strategic_planning || [],
    },
    networking: {
      linkedin_reaching_out: formData.linkedin_reaching_out || 0,
      understanding_networking: formData.understanding_networking || [],
    },
    resume: {
      job_posting_effectiveness: formData?.job_posting_effectiveness || [],
      length: formData?.length || 0,
      customization: formData?.customization || [],
    },
    linkedin_profile: {
      persona: formData.persona || 0,
      recommendations: formData.recommendations || 0,
      connections: formData.connections || 0,
      approach: formData.approach || 0,
      behavioral: formData.behavioral || []
    },    
    interviewing: {
      behavioral: formData?.behavioral || [],
      technical: formData?.technical || [],
      platforms_used: formData?.platforms_used || {
        none: false,
        leetcode: false,
        coderbyte: false,
        formation: false,
        algoExpert: false,
        strataScratch: false,
        hackerRank: false,
        interviewQuery: false,
        other: false,
      },
    },
    cultural_intelligence: {
      small_talk_topics: {
        what_is_small_talk: formData.smallTalkTopics?.what_is_small_talk || false,
        politics: formData.smallTalkTopics?.politics || false,
        weather: formData.smallTalkTopics?.weather || false,
        hobbies: formData.smallTalkTopics?.hobbies || false,
        movies_performances_books: formData.smallTalkTopics?.movies_performances_books || false,
        cooking_meals_cuisines: formData.smallTalkTopics?.cooking_meals_cuisines || false,
        family_personal_issues: formData.smallTalkTopics?.family_personal_issues || false,
        health_issues: formData.smallTalkTopics?.health_issues || false,
        job_issues: formData.smallTalkTopics?.job_issues || false,
        pets: formData.smallTalkTopics?.pets || false,
        salary: formData.smallTalkTopics?.salary || false,
        sport_events: formData.smallTalkTopics?.sport_events || false,
        stress_problems: formData.smallTalkTopics?.stress_problems || false,
        travel: formData.smallTalkTopics?.travel || false,
      },
      culture: formData.culture || 0,
      comfortable: formData.comfortable || 0
    },
    email: formData.email || '',
    dateCreated: new Date(),
  };
};