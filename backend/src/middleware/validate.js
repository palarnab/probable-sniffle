import { ZodError } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            status: 400,
            issues: err.issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
              code: i.code,
            })),
          },
        });
      }
      next(err);
    }
  };
}
