export enum SuggestType {
    SKILL_SUGGESTION = "skill_suggestion",
}

export interface SkillAnalysis {
    matched_skills: string[];
    missing_skills: string[];
}

export interface SuggestData {
    userId: string;
    requestedSkills: SkillAnalysis;
}

export interface SuggestedResponse {
    suggested_problems: string[];
    suggested_quizzes: string[];
}