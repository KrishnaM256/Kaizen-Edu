from flask import Flask,request,jsonify
from flask_cors import CORS
# Predefined mapping of skills to domains
app = Flask(__name__)
CORS(app)
skill_to_domain = {
    # Programming Languages
    "Python": ["Data Science", "Machine Learning", "Web Development", "Automation", "Scripting"],
    "Java": ["Web Development", "Android Development", "Enterprise Applications"],
    "C++": ["Game Development", "System Programming", "Embedded Systems"],
    "JavaScript": ["Web Development", "Frontend Development", "Full Stack Development"],
    "C": ["System Programming", "Embedded Systems", "Operating Systems"],
    "C#": ["Game Development", "Windows Applications", "Enterprise Software"],
    "R": ["Data Science", "Statistical Analysis", "Bioinformatics"],
    "Swift": ["iOS Development", "Mobile App Development"],
    "Kotlin": ["Android Development", "Mobile App Development"],
    "Go": ["Backend Development", "Cloud Computing", "Microservices"],
    "Ruby": ["Web Development", "Scripting", "Automation"],
    "PHP": ["Web Development", "Backend Development"],
    "TypeScript": ["Web Development", "Frontend Development", "Full Stack Development"],
    "SQL": ["Database Management", "Data Analysis", "Backend Development"],
    "Bash": ["Scripting", "Automation", "DevOps"],

    # Data Science and Machine Learning
    "Machine Learning": ["Data Science", "Artificial Intelligence", "Predictive Analytics"],
    "Deep Learning": ["Artificial Intelligence", "Computer Vision", "Natural Language Processing"],
    "Data Analysis": ["Data Science", "Business Intelligence", "Statistics"],
    "Data Visualization": ["Data Science", "Business Intelligence", "Reporting"],
    "Statistics": ["Data Science", "Machine Learning", "Research"],
    "Natural Language Processing": ["Artificial Intelligence", "Text Analytics", "Chatbots"],
    "Computer Vision": ["Artificial Intelligence", "Image Processing", "Robotics"],
    "Big Data": ["Data Engineering", "Data Science", "Cloud Computing"],
    "Data Engineering": ["Data Science", "Big Data", "Cloud Computing"],
    "Predictive Analytics": ["Data Science", "Machine Learning", "Business Intelligence"],

    # Web Development
    "HTML": ["Web Development", "Frontend Development"],
    "CSS": ["Web Development", "Frontend Development"],
    "React": ["Frontend Development", "Web Development"],
    "Angular": ["Frontend Development", "Web Development"],
    "Vue.js": ["Frontend Development", "Web Development"],
    "Node.js": ["Backend Development", "Web Development"],
    "Django": ["Web Development", "Backend Development"],
    "Flask": ["Web Development", "Backend Development"],
    "Spring Boot": ["Web Development", "Backend Development", "Enterprise Applications"],
    "REST APIs": ["Web Development", "Backend Development", "Microservices"],
    "GraphQL": ["Web Development", "Backend Development", "API Design"],

    # Mobile Development
    "Android Development": ["Mobile App Development", "Android"],
    "iOS Development": ["Mobile App Development", "iOS"],
    "React Native": ["Mobile App Development", "Cross-Platform Development"],
    "Flutter": ["Mobile App Development", "Cross-Platform Development"],

    # Cloud and DevOps
    "AWS": ["Cloud Computing", "DevOps", "Backend Development"],
    "Azure": ["Cloud Computing", "DevOps", "Backend Development"],
    "Google Cloud": ["Cloud Computing", "DevOps", "Backend Development"],
    "Docker": ["DevOps", "Cloud Computing", "Containerization"],
    "Kubernetes": ["DevOps", "Cloud Computing", "Container Orchestration"],
    "CI/CD": ["DevOps", "Software Engineering", "Automation"],
    "Terraform": ["DevOps", "Infrastructure as Code", "Cloud Computing"],
    "Ansible": ["DevOps", "Automation", "Configuration Management"],

    # Software Engineering
    "Object-Oriented Programming": ["Software Engineering", "Programming Fundamentals"],
    "Design Patterns": ["Software Engineering", "System Design"],
    "System Design": ["Software Engineering", "Backend Development"],
    "Microservices": ["Software Engineering", "Backend Development", "Cloud Computing"],
    "Agile Methodology": ["Software Engineering", "Project Management"],
    "Scrum": ["Software Engineering", "Project Management"],
    "Version Control (Git)": ["Software Engineering", "Collaboration", "DevOps"],
    "Testing": ["Software Engineering", "Quality Assurance"],
    "Debugging": ["Software Engineering", "Problem Solving"],

    # Electrical and Electronics Engineering
    "Embedded Systems": ["Electrical Engineering", "IoT", "Robotics"],
    "IoT": ["Electrical Engineering", "Embedded Systems", "Smart Devices"],
    "Robotics": ["Electrical Engineering", "Mechanical Engineering", "AI"],
    "Circuit Design": ["Electrical Engineering", "Hardware Design"],
    "PCB Design": ["Electrical Engineering", "Hardware Design"],
    "Signal Processing": ["Electrical Engineering", "Telecommunications", "Audio Processing"],
    "Power Systems": ["Electrical Engineering", "Energy Management"],
    "Control Systems": ["Electrical Engineering", "Automation", "Robotics"],

    # Mechanical Engineering
    "CAD": ["Mechanical Engineering", "Product Design"],
    "Thermodynamics": ["Mechanical Engineering", "Energy Systems"],
    "Fluid Mechanics": ["Mechanical Engineering", "Aerospace Engineering"],
    "Structural Analysis": ["Mechanical Engineering", "Civil Engineering"],
    "Mechatronics": ["Mechanical Engineering", "Robotics", "Automation"],
    "Manufacturing": ["Mechanical Engineering", "Industrial Engineering"],
    "Materials Science": ["Mechanical Engineering", "Product Design"],

    # Business and Soft Skills
    "Project Management": ["Business", "Leadership", "Software Engineering"],
    "Leadership": ["Business", "Management", "Teamwork"],
    "Communication": ["Soft Skills", "Business", "Teamwork"],
    "Public Speaking": ["Soft Skills", "Communication", "Leadership"],
    "Teamwork": ["Soft Skills", "Collaboration", "Business"],
    "Time Management": ["Soft Skills", "Productivity", "Business"],
    "Problem Solving": ["Soft Skills", "Analytical Thinking", "Engineering"],
    "Critical Thinking": ["Soft Skills", "Analytical Thinking", "Research"],
    "Negotiation": ["Soft Skills", "Business", "Sales"],
    "Emotional Intelligence": ["Soft Skills", "Leadership", "Teamwork"],

    # Other Skills
    "Blockchain": ["Cryptography", "Finance", "Decentralized Systems"],
    "Cybersecurity": ["Information Security", "Network Security", "Ethical Hacking"],
    "UI/UX Design": ["Web Development", "Frontend Development", "Product Design"],
    "Game Development": ["Game Design", "Programming", "3D Modeling"],
    "3D Modeling": ["Game Development", "Animation", "Product Design"],
    "AR/VR": ["Game Development", "Simulation", "Training"],
    "Quantum Computing": ["Computer Science", "Physics", "Research"],
    "Bioinformatics": ["Biology", "Data Science", "Research"],
    "Ethical Hacking": ["Cybersecurity", "Information Security", "Network Security"],
}

def map_skills_to_domains(skills, skill_to_domain):
    domains = set()
    for skill in skills:
        if skill in skill_to_domain:
            domains.update(skill_to_domain[skill])
    return domains

# Function to calculate matching score
def calculate_matching_score(mentee_domains, mentor_domains):
    overlap = mentee_domains.intersection(mentor_domains)
    return len(overlap) / len(mentee_domains) if len(mentee_domains) > 0 else 0

# Function to match mentees with mentors
def match_mentees_with_mentors(mentees, mentors, skill_to_domain):
    mentee = mentees[0]  # Only one mentee is expected
    mentee_domains = map_skills_to_domains(mentee["skills"], skill_to_domain)

    matched_mentors = []
    for mentor in mentors:
        mentor_domains = set(mentor["domains"])
        matching_score = calculate_matching_score(mentee_domains, mentor_domains)
        if matching_score > 0.00:
            matched_mentors.append({
                "name": mentor["name"],
                "score": matching_score
            })

    # Sort mentors by matching score (highest first)
    matched_mentors.sort(key=lambda x: x["score"], reverse=True)
    return matched_mentors

# Flask API endpoint
@app.route('/match', methods=['POST'])
def match():
    data = request.json
    mentees = data.get("mentees", [])
    mentors = data.get("mentors", [])

    if not mentees or not mentors:
        return jsonify({"error": "Both mentees and mentors lists are required"}), 400

    matched_mentors = match_mentees_with_mentors(mentees, mentors, skill_to_domain)
    return jsonify({"matched_mentors": matched_mentors})

if __name__ == "__main__":
    app.run(debug=True)