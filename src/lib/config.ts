export const QUIZ_CONFIG = {
	fluency: {
		/**
		 * The maximum response time (in milliseconds) to be considered a "fast" response.
		 * Correct answers within this time reward maximum SM-2 quality (5) and highest XP.
		 * Incorrect answers within this time penalize slightly less than a slow incorrect answer (Quality 2 vs 1).
		 */
		fastResponseThresholdMs: 3000,

		/**
		 * The maximum response time (in milliseconds) to be considered an "average" response.
		 * Correct answers within this time (but slower than fast) reward high SM-2 quality (4).
		 * Correct answers taking longer than this threshold are considered "slow" and reward SM-2 quality (3).
		 */
		averageResponseThresholdMs: 5000
	}
};
