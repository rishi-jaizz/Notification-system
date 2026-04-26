const prisma = require('../config/database');
const templateService = require('../services/templateService');

async function create(req, res, next) {
  try {
    const { name, type, subject, body } = req.body;
    if (!name || !type || !body) {
      return res.status(400).json({ success: false, message: 'name, type, and body are required' });
    }
    const template = await templateService.createTemplate({ name, type, subject, body });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name, type, subject, body } = req.body;
    const template = await templateService.updateTemplate(req.params.id, { name, type, subject, body });
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.template.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
}

async function preview(req, res, next) {
  try {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const vars = req.body.variables || {};
    const rendered = {
      subject: template.subject ? templateService.renderTemplate(template.subject, vars) : null,
      body: templateService.renderTemplate(template.body, vars),
    };
    res.json({ success: true, data: rendered });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, update, remove, preview };
