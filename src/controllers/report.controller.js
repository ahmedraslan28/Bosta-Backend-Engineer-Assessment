const { generatePeriodReportCSV, generateAllBorrowsLastMonth, generateOverdueBorrowsLastMonth } = require("../services/report.service");

exports.exportPeriodReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ message: "Missing from or to date" });
      return ;
    }

    const filePath = await generatePeriodReportCSV(from, to);

    if (!filePath) {
      res.status(200).json({ message: "No data to export in this period." });
    }

    res.status(200).json({
      message: "Report generated and saved successfully.",
      path: filePath,
    });
  } catch (err) {
    next(err);
  }
};

exports.exportOverdueLastMonth = async (req, res, next) => {
  try {
    const filePath = await generateOverdueBorrowsLastMonth();
    if (!filePath) {
      res.status(200).json({ message: "No data to export in this period." });
      return;
    }
    res.status(200).json({
      message: "Overdue report saved successfully.",
      path: filePath,
    });
  } catch (err) {
    next(err);
  }
};

exports.exportAllLastMonth = async (req, res, next) => {
  try {
    const filePath = await generateAllBorrowsLastMonth();
    if (!filePath) {
      res.status(200).json({ message: "No data to export in this period." });
      return;
    }
    res.status(200).json({
      message: "All borrows last month report saved successfully.",
      path: filePath,
    });
  } catch (err) {
    next(err);
  }
};

