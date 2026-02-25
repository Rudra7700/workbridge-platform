export interface ScoredJob {
    id: string;
    score: number;
    skillMatch: boolean;
    wageMatch: boolean;
    distanceMatch: boolean;
    // ... original job fields
}

// Mock function for now, real implementation would use Postgres similarity or more complex logic
export function calculateMatchScore(job: any, labourerProfile: any): number {
    let score = 0;

    // Skill Match (40%)
    // Assuming labor_profile.skills is array of strings
    if (labourerProfile.skills && labourerProfile.skills.some((s: string) => job.skill_required.toLowerCase().includes(s.toLowerCase()))) {
        score += 40;
    } else {
        // Partial text match fallback
        if (job.skill_required.toLowerCase().includes('general') || (labourerProfile.skills || []).includes('General')) {
            score += 10;
        }
    }

    // Wage Match (15%)
    // If job wage >= expectation
    if (job.wage >= (labourerProfile.wage_expectation || 0)) {
        score += 15;
    }

    // Distance (25%)
    // Requires lat/long. Mock:
    score += 15; // Assume moderate distance

    // Rating (20%)
    // Employer rating? Or Job urging?
    if (job.urgency) {
        score += 10;
    }

    return score;
}

export function sortJobsByMatch(jobs: any[], labourerProfile: any) {
    return jobs.map(job => ({
        ...job,
        matchScore: calculateMatchScore(job, labourerProfile)
    })).sort((a, b) => b.matchScore - a.matchScore);
}
