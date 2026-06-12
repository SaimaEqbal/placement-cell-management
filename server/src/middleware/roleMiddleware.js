export const requireSPC = (req, res, next) => {
  if (req.user.role !== "spc") {
    return res.status(403).json({
      message: "SPC access required",
    });
  }

  next();
};