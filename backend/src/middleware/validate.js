import { HttpError } from '../lib/httpError.js';

const formatIssues = (issues = []) =>
  issues.map((issue) => ({
    path: issue.path.join('.') || 'body',
    message: issue.message,
  }));

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    next(
      new HttpError(400, 'Invalid request body.', {
        issues: formatIssues(result.error.issues),
      })
    );
    return;
  }

  req.validatedBody = result.data;
  next();
};

export default validateBody;
