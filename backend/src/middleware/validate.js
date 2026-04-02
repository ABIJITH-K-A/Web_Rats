import { HttpError } from '../lib/httpError.js';

const formatIssues = (issues = []) =>
  issues.map((issue) => ({
    path: issue.path.join('.') || 'body',
    message: issue.message,
  }));

const validate = (target) => (schema) => (req, res, next) => {
  const result = schema.safeParse(req[target]);

  if (!result.success) {
    next(
      new HttpError(400, `Invalid request ${target}.`, {
        issues: formatIssues(result.error.issues),
      })
    );
    return;
  }

  // Store validated data in a specific property to ensure routes use the safe data
  const validatedKey = `validated${target.charAt(0).toUpperCase() + target.slice(1)}`;
  req[validatedKey] = result.data;
  next();
};

export const validateBody = validate('body');
export const validateQuery = validate('query');
export const validateParams = validate('params');

export default {
  validateBody,
  validateQuery,
  validateParams,
};
