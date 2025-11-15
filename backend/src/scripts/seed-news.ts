// backend/src/scripts/seed-news.ts
// Script để tạo dữ liệu mẫu cho News
import { connectMongo } from "../config/database";
import { News } from "../shared/models/News";

const sampleNews = [
  {
    title: "The Future of Artificial Intelligence in Education",
    category: "education",
    image: "s3://project.toeic/news/ai-education.jpg",
    paragraphs: [
      "Artificial intelligence is revolutionizing the education sector in unprecedented ways. From personalized learning experiences to automated grading systems, AI technologies are reshaping how students learn and teachers teach. Educational institutions worldwide are increasingly adopting AI-powered tools to enhance the learning process and improve educational outcomes.",
      "Machine learning algorithms can now analyze student performance data to identify learning patterns and predict areas where students might struggle. This enables educators to provide targeted interventions and personalized support, ensuring that no student falls behind. Adaptive learning platforms use AI to adjust the difficulty and pace of content based on individual student progress.",
      "Despite these benefits, the integration of AI in education also raises important questions about data privacy, algorithmic bias, and the role of human teachers. Experts emphasize that AI should complement, not replace, human educators, serving as a powerful tool to enhance teaching effectiveness while preserving the essential human elements of education such as empathy, creativity, and critical thinking.",
    ],
    publishedAt: new Date("2024-11-10"),
  },
  {
    title: "Global Climate Summit Reaches Historic Agreement",
    category: "politics",
    image: "s3://project.toeic/news/climate-summit.jpg",
    paragraphs: [
      "World leaders have reached a groundbreaking agreement at the Global Climate Summit, committing to ambitious targets for reducing greenhouse gas emissions. The historic accord represents a significant step forward in the international effort to combat climate change and limit global temperature rise to 1.5 degrees Celsius above pre-industrial levels.",
      "The agreement includes provisions for financial support to developing nations, technology transfer for clean energy solutions, and mechanisms for monitoring and reporting emissions. Developed countries have pledged substantial funding to help vulnerable nations adapt to climate impacts and transition to renewable energy sources.",
      "Environmental organizations have welcomed the agreement while cautioning that implementation will be crucial. The success of this initiative depends on each country's commitment to translating these promises into concrete policies and actions. Scientists emphasize that the window for preventing catastrophic climate change is rapidly closing, making immediate action imperative.",
    ],
    publishedAt: new Date("2024-11-12"),
  },
  {
    title: "Breakthrough in Renewable Energy Storage Technology",
    category: "technology",
    image: "s3://project.toeic/news/renewable-energy.jpg",
    paragraphs: [
      "Scientists have announced a major breakthrough in battery technology that could revolutionize renewable energy storage. The new solid-state battery design offers significantly higher energy density, faster charging times, and improved safety compared to conventional lithium-ion batteries. This innovation addresses one of the most significant challenges facing the widespread adoption of renewable energy sources.",
      "The breakthrough technology uses advanced materials that allow for more efficient energy storage while reducing the risk of overheating and degradation over time. Researchers report that the new batteries can store up to three times more energy than current models and can be recharged in a fraction of the time. This development has significant implications for electric vehicles, grid-scale energy storage, and portable electronics.",
      "Industry experts predict that this technology could accelerate the transition to renewable energy by making solar and wind power more reliable and cost-effective. The ability to store excess energy generated during peak production times and release it when needed addresses the intermittency problem that has long plagued renewable energy systems. Commercial production of these batteries is expected to begin within the next few years.",
    ],
    publishedAt: new Date("2024-11-13"),
  },
  {
    title: "Cultural Heritage Sites Protected Through Digital Preservation",
    category: "culture",
    image: "s3://project.toeic/news/digital-heritage.jpg",
    paragraphs: [
      "A new international initiative is using cutting-edge technology to create detailed digital replicas of endangered cultural heritage sites. Using advanced 3D scanning, photogrammetry, and virtual reality technologies, researchers are documenting monuments, temples, and archaeological sites with unprecedented precision. This digital preservation effort aims to protect cultural heritage for future generations, even if the physical sites are threatened by climate change, conflict, or natural disasters.",
      "The project has already documented dozens of significant sites across multiple continents, creating comprehensive digital archives that capture every detail down to millimeter-level accuracy. These digital models serve multiple purposes: they provide valuable data for restoration efforts, enable virtual tours for educational purposes, and create permanent records of sites that might otherwise be lost to time.",
      "Experts emphasize that digital preservation should complement, not replace, traditional conservation efforts. While virtual replicas cannot capture the full experience of visiting a physical site, they offer an invaluable tool for education, research, and preservation. The initiative has received support from UNESCO and various governments committed to protecting world heritage sites.",
    ],
    publishedAt: new Date("2024-11-14"),
  },
  {
    title: "Medical Research Reveals New Approach to Fighting Disease",
    category: "health",
    image: "s3://project.toeic/news/medical-research.jpg",
    paragraphs: [
      "Medical researchers have discovered a promising new approach to treating autoimmune diseases that could benefit millions of patients worldwide. The breakthrough involves reprogramming immune cells to stop attacking the body's own tissues while maintaining their ability to fight infections and cancer. Early clinical trials have shown encouraging results with minimal side effects.",
      "The treatment uses advanced gene therapy techniques to modify specific immune cells, teaching them to distinguish between healthy tissue and genuine threats. Unlike traditional immunosuppressive drugs that weaken the entire immune system, this targeted approach preserves overall immune function while addressing the root cause of autoimmune disorders. Patients in the trials have experienced significant improvement in symptoms and quality of life.",
      "While the research is still in its early stages, scientists are optimistic about the potential for this therapy to treat a wide range of autoimmune conditions, including rheumatoid arthritis, multiple sclerosis, and type 1 diabetes. The next phase of research will involve larger clinical trials to confirm the treatment's safety and effectiveness across diverse patient populations.",
    ],
    publishedAt: new Date("2024-11-15"),
  },
];

async function seedNews() {
  try {
    await connectMongo();
    console.log("Connected to MongoDB");

    // Clear existing news
    await News.deleteMany({});
    console.log("Cleared existing news");

    // Insert sample news
    await News.insertMany(sampleNews);
    console.log(`Successfully seeded ${sampleNews.length} news articles`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding news:", error);
    process.exit(1);
  }
}

seedNews();


