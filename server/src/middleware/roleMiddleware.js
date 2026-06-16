export const requireSPC = (req, res, next) => {
  if (req.user.role !== "spc") {
    return res.status(403).json({
      message: "SPC access required",
    });
  }

  next();
};

export const requireTPC = (req, res, next) => {
  if (req.user.role !== "tpc") {
    return res.status(403).json({
      message: "TPC access required"
    });
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
};

export const requireAdminTPC = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "tpc") {
    return res.status(403).json({
      message: "Admin or TPC access required"
    });
  }

  next();
};

export const requireAdminTPCSPC = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "tpc" && req.user.role !== "spc") {
    return res.status(403).json({
      message: "Admin , TPC or SPC access required"
    });
  }

  next();
};