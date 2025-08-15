const express = require("express");
const router = express.Router();
const heroController = require("../controllers/heroController");
const auth = require("../middleware/auth");

router.get("/", heroController.getAllHeroes);
router.get("/:id", heroController.getHeroById);
router.post("/", auth, heroController.createHero);
router.put("/:id", auth, heroController.updateHero);
router.delete("/:id", auth, heroController.deleteHero);

module.exports = router;
