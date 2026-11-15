export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Please check the submitted information.",
        errors: result.error.issues.map(({ path, message }) => ({
          field: path.join("."),
          message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
}
