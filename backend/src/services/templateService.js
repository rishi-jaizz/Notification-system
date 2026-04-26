const prisma = require('../config/database');

/**
 * Renders a template string by substituting {{variable}} placeholders.
 */
function renderTemplate(templateStr, variables = {}) {
  let rendered = templateStr;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(regex, String(value));
  }
  return rendered;
}

/**
 * Extracts unique variable names from a template string.
 * e.g. "Hello {{name}}, your code is {{code}}" → ["name", "code"]
 */
function extractVariables(templateStr = '') {
  const matches = templateStr.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{\s*|\s*\}\}/g, '')))];
}

async function createTemplate(data) {
  const variables = extractVariables((data.body || '') + ' ' + (data.subject || ''));
  return prisma.template.create({
    data: { ...data, variables },
  });
}

async function updateTemplate(id, data) {
  const variables = extractVariables((data.body || '') + ' ' + (data.subject || ''));
  return prisma.template.update({
    where: { id },
    data: { ...data, variables },
  });
}

/**
 * Renders a saved template by ID with provided variables.
 */
async function renderById(templateId, variables = {}) {
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) throw new Error(`Template not found: ${templateId}`);
  return {
    subject: template.subject ? renderTemplate(template.subject, variables) : null,
    body: renderTemplate(template.body, variables),
  };
}

module.exports = { renderTemplate, extractVariables, createTemplate, updateTemplate, renderById };
