export function extractRelevantData(userMessage, portfolioData) {
  const msg = userMessage.toLowerCase();
  const relevant = {};
  const addedSections = new Set(); // prevent duplicates

  const keywordToSectionMap = {
    // Projects
    project: "projects",
    projects: "projects",
    portfolio: "projects",
    app: "projects",
    apps: "projects",
    application: "projects",
    applications: "projects",

    // Skills
    skills: "skills",
    tech: "skills",
    techs: "skills",
    techstack: "skills",
    technologies: "skills",
    tools: "skills",
    language: "skills",
    languages: "skills",
    frontend: "skills",
    backend: "skills",
    database: "skills",
    databases: "skills",
    stack: "skills",

    // Experience
    experience: "experience",
    work: "experience",
    worked: "experience",
    company: "experience",
    job: "experience",
    internship: "experience",
    intern: "experience",

    // Education
    education: "education",
    educate: "education",
    studies: "education",
    study: "education",
    college: "education",
    school: "education",
    degree: "education",
    qualifications: "education",

    // Achievements
    achievement: "achievements",
    achievements: "achievements",
    rank: "achievements",
    marks: "achievements",
    score: "achievements",
    percentage: "achievements",
    board: "achievements",

    // Interests
    interest: "interests",
    interests: "interests",
    hobby: "interests",
    hobbies: "interests",
    passion: "interests",

    // Contact
    contact: "contact",
    email: "contact",
    phone: "contact",
    number: "contact",
    location: "contact",
    address: "contact",
    github: "contact",
    linkedin: "contact",
    social: "contact",

    // Bio
    bio: "bio",
    about: "bio",
    yourself: "bio",
    introduction: "bio",
    introduce: "bio",
    summary: "bio",
    who: "bio",
    name: "bio",
    role: "bio",
    age: "bio",
    girlfriend: "girlfriend",
  };

  // Check user message for keywords
  for (const keyword in keywordToSectionMap) {
    if (msg.includes(keyword)) {
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
          case "girlfriend":
            relevant.girlfriend = portfolioData?.girlfriend;
        }
      }
    }
  }

  // Default fallback → name + role
  if (Object.keys(relevant).length === 0) {
    relevant.bio = {
      name: portfolioData?.bio?.name,
      role: portfolioData?.bio?.role,
    };
  }

  return relevant;
}
