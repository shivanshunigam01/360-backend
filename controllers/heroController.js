const Hero = require("../models/Hero");

exports.getAllHeroes = async (req, res) => {
  try {
    const heroes = await Hero.find();
    res.status(200).json(heroes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHeroById = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);
    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }
    res.status(200).json(hero);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createHero = async (req, res) => {
  try {
    const hero = new Hero(req.body);
    const savedHero = await hero.save();
    res.status(201).json(savedHero);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateHero = async (req, res) => {
  try {
    const hero = await Hero.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now(),
      },
      { new: true }
    );
    console.log(req.body);
    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }
    res.status(200).json(hero);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteHero = async (req, res) => {
  try {
    const hero = await Hero.findByIdAndDelete(req.params.id);
    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }
    res.status(200).json({ message: "Hero deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
