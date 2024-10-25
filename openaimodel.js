const express = require('express');
const cors = require('cors');
const connectDB = require("./config/connectDB");
const Questionnaire = require("./models/questionnaire");
const bodyParser = require('body-parser');

const { config } = require('dotenv');
const OpenAI = require('openai');

// Load environment variables
config();

// Create a web server
const app = express();
const port = 3034;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//Functions to convert numerical data stored in the database into readable language format to create the prompt
//FUNCTION1-DEMOGRAPHIC AND KNOWLEDGE
function knowledgeAndDemoPrompt(knowledge, demographic) {
  // console.log(data);
  // Define mappings for numeric values to descriptive text
  const analyticsDegreeMapping = [
    "Has completed some analytics-related courses with no certificates",
    "Has completed some analytics-related courses with certificates",
    "Is pursuing or completed an undergraduate degree in analytics",
    "Is pursuing or completed a graduate or post-graduate degree in analytics"
  ];

  const projectsPortfolioMapping = {
    "None": "No project portfolio",
    "One": "1 project for portfolio",
    "Two": "2 projects for portfolio",
    "Three": "3 projects for portfolio",
    "MoreThanThree": "3+ projects for portfolio"
  };

  const informationalInterviewMapping = {
    "WhatIs": "Unaware of Informational Interviews",
    "None": "Not done Informational Interviews",
    "Few": "Done few Informational Interviews",
    "Many": "Done many Informational Interviews"
  };

  // Extract data
  // const { knowledge, demographic } = data.data;
  // console.log(knowledge);
  // Format the graduation date
  const formattedGraduationDate = knowledge.graduationDate
    ? new Date(knowledge.graduationDate).toLocaleDateString()
    : "Not provided";

  // Map numeric values to descriptive text
  const analyticsDegrees = knowledge.training_education_analytics
    .map((value, index) => value === 1 ? analyticsDegreeMapping[index] : null)
    .filter(text => text !== null);

  // Convert the project portfolio value to text
  const formattedProjectsPortfolio = projectsPortfolioMapping[knowledge.projectsPortfolio] || "Not provided";

  // Convert the informational interviews value to text
  const formattedInformationalInterviews = informationalInterviewMapping[knowledge.informationalInterviews] || "Not provided";

  // Return the combined prompt sentence
  return `Age: ${demographic.age}; Gender: ${demographic.gender}; Graduation Date: ${formattedGraduationDate}; Analytics Degrees: ${analyticsDegrees.join(', ') || "None"}; First Job in Analytics: ${knowledge.firstJobAnalytics === "Yes" ? "Yes" : "No"}; Projects Portfolio: ${formattedProjectsPortfolio}; Informational Interviews: ${formattedInformationalInterviews}.`;
}

//FUNCTION2-NETWORKING AND RESUME
function networkingAndResume(networking, resume) {
  const networkingStatements = [
    "I can change my opinion when I hear good arguments",
    "If I only know someone through social media (LinkedIn, Facebook), it is inappropriate to ask them for a meeting",
    "Networking is all about finding people who can help me with my next career move",
    "I find the idea of networking with strangers challenging",
    "I feel comfortable walking up to someone I find interesting and talking to them",
    "I actively attend job fairs and professional events related to analytics",
    "I am constantly on the lookout for new ways to improve my life",
    "If I see something I dont like, I fix it",
    "I tend to let others take the initiative to start new projects",
    "I can spot a good opportunity long before others can",
    "I enjoy promoting new ideas, even when others dismiss them"
  ];

  const opinionOptions = [
    "I strongly disagree that ",
    "I disagree that ",
    "I am neutral about the statement- ",
    "I agree that ",
    "I strongly agree that "
  ];
  
  const resumeLengthOptions = ["One page", "Two pages", "More than two pages"];
  const resumeCustomizationOptions = [
    "Values of the company",
    "Soft skills",
    "Technical skills",
    "Education required",
    "Work experience required"
  ];

  const networkingTimeOptions = [
    "I constantly network with people irrespective of my job situation",
    "Sooner rather than later",
    "About 3 months before the contract expires",
    "I will use the network I already have rather than making new connections",
    "I will contact people if their company is hiring",
    "Why do I need to network? I will start applying for positions with my resume directly"
  ];

  // Networking prompt
  const networkingPrompt = "My networking skills:\n" + 
    `If my contract expires in a year, the best time for me to start networking for a new role is: ${networkingTimeOptions[networking.linkedin_reaching_out]}.\n`+
    networking.understanding_networking.map((response, index) => 
      ` ${opinionOptions[response]} ${networkingStatements[index]}.`
    ).join('\n');

  // Resume prompt
  const resumePrompt = "Resume Responses:\n"+
    ` For a job application, in my resume, ${opinionOptions[resume.job_posting_effectiveness[0]]}I should include as many skills/job experiences as I have, and ${opinionOptions[resume.job_posting_effectiveness[1]]} one should avoid using exact words mentioned in a job posting, as a hiring manager might assume that I copied their job posting into my resume. \n`+
    ` Resume Length: ${resumeLengthOptions[resume.length]}\n`+
    ` When looking through a job posting for what a position requires, I look at:\n`;
    resume.customization
    .map((value, index) => value === 1 ? resumeCustomizationOptions[index] : null)
    .filter(option => option !== null)
    .join('. \n');

  return `${networkingPrompt}\n${resumePrompt}`;
}

//FUNCTION3-TECHNICAL SKILLS AND WORK EXPERIENCE
function technicalAndworkExperience(technicalSkills, work_experience) {
  //Work Experience
  const work_NonAnalyticsCanada = work_experience?.work_NonAnalyticsCanada ?? "Not provided";
  const work_AnalyticsCanada = work_experience?.analytics_canada ?? "Not provided";
  const work_AnalyticsAbroad = work_experience?.analytics_abroad ?? "Not provided";
  //const work_portfolioProjects = work_experience?.portfolio_projects ?? "Not provided";
  const work_firstJobDate = work_experience?.first_job_date
    ? new Date(work_experience.first_job_date).toLocaleDateString()
    : "Not provided";
  const work_interviewOffers = work_experience?.interview_offers ?? "Not provided";

  // Work experience prompt
  const workPrompt = "Work Experience Responses:\n"+
          `My work experience in Canada not related to data analytics: ${work_NonAnalyticsCanada} years
          and Work experience in Canada related to data analytics: ${work_AnalyticsCanada} years
          and data analytics Work experience abroad: ${work_AnalyticsAbroad} years
          and first job date in data analytics in Canada: ${work_firstJobDate}
          and I have: ${work_interviewOffers} interview offers.`;
  
  //Technical Skills
  const options = [
    "Not Provided",
    "Not studied",
    "Studied but need to apply this skill",
    "Have some experience but still learning",
    "Have enough experience but require occasional support",
    "Can execute complex tasks",
    "Can train others",
  ];

  const BI=options[technicalSkills.BI] ?? "Not Provided";
  const sql=options[technicalSkills.sql] ?? "Not Provided";
  const r=options[technicalSkills.r] ?? "Not Provided";
  const excel=options[technicalSkills.excel] ?? "Not Provided";
  const python=options[technicalSkills.python] ?? "Not Provided";
  
  
  
  const technicalPrompt = "Technical skills Responses:\n"+
    `My skill in B.I. is: ${BI}
    and my skill in r is: ${r}
    and my skill in python is: ${python}
    and my skill in excel is: ${excel}
    and my skill in sql is: ${sql}.`;
  
  
  return `${technicalPrompt}\n${workPrompt}`
}

function getDescription(dataJson) {
  // Get Knowledge and Demographic's part of the prompt
  const { knowledge, demographic} = dataJson;
  prompt_P1=knowledgeAndDemoPrompt(knowledge, demographic);
  // Get networking and resume's part of the prompt
  const { networking, resume } = dataJson;
  prompt_P2=prompt_P1+' '+networkingAndResume(networking, resume);
  
  const {technical_skills, work_experience}=dataJson;
  prompt_P3=prompt_P2+' '+technicalAndworkExperience(technical_skills, work_experience);
    // Add more information to the prompt here by creating seperate functions for other questionnnaire sections and calling them here

  prompt = `Based on the following data: ${prompt_P3},
    what is the percentage probability of employment in 3 months, 6 months, 9 months, and 9+ months? 
    Additionally, provide improvement suggestions for increasing employment probability in these areas: 
      Networking, Technical Skills, Soft Skills, Resume, Interview Preparation. 
    Please also assess the following Skills: 
      Technical Skills, Soft Skills, Resume, Interview Skills, Knowledge, Networking, 
      providing the level of each skill as a number between 0 and 1, where 0 is 'Basic' and 1 is 'Expert'.
    Please provide the response in the following JSON format: 
    {
    "Probability3Months": "value",
    "Probability6Months": "value",
    "Probability9Months": "value", 
    "Probability9PlusMonths": "value",
    "Suggestions": [
      {"area": "Networking", "suggestion": "value"},
      {"area": "Technical Skills", "suggestion": "value"},
      {"area": "Soft Skills", "suggestion": "value"},
      {"area": "Resume", "suggestion": "value"},
      {"area": "Interview Preparation", "suggestion": "value"}
    ],
    "Skills": [
      {"skill": "Technical Skills", "level": "value"},
      {"skill": "Soft Skills", "level": "value"},
      {"skill": "Resume", "level": "value"},
      {"skill": "Interview Skills", "level": "value"},
      {"skill": "Knowledge", "level": "value"},
      {"skill": "Networking", "level": "value"}
    ]
  }.`;
          
  return prompt;
}

//Function to call the openAI API and return the response
async function getProbabilityResponse(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: prompt },
    ],
  });
  
  return response.choices[0].message.content;
}

// API endpoint to get all data for a given email
app.get('/api/getdata/:email', async (req, res) => {
  const { email } = req.params;
  
  try {
    // Find the record by email
    const record = await Questionnaire.findOne({ email });
    
    if (record) {
      //console.log('Data retrieved from database:', record);  // Log data to the console

      const prompt = getDescription(record);
      // res.send(prompt);

      // UNCOMMENT THE BELOW 2 LINE - COMMENTED TO PREVENT USELESS API CALL AS IT IS EXPENSIVE
      // const aiResponse = await getProbabilityResponse(prompt);
      // res.status(200).json(JSON.parse(aiResponse));

      res.status(200).send('Uncomment some lines above and comment this.\n'+ prompt);
      // ----------Add code here which converts the json data into a prompt question using minimum words possible?
      // I want the prompt to ask 'what is the probability of employment in 3months, 6 months, 9 months and 9+ months based on' - the data from json file 
      // ----------
      
    } else {
      res.status(404).json({ message: 'No record found for this email.' });
    }
  } catch (err) {
    console.error('Failed to retrieve data', err);
    res.status(500).json({ message: 'Failed to retrieve data', error: err.message });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = {
  getDescription,
  getProbabilityResponse,
};
