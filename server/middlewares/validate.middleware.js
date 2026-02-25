import { ZodError } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    const data = {
      body: req.body,
      params: req.params,
      query: req.query
    };

    const parsed = schema.parse(data);

    // Replace with sanitized values
    req.body = parsed.body || {};
    req.params = parsed.params || {};
    req.query = parsed.query || {};

    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: err.errors[0].message
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid request data"
    });
  }
};