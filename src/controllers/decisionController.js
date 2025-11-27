// src/controllers/decisionController.js
const Decision = require("../models/Decision");
const Option = require("../models/Option");
const Criteria = require("../models/Criteria");
const Evaluation = require("../models/Evaluation");

// POST /api/decisions
const createDecision = async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const decision = await Decision.create({
      user: req.user._id,
      title,
      description: description || "",
      tags: tags || [],
    });

    res.status(201).json({
      message: "Decision created",
      decision,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/decisions
const getDecisions = async (req, res, next) => {
  try {
    const decisions = await Decision.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ decisions });
  } catch (error) {
    next(error);
  }
};

// GET /api/decisions/:id
const getDecisionById = async (req, res, next) => {
  try {
    const decision = await Decision.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!decision) {
      return res.status(404).json({ message: "Decision not found" });
    }

    const [options, criteria, evaluations] = await Promise.all([
      Option.find({ decision: decision._id }),
      Criteria.find({ decision: decision._id }),
      Evaluation.find({ decision: decision._id }),
    ]);

    res.json({
      decision,
      options,
      criteria,
      evaluations,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/decisions/:id
const updateDecision = async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;

    const decision = await Decision.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        $set: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(tags && { tags }),
        },
      },
      { new: true }
    );

    if (!decision) {
      return res.status(404).json({ message: "Decision not found" });
    }

    res.json({ message: "Decision updated", decision });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/decisions/:id
const deleteDecision = async (req, res, next) => {
  try {
    const decision = await Decision.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!decision) {
      return res.status(404).json({ message: "Decision not found" });
    }

    await Promise.all([
      Option.deleteMany({ decision: decision._id }),
      Criteria.deleteMany({ decision: decision._id }),
      Evaluation.deleteMany({ decision: decision._id }),
      decision.deleteOne(),
    ]);

    res.json({ message: "Decision deleted" });
  } catch (error) {
    next(error);
  }
};

// POST /api/decisions/:id/options
const addOption = async (req, res, next) => {
  try {
    const { name, summary } = req.body;

    const decision = await Decision.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!decision) {
      return res.status(404).json({ message: "Decision not found" });
    }

    if (!name) {
      return res.status(400).json({ message: "Option name is required" });
    }

    const option = await Option.create({
      decision: decision._id,
      name,
      summary: summary || "",
    });

    res.status(201).json({ message: "Option added", option });
  } catch (error) {
    next(error);
  }
};

// POST /api/decisions/:id/criteria
const addCriteria = async (req, res, next) => {
  try {
    const { name, weight } = req.body;

    const decision = await Decision.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!decision) {
      return res.status(404).json({ message: "Decision not found" });
    }

    if (!name || !weight) {
      return res
        .status(400)
        .json({ message: "Criteria name and weight are required" });
    }

    const criteria = await Criteria.create({
      decision: decision._id,
      name,
      weight,
    });

    res.status(201).json({ message: "Criteria added", criteria });
  } catch (error) {
    next(error);
  }
};

// POST /api/decisions/:id/evaluations
// body: { optionId, criteriaId, pros, cons }
const addEvaluation = async (req, res, next) => {
  try {
    const { optionId, criteriaId, pros, cons } = req.body;

    const decision = await Decision.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!decision) {
      return res.status(404).json({ message: "Decision not found" });
    }

    const [option, criteria] = await Promise.all([
      Option.findOne({ _id: optionId, decision: decision._id }),
      Criteria.findOne({ _id: criteriaId, decision: decision._id }),
    ]);

    if (!option || !criteria) {
      return res.status(400).json({ message: "Invalid option or criteria" });
    }

    let evaluation = await Evaluation.findOne({
      decision: decision._id,
      option: option._id,
      criteria: criteria._id,
    });

    if (!evaluation) {
      evaluation = await Evaluation.create({
        decision: decision._id,
        option: option._id,
        criteria: criteria._id,
        pros: pros || [],
        cons: cons || [],
      });
    } else {
      evaluation.pros = pros || [];
      evaluation.cons = cons || [];
      await evaluation.save();
    }

    res.status(201).json({
      message: "Evaluation saved",
      evaluation,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/decisions/:id/analyze
const analyzeDecision = async (req, res, next) => {
  try {
    const decisionId = req.params.id;

    const decision = await Decision.findOne({
      _id: decisionId,
      user: req.user._id,
    });

    if (!decision) {
      return res.status(404).json({ message: "Decision not found" });
    }

    const [options, criteria, evaluations] = await Promise.all([
      Option.find({ decision: decisionId }),
      Criteria.find({ decision: decisionId }),
      Evaluation.find({ decision: decisionId }),
    ]);

    if (!options.length || !criteria.length) {
      return res.status(400).json({
        message: "Need at least one option and one criteria to analyze",
      });
    }

    const optionScores = {};

    options.forEach((opt) => {
      optionScores[opt._id.toString()] = {
        optionId: opt._id,
        name: opt.name,
        totalScore: 0,
        details: [],
        totalProsImpact: 0,
        totalConsImpact: 0,
        filledCriteriaCount: 0,
      };
    });

    const totalCriteria = criteria.length;

    for (const crit of criteria) {
      const weightNorm = crit.weight / 5;

      const critEvaluations = evaluations.filter(
        (ev) => ev.criteria.toString() === crit._id.toString()
      );

      for (const evalItem of critEvaluations) {
        const prosImpact = (evalItem.pros || []).reduce(
          (sum, p) => sum + p.impactScore,
          0
        );
        const consImpact = (evalItem.cons || []).reduce(
          (sum, c) => sum + c.impactScore,
          0
        );
        const netImpact = prosImpact - consImpact;

        let normImpact = (netImpact + 10) / 20;
        if (normImpact < 0) normImpact = 0;
        if (normImpact > 1) normImpact = 1;

        const score = weightNorm * normImpact * 100;

        const os = optionScores[evalItem.option.toString()];
        if (!os) continue;

        os.totalScore += score;
        os.totalProsImpact += prosImpact;
        os.totalConsImpact += consImpact;
        os.filledCriteriaCount += 1;

        os.details.push({
          criteriaId: crit._id,
          criteriaName: crit.name,
          weight: crit.weight,
          weightNorm,
          netImpact,
          normImpact,
          score,
        });
      }
    }

    let recommendedOption = null;
    let maxScore = -1;
    const resultArray = [];

    for (const key of Object.keys(optionScores)) {
      const os = optionScores[key];

      const totalImpact = os.totalProsImpact + os.totalConsImpact;
      let riskLevel = "Unknown";

      if (totalImpact > 0) {
        const riskRatio = os.totalConsImpact / totalImpact;
        if (riskRatio < 0.25) riskLevel = "Low";
        else if (riskRatio < 0.5) riskLevel = "Medium";
        else riskLevel = "High";
      }

      const confidence =
        totalCriteria > 0
          ? Math.round((os.filledCriteriaCount / totalCriteria) * 100)
          : 0;

      const finalScore = Math.round(os.totalScore);

      if (finalScore > maxScore) {
        maxScore = finalScore;
        recommendedOption = {
          optionId: os.optionId,
          name: os.name,
          score: finalScore,
          risk: riskLevel,
          confidence,
        };
      }

      resultArray.push({
        optionId: os.optionId,
        name: os.name,
        score: finalScore,
        risk: riskLevel,
        confidence,
        details: os.details,
      });
    }

    res.json({
      decision: {
        _id: decision._id,
        title: decision.title,
        description: decision.description,
      },
      criteria,
      results: resultArray,
      recommended: recommendedOption,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/decisions/:id/apply-ai
// body: { criteria: [...], evaluations: [...] }
const applyAiSuggestion = async (req, res, next) => {
  try {
    const decisionId = req.params.id;
    const { criteria, evaluations } = req.body;

    if (!criteria || !criteria.length || !evaluations || !evaluations.length) {
      return res.status(400).json({
        message: "criteria and evaluations array are required",
      });
    }

    const decision = await Decision.findOne({
      _id: decisionId,
      user: req.user._id,
    });

    if (!decision) {
      return res.status(404).json({ message: "Decision not found" });
    }

    const options = await Option.find({ decision: decisionId });
    const optionMapByName = {};
    options.forEach((opt) => {
      optionMapByName[opt.name] = opt;
    });

    const criteriaMapByName = {};
    for (const c of criteria) {
      if (!c.name) continue;

      let existing = await Criteria.findOne({
        decision: decisionId,
        name: c.name,
      });

      if (!existing) {
        existing = await Criteria.create({
          decision: decisionId,
          name: c.name,
          weight: c.weight || 3,
        });
      } else if (c.weight) {
        existing.weight = c.weight;
        await existing.save();
      }

      criteriaMapByName[c.name] = existing;
    }

    let evalCount = 0;

    for (const ev of evaluations) {
      const { optionName, criteriaName, pros, cons } = ev;

      const optDoc = optionMapByName[optionName];
      const critDoc = criteriaMapByName[criteriaName];

      if (!optDoc || !critDoc) {
        continue;
      }

      await Evaluation.findOneAndUpdate(
        {
          decision: decisionId,
          option: optDoc._id,
          criteria: critDoc._id,
        },
        {
          decision: decisionId,
          option: optDoc._id,
          criteria: critDoc._id,
          pros: pros || [],
          cons: cons || [],
        },
        { upsert: true, new: true }
      );

      evalCount++;
    }

    return res.json({
      message: "AI suggestion applied successfully",
      stats: {
        criteriaCount: Object.keys(criteriaMapByName).length,
        evaluationCount: evalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDecision,
  getDecisions,
  getDecisionById,
  updateDecision,
  deleteDecision,
  addOption,
  addCriteria,
  addEvaluation,
  analyzeDecision,
  applyAiSuggestion,
};
