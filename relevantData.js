export function extractRelevantData(userMessage, portfolioData) {
  const lowerMsg = userMessage.toLowerCase();
  const relevant = {};
  const addedSections = new Set(); //this is here to remove all the duplicate values if user provides..

  const keywordToSectionMap = {
    project: "projects",
    projects: "projects",
    portfolio: "projects",
    apps: "projects",
    applications: "projects",

    skills: "skills",
    technologies: "skills",
    tools: "skills",
    stack: "skills",
    techstack: "skills",
    tech: "skills",
    programminglanguage: "skills",
    language: "skills",
    frontend: "skills",
    backend: "skills",
    database: "skills",

    experience: "experience",
    work: "experience",
    "worked on": "experience",
    company: "experience",
    projectsworked: "experience",

    education: "education",
    studies: "education",
    college: "education",
    school: "education",
    qualifications: "education",
    degree: "education",
    institution: "education",

    achievement: "achievements",
    achievements: "achievements",
    rank: "achievements",
    marks: "achievements",
    board: "achievements",
    score: "achievements",
    percentage: "achievements",

    interest: "interests",
    interests: "interests",
    passion: "interests",
    passionate: "interests",

    contact: "contact",
    email: "contact",
    phone: "contact",
    number: "contact",
    location: "contact",
    address: "contact",
    github: "contact",
    linkedin: "contact",
    social: "contact",

    bio: "bio",
    about: "bio",
    yourself: "bio",
    introduce: "bio",
    introduction: "bio",
    "who is tanishk": "bio",
    age: "bio",
    old: "bio",
    name: "bio",
    "what do you do": "bio",
    role: "bio",
    summary: "bio",
    hobbies: "bio",
    cricket: "bio",
    "play cricket": "bio",
    "free time": "bio",
    "like to do": "bio",
  };

  for (const keyword in keywordToSectionMap) {
    if (lowerMsg.includes(keyword)) {
      const section = keywordToSectionMap[keyword];

      if (!addedSections.has(section)) {
        addedSections.add(section);

        switch (section) {
          case "bio":
            relevant.bio = {
              name: portfolioData?.bio?.name,
              role: portfolioData?.bio?.role,
              summary: portfolioData?.bio?.summary,
              age: portfolioData?.bio?.age,
              hobbies: portfolioData?.bio?.hobbies,
            };
            break;

          case "skills":
            relevant.skills = portfolioData?.skills;
            break;

          case "projects":
            relevant.projects = (portfolioData?.projects || []).map((p) => ({
              title: p.title,
              description: p.description,
              techStack: p.techStack,
              features: p.features,
              challenges: p.challenges,
            }));
            break;

          case "experience":
            relevant.experience = portfolioData?.experience;
            break;

          case "education":
            relevant.education = portfolioData?.education;
            break;

          case "achievements":
            relevant.achievements = portfolioData?.achievements;
            break;

          case "interests":
            relevant.interests = portfolioData?.interests;
            break;

          case "contact":
            relevant.contact = portfolioData?.contact;
            break;
        }
      }
    }
  }

  if (Object.keys(relevant).length === 0) {
    relevant.bio = {
      name: portfolioData?.bio?.name,
      role: portfolioData?.bio?.role,
    };
  }

  return relevant;
}
