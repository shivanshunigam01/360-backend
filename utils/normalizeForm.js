const normalizeForm = (form) => {
  // Define the allowed enum values
  const allowedForms = ["Tablet", "Capsule", "Liquid", "Injection"];

  // If form is undefined or null, return default
  if (!form) return "Tablet";

  // Convert form to string and lowercase for comparison
  const formLower = form.toLowerCase();

  // Define keywords for each form type
  const formMatchers = {
    Liquid: [
      "liquid",
      "solution",
      "spray",
      "syrup",
      "suspension",
      "drops",
      "nasal",
    ],
    Tablet: ["tablet", "tab"],
    Capsule: ["capsule", "cap"],
    Injection: ["injection", "injectable", "syringe", "shot"],
  };

  // Check each form type's keywords
  for (const [formType, keywords] of Object.entries(formMatchers)) {
    if (keywords.some((keyword) => formLower.includes(keyword))) {
      return formType;
    }
  }

  // If no match found, log for review and return default
  console.log(`No form match found for: "${form}"`);
  return "Tablet";
};

module.exports = normalizeForm;
