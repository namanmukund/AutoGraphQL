import express from 'express';
import {
  getAllModelsMetadata,
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  batchDeleteRecords,
  exportRecords,
  importRecords,
  generateMockRecords,
  purgeRecords,
} from './modelAdapter';

const router = express.Router();

// 1. GET /api/studio/models - Get all models metadata & field definitions
router.get('/api/studio/models', async (req, res) => {
  try {
    const meta = await getAllModelsMetadata();
    res.json({ success: true, ...meta });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/studio/data/:model/export - Export CSV or JSON (MUST be before /:model/:id)
router.get('/api/studio/data/:model/export', async (req, res) => {
  try {
    const { model } = req.params;
    const { format = 'json' } = req.query;
    const content = await exportRecords(model, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${model}_export.csv"`);
      return res.send(content);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${model}_export.json"`);
    res.send(content);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/studio/data/:model/import - Batch import records
router.post('/api/studio/data/:model/import', async (req, res) => {
  try {
    const { model } = req.params;
    const { records } = req.body;
    const result = await importRecords(model, records);
    res.json({ success: true, ...result, message: `Imported ${result.imported} of ${result.total} records` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. POST /api/studio/data/:model/seed - Synthetic Mock Data Seeder
router.post('/api/studio/data/:model/seed', async (req, res) => {
  try {
    const { model } = req.params;
    const { count = 10 } = req.body;
    const result = await generateMockRecords(model, count);
    res.json({ success: true, ...result, message: `Generated ${result.countCreated} synthetic records for '${model}'` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. DELETE /api/studio/data/:model/purge - Purge test records
router.delete('/api/studio/data/:model/purge', async (req, res) => {
  try {
    const { model } = req.params;
    const result = await purgeRecords(model);
    res.json({ success: true, ...result, message: `Purged ${result.deletedCount} records from '${model}'` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. POST /api/studio/data/:model/batch-delete - Batch delete records
router.post('/api/studio/data/:model/batch-delete', async (req, res) => {
  try {
    const { model } = req.params;
    const { ids } = req.body;
    const result = await batchDeleteRecords(model, ids);
    res.json({ success: true, ...result, message: `Successfully deleted ${result.deletedCount} records` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. GET /api/studio/data/:model - List records with pagination, search, filter
router.get('/api/studio/data/:model', async (req, res) => {
  try {
    const { model } = req.params;
    const {
      page, limit, sortField, sortOrder, search, filterField, filterOp, filterVal,
    } = req.query;

    const result = await listRecords(model, {
      page,
      limit,
      sortField,
      sortOrder,
      search,
      filterField,
      filterOp,
      filterVal,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/studio/data/:model - Create new record
router.post('/api/studio/data/:model', async (req, res) => {
  try {
    const { model } = req.params;
    const data = req.body;
    const record = await createRecord(model, data);
    res.status(201).json({ success: true, data: record, message: 'Record created successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 9. GET /api/studio/data/:model/:id - Get single record
router.get('/api/studio/data/:model/:id', async (req, res) => {
  try {
    const { model, id } = req.params;
    const record = await getRecordById(model, id);
    if (!record) {
      return res.status(404).json({ success: false, error: `Record '${id}' not found` });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. PATCH /api/studio/data/:model/:id - Inline update record
router.patch('/api/studio/data/:model/:id', async (req, res) => {
  try {
    const { model, id } = req.params;
    const data = req.body;
    const updated = await updateRecord(model, id, data);
    res.json({ success: true, data: updated, message: 'Record updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 11. DELETE /api/studio/data/:model/:id - Delete single record
router.delete('/api/studio/data/:model/:id', async (req, res) => {
  try {
    const { model, id } = req.params;
    const result = await deleteRecord(model, id);
    res.json({ success: true, ...result, message: 'Record deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
