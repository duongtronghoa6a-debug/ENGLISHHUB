/**
 * Resources Routes
 * /api/v1/resources
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// GET /api/v1/resources - Get all resources from JSON file
router.get('/', (req, res) => {
    try {
        const resourcesPath = path.join(__dirname, '../../database/data/resources.json');

        if (!fs.existsSync(resourcesPath)) {
            return res.status(200).json({
                success: true,
                data: { resources: [] }
            });
        }

        const data = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));

        // Apply filters if provided
        let resources = data.resources || [];
        const { category, skill, level, type, search } = req.query;

        if (category) {
            resources = resources.filter(r => r.category === category);
        }
        if (skill) {
            resources = resources.filter(r => r.skill === skill);
        }
        if (level) {
            resources = resources.filter(r => r.level === level);
        }
        if (type) {
            resources = resources.filter(r => r.type === type);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            resources = resources.filter(r =>
                r.title.toLowerCase().includes(searchLower) ||
                r.description?.toLowerCase().includes(searchLower)
            );
        }

        res.status(200).json({
            success: true,
            data: { resources, total: resources.length }
        });
    } catch (error) {
        console.error('Error loading resources:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/v1/resources/:id - Get single resource
router.get('/:id', (req, res) => {
    try {
        const resourcesPath = path.join(__dirname, '../../database/data/resources.json');
        const data = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
        const resource = data.resources?.find(r => r.id === req.params.id);

        if (!resource) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }

        res.status(200).json({ success: true, data: resource });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
