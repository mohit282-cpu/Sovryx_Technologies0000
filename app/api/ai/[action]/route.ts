import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Instantiate GenAI client lazily or using process.env.GEMINI_API_KEY
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const { action } = await params;
    const body = await req.json();

    const ai = getGenAIClient();
    const model = "gemini-2.5-flash";

    let systemInstruction = "You are Sovryx OS, an elite AI Executive Advisor and Chief Operating Officer intelligence engine serving the company CEO.";
    let prompt = "";

    switch (action) {
      case "weekly-summary":
        prompt = `Generate a concise, high-impact Weekly CEO Executive Summary for the company based on this operational context:
${JSON.stringify(body, null, 2)}

Provide:
1. Overall Weekly Performance Overview (2-3 sentences)
2. Strategic Key Wins & Milestones
3. Bottlenecks & Operational Delays
4. CEO Priority Action Items for Next Week`;
        break;

      case "employee-review":
        prompt = `Generate a formal CEO Employee Performance Review for employee:
${JSON.stringify(body.employee, null, 2)}
Tasks completed by employee: ${JSON.stringify(body.tasks || [], null, 2)}

Provide:
1. Executive Performance Evaluation
2. Core Technical & Professional Strengths
3. Areas Requiring Growth / Improvement
4. Promotion Recommendation (Immediate / Eligible in 6 Months / Hold)
5. Suggested Targeted Training / Mentorship Program`;
        break;

      case "project-summary":
        prompt = `Generate a Project Executive Brief for project:
${JSON.stringify(body.project, null, 2)}
Associated Tasks: ${JSON.stringify(body.tasks || [], null, 2)}

Provide:
1. Health & Velocity Summary
2. Budget & Timeline Risk Assessment
3. Team Allocation & Execution Quality
4. Next Milestone Deliverables`;
        break;

      case "risk-detection":
        prompt = `Analyze company projects, tasks, attendance, and employee metrics to detect operational and delivery risks:
Context: ${JSON.stringify(body, null, 2)}

Provide a structured JSON output with:
{
  "criticalRisks": [
    {"source": "Project / Employee name", "severity": "High/Medium", "issue": "Description", "mitigation": "Recommended CEO Action"}
  ],
  "riskLevel": "Low | Medium | Critical",
  "summary": "Brief executive risk overview"
}`;
        break;

      case "meeting-summary":
        prompt = `Summarize this executive meeting notes/agenda and extract actionable items:
Meeting Title: ${body.title || 'Executive Sync'}
Agenda: ${body.agenda || ''}
Raw Notes / Audio Transcript: ${body.rawNotes || body.agenda || ''}

Provide JSON:
{
  "executiveSummary": "Concise overview of discussion points and decisions",
  "actionItems": [
    {"text": "Specific task", "assignee": "Employee name or unassigned"}
  ]
}`;
        break;

      case "performance-analysis":
        prompt = `Analyze overall company workforce performance data and provide ratings & CEO interventions:
Employees data: ${JSON.stringify(body.employees, null, 2)}
Performance records: ${JSON.stringify(body.performance, null, 2)}

Provide:
1. Overall Workforce Productivity Assessment
2. Top Performers & Recognition Advice
3. Underperforming Personnel & Corrective Action Plans
4. Strategic Leadership & Skill Gap Recommendations`;
        break;

      case "ceo-recommendations":
        prompt = `You are advising the CEO of Sovryx Technologies. Based on current metrics:
${JSON.stringify(body, null, 2)}

Give 3-5 immediate high-leverage strategic recommendations to maximize company revenue, eliminate project risks, and elevate team productivity.`;
        break;

      case "task-generation":
        prompt = `Generate a list of actionable project tasks for goal/brief: "${body.brief}".
Project ID: ${body.projectId || ''}
Available Employees: ${JSON.stringify(body.employees || [], null, 2)}

Provide JSON response as an array of tasks:
[
  {
    "title": "Task title",
    "description": "Clear step description",
    "priority": "Low|Medium|High|Urgent",
    "difficulty": "Easy|Medium|Hard|Expert",
    "estimatedHours": 10,
    "suggestedEmployeeName": "Name if applicable"
  }
]`;
        break;

      case "project-planning":
        prompt = `Generate a comprehensive project milestone roadmap, recommended budget allocation, and team structure for project idea:
Title: "${body.name}"
Client: "${body.client}"
Budget: $${body.budget || 100000}
Description: "${body.description}"

Provide structured project plan with milestones, risk assessment, and recommended task breakdown.`;
        break;

      case "company-report":
        prompt = `Generate a formal ${body.type || 'Daily'} Executive Operating Report for the CEO:
Company State: ${JSON.stringify(body.state, null, 2)}

Provide a formatted markdown executive report containing Executive Summary, Key Highlights, Identified Operational Risks, and Recommended CEO Decisions.`;
        break;

      case "chat":
        prompt = `The CEO asks: "${body.userMessage}".
Current Company Snapshot Context:
- Employees Count: ${body.context?.employeesCount || 0}
- Active Projects: ${body.context?.projectsCount || 0}
- At Risk Projects: ${body.context?.atRiskCount || 0}
- Pending Urgent Tasks: ${body.context?.urgentTasksCount || 0}

Answer directly as the Chief AI Advisor to the CEO in a clear, decisive, professional manner.`;
        break;

      default:
        return NextResponse.json({ error: `Unknown AI action: ${action}` }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return NextResponse.json({
      text: response.text || "No AI response generated.",
      action
    });

  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process AI request." },
      { status: 500 }
    );
  }
}
